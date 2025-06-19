import { Request, Response } from 'express';
import { getAuthConfig } from '../auth-config';

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface CognitoUser {
  id: string;
  email: string;
  name?: string;
}

export class SimpleCognitoHandler {
  private config = getAuthConfig();
  private processingCodes = new Set<string>(); // Track codes being processed

  constructor() {
    // Configuration is now centralized
  }

  // Handle the callback from Cognito with authorization code
  async handleCallback(req: Request, res: Response) {
    try {
      // Check if user is already authenticated to prevent duplicate processing
      if ((req.session as any)?.user) {
        console.log('User already authenticated, skipping callback processing');
        return res.status(200).json({ 
          id: (req.session as any).user.cognitoId,
          email: (req.session as any).user.email,
          name: (req.session as any).user.displayName 
        });
      }

      const { code } = req.body;
      
      if (!code) {
        console.log('ERROR: No authorization code in request body');
        return res.status(400).json({ error: 'Authorization code required' });
      }

      // Check if this code is already being processed
      if (this.processingCodes.has(code)) {
        console.log('Code already being processed, waiting for completion...');
        return res.status(200).json({ message: 'Authentication in progress' });
      }

      // Mark code as being processed
      this.processingCodes.add(code);

      console.log('Authorization code received: [REDACTED]');

      // Exchange code for tokens
      console.log('Exchanging code for tokens...');
      const tokens = await this.exchangeCodeForTokens(code, req);
      console.log('Token exchange successful');
      
      // Parse user info from ID token
      console.log('Parsing ID token...');
      const user = this.parseIdToken(tokens.id_token);
      console.log('User parsed from token:', JSON.stringify(user, null, 2));
      
      // Create or find user in database
      console.log('Creating or finding user in database...');
      const { storage } = await import('../storage');
      
      let dbUser = await storage.getUserByCognitoId(user.id);
      if (!dbUser) {
        // Check if user exists by email first
        dbUser = await storage.getUserByEmail(user.email);
        if (dbUser) {
          // Update existing user with Cognito ID
          dbUser = await storage.updateUser(dbUser.id, {
            cognitoId: user.id,
            provider: 'cognito'
          });
          console.log('Updated existing user with Cognito ID:', dbUser);
        } else {
          // Create new user with unique username
          let username = user.email.split('@')[0];
          let counter = 1;
          
          // Ensure username is unique
          while (await storage.getUserByUsername(username)) {
            username = `${user.email.split('@')[0]}${counter}`;
            counter++;
          }
          
          dbUser = await storage.createUser({
            username,
            email: user.email,
            displayName: user.name || user.email.split('@')[0],
            cognitoId: user.id,
            provider: 'cognito'
          });
          console.log('Created new user:', dbUser);
        }
      } else {
        console.log('Found existing user:', dbUser);
      }
      
      // Store database user ID in session
      console.log('Storing user in session...');
      if (dbUser) {
        (req.session as any).userId = dbUser.id;
        (req.session as any).user = {
          id: dbUser.id,
          email: dbUser.email,
          displayName: dbUser.displayName,
          cognitoId: dbUser.cognitoId
        };
        
        console.log('Session after storing user:');
        console.log('- Session ID: [REDACTED]');
        console.log('- Database User ID:', (req.session as any).userId);
        console.log('- User data:', JSON.stringify((req.session as any).user, null, 2));
      }
      

      
      console.log('Authentication callback completed successfully');
      
      // Clean up the processing code
      this.processingCodes.delete(code);
      
      res.json(user);
    } catch (error) {
      // Clean up the processing code on error
      const { code } = req.body;
      if (code) {
        this.processingCodes.delete(code);
      }
      
      console.error('=== CALLBACK ERROR ===');
      console.error('Error details:', error);
      
      // Handle specific token exchange errors more gracefully
      if ((error as Error).message?.includes('invalid_grant')) {
        console.log('Token already used or expired - this can happen with multiple requests');
        // Check if user got authenticated in a parallel request
        if ((req.session as any)?.user) {
          console.log('User was authenticated in parallel request, returning success');
          return res.status(200).json({ 
            id: (req.session as any).user.cognitoId,
            email: (req.session as any).user.email,
            name: (req.session as any).user.displayName 
          });
        }
        return res.status(400).json({ error: 'Authorization code expired or already used' });
      }
      
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Get current user from session
  getCurrentUser(req: Request, res: Response) {
    console.log('Checking authentication - Session ID: [REDACTED]');
    console.log('Session data:', JSON.stringify(req.session, null, 2));
    
    const user = (req.session as any).user;
    const userId = (req.session as any).userId;
    
    console.log('User from session:', user);
    console.log('UserId from session:', userId);
    
    if (user) {
      console.log('User authenticated successfully');
      res.json(user);
    } else {
      console.log('User not authenticated - no user in session');
      res.status(401).json({ error: 'Not authenticated' });
    }
  }

  // Sign out user
  signOut(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Sign out failed' });
      }
      
      // Return the Cognito logout URL so frontend can redirect
      const logoutUri = encodeURIComponent(this.config.urls.logoutUrl);
      const cognitoLogoutUrl = `${this.config.cognito.hostedUIDomain}/logout?client_id=${this.config.cognito.clientId}&logout_uri=${logoutUri}`;
      
      res.json({ 
        message: 'Signed out successfully',
        cognitoLogoutUrl: cognitoLogoutUrl
      });
    });
  }

  private async exchangeCodeForTokens(code: string, req: Request): Promise<TokenResponse> {
    // Use the centralized callback URL
    const redirectUri = this.config.urls.callbackUrl;
    
    console.log('Token exchange redirect URI:', redirectUri);
    
    const response = await fetch(`${this.config.cognito.hostedUIDomain}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.cognito.clientId,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  private parseIdToken(idToken: string): CognitoUser {
    try {
      // Decode the JWT payload (middle part)
      const payload = JSON.parse(
        Buffer.from(idToken.split('.')[1], 'base64').toString()
      );

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.given_name,
      };
    } catch (error) {
      throw new Error('Failed to parse ID token');
    }
  }
}

export const simpleCognitoHandler = new SimpleCognitoHandler();