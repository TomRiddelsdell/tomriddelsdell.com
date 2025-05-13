import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWorkflowSchema, insertConnectedAppSchema, insertTemplateSchema, insertActivityLogSchema } from "@shared/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'flowcreate_secret',
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

  // Configure Passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup local strategy for username/password auth
  passport.use(new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        // In a real app, we would use bcrypt to compare passwords
        if (user.password !== password) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Serialize/deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // API Routes
  // Auth Routes
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Generate a username from email
      const username = email.split('@')[0];

      // Validate input
      const userData = {
        username,
        email,
        password,
        provider: 'email'
      };

      const validatedData = insertUserSchema.parse(userData);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Create user
      const newUser = await storage.createUser(validatedData);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      
      // Log in the user
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error logging in after signup' });
        }
        return res.status(201).json({ user: userWithoutPassword });
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: fromZodError(error).message });
      }
      console.error('Signup error:', error);
      return res.status(500).json({ message: 'Error creating user' });
    }
  });

  app.post('/api/auth/signin', (req: Request, res: Response, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        return res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });

  app.get('/api/auth/google', (req: Request, res: Response) => {
    // In a real implementation, we would use passport's Google strategy
    // For this example, we're simulating a successful Google login
    const mockUser = {
      id: 999,
      username: "t.riddelsdell",
      email: "tom.riddelsdell@example.com",
      displayName: "Tom Riddelsdell",
      photoURL: null
    };
    
    req.login(mockUser, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during login' });
      }
      
      // Create activity log for the sign-in
      storage.createActivityLog({
        userId: mockUser.id,
        action: 'auth.google.signin',
        details: 'Signed in with Google',
        timestamp: new Date()
      }).catch(console.error);
      
      return res.status(200).json({ user: mockUser });
    });
  });

  app.post('/api/auth/signout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/status', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      const { password: _, ...userWithoutPassword } = req.user as any;
      return res.json({ user: userWithoutPassword });
    }
    res.json({ user: null });
  });

  // Dashboard Routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
  });

  // Workflow Routes
  app.get('/api/workflows', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const workflows = await storage.getWorkflowsByUserId(userId);
      res.json(workflows);
    } catch (error) {
      console.error('Error getting workflows:', error);
      res.status(500).json({ message: 'Error fetching workflows' });
    }
  });

  app.get('/api/workflows/recent', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const workflows = await storage.getRecentWorkflows(userId);
      res.json(workflows);
    } catch (error) {
      console.error('Error getting recent workflows:', error);
      res.status(500).json({ message: 'Error fetching recent workflows' });
    }
  });

  app.post('/api/workflows', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const workflowData = { ...req.body, userId };
      
      const validatedData = insertWorkflowSchema.parse(workflowData);
      
      const workflow = await storage.createWorkflow(validatedData);
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Error creating workflow:', error);
      res.status(500).json({ message: 'Error creating workflow' });
    }
  });

  // Connected Apps Routes
  app.get('/api/connected-apps', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const apps = await storage.getConnectedAppsByUserId(userId);
      res.json(apps);
    } catch (error) {
      console.error('Error getting connected apps:', error);
      res.status(500).json({ message: 'Error fetching connected apps' });
    }
  });

  app.get('/api/available-apps', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const apps = await storage.getAvailableApps();
      res.json(apps);
    } catch (error) {
      console.error('Error getting available apps:', error);
      res.status(500).json({ message: 'Error fetching available apps' });
    }
  });

  app.post('/api/connected-apps', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const appData = { ...req.body, userId };
      
      const validatedData = insertConnectedAppSchema.parse(appData);
      
      const app = await storage.createConnectedApp(validatedData);
      res.status(201).json(app);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Error connecting app:', error);
      res.status(500).json({ message: 'Error connecting app' });
    }
  });

  // Templates Routes
  app.get('/api/templates', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error getting templates:', error);
      res.status(500).json({ message: 'Error fetching templates' });
    }
  });

  app.get('/api/templates/popular', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const templates = await storage.getPopularTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error getting popular templates:', error);
      res.status(500).json({ message: 'Error fetching popular templates' });
    }
  });

  // Activity Log Routes
  app.get('/api/activity-log', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 20;
      
      const logs = await storage.getActivityLogsByUserId(userId, page, perPage);
      res.json(logs);
    } catch (error) {
      console.error('Error getting activity logs:', error);
      res.status(500).json({ message: 'Error fetching activity logs' });
    }
  });

  app.post('/api/activity-log', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const logData = { ...req.body, userId };
      
      const validatedData = insertActivityLogSchema.parse(logData);
      
      const log = await storage.createActivityLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Error creating activity log:', error);
      res.status(500).json({ message: 'Error creating activity log' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}
