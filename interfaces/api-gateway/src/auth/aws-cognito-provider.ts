import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  InitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  AdminUserGlobalSignOutCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminRespondToAuthChallengeCommand,
  AuthFlowType,
  AttributeType,
  MessageActionType
} from "@aws-sdk/client-cognito-identity-provider";
import { calculateSecretHash } from "./cognito-utils";
import { AuthOptions, AuthProvider, AuthUser } from "./types";

export class AwsCognitoProvider implements AuthProvider {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private clientSecret?: string;

  constructor(options: AuthOptions) {
    if (!options.region || !options.userPoolId || !options.clientId) {
      throw new Error("AWS Cognito provider requires region, userPoolId, and clientId options");
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials are required: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables must be set");
    }

    this.client = new CognitoIdentityProviderClient({
      region: options.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    this.userPoolId = options.userPoolId;
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
  }

  /**
   * Create a new user in Cognito
   */
  async createUser(userData: Partial<AuthUser>): Promise<AuthUser> {
    if (!userData.email) {
      throw new Error("Email is required to create a user");
    }
    
    const username = userData.username || userData.email;
    
    // Prepare user attributes
    const userAttributes: AttributeType[] = [
      { Name: "email", Value: userData.email },
      { Name: "email_verified", Value: "true" }
    ];
    
    if (userData.displayName) {
      userAttributes.push({ Name: "name", Value: userData.displayName });
    }
    
    // Create the user in Cognito
    try {
      const command = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        UserAttributes: userAttributes,
        // This prevents sending the temporary password to the user email
        MessageAction: MessageActionType.SUPPRESS
      });
      
      const response = await this.client.send(command);
      
      if (!response.User) {
        throw new Error("Failed to create user in Cognito");
      }
      
      // Map Cognito user to our user model
      const user: AuthUser = {
        id: response.User.Username || "",
        email: userData.email,
        username: username,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        provider: userData.provider || "cognito"
      };
      
      return user;
    } catch (error) {
      console.error("Cognito create user error:", error);
      throw error;
    }
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(email: string, password: string): Promise<AuthUser | null> {
    try {
      console.log(`Attempting Cognito sign-in for: ${email}`);
      
      // First, get the user to check if they exist and to get their username
      let username = email;
      try {
        const user = await this.getUserByEmail(email);
        if (user && user.username) {
          username = user.username;
          console.log(`Found user by email, using username: ${username}`);
        }
      } catch (error) {
        console.log(`Error getting user by email, using email as username:`, error);
      }
      
      // Set up auth parameters
      const authParameters: Record<string, string> = {
        USERNAME: username,
        PASSWORD: password
      };
      
      // Add SECRET_HASH if client secret is provided
      if (this.clientSecret) {
        authParameters.SECRET_HASH = calculateSecretHash(
          username,
          this.clientId,
          this.clientSecret
        );
      }
      
      // Use ADMIN_USER_PASSWORD_AUTH flow for server-side authentication
      console.log(`Using authentication flow: ADMIN_USER_PASSWORD_AUTH for user ${username}`);
      const authCommand = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        AuthParameters: authParameters
      });
      
      const authResponse = await this.client.send(authCommand);
      
      if (!authResponse.AuthenticationResult) {
        // If the user needs to change password or complete another challenge
        if (authResponse.ChallengeName) {
          console.log(`User needs to complete challenge: ${authResponse.ChallengeName}`);
          
          // Handle NEW_PASSWORD_REQUIRED challenge if needed
          if (authResponse.ChallengeName === "NEW_PASSWORD_REQUIRED") {
            const challengeResponse = await this.client.send(
              new AdminRespondToAuthChallengeCommand({
                UserPoolId: this.userPoolId,
                ClientId: this.clientId,
                ChallengeName: authResponse.ChallengeName,
                ChallengeResponses: {
                  USERNAME: email,
                  NEW_PASSWORD: password // Set the same password
                },
                Session: authResponse.Session
              })
            );
            
            if (!challengeResponse.AuthenticationResult) {
              return null;
            }
          } else {
            return null;
          }
        } else {
          return null;
        }
      }
      
      // Get user details
      return await this.getUserByEmail(email);
    } catch (error) {
      console.error("Cognito sign in error:", error);
      return null;
    }
  }

  /**
   * Sign out a user
   */
  async signOut(userId: string): Promise<boolean> {
    try {
      const command = new AdminUserGlobalSignOutCommand({
        UserPoolId: this.userPoolId,
        Username: userId
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error("Cognito sign out error:", error);
      return false;
    }
  }

  /**
   * Get a user by their Cognito user ID
   */
  async getUserById(id: string): Promise<AuthUser | null> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: id
      });
      
      const response = await this.client.send(command);
      
      // Map the Cognito user to our user model
      const userAttributes = response.UserAttributes || [];
      
      const user: AuthUser = {
        id: response.Username || "",
        email: this.getAttributeValue(userAttributes, "email") || "",
        displayName: this.getAttributeValue(userAttributes, "name"),
        photoURL: this.getAttributeValue(userAttributes, "picture"),
        provider: "cognito"
      };
      
      return user;
    } catch (error) {
      console.error("Cognito get user error:", error);
      return null;
    }
  }

  /**
   * Get a user by their email address
   */
  async getUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      const command = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Filter: `email = "${email}"`,
        Limit: 1
      });
      
      const response = await this.client.send(command);
      
      if (!response.Users || response.Users.length === 0) {
        return null;
      }
      
      const cognitoUser = response.Users[0];
      const userAttributes = cognitoUser.Attributes || [];
      
      const user: AuthUser = {
        id: cognitoUser.Username || "",
        email: this.getAttributeValue(userAttributes, "email") || email,
        displayName: this.getAttributeValue(userAttributes, "name"),
        photoURL: this.getAttributeValue(userAttributes, "picture"),
        provider: "cognito"
      };
      
      return user;
    } catch (error) {
      console.error("Cognito get user by email error:", error);
      return null;
    }
  }

  /**
   * Reset a user's password
   */
  async resetPassword(email: string): Promise<boolean> {
    try {
      // Add SECRET_HASH if client secret is provided
      const clientMetadata: Record<string, string> = {};
      const secretHash = this.clientSecret ? 
        calculateSecretHash(email, this.clientId, this.clientSecret) : 
        undefined;
      
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        SecretHash: secretHash,
        ClientMetadata: clientMetadata
      });
      
      console.log(`Sending forgot password command for user: ${email}`);
      await this.client.send(command);
      console.log(`Forgot password email sent successfully to: ${email}`);
      return true;
    } catch (error) {
      console.error("Cognito reset password error:", error);
      return false;
    }
  }

  /**
   * Confirm a password reset with the code sent to the user's email
   */
  async confirmResetPassword(email: string, code: string, newPassword: string): Promise<boolean> {
    try {
      // Add SECRET_HASH if client secret is provided
      const secretHash = this.clientSecret ? 
        calculateSecretHash(email, this.clientId, this.clientSecret) : 
        undefined;
      
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
        SecretHash: secretHash
      });
      
      console.log(`Confirming password reset for user: ${email}`);
      await this.client.send(command);
      console.log(`Password reset confirmed successfully for: ${email}`);
      return true;
    } catch (error) {
      console.error("Cognito confirm reset password error:", error);
      return false;
    }
  }

  /**
   * Change a user's password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // For the first password setup when oldPassword is empty
      if (!oldPassword) {
        const command = new AdminSetUserPasswordCommand({
          UserPoolId: this.userPoolId,
          Username: userId,
          Password: newPassword,
          Permanent: true
        });
        
        await this.client.send(command);
        return true;
      }
      
      // For changing an existing password, admin can set it directly
      const command = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: userId,
        Password: newPassword,
        Permanent: true
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error("Cognito change password error:", error);
      return false;
    }
  }

  /**
   * Authenticate with Google token
   */
  async authenticateWithGoogle(token: string): Promise<AuthUser | null> {
    // This would typically involve:
    // 1. Verifying the Google token
    // 2. Getting the user info from Google
    // 3. Creating or updating the user in Cognito
    // 4. Returning the user
    
    // For now, this is a placeholder since we need actual Google integration
    console.log("Google authentication not implemented yet");
    return null;
  }

  /**
   * Helper to get attribute value from Cognito attributes array
   */
  private getAttributeValue(attributes: AttributeType[], name: string): string | undefined {
    const attribute = attributes.find(attr => attr.Name === name);
    return attribute?.Value;
  }
}