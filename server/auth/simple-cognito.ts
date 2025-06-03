import { Request, Response } from 'express';

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
  private clientId: string;
  private hostedUIDomain: string;

  constructor() {
    this.clientId = process.env.VITE_AWS_COGNITO_CLIENT_ID!;
    this.hostedUIDomain = process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN!;
  }

  // Handle the callback from Cognito with authorization code
  async handleCallback(req: Request, res: Response) {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, req);
      
      // Parse user info from ID token
      const user = this.parseIdToken(tokens.id_token);
      
      // Store user in session
      (req.session as any).userId = user.id;
      (req.session as any).user = user;
      
      res.json(user);
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Get current user from session
  getCurrentUser(req: Request, res: Response) {
    const user = (req.session as any).user;
    if (user) {
      res.json(user);
    } else {
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
      res.json({ message: 'Signed out successfully' });
    });
  }

  private async exchangeCodeForTokens(code: string, req: Request): Promise<TokenResponse> {
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
    
    const response = await fetch(`${this.hostedUIDomain}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
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