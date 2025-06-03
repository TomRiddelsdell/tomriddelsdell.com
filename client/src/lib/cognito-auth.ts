// Simple AWS Cognito authentication using the hosted UI
export interface CognitoUser {
  id: string;
  email: string;
  name?: string;
}

class CognitoAuth {
  private clientId: string;
  private hostedUIDomain: string;
  private redirectUri: string;

  constructor() {
    this.clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
    this.hostedUIDomain = import.meta.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN;
    this.redirectUri = `${window.location.origin}/auth/callback`;
  }

  // Redirect to Cognito hosted UI for login
  signIn() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: this.redirectUri
    });

    window.location.href = `${this.hostedUIDomain}/login?${params}`;
  }

  // Sign out by redirecting to Cognito logout
  signOut() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      logout_uri: window.location.origin
    });

    window.location.href = `${this.hostedUIDomain}/logout?${params}`;
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