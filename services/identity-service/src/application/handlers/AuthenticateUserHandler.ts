import { AuthenticationService } from '../../../../domains/identity/src/services/AuthenticationService';
import { CognitoId } from '../../../../domains/shared-kernel/src/value-objects/CognitoId';
import { User } from '../../../../domains/identity/src/entities/User';

export interface AuthenticateUserCommand {
  cognitoId: string;
  ipAddress?: string;
}

export interface AuthenticateUserResult {
  user: {
    id: number;
    email: string;
    displayName: string | null;
    role: string;
    isActive: boolean;
  };
  authenticated: boolean;
}

export class AuthenticateUserHandler {
  constructor(private authenticationService: AuthenticationService) {}

  async handle(command: AuthenticateUserCommand): Promise<AuthenticateUserResult> {
    try {
      const cognitoId = CognitoId.fromString(command.cognitoId);
      const user = await this.authenticationService.authenticateUser(cognitoId, command.ipAddress);
      
      return {
        user: {
          id: user.getId().getValue(),
          email: user.getEmail().getValue(),
          displayName: user.getDisplayName(),
          role: user.getRole(),
          isActive: user.isActiveUser()
        },
        authenticated: true
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}