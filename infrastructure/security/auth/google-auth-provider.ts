import { AuthOptions, AuthProvider, AuthUser } from "./types";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express, Request, Response, NextFunction } from "express";

export class GoogleAuthProvider implements AuthProvider {
  private clientId: string;
  private clientSecret: string;
  private callbackURL: string;
  
  constructor(options: AuthOptions) {
    this.clientId = options.clientId || process.env.GOOGLE_CLIENT_ID || "";
    this.clientSecret = options.clientSecret || process.env.GOOGLE_CLIENT_SECRET || "";
    
    // Use dynamic callback URL based on current environment
    const host = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS}`
      : (process.env.NODE_ENV === 'production' 
          ? require('../../configuration/config-loader').getConfig().services.external.baseUrl
          : 'http://localhost:5000');
    
    this.callbackURL = `${host}/api/auth/google/callback`;
    
    if (!this.clientId || !this.clientSecret) {
      console.warn("Google Auth provider missing credentials. Authentication will not work properly.");
    } else {
      console.log("Google authentication configured with client ID: " + this.clientId.substring(0, 5) + "...");
    }
  }
  
  /**
   * Initialize the provider with Express app
   */
  async initialize(app: Express): Promise<void> {
    if (!this.clientId || !this.clientSecret) {
      return;
    }
    
    passport.use(new GoogleStrategy({
      clientID: this.clientId,
      clientSecret: this.clientSecret,
      callbackURL: this.callbackURL,
      scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0].value;
        if (!email) {
          return done(new Error("Email not found in Google profile"));
        }
        
        const user: AuthUser = {
          id: profile.id,
          email: email,
          displayName: profile.displayName || email.split('@')[0],
          photoURL: profile.photos && profile.photos[0].value,
          provider: 'google'
        };
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
    
    // Initialize passport
    app.use(passport.initialize());
    
    // Setup Google auth routes
    app.get('/api/auth/google', passport.authenticate('google'));
    
    app.get('/api/auth/google/callback', (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate('google', (err: any, user: any) => {
        if (err) {
          console.error("Google authentication error:", err);
          return res.redirect('/auth-error?error=google_auth_failed');
        }
        
        if (!user) {
          return res.redirect('/auth-error?error=no_user');
        }
        
        // Store user in session
        req.session.googleUser = user;
        
        // Redirect to frontend auth handler
        return res.redirect('/auth-success');
      })(req, res, next);
    });
    
    console.log("Google authentication initialized");
  }
  
  /**
   * Sign in a user with username and password
   * Note: For Google auth, this is not used directly
   */
  async signIn(username: string, password: string): Promise<AuthUser | null> {
    console.warn("Password signin not supported with Google auth provider");
    return null;
  }
  
  /**
   * Sign out a user
   */
  async signOut(userId: string): Promise<boolean> {
    // For Google auth, we just clear the session on the server side
    // The actual sign out happens on the client
    return true;
  }
  
  /**
   * Create a new user
   */
  async createUser(userData: Partial<AuthUser>): Promise<AuthUser> {
    // For Google auth, users are created during the OAuth flow
    throw new Error("Manual user creation not supported with Google auth provider");
  }
  
  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<AuthUser | null> {
    // We would typically look this up in the database
    // For now, just return a minimal user object
    return {
      id,
      email: "unknown@example.com",
      displayName: "Unknown User",
      provider: "google"
    };
  }
  
  /**
   * Get a user by email
   */
  async getUserByEmail(email: string): Promise<AuthUser | null> {
    // We would typically look this up in the database
    // For now, return null to indicate user not found
    return null;
  }
  
  /**
   * Change a user's password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    console.warn("Password change not supported with Google auth provider");
    return false;
  }
  
  /**
   * Reset a user's password
   */
  async resetPassword(email: string): Promise<boolean> {
    console.warn("Password reset not supported with Google auth provider");
    return false;
  }
  
  /**
   * Confirm a password reset with the code sent to the user's email
   */
  async confirmResetPassword(email: string, code: string, newPassword: string): Promise<boolean> {
    console.warn("Password reset confirmation not supported with Google auth provider");
    return false;
  }
}