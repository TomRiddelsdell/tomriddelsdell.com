import { Request, Response, NextFunction } from 'express';
import authService from './index';
import { UserAdapter } from './user-adapter';

/**
 * Authentication controller that uses AWS Cognito
 */
export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response) {
    try {
      const { email, password, username, displayName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Check if user already exists
      const existingUser = await UserAdapter.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      // Create user in Cognito
      const cognitoUser = await authService.getProvider().createUser({
        email,
        displayName: displayName || username || email.split('@')[0],
        provider: 'cognito'
      });
      
      // Set permanent password
      await authService.getProvider().changePassword(cognitoUser.id, '', password);
      
      // Sync with our database
      const localUser = await UserAdapter.syncUser(cognitoUser);
      
      // Sign in the user
      req.session.userId = localUser.id;
      
      // Return user info without sensitive fields
      const { password: _, ...userWithoutPassword } = cognitoUser;
      return res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'Error creating user' });
    }
  }
  
  /**
   * Login a user
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Authenticate with Cognito
      const cognitoUser = await authService.getProvider().signIn(email, password);
      
      if (!cognitoUser) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      // Sync with our database
      const localUser = await UserAdapter.syncUser(cognitoUser);
      
      // Track login
      const clientIP = req.headers['x-forwarded-for'] || 
                       req.socket.remoteAddress || 
                       'unknown';
      
      await UserAdapter.trackUserLogin(localUser.id, clientIP as string);
      
      // Set session
      req.session.userId = localUser.id;
      
      // Return user info without sensitive data
      const userResponse = {
        id: localUser.id,
        email: localUser.email,
        displayName: localUser.displayName,
        photoURL: localUser.photoURL,
        provider: localUser.provider,
        role: localUser.role
      };
      
      return res.json({ user: userResponse });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Error during login' });
    }
  }
  
  /**
   * Login or register with a third-party provider
   */
  static async socialLogin(req: Request, res: Response) {
    try {
      const { email, provider, token } = req.body;
      
      if (!email || !provider) {
        return res.status(400).json({ message: 'Email and provider are required' });
      }
      
      // For social sign-in, we would validate the token with the provider
      // and then sign in or create the user in Cognito
      // For this implementation, we'll simplify and just create/find by email
      
      let cognitoUser = await authService.getProvider().getUserByEmail(email);
      
      // If user doesn't exist, create one
      if (!cognitoUser) {
        cognitoUser = await authService.getProvider().createUser({
          email,
          displayName: req.body.displayName || email.split('@')[0],
          photoURL: req.body.photoURL,
          provider
        });
      }
      
      // Sync with our database
      const localUser = await UserAdapter.syncUser(cognitoUser);
      
      // Track login
      const clientIP = req.headers['x-forwarded-for'] || 
                       req.socket.remoteAddress || 
                       'unknown';
      
      await UserAdapter.trackUserLogin(localUser.id, clientIP as string);
      
      // Set session
      req.session.userId = localUser.id;
      
      // Return user info
      const userResponse = {
        id: localUser.id,
        email: localUser.email,
        displayName: localUser.displayName,
        photoURL: localUser.photoURL,
        provider: localUser.provider,
        role: localUser.role
      };
      
      return res.json({ user: userResponse });
    } catch (error) {
      console.error('Social login error:', error);
      return res.status(500).json({ message: 'Error during social login' });
    }
  }
  
  /**
   * Logout a user
   */
  static async logout(req: Request, res: Response) {
    try {
      // Sign out of Cognito if needed (not required for most apps)
      if (req.session.userId) {
        const [localUser] = await UserAdapter.getUserById(req.session.userId.toString());
        if (localUser?.cognitoId) {
          await authService.getProvider().signOut(localUser.cognitoId);
        }
      }
      
      // Clear session
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Error logging out' });
        }
        
        res.clearCookie('connect.sid'); // Clear the session cookie
        return res.json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ message: 'Error during logout' });
    }
  }
  
  /**
   * Get current user status
   */
  static async status(req: Request, res: Response) {
    try {
      if (req.session.userId) {
        // Get user from database
        const localUser = await UserAdapter.getUserById(req.session.userId.toString());
        
        if (!localUser) {
          // Session references a non-existent user
          req.session.destroy(() => {});
          return res.json({ user: null });
        }
        
        // Return user info
        const userResponse = {
          id: localUser.id,
          email: localUser.email,
          displayName: localUser.displayName,
          photoURL: localUser.photoURL,
          provider: localUser.provider,
          role: localUser.role
        };
        
        return res.json({ user: userResponse });
      }
      
      return res.json({ user: null });
    } catch (error) {
      console.error('Auth status error:', error);
      return res.status(500).json({ message: 'Error checking authentication status' });
    }
  }
  
  /**
   * Reset a user's password
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      // Find user in Cognito
      const cognitoUser = await authService.getProvider().getUserByEmail(email);
      
      if (!cognitoUser) {
        // Don't reveal if user exists for security
        return res.json({ message: 'If an account exists with this email, a password reset link will be sent' });
      }
      
      // Initiate password reset in Cognito
      const success = await authService.getProvider().resetPassword(email);
      
      return res.json({ 
        message: 'If an account exists with this email, a password reset link will be sent',
        success
      });
    } catch (error) {
      console.error('Password reset error:', error);
      // Don't reveal failure details
      return res.json({ 
        message: 'If an account exists with this email, a password reset link will be sent',
        success: false
      });
    }
  }
  
  /**
   * Change a user's password
   */
  static async changePassword(req: Request, res: Response) {
    try {
      const { oldPassword, newPassword } = req.body;
      
      if (!req.session.userId) {
        return res.status(401).json({ message: 'You must be logged in to change your password' });
      }
      
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old password and new password are required' });
      }
      
      // Get user from database
      const localUser = await UserAdapter.getUserById(req.session.userId.toString());
      
      if (!localUser || !localUser.cognitoId) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Change password in Cognito
      const success = await authService.getProvider().changePassword(
        localUser.cognitoId,
        oldPassword,
        newPassword
      );
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to change password. Current password may be incorrect.' });
      }
      
      return res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ message: 'Error changing password' });
    }
  }
  
  /**
   * Middleware to check if user is authenticated
   */
  static isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.session.userId) {
      return next();
    }
    
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  /**
   * Middleware to check if user has admin role
   */
  static isAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get user from session
    UserAdapter.getUserById(req.session.userId.toString())
      .then(user => {
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }
        
        return next();
      })
      .catch(error => {
        console.error('Auth check error:', error);
        return res.status(500).json({ message: 'Error checking authorization' });
      });
  }
}