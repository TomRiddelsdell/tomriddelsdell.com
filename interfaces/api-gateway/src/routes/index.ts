import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { insertConnectedAppSchema, insertTemplateSchema, insertActivityLogSchema } from "../../../../domains/shared-kernel/src/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendContactEmail } from "../email";
import { registerAdminRoutes } from "./admin";
import { AuthController } from "../auth/auth-controller";
import { getAuthConfig, validateAuthConfig } from "../auth/auth-config";
import analyticsRouter from "./analytics";

/**
 * Lambda-compatible route registration function
 * Does not return a Server, just registers routes on the provided Express app
 */
export async function registerRoutes(app: Express): Promise<void> {
  try {
    // Validate authentication configuration
    validateAuthConfig();
    const authConfig = getAuthConfig();
    console.log('Authentication configuration validated');

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

    // API Routes - Authentication
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
    
    // Register admin routes for user management
    await registerAdminRoutes(app);

    console.log('All routes registered successfully for Lambda');
  } catch (error) {
    console.error('Error registering routes:', error);
    throw error;
  }
}
