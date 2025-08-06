// Auth types
export interface AuthUser {
  id: number;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
}

// Sign in with AWS Cognito (currently the only authentication method used)
export async function awsSignIn(): Promise<AuthUser> {
  // Import the proper Cognito redirect function
  const { redirectToCognito } = await import('./simple-auth');
  
  // Redirect to Cognito hosted UI for authentication
  await redirectToCognito();
  
  // This function won't return normally since it redirects
  // Return a promise that never resolves as we're redirecting
  return new Promise(() => {});
}