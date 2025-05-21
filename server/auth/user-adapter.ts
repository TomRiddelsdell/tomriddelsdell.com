import { db } from '../db';
import { users, type User } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AuthUser } from './types';
import authService from './index';

/**
 * Adapter to sync between Cognito users and local database
 */
export class UserAdapter {
  /**
   * Synchronize a Cognito user with our database
   * - Creates a new user if none exists
   * - Updates existing user if found
   */
  static async syncUser(cognitoUser: AuthUser): Promise<User> {
    try {
      // Check if user already exists in our database by cognito ID
      let localUser: User | undefined;
      
      if (cognitoUser.id) {
        const [existingUserById] = await db
          .select()
          .from(users)
          .where(eq(users.cognitoId, cognitoUser.id));
        
        if (existingUserById) {
          localUser = existingUserById;
        }
      }
      
      // If not found by Cognito ID, try by email
      if (!localUser && cognitoUser.email) {
        const [existingUserByEmail] = await db
          .select()
          .from(users)
          .where(eq(users.email, cognitoUser.email));
        
        if (existingUserByEmail) {
          localUser = existingUserByEmail;
          
          // Update the Cognito ID if it was found by email but didn't have a Cognito ID
          if (!existingUserByEmail.cognitoId) {
            await db
              .update(users)
              .set({ cognitoId: cognitoUser.id })
              .where(eq(users.id, existingUserByEmail.id));
            
            // Reload the user with updated data
            const [updatedUser] = await db
              .select()
              .from(users)
              .where(eq(users.id, existingUserByEmail.id));
            
            localUser = updatedUser;
          }
        }
      }
      
      // If user doesn't exist, create a new record
      if (!localUser) {
        // Create a new user in our database
        const [newUser] = await db
          .insert(users)
          .values({
            cognitoId: cognitoUser.id,
            username: cognitoUser.email.split('@')[0],
            email: cognitoUser.email,
            displayName: cognitoUser.displayName,
            photoURL: cognitoUser.photoURL,
            provider: cognitoUser.provider,
            lastLogin: new Date(),
          })
          .returning();
        
        return newUser;
      }
      
      // If user exists, update their details if needed
      if (
        localUser.displayName !== cognitoUser.displayName ||
        localUser.photoURL !== cognitoUser.photoURL ||
        !localUser.lastLogin
      ) {
        const [updatedUser] = await db
          .update(users)
          .set({
            displayName: cognitoUser.displayName,
            photoURL: cognitoUser.photoURL,
            lastLogin: new Date(),
          })
          .where(eq(users.id, localUser.id))
          .returning();
        
        return updatedUser;
      }
      
      return localUser;
    } catch (error) {
      console.error('Error syncing user from Cognito to database:', error);
      throw error;
    }
  }
  
  /**
   * Get a user from Cognito by ID and sync with local database
   */
  static async getUserById(id: string): Promise<User | null> {
    try {
      // First check if we have a local user with this cognito ID
      const [localUser] = await db
        .select()
        .from(users)
        .where(eq(users.cognitoId, id));
      
      if (localUser) {
        return localUser;
      }
      
      // If not found locally, try to get from Cognito
      const cognitoUser = await authService.getProvider().getUserById(id);
      
      if (!cognitoUser) {
        return null;
      }
      
      // Sync the user to our database
      return await this.syncUser(cognitoUser);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
  
  /**
   * Get a user from Cognito by email and sync with local database
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      // First check if we have a local user with this email
      const [localUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      if (localUser) {
        return localUser;
      }
      
      // If not found locally, try to get from Cognito
      const cognitoUser = await authService.getProvider().getUserByEmail(email);
      
      if (!cognitoUser) {
        return null;
      }
      
      // Sync the user to our database
      return await this.syncUser(cognitoUser);
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }
  
  /**
   * Track user login in our database
   */
  static async trackUserLogin(userId: number, ipAddress?: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          lastLogin: new Date(),
          lastIP: ipAddress,
          loginCount: (u) => (u.loginCount || 0) + 1
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error tracking user login:', error);
    }
  }
}