import { apiRequest } from "./queryClient";

// Auth types
export interface AuthUser {
  id: number;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

// Check if user is logged in
export async function checkAuthStatus(): Promise<AuthUser | null> {
  try {
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
    const res = await fetch(`${baseUrl}/api/auth/status`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await res.json();
    return data.user || null;
  } catch (error) {
    return null;
  }
}

// Sign in with email and password
export async function emailSignIn(email: string, password: string, rememberMe?: boolean): Promise<AuthUser> {
  console.log('Attempting sign in with:', { email, rememberMe });
  
  try {
    // Use the correct server port for API requests
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
    const url = `${baseUrl}/api/auth/signin`;
    console.log('Making request to:', url);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        password,
        rememberMe: !!rememberMe
      }),
      credentials: 'include'
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status}: ${text}`);
    }
    
    const data = await res.json();
    console.log('Sign in response:', data);
    
    if (!data.user) {
      throw new Error(data.message || 'Failed to sign in');
    }
    
    return data.user;
  } catch (error) {
    console.error('Sign in error details:', error);
    throw error;
  }
}

// Sign up with email and password
export async function emailSignUp(email: string, password: string): Promise<AuthUser> {
  const res = await apiRequest('POST', '/api/auth/signup', { email, password });
  const data = await res.json();
  
  if (!data.user) {
    throw new Error(data.message || 'Failed to sign up');
  }
  
  return data.user;
}

// Sign in with Google-like experience
export async function googleSignIn(): Promise<AuthUser> {
  try {
    // Use a default test account for the simplified experience
    const defaultEmail = "t.riddelsdell@gmail.com";
    
    // Call our simplified Google-style signin endpoint
    const res = await fetch('/api/auth/google-signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: defaultEmail }),
      credentials: 'include'
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error('Failed to sign in with Google');
    }
    
    const data = await res.json();
    
    if (!data.user) {
      throw new Error(data.message || 'Failed to sign in with Google');
    }
    
    return data.user;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

// Sign in with AWS Cognito
export async function awsSignIn(): Promise<AuthUser> {
  try {
    // Use a default test account for the simplified experience
    const defaultEmail = "t.riddelsdell@gmail.com";
    
    // Call our simplified AWS-style signin endpoint with proper format
    const res = await fetch('/api/auth/aws-signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: defaultEmail,
        provider: 'aws', 
        displayName: 'Tom Riddelsdell'
      }),
      credentials: 'include'
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error('Failed to sign in with AWS');
    }
    
    const data = await res.json();
    
    if (!data.user) {
      throw new Error(data.message || 'Failed to sign in with AWS');
    }
    
    return data.user;
  } catch (error) {
    console.error('AWS sign in error:', error);
    throw error;
  }
}

// Full AWS OAuth flow (redirects to AWS for login)
export function awsOAuthSignIn(): void {
  window.location.href = '/auth/aws';
}

// Sign out
export async function signOut(): Promise<void> {
  await apiRequest('POST', '/api/auth/signout', undefined);
}
