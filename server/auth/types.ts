/**
 * Auth user represents a user as returned by the authentication provider
 */
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  provider: string;
}

/**
 * Credentials for a user when signing in
 */
export interface AuthCredentials {
  username: string;
  password: string;
}

/**
 * Structure for auth provider implementation
 */
export interface AuthProvider {
  // Core authentication methods
  createUser(userData: Partial<AuthUser>): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser | null>;
  signOut(userId: string): Promise<boolean>;
  
  // User management
  getUserById(id: string): Promise<AuthUser | null>;
  getUserByEmail(email: string): Promise<AuthUser | null>;
  
  // Password management
  resetPassword(email: string): Promise<boolean>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
  
  // Third-party auth
  authenticateWithGoogle(token: string): Promise<AuthUser | null>;
}

/**
 * Authentication service interface
 */
export interface AuthService {
  initialize(): Promise<void>;
  getProvider(): AuthProvider;
}

/**
 * Options for configuring the Auth Service
 */
export interface AuthOptions {
  provider: string;
  region?: string;
  userPoolId?: string;
  clientId?: string;
  clientSecret?: string;
}