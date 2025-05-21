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
      
      console.log(`Attempting to register user: ${email}`);
      
      // Check if user already exists
      try {
        const existingUser = await UserAdapter.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: 'User with this email already exists' });
        }
      } catch (error) {
        console.log('Error checking existing user, continuing with registration:', error);
      }
      
      // Create user in Cognito
      try {
        console.log('Creating user in Cognito');
        const cognitoUser = await authService.getProvider().createUser({
          email,
          username: username || email.split('@')[0],
          displayName: displayName || username || email.split('@')[0],
          provider: 'cognito'
        });
        
        // Set permanent password
        console.log('Setting user password');
        await authService.getProvider().changePassword(cognitoUser.id, '', password);
        
        // Sync with our database
        console.log('Syncing user with database');
        const localUser = await UserAdapter.syncUser(cognitoUser);
        
        // Set user session
        req.session.userId = localUser.id;
        
        // Return user info 
        return res.status(201).json({ 
          user: {
            id: localUser.id,
            email: localUser.email,
            username: localUser.username,
            displayName: localUser.displayName,
            photoURL: localUser.photoURL,
            provider: localUser.provider
          }
        });
      } catch (error) {
        console.error('Error creating user in Cognito:', error);
        throw error;
      }
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
      
      console.log(`Attempting to login user: ${email}`);
      
      try {
        // Authenticate with Cognito
        const cognitoUser = await authService.getProvider().signIn(email, password);
        if (!cognitoUser) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Sync with our database
        const localUser = await UserAdapter.syncUser(cognitoUser);
        
        // Set user session
        req.session.userId = localUser.id;
        
        // Return user info
        return res.json({ 
          user: {
            id: localUser.id,
            email: localUser.email,
            username: localUser.username,
            displayName: localUser.displayName,
            photoURL: localUser.photoURL,
            provider: localUser.provider
          }
        });
      } catch (error) {
        console.error('Cognito sign-in error:', error);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
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
      // For AWS signin, we'll handle a simpler request format
      console.log('Social login request body:', req.body);
      
      // Extract email from the request - handle both direct email and nested formats
      const email = req.body.email || (req.body.user && req.body.user.email);
      const displayName = req.body.displayName || (req.body.user && req.body.user.displayName) || email;
      const provider = req.body.provider || 'aws';
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      console.log(`Social login for: ${email} with provider: ${provider || 'AWS'}`);
      
      try {
        // First check if the user already exists
        let cognitoUser = await authService.getProvider().getUserByEmail(email);
        
        // If not, create them
        if (!cognitoUser) {
          console.log('User not found, creating new user');
          cognitoUser = await authService.getProvider().createUser({
            email,
            username: email.split('@')[0],
            displayName: displayName || email.split('@')[0],
            provider: provider || 'aws',
            photoURL: req.body.photoURL
          });
        }
        
        // Sync with database
        const localUser = await UserAdapter.syncUser(cognitoUser);
        
        // Set user session
        req.session.userId = localUser.id;
        
        // Return user info
        return res.json({ 
          user: {
            id: localUser.id,
            email: localUser.email,
            username: localUser.username,
            displayName: localUser.displayName,
            photoURL: localUser.photoURL,
            provider: localUser.provider || provider || 'aws'
          }
        });
      } catch (error) {
        console.error('Social login processing error:', error);
        throw error;
      }
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
      if (req.session.userId) {
        // Sign out from Cognito if needed
        try {
          await authService.getProvider().signOut(req.session.userId.toString());
        } catch (error) {
          console.error('Cognito sign-out error:', error);
          // Continue with logout even if Cognito fails
        }
        
        // Clear session
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).json({ message: 'Error during logout' });
          }
          
          res.clearCookie('connect.sid');
          return res.json({ message: 'Logged out successfully' });
        });
      } else {
        return res.status(200).json({ message: 'No active session' });
      }
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
      if (!req.session.userId) {
        return res.json({ user: null });
      }
      
      const user = await UserAdapter.getUser(req.session.userId);
      
      if (!user) {
        req.session.destroy(() => {}); // Clean up invalid session
        return res.json({ user: null });
      }
      
      return res.json({ 
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: user.provider
        }
      });
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
      
      const success = await authService.getProvider().resetPassword(email);
      
      if (success) {
        return res.json({ message: 'Password reset instructions sent' });
      } else {
        return res.status(400).json({ message: 'Failed to initiate password reset' });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({ message: 'Error processing password reset' });
    }
  }

  /**
   * Change a user's password
   */
  static async changePassword(req: Request, res: Response) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old and new passwords are required' });
      }
      
      const user = await UserAdapter.getUser(req.session.userId);
      
      if (!user || !user.cognitoId) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const success = await authService.getProvider().changePassword(
        user.cognitoId,
        oldPassword,
        newPassword
      );
      
      if (success) {
        return res.json({ message: 'Password changed successfully' });
      } else {
        return res.status(400).json({ message: 'Failed to change password' });
      }
    } catch (error) {
      console.error('Password change error:', error);
      return res.status(500).json({ message: 'Error changing password' });
    }
  }

  /**
   * Middleware to check if user is authenticated
   */
  static isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  }
}