import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWorkflowSchema, insertConnectedAppSchema, insertTemplateSchema, insertActivityLogSchema } from "@shared/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendContactEmail } from "./email";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
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
  
  // Set up Google OAuth Strategy with development-friendly configuration
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: '/api/auth/google/callback', // Relative URL for flexibility
    // No proxy setting during dev to avoid potential issues
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Get profile info
      const googleId = profile.id;
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const displayName = profile.displayName || '';
      const photoURL = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
      
      if (!email) {
        return done(new Error('No email found in Google profile'));
      }
      
      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      // If user doesn't exist, create a new one
      if (!user) {
        user = await storage.createUser({
          username: email.split('@')[0],
          email: email,
          password: `google-auth-${googleId}`, // Not actually used for OAuth users
          provider: 'google',
          displayName: displayName,
          photoURL: photoURL
        });
      } 
      // If user exists but has email/password auth, link it with Google
      else if (user.provider !== 'google') {
        user = await storage.updateUser(user.id, {
          provider: 'google',
          displayName: displayName || user.displayName,
          photoURL: photoURL || user.photoURL
        });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Google auth error:', error);
      return done(error);
    }
  }));

  // Serialize/deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      // Check if user exists
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      return done(null, false);
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

  // Simplified Google-style sign-in (direct login without full OAuth)
  app.post('/api/auth/google-signin', async (req: Request, res: Response) => {
    try {
      // Extract email from request
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      // Check if user exists or create one
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create a new user with Google-like attributes
        const username = email.split('@')[0];
        const displayName = username.split('.').map((part: string) => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
        
        user = await storage.createUser({
          username,
          email,
          password: 'google-auth-' + Math.random().toString(36).substring(2), // Random password not used
          provider: 'google',
          displayName,
          photoURL: null
        });
      }
      
      // Create activity log
      await storage.createActivityLog({
        userId: user.id,
        eventType: 'auth.signin',
        details: 'Signed in with Google-style login',
        status: 'success'
      });
      
      // Set user in session manually instead of using req.login
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ user: userWithoutPassword });
      
    } catch (error) {
      console.error('Google-style signin error:', error);
      return res.status(500).json({ message: 'Authentication failed' });
    }
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
  
  // Contact form submission endpoint
  app.post('/api/contact', async (req: Request, res: Response) => {
    try {
      // Define a schema for contact form data
      const contactSchema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email address'),
        subject: z.string().optional(),
        message: z.string().min(5, 'Message is too short')
      });

      // Validate the request body
      const contactData = contactSchema.parse(req.body);
      
      // Send the email
      const success = await sendContactEmail(contactData);
      
      if (success) {
        // Log the contact submission for authenticated users
        if (req.isAuthenticated() && req.user) {
          await storage.createActivityLog({
            userId: (req.user as any).id,
            eventType: 'contact_form',
            status: 'success',
            details: {
              subject: contactData.subject || 'No subject',
              fromEmail: contactData.email
            }
          });
        }
        
        res.status(200).json({ message: 'Message sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send message' });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Invalid form data', 
          errors: fromZodError(error).message 
        });
      }
      console.error('Error processing contact form:', error);
      res.status(500).json({ message: 'An error occurred while processing your message' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  try {
    if (req.isAuthenticated() && req.user) {
      return next();
    }
    
    // If session exists but user is not properly loaded
    if (req.session && req.session.passport && req.session.passport.user && !req.user) {
      console.warn("Session exists but user not loaded - clearing session");
      req.session.destroy((err) => {
        if (err) console.error("Error destroying invalid session:", err);
      });
    }
    
    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({ message: 'Authentication error' });
  }
}
