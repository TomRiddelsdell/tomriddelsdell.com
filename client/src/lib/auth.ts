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
    const res = await fetch('/api/auth/status', {
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
    const url = '/api/auth/signin';
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
  const res = await apiRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  if (!res.user) {
    throw new Error(res.message || 'Failed to sign up');
  }
  
  return res.user;
}

// Sign in with Google
export async function googleSignIn(): Promise<AuthUser> {
  try {
    const defaultEmail = "t.riddelsdell@gmail.com";
    
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

// Sign in with AWS
export async function awsSignIn(): Promise<AuthUser> {
  try {
    const defaultEmail = "t.riddelsdell@gmail.com";
    
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