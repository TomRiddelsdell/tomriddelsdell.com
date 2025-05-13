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
    const res = await apiRequest('GET', '/api/auth/status', undefined);
    const data = await res.json();
    return data.user || null;
  } catch (error) {
    return null;
  }
}

// Sign in with email and password
export async function emailSignIn(email: string, password: string, rememberMe?: boolean): Promise<AuthUser> {
  const res = await apiRequest('POST', '/api/auth/signin', { 
    email, 
    password,
    rememberMe: !!rememberMe
  });
  
  const data = await res.json();
  
  if (!data.user) {
    throw new Error(data.message || 'Failed to sign in');
  }
  
  return data.user;
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

// Sign in with Google
export async function googleSignIn(): Promise<AuthUser> {
  // Redirect to Google OAuth URL
  window.location.href = '/api/auth/google';
  
  // This won't actually be reached due to the redirect
  throw new Error('Redirecting to Google sign-in');
}

// Sign out
export async function signOut(): Promise<void> {
  await apiRequest('POST', '/api/auth/signout', undefined);
}
