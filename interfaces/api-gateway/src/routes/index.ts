import type { Express, Request, Response } from "express";
// !! CRITICAL: Apply lazy loading pattern to prevent Lambda cold start timeouts !!

// Type-only imports - these don't trigger module loading
import type { ZodError } from "zod";

// Lazy-loaded modules to avoid expensive initialization during cold start
let storage: any = null;
let authConfig: any = null;
let AuthController: any = null;
let emailService: any = null;
let analyticsRouter: any = null;
let adminRoutes: any = null;
let schemas: any = null;

// Cached lazy loaders
async function getStorage() {
  if (!storage) {
    const { storage: storageInstance } = await import("../storage");
    storage = storageInstance;
  }
  return storage;
}

async function getAuthConfig() {
  if (!authConfig) {
    const authModule = await import("../auth/auth-config");
    authConfig = authModule;
  }
  return authConfig;
}

async function getAuthController() {
  if (!AuthController) {
    const { AuthController: controller } = await import("../auth/auth-controller");
    AuthController = controller;
  }
  return AuthController;
}

async function getEmailService() {
  if (!emailService) {
    const { sendContactEmail } = await import("../email");
    emailService = { sendContactEmail };
  }
  return emailService;
}

async function getAnalyticsRouter() {
  if (!analyticsRouter) {
    const router = await import("./analytics");
    analyticsRouter = router.default;
  }
  return analyticsRouter;
}

async function getAdminRoutes() {
  if (!adminRoutes) {
    const { registerAdminRoutes } = await import("./admin");
    adminRoutes = { registerAdminRoutes };
  }
  return adminRoutes;
}

async function getSchemas() {
  if (!schemas) {
    const schemaModule = await import("../../../../domains/shared-kernel/src/schema");
    const { z } = await import("zod");
    schemas = { ...schemaModule, z };
  }
  return schemas;
}

/**
 * Lambda-optimized route registration function
 * Uses lazy loading to minimize cold start time
 */
export async function registerRoutes(app: Express): Promise<void> {
  try {
    // Lazy load auth configuration only when needed
    const authModule = await getAuthConfig();
    authModule.validateAuthConfig();
    const authConfig = authModule.getAuthConfig();
    console.log('Authentication configuration validated');

    // Preload AuthController to avoid null reference issues
    const authController = await getAuthController();

    // Root route handler for Lambda - serve simple index response
    app.get('/', (req: Request, res: Response) => {
      res.json({
        service: 'tomriddelsdell.com API Gateway',
        status: 'running',
        environment: process.env.NODE_ENV || 'development',
        platform: 'AWS Lambda',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // Health check endpoint (duplicate definition, but that's ok)
    app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        environment: process.env.NODE_ENV || 'development',
        platform: 'AWS Lambda',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API Routes - Authentication (lazy loaded)
    try {
      console.log('Attempting to import aws-cognito-handler...');
      const { awsCognitoHandler } = await import('../auth/aws-cognito-handler');
      console.log('Successfully imported aws-cognito-handler');
      
      console.log('Setting up auth routes...');
      // GET route for Cognito OAuth callback (receives authorization code as query param)
      app.get('/auth/callback', awsCognitoHandler.handleCallback.bind(awsCognitoHandler));
      
      // POST route for Cognito OAuth callback (receives authorization code in request body)
      app.post('/auth/callback', awsCognitoHandler.handleCallback.bind(awsCognitoHandler));
      
      // API endpoint for auth callback (for testing and API consistency)
      app.post('/api/auth/callback', awsCognitoHandler.handleCallback.bind(awsCognitoHandler));
      
      // Current user endpoint
      app.get('/api/auth/me', awsCognitoHandler.getCurrentUser.bind(awsCognitoHandler));
      
      // Sign out endpoint
      app.post('/api/auth/signout', awsCognitoHandler.signOut.bind(awsCognitoHandler));
      
      console.log('Auth routes set up successfully');
    } catch (error) {
      console.error('Failed to set up auth routes:', error);
    }

    // Dashboard stats
    app.get('/api/dashboard/stats', AuthController.isAuthenticated, async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const storage = await getStorage();
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
        
        const storage = await getStorage();
        const apps = await storage.getConnectedAppsByUserId(req.session.userId);
        return res.json(apps);
      } catch (error) {
        console.error('Error getting connected apps:', error);
        return res.status(500).json({ message: 'Error retrieving connected apps' });
      }
    });

    app.get('/api/available-apps', AuthController.isAuthenticated, async (req: Request, res: Response) => {
      try {
        const storage = await getStorage();
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
          const storageModule = await getStorage();
          const validatedData = storageModule.insertConnectedAppSchema.parse(appData);
          const storage = await storageModule.getStorage();
          const app = await storage.createConnectedApp(validatedData);
          return res.status(201).json(app);
        } catch (error) {
          const { ZodError } = await import('zod');
          if (error instanceof ZodError) {
            return res.status(400).json({ message: 'Invalid app data', errors: error.message });
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
        const storage = await getStorage();
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
        
        const storage = await getStorage();
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
        
        const storage = await getStorage();
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
          const storageModule = await getStorage();
          const validatedData = storageModule.insertActivityLogSchema.parse(logData);
          const storage = await storageModule.getStorage();
          const log = await storage.createActivityLog(validatedData);
          return res.status(201).json(log);
        } catch (error) {
          const { ZodError } = await import('zod');
          if (error instanceof ZodError) {
            return res.status(400).json({ message: 'Invalid log data', errors: error.message });
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
        
        const emailModule = await getEmailService();
        const success = await emailModule.sendContactEmail({
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

    // Register analytics routes for monitoring dashboard
    app.use('/api/analytics', analyticsRouter);
    
    // Register config routes for frontend configuration
    try {
      const configRouter = await import('./config');
      app.use('/api/config', configRouter.default);
      console.log('Config routes registered successfully');
    } catch (error) {
      console.error('Failed to register config routes:', error);
    }
    
    // Register monitoring routes for Phase 1 enhanced dashboard
    try {
      const monitoringRouter = await import('./monitoring');
      app.use('/api/monitoring', monitoringRouter.default);
      console.log('Monitoring routes registered successfully');
    } catch (error) {
      console.error('Failed to register monitoring routes:', error);
    }
    
    // Register admin routes for user management (lazy loaded)
    try {
      const adminModule = await getAdminRoutes();
      await adminModule.registerAdminRoutes(app);
      console.log('Admin routes registered successfully');
    } catch (error) {
      console.error('Failed to register admin routes:', error);
    }

    console.log('All routes registered successfully for Lambda');
  } catch (error) {
    console.error('Error registering routes:', error);
    throw error;
  }
}
