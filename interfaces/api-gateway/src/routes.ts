import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkflowSchema, insertConnectedAppSchema, insertTemplateSchema, insertActivityLogSchema } from "../../../domains/shared-kernel/src/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendContactEmail } from "./email";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerAdminRoutes } from "./admin";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { AuthController } from "./auth/auth-controller";
// Import the migration function
import { migrateToCognito } from "./migrations/add-cognito-support";
import { getAuthConfig, validateAuthConfig } from "./auth-config";
import analyticsRouter from "../../../server/routes/analytics";

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
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
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

  // API Routes
  // Simple Cognito authentication routes
  const { simpleCognitoHandler } = await import('./auth/simple-cognito');
  app.post('/api/auth/callback', simpleCognitoHandler.handleCallback.bind(simpleCognitoHandler));
  app.get('/api/auth/me', simpleCognitoHandler.getCurrentUser.bind(simpleCognitoHandler));
  app.post('/api/auth/signout', simpleCognitoHandler.signOut.bind(simpleCognitoHandler));

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

  // Workflow routes
  app.get('/api/workflows', AuthController.isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const workflows = await storage.getWorkflowsByUserId(req.session.userId);
      return res.json(workflows);
    } catch (error) {
      console.error('Error getting workflows:', error);
      return res.status(500).json({ message: 'Error retrieving workflows' });
    }
  });

  app.get('/api/workflows/recent', AuthController.isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const workflows = await storage.getRecentWorkflows(req.session.userId, limit);
      return res.json(workflows);
    } catch (error) {
      console.error('Error getting recent workflows:', error);
      return res.status(500).json({ message: 'Error retrieving recent workflows' });
    }
  });

  app.post('/api/workflows', AuthController.isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const workflowData = { ...req.body, userId: req.session.userId };
      
      try {
        const validatedData = insertWorkflowSchema.parse(workflowData);
        const workflow = await storage.createWorkflow(validatedData);
        return res.status(201).json(workflow);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: 'Invalid workflow data', errors: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      return res.status(500).json({ message: 'Error creating workflow' });
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

  // Register analytics routes for monitoring dashboard
  app.use('/api/analytics', analyticsRouter);
  
  // Register admin routes for user management
  await registerAdminRoutes(app);
  
  const httpServer = createServer(app);

  return httpServer;
}