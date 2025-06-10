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
    const username = cognitoUser.Username || this.extractAttribute(attributes, 'preferred_username');
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
}