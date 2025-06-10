import { AuthenticationService } from '../../domain/services/AuthenticationService';
import { 
  AuthenticateUserCommand, 
  AuthenticateOrCreateUserCommand,
  CreateUserCommand,
  UpdateUserProfileCommand,
  ChangeUserRoleCommand,
  DeactivateUserCommand
} from '../commands/AuthenticateUserCommand';
import { User, AuthProvider, UserRole } from '../../domain/entities/User';

export class AuthenticationCommandHandler {
  constructor(
    private readonly authenticationService: AuthenticationService
  ) {}

  async handleAuthenticateUser(command: AuthenticateUserCommand): Promise<User> {
    return await this.authenticationService.authenticateUser(
      command.cognitoId,
      command.ipAddress
    );
  }

  async handleAuthenticateOrCreateUser(command: AuthenticateOrCreateUserCommand): Promise<{ user: User; isNewUser: boolean }> {
    return await this.authenticationService.authenticateOrCreateUser(
      {
        email: command.email,
        cognitoId: command.cognitoId,
        username: command.username,
        displayName: command.displayName,
        provider: command.provider as AuthProvider
      },
      command.ipAddress
    );
  }

  async handleCreateUser(command: CreateUserCommand): Promise<User> {
    return await this.authenticationService.createNewUser({
      email: command.email,
      cognitoId: command.cognitoId,
      username: command.username,
      displayName: command.displayName,
      provider: command.provider as AuthProvider
    });
  }

  async handleUpdateUserProfile(command: UpdateUserProfileCommand): Promise<void> {
    const user = await this.authenticationService.getUserById(command.userId);
    user.updateProfile(command.displayName, command.preferredLanguage);
    // The service would handle persistence through repository
  }

  async handleChangeUserRole(command: ChangeUserRoleCommand): Promise<void> {
    const user = await this.authenticationService.getUserById(command.userId);
    user.changeRole(command.newRole as UserRole);
    // The service would handle persistence through repository
  }

  async handleDeactivateUser(command: DeactivateUserCommand): Promise<void> {
    await this.authenticationService.deactivateUser(command.userId);
  }
}