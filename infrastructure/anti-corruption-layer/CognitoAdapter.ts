import { User, UserRole, AuthProvider } from '../../domains/identity/src/entities/User';
import { Email } from '../../domains/shared-kernel/src/value-objects/Email';
import { CognitoId } from '../../domains/shared-kernel/src/value-objects/CognitoId';
import { UserId } from '../../domains/shared-kernel/src/value-objects/UserId';

/**
 * Anti-Corruption Layer for AWS Cognito
 * Translates between Cognito data structures and our domain models
 * Prevents Cognito concepts from leaking into our domain
 */
export class CognitoAdapter {
  
  /**
   * Converts Cognito user data to our domain User entity
   */
  static toDomainUser(cognitoUser: any): User {
    const attributes = cognitoUser.UserAttributes || cognitoUser.Attributes || [];
    
    const email = this.extractAttribute(attributes, 'email');
    const preferredUsername = this.extractAttribute(attributes, 'preferred_username');
    const username = preferredUsername || cognitoUser.Username;
    const displayName = this.extractAttribute(attributes, 'name') || 
                       this.extractAttribute(attributes, 'given_name');
    
    if (!email) {
      throw new Error('Email is required for user creation');
    }

    if (!username) {
      throw new Error('Username is required for user creation');
    }

    // Generate domain IDs
    const userId = new UserId(this.generateNumericId());
    const emailVO = new Email(email);
    const cognitoId = new CognitoId(cognitoUser.Username);
    
    return User.create(
      userId,
      emailVO,
      cognitoId,
      username,
      displayName || undefined,
      AuthProvider.COGNITO
    );
  }

  /**
   * Maps Cognito groups to our domain roles
   */
  static mapCognitoGroupToRole(groupName: string): UserRole {
    const groupRoleMap: Record<string, UserRole> = {
      'admin': UserRole.ADMIN,
      'editor': UserRole.EDITOR,
      'user': UserRole.USER
    };

    return groupRoleMap[groupName.toLowerCase()] || UserRole.USER;
  }

  /**
   * Helper method to extract attribute value from Cognito attributes array
   */
  private static extractAttribute(attributes: any[], name: string): string | null {
    const attribute = attributes.find((attr: any) => attr.Name === name);
    return attribute ? attribute.Value : null;
  }

  /**
   * Generates a numeric ID for compatibility with existing system
   */
  private static generateNumericId(): number {
    return Math.floor(Math.random() * 1000000) + Date.now();
  }

  /**
   * Extract user status from Cognito user data
   */
  static extractUserStatus(cognitoUser: any): string {
    return cognitoUser.UserStatus || 'CONFIRMED';
  }

  /**
   * Convert Cognito authentication result to application format
   */
  static toAuthenticationResult(authResult: any): any {
    return {
      accessToken: authResult.AuthenticationResult?.AccessToken || '',
      refreshToken: authResult.AuthenticationResult?.RefreshToken || '',
      idToken: authResult.AuthenticationResult?.IdToken || '',
      expiresIn: authResult.AuthenticationResult?.ExpiresIn || 3600
    };
  }

  /**
   * Validate Cognito user data structure
   */
  static validateCognitoUserData(cognitoUser: any): void {
    if (!cognitoUser) {
      throw new Error('Cognito user data is required');
    }

    if (!cognitoUser.Username) {
      throw new Error('Cognito Username is required');
    }

    if (!cognitoUser.UserAttributes || !Array.isArray(cognitoUser.UserAttributes)) {
      throw new Error('UserAttributes array is required');
    }

    const emailAttr = cognitoUser.UserAttributes.find((attr: any) => attr.Name === 'email');
    if (!emailAttr) {
      throw new Error('Email attribute is required in Cognito user data');
    }
  }
}