import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConnectedAppSchema, insertTemplateSchema, insertActivityLogSchema } from "../../../domains/shared-kernel/src/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendContactEmail } from "./email";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerAdminRoutes } from "./admin";
import { db } from "./db";
import { sql, eq } from "drizzle-orm";
import { users } from "../../../domains/shared-kernel/src/schema";
import { AuthController } from "./auth/auth-controller";
// Import the migration function
import { migrateToCognito } from "./migrations/add-cognito-support";
import { getAuthConfig, validateAuthConfig } from "./auth/auth-config";
import analyticsRouter from "./routes/analytics";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate authentication configuration
  validateAuthConfig();
  const authConfig = getAuthConfig();
  
  // Configure session with centralized config
  const sessionMiddleware = session({
    secret: authConfig.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: authConfig.session.secure || process.env.NODE_ENV === 'production',
      httpOnly: authConfig.session.httpOnly !== false,
      sameSite: authConfig.session.sameSite || 'lax',
      maxAge: authConfig.session.maxAge || 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  });

  app.use(sessionMiddleware);

  // Run database migration to support Cognito integration if needed
  try {
    await migrateToCognito();
    console.log('Database prepared for Cognito authentication');
  } catch (error) {
    console.error('Error preparing database for Cognito:', error);
  }

  // Production Health Check (load balancer endpoint)
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // API Routes
  // Simple Cognito authentication routes
  try {
    console.log('Attempting to import simple-cognito handler...');
    const { simpleCognitoHandler } = await import('./auth/simple-cognito');
    console.log('Successfully imported simple-cognito handler');
    
    console.log('Setting up auth routes...');
    app.post('/api/auth/callback', simpleCognitoHandler.handleCallback.bind(simpleCognitoHandler));
    app.get('/api/auth/me', simpleCognitoHandler.getCurrentUser.bind(simpleCognitoHandler));
    app.post('/api/auth/signout', simpleCognitoHandler.signOut.bind(simpleCognitoHandler));
    console.log('Auth routes set up successfully');
  } catch (error) {
    console.error('Failed to set up auth routes:', error);
    // Fallback handler for auth routes to prevent 404s
    app.post('/api/auth/callback', (req, res) => {
      console.log('FALLBACK: Auth callback called');
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }
      return res.status(400).json({ error: 'Invalid authorization code' });
    });
    app.get('/api/auth/me', (req, res) => {
      res.status(401).json({ error: 'Not authenticated' });
    });
    app.post('/api/auth/signout', (req, res) => {
      res.json({ message: 'Signed out' });
    });
  }

  // Dashboard stats
  app.get('/api/dashboard/stats', AuthController.isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const stats = await storage.getDashboardStats(req.session.userId);
      return res.json(stats);
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return res.status(500).json({ message: 'Error retrieving dashboard statistics' });
    }
  });

  // Connected apps routes
  app.get('/api/connected-apps', AuthController.isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const apps = await storage.getConnectedAppsByUserId(req.session.userId);
      return res.json(apps);
    } catch (error) {
      console.error('Error getting connected apps:', error);
      return res.status(500).json({ message: 'Error retrieving connected apps' });
    }
  });

  app.get('/api/available-apps', AuthController.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const apps = await storage.getAvailableApps();
      return res.json(apps);
    } catch (error) {
      console.error('Error getting available apps:', error);
      return res.status(500).json({ message: 'Error retrieving available apps' });
    }
  });

  app.post('/api/connected-apps', AuthController.isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const appData = { ...req.body, userId: req.session.userId };
      
      try {
        const validatedData = insertConnectedAppSchema.parse(appData);
        const app = await storage.createConnectedApp(validatedData);
        return res.status(201).json(app);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: 'Invalid app data', errors: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error connecting app:', error);
      return res.status(500).json({ message: 'Error connecting app' });
    }
  });

  // Template routes
  app.get('/api/templates', AuthController.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const templates = await storage.getAllTemplates();
      return res.json(templates);
    } catch (error) {
      console.error('Error getting templates:', error);
      return res.status(500).json({ message: 'Error retrieving templates' });
    }
  });

  app.get('/api/templates/popular', AuthController.isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limitParam = req.query.limit as string;
      const limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam))) : 5;
      
      if (limitParam && isNaN(limit)) {
        return res.status(400).json({ message: 'Invalid limit parameter' });
      }
      
      const templates = await storage.getPopularTemplates(limit);
      return res.json(templates);
    } catch (error) {
      console.error('Error getting popular templates:', error);
      return res.status(500).json({ message: 'Error retrieving popular templates' });
    }
  });

  // Activity log routes
  app.get('/api/activity-log', AuthController.isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const perPage = req.query.perPage ? parseInt(req.query.perPage as string) : 20;
      
      const activityLogs = await storage.getActivityLogsByUserId(req.session.userId, page, perPage);
      return res.json(activityLogs);
    } catch (error) {
      console.error('Error getting activity logs:', error);
      return res.status(500).json({ message: 'Error retrieving activity logs' });
    }
  });

  app.post('/api/activity-log', AuthController.isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const logData = { 
        ...req.body, 
        userId: req.session.userId,
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown'
      };
      
      try {
        const validatedData = insertActivityLogSchema.parse(logData);
        const log = await storage.createActivityLog(validatedData);
        return res.status(201).json(log);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: 'Invalid log data', errors: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error creating activity log:', error);
      return res.status(500).json({ message: 'Error logging activity' });
    }
  });

  // Contact form submission
  app.post('/api/contact', async (req: Request, res: Response) => {
    try {
      const { name, email, message, subject } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email and message are required' });
      }
      
      const success = await sendContactEmail({
        name,
        email,
        subject: subject || 'Contact Form Submission',
        message
      });
      
      if (success) {
        return res.json({ message: 'Message sent successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to send message' });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      return res.status(500).json({ message: 'Error processing contact form submission' });
    }
  });



  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      architecture: 'pure-ddd',
      services: ['identity', 'workflow', 'integration', 'analytics', 'notification']
    });
  });

  // Test frontend file access
  app.get('/test-frontend', async (req: Request, res: Response) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const frontendPath = path.resolve(process.cwd(), 'interfaces', 'web-frontend', 'index.html');
      const content = await fs.promises.readFile(frontendPath, 'utf-8');
      res.set('Content-Type', 'text/html');
      res.send(content);
    } catch (error) {
      res.status(500).json({ error: 'Frontend file not accessible', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Register analytics routes for monitoring dashboard
  app.use('/api/analytics', analyticsRouter);
  
  // Register monitoring routes for Phase 1 enhanced dashboard
  try {
    const monitoringRouter = await import('./routes/monitoring');
    app.use('/api/monitoring', monitoringRouter.default);
    console.log('Monitoring routes registered successfully');
  } catch (error) {
    console.error('Failed to register monitoring routes:', error);
  }
  
  // Register admin routes for user management
  await registerAdminRoutes(app);
  
  // Enhanced user management endpoint with improved security
  app.get('/api/admin/users', async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      
      if (!sessionUserId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Always verify admin role from database (prevents session tampering)
      const currentUser = await db.select().from(users).where(eq(users.id, sessionUserId)).limit(1);
      
      if (!currentUser[0]) {
        // Clear potentially invalid session
        req.session.destroy(() => {});
        return res.status(401).json({ error: 'User not found' });
      }
      
      if (!currentUser[0].isActive) {
        return res.status(403).json({ error: 'Account deactivated' });
      }
      
      if (currentUser[0].role !== 'admin') {
        // Log unauthorized access attempt
        console.warn(`Unauthorized admin access attempt: User ${currentUser[0].email} (role: ${currentUser[0].role}) from IP: ${req.ip}`);
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Log successful admin action
      console.log(`Admin access granted: ${currentUser[0].email} viewing user list from IP: ${req.ip}`);
      
      const allUsers = await db.select().from(users).orderBy(users.createdAt);
      
      // Filter sensitive data before sending
      const sanitizedUsers = allUsers.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        loginCount: user.loginCount,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        provider: user.provider
        // Note: cognitoId, password, and other sensitive fields excluded
      }));

      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Error in admin users endpoint:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}