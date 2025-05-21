import { 
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  AdminResetUserPasswordCommand,
  ListUsersCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { AuthProviderInterface, AuthUser } from './types';

/**
 * AWS Cognito implementation of the authentication provider interface
 */
export class AwsCognitoProvider implements AuthProviderInterface {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor(userPoolId?: string, clientId?: string, region?: string) {
    // Use environment variables if parameters not provided
    this.userPoolId = userPoolId || process.env.AWS_USER_POOL_ID || '';
    this.clientId = clientId || process.env.AWS_CLIENT_ID || '';
    const awsRegion = region || process.env.AWS_REGION || 'us-east-1';

    if (!this.userPoolId) {
      throw new Error('AWS User Pool ID is required');
    }

    if (!this.clientId) {
      throw new Error('AWS Client ID is required');
    }

    this.client = new CognitoIdentityProviderClient({ 
      region: awsRegion,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }

  /**
   * Convert AWS Cognito user to our standardized AuthUser format
   */
  private mapCognitoUserToAuthUser(cognitoUser: any): AuthUser {
    // Extract attributes from Cognito user
    const attributes = cognitoUser.UserAttributes || cognitoUser.Attributes || [];
    
    // Map attributes to a simple object
    const attributesMap: Record<string, string> = {};
    attributes.forEach((attr: any) => {
      attributesMap[attr.Name] = attr.Value;
    });

    return {
      id: cognitoUser.Username || attributesMap.sub,
      email: attributesMap.email || '',
      displayName: attributesMap.name || null,
      photoURL: attributesMap.picture || null,
      provider: 'cognito',
      createdAt: cognitoUser.UserCreateDate || new Date(),
      lastLogin: cognitoUser.UserLastModifiedDate || null,
      attributes: attributesMap
    };
  }

  async getUserById(id: string): Promise<AuthUser | null> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: id
      });

      const response = await this.client.send(command);
      return this.mapCognitoUserToAuthUser(response);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      // Cognito doesn't have a direct "get user by email" so we have to list users and filter
      const command = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1
      });

      const response = await this.client.send(command);
      
      if (response.Users && response.Users.length > 0) {
        return this.mapCognitoUserToAuthUser(response.Users[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async createUser(userData: Partial<AuthUser>): Promise<AuthUser> {
    try {
      if (!userData.email) {
        throw new Error('Email is required to create a user');
      }

      // Prepare user attributes
      const userAttributes = [
        { Name: 'email', Value: userData.email },
        { Name: 'email_verified', Value: 'true' }, // Auto-verify for simplicity
      ];

      if (userData.displayName) {
        userAttributes.push({ Name: 'name', Value: userData.displayName });
      }

      if (userData.photoURL) {
        userAttributes.push({ Name: 'picture', Value: userData.photoURL });
      }

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);

      const command = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: userData.email,
        TemporaryPassword: tempPassword,
        UserAttributes: userAttributes,
        MessageAction: 'SUPPRESS' // Don't send welcome email, we'll handle that ourselves
      });

      const response = await this.client.send(command);
      
      if (!response.User) {
        throw new Error('Failed to create user in Cognito');
      }

      return this.mapCognitoUserToAuthUser(response.User);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<AuthUser>): Promise<AuthUser | null> {
    try {
      const userAttributes = [];

      if (userData.email) {
        userAttributes.push({ Name: 'email', Value: userData.email });
        userAttributes.push({ Name: 'email_verified', Value: 'true' });
      }

      if (userData.displayName) {
        userAttributes.push({ Name: 'name', Value: userData.displayName });
      }

      if (userData.photoURL) {
        userAttributes.push({ Name: 'picture', Value: userData.photoURL });
      }

      if (userAttributes.length === 0) {
        throw new Error('No attributes to update');
      }

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: id,
        UserAttributes: userAttributes
      });

      await this.client.send(command);
      
      // Get the updated user
      return this.getUserById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: id
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser | null> {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      });

      const response = await this.client.send(command);
      
      if (!response.AuthenticationResult) {
        return null;
      }

      // Get user details from Cognito
      const user = await this.getUserByEmail(email);
      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      return null;
    }
  }

  async signInWithProvider(provider: string, token: string): Promise<AuthUser | null> {
    // This would be expanded with social sign-in token validation
    // We're keeping it simple for now
    console.warn('Provider sign-in is not fully implemented in the AWS Cognito adapter');
    return null;
  }

  async signOut(userId: string): Promise<boolean> {
    // Cognito doesn't have server-side sign out like some other providers
    // Client-side sign-out is handled by removing tokens
    return true;
  }

  async resetPassword(email: string): Promise<boolean> {
    try {
      // First, get the user ID from email
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        return false;
      }

      const command = new AdminResetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: user.id
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Set the new password administratively
      const command = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: userId,
        Password: newPassword,
        Permanent: true
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }

  async listUsers(limit: number = 10, paginationToken?: string): Promise<{ users: AuthUser[]; nextToken?: string }> {
    try {
      const command = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Limit: limit,
        PaginationToken: paginationToken
      });

      const response = await this.client.send(command);
      
      const users = (response.Users || []).map(user => this.mapCognitoUserToAuthUser(user));
      
      return {
        users,
        nextToken: response.PaginationToken
      };
    } catch (error) {
      console.error('Error listing users:', error);
      return { users: [] };
    }
  }
}