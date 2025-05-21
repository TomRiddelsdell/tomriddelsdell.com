/**
 * Authentication provider interface
 * This defines a provider-agnostic interface for auth operations
 */

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  createdAt: Date;
  lastLogin: Date | null;
  attributes?: Record<string, any>;
}

export interface AuthProviderInterface {
  // User operations
  getUserById(id: string): Promise<AuthUser | null>;
  getUserByEmail(email: string): Promise<AuthUser | null>;
  createUser(userData: Partial<AuthUser>): Promise<AuthUser>;
  updateUser(id: string, userData: Partial<AuthUser>): Promise<AuthUser | null>;
  deleteUser(id: string): Promise<boolean>;
  
  // Authentication operations
  signIn(email: string, password: string): Promise<AuthUser | null>;
  signInWithProvider(provider: string, token: string): Promise<AuthUser | null>;
  signOut(userId: string): Promise<boolean>;
  
  // Password operations
  resetPassword(email: string): Promise<boolean>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
  
  // User listing operations
  listUsers(limit?: number, paginationToken?: string): Promise<{
    users: AuthUser[];
    nextToken?: string;
  }>;
}

export interface AuthServiceInterface {
  initialize(): Promise<void>;
  getProvider(): AuthProviderInterface;
}