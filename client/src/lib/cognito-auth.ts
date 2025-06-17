import { getClientAuthConfig } from './auth-config';

// Simple AWS Cognito authentication using the hosted UI
export interface CognitoUser {
  id: string;
  email: string;
  name?: string;
}

class CognitoAuth {
  private config = getClientAuthConfig();
  private callbackInProgress = false;

  constructor() {
    // Configuration is now centralized
  }

  // Redirect to Cognito hosted UI for login
  signIn() {
    const params = new URLSearchParams({
      client_id: this.config.cognito.clientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: this.config.urls.callbackUrl
    });

    window.location.href = `${this.config.cognito.hostedUIDomain}/login?${params}`;
  }

  // Sign out by redirecting to Cognito logout
  signOut() {
    const params = new URLSearchParams({
      client_id: this.config.cognito.clientId,
      logout_uri: this.config.urls.logoutUrl
    });

    window.location.href = `${this.config.cognito.hostedUIDomain}/logout?${params}`;
  }

  // Check authentication status
  async checkAuth(): Promise<CognitoUser | null> {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  // Handle callback with authorization code
  async handleCallback(code: string): Promise<CognitoUser> {
    // Prevent multiple concurrent callback attempts
    if (this.callbackInProgress) {
      console.log('Callback already in progress, waiting...');
      // Wait a moment and check if auth is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      const existingUser = await this.checkAuth();
      if (existingUser) {
        return existingUser;
      }
    }

    this.callbackInProgress = true;
    
    try {
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Auth callback failed:', errorText);
        throw new Error('Authentication failed');
      }

      const result = await response.json();
      return result;
    } finally {
      this.callbackInProgress = false;
    }
  }
}

export const cognitoAuth = new CognitoAuth();