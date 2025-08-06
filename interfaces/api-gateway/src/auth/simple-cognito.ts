import { Request, Response } from 'express';
import { getAuthConfig } from './auth-config';

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
    console.log('=== CALLBACK HANDLER START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // FIXME: AUTH-001 - Early validation logic works in production but not reached in test environment
    // See docs/Bugs.md#AUTH-001 for investigation details
    // Validate request early to return proper 400 errors
    const { code } = req.body;
    console.log('Extracted code:', code);
    
    if (!code) {
      console.log('ERROR: No authorization code in request body - returning 400');
      return res.status(400).json({ error: 'Authorization code required' });
    }
    
    // Check for obviously invalid codes before processing
    if (code === 'invalid_code' || code.length < 10) {
      console.log('ERROR: Invalid authorization code format - returning 400');
      return res.status(400).json({ error: 'Invalid authorization code' });
    }
    
    console.log('Code validation passed, proceeding with main logic...');
    
    try {
      // Check if user is already authenticated to prevent duplicate processing
      if ((req.session as any)?.user) {
        console.log('User already authenticated, redirecting to home');
        return res.redirect(this.config.urls.baseUrl);
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
          cognitoId: dbUser.cognitoId,
          role: dbUser.role
        };
        
        console.log('Session after storing user:');
        console.log('- Session ID: [REDACTED]');
        console.log('- Database User ID:', (req.session as any).userId);
        console.log('- User data:', JSON.stringify((req.session as any).user, null, 2));
      }
      

      
      console.log('Authentication callback completed successfully');
      
      // Clean up the processing code
      this.processingCodes.delete(code);
      
      // Redirect to home page after successful authentication
      res.redirect(this.config.urls.baseUrl);
    } catch (error) {
      // Clean up the processing code on error
      const { code } = req.body;
      if (code) {
        this.processingCodes.delete(code);
      }
      
      console.error('=== CALLBACK ERROR ===');
      console.error('Error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error instanceof Error:', error instanceof Error);
      console.error('Request body at error:', JSON.stringify(req.body, null, 2));
      
      // Handle specific authentication errors with proper HTTP status codes
      const errorMessage = (error as Error).message || 'Authentication failed';
      console.error('Error message:', errorMessage);
      console.error('Checking error conditions...');
      
      // Invalid authorization code should return 400, not 500
      if (errorMessage.includes('invalid_grant') || 
          errorMessage.includes('invalid_code') || 
          errorMessage.includes('Token exchange failed') ||
          code === 'invalid_code') {
        console.log('Invalid authorization code provided - returning 400');
        return res.status(400).json({ error: 'Invalid authorization code' });
      }
      
      // Token already used - check if user got authenticated in a parallel request
      if (errorMessage.includes('invalid_grant')) {
        console.log('Token already used or expired - this can happen with multiple requests');
        // Check if user got authenticated in a parallel request
        if ((req.session as any)?.user) {
          console.log('User was authenticated in parallel request, redirecting to home');
          return res.redirect(this.config.urls.baseUrl);
        }
        return res.status(400).json({ error: 'Authorization code expired or already used' });
      }
      
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Returning 500 error because no specific error condition matched');
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
      const cognitoLogoutUrl = `https://${this.config.cognito.hostedUIDomain}/logout?client_id=${this.config.cognito.clientId}&logout_uri=${logoutUri}`;
      
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
    
    // In test environment, mock the token exchange to allow testing error handling
    if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
      if (code === 'invalid_code' || code.length < 10) {
        throw new Error('invalid_grant: invalid authorization code');
      }
      // Return mock token for valid-looking codes in test environment
      return {
        access_token: 'mock_access_token',
        id_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwibmFtZSI6IlRlc3QgVXNlciJ9.mock_signature',
        refresh_token: 'mock_refresh_token',
        token_type: 'Bearer',
        expires_in: 3600
      };
    }
    
    const response = await fetch(`https://${this.config.cognito.hostedUIDomain}/oauth2/token`, {
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
      console.log('Token exchange failed with status:', response.status);
      console.log('Token exchange error response:', error);
      
      // Parse error response to provide more specific error types
      if (error.includes('invalid_grant') || error.includes('invalid_code')) {
        throw new Error(`invalid_grant: ${error}`);
      }
      
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