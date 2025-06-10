import { IdentityModule } from '../IdentityModule';
import { AuthenticateOrCreateUserCommand } from '../../application/commands/AuthenticateUserCommand';
import { GetUserByIdQuery } from '../../application/queries/GetUserQuery';
import { User as DomainUser } from '../../domain/entities/User';

/**
 * Adapter to bridge the DDD Identity domain with the existing authentication system
 */
export class AuthenticationAdapter {
  private identityModule: IdentityModule;

  constructor() {
    this.identityModule = IdentityModule.getInstance();
  }

  /**
   * Authenticate or create user - bridges with existing auth callback
   */
  async authenticateOrCreateUser(userData: {
    email: string;
    cognitoId: string;
    username?: string;
    displayName?: string;
    provider?: string;
  }, ipAddress?: string): Promise<{ user: any; isNewUser: boolean }> {
    
    const username = userData.username || userData.email.split('@')[0];
    
    const command = new AuthenticateOrCreateUserCommand(
      userData.email,
      userData.cognitoId,
      username,
      userData.displayName,
      userData.provider || 'cognito',
      ipAddress
    );

    const result = await this.identityModule.getCommandHandler()
      .handleAuthenticateOrCreateUser(command);

    return {
      user: this.mapDomainUserToLegacyFormat(result.user),
      isNewUser: result.isNewUser
    };
  }

  /**
   * Get user by ID - bridges with existing session management
   */
  async getUserById(id: number): Promise<any | null> {
    try {
      const query = new GetUserByIdQuery(id);
      const user = await this.identityModule.getQueryHandler()
        .handleGetUserById(query);
      
      return this.mapDomainUserToLegacyFormat(user);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get authentication service for advanced operations
   */
  getAuthenticationService() {
    return this.identityModule.getAuthenticationService();
  }

  /**
   * Map domain user to legacy format for backward compatibility
   */
  private mapDomainUserToLegacyFormat(domainUser: DomainUser): any {
    const userData = domainUser.toPlainObject();
    
    return {
      id: userData.id,
      cognitoId: userData.cognitoId,
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      lastLogin: userData.lastLogin,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      provider: userData.provider,
      role: userData.role,
      preferredLanguage: userData.preferredLanguage,
      isActive: userData.isActive,
      loginCount: userData.loginCount,
      lastIP: userData.lastIP
    };
  }

  /**
   * Track user login for existing session management
   */
  async trackUserLogin(userId: number, ipAddress?: string): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (user) {
        // Domain user already handles login tracking through authenticate method
        // This adapter ensures compatibility with existing code
      }
    } catch (error) {
      // Handle silently to maintain backward compatibility
      console.error('Failed to track user login:', error);
    }
  }
}