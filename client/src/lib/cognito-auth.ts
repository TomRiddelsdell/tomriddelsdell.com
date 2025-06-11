import { getClientAuthConfig } from './auth-config';

// Simple AWS Cognito authentication using the hosted UI
export interface CognitoUser {
  id: string;
  email: string;
  name?: string;
}

class CognitoAuth {
  private config = getClientAuthConfig();

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
    const response = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    return await response.json();
  }
}

export const cognitoAuth = new CognitoAuth();