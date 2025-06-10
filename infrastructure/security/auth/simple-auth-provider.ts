import { AuthOptions, AuthProvider, AuthUser } from "./types";

/**
 * A simplified authentication provider for local development and demos
 */
export class SimpleAuthProvider implements AuthProvider {
  private users: Map<string, AuthUser> = new Map();
  private emailToId: Map<string, string> = new Map();
  private passwords: Map<string, string> = new Map(); // Simple password storage

  constructor(_options: AuthOptions) {
    // Add a demo user
    const demoUser: AuthUser = {
      id: 'demo-user-1',
      email: 'tom@example.com',
      username: 'tom',
      displayName: 'Tom Riddelsdell',
      photoURL: undefined,
      provider: 'email'
    };
    
    this.users.set(demoUser.id, demoUser);
    this.emailToId.set(demoUser.email, demoUser.id);
    this.passwords.set(demoUser.id, 'password123'); // Default password for demo
    
    console.log('SimpleAuthProvider initialized with demo user');
  }

  /**
   * Create a new user
   */
  async createUser(userData: Partial<AuthUser>): Promise<AuthUser> {
    if (!userData.email) {
      throw new Error('Email is required');
    }
    
    // Check if user already exists
    if (this.emailToId.has(userData.email)) {
      throw new Error('User with this email already exists');
    }
    
    // Create new user
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const username = userData.username || userData.email.split('@')[0];
    
    const newUser: AuthUser = {
      id: userId,
      email: userData.email,
      username: username,
      displayName: userData.displayName || username,
      photoURL: userData.photoURL || undefined,
      provider: userData.provider || 'email'
    };
    
    // Save user
    this.users.set(userId, newUser);
    this.emailToId.set(userData.email, userId);
    
    console.log(`Created new user: ${newUser.email}`);
    return newUser;
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(email: string, password: string): Promise<AuthUser | null> {
    const userId = this.emailToId.get(email);
    if (!userId) {
      console.log(`Login failed: User not found for email ${email}`);
      return null;
    }
    
    // For demo purposes, any password works for existing users
    const user = this.users.get(userId);
    console.log(`User logged in: ${email}`);
    return user || null;
  }

  /**
   * Sign out a user
   */
  async signOut(_userId: string): Promise<boolean> {
    return true;
  }

  /**
   * Get a user by their ID
   */
  async getUserById(id: string): Promise<AuthUser | null> {
    return this.users.get(id) || null;
  }

  /**
   * Get a user by their email address
   */
  async getUserByEmail(email: string): Promise<AuthUser | null> {
    const userId = this.emailToId.get(email);
    if (!userId) {
      return null;
    }
    
    return this.users.get(userId) || null;
  }

  /**
   * Reset a user's password
   */
  async resetPassword(_email: string): Promise<boolean> {
    return true;
  }

  /**
   * Confirm a password reset
   */
  async confirmResetPassword(_email: string, _code: string, _newPassword: string): Promise<boolean> {
    return true;
  }

  /**
   * Change a user's password
   */
  async changePassword(userId: string, _oldPassword: string, newPassword: string): Promise<boolean> {
    if (this.users.has(userId)) {
      this.passwords.set(userId, newPassword);
      return true;
    }
    return false;
  }

  /**
   * Authenticate with Google token
   */
  async authenticateWithGoogle(_token: string): Promise<AuthUser | null> {
    // Create a simulated Google user
    const googleUser: AuthUser = {
      id: `google-user-${Date.now()}`,
      email: 'google-user@example.com',
      username: 'googleuser',
      displayName: 'Google User',
      photoURL: undefined,
      provider: 'google'
    };
    
    // Store the user
    this.users.set(googleUser.id, googleUser);
    this.emailToId.set(googleUser.email, googleUser.id);
    
    return googleUser;
  }
}