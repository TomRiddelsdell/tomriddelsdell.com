import { Request, Response } from 'express';
import { AuthenticationCommandHandler } from '../../application/handlers/AuthenticationCommandHandler';
import { UserQueryHandler } from '../../application/handlers/UserQueryHandler';
import { 
  AuthenticateUserCommand,
  AuthenticateOrCreateUserCommand,
  UpdateUserProfileCommand,
  ChangeUserRoleCommand,
  DeactivateUserCommand
} from '../../application/commands/AuthenticateUserCommand';
import {
  GetUserByIdQuery,
  GetUserByEmailQuery,
  GetUserStatsQuery,
  GetAllUsersQuery,
  SearchUsersQuery
} from '../../application/queries/GetUserQuery';
import { handleError } from '../../../../../server/errors';

export class IdentityController {
  constructor(
    private readonly commandHandler: AuthenticationCommandHandler,
    private readonly queryHandler: UserQueryHandler
  ) {}

  async authenticateUser(req: Request, res: Response): Promise<void> {
    try {
      const { cognitoId } = req.body;
      const ipAddress = req.ip;

      const command = new AuthenticateUserCommand(cognitoId, ipAddress);
      const user = await this.commandHandler.handleAuthenticateUser(command);

      res.json(user.toPlainObject());
    } catch (error) {
      handleError(error, res, 'Authentication failed');
    }
  }

  async authenticateOrCreateUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, cognitoId, username, displayName, provider } = req.body;
      const ipAddress = req.ip;

      const command = new AuthenticateOrCreateUserCommand(
        email,
        cognitoId,
        username,
        displayName,
        provider,
        ipAddress
      );

      const result = await this.commandHandler.handleAuthenticateOrCreateUser(command);

      res.json({
        user: result.user.toPlainObject(),
        isNewUser: result.isNewUser
      });
    } catch (error) {
      handleError(error, res, 'Authentication or user creation failed');
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // Extract user ID from session or token
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const query = new GetUserByIdQuery(userId);
      const user = await this.queryHandler.handleGetUserById(query);

      res.json(user.toPlainObject());
    } catch (error) {
      handleError(error, res, 'Failed to get current user');
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const query = new GetUserByIdQuery(userId);
      const user = await this.queryHandler.handleGetUserById(query);

      res.json(user.toPlainObject());
    } catch (error) {
      handleError(error, res, 'User not found');
    }
  }

  async updateUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { displayName, preferredLanguage } = req.body;

      const command = new UpdateUserProfileCommand(userId, displayName, preferredLanguage);
      await this.commandHandler.handleUpdateUserProfile(command);

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      handleError(error, res, 'Failed to update profile');
    }
  }

  async changeUserRole(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      const command = new ChangeUserRoleCommand(userId, role);
      await this.commandHandler.handleChangeUserRole(command);

      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      handleError(error, res, 'Failed to change user role');
    }
  }

  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      const command = new DeactivateUserCommand(userId);
      await this.commandHandler.handleDeactivateUser(command);

      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      handleError(error, res, 'Failed to deactivate user');
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.active === 'true';
      const query = new GetAllUsersQuery(activeOnly);
      const users = await this.queryHandler.handleGetAllUsers(query);

      res.json(users.map(user => user.toPlainObject()));
    } catch (error) {
      handleError(error, res, 'Failed to get users');
    }
  }

  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : undefined;
      const query = new GetUserStatsQuery(days);
      const stats = await this.queryHandler.handleGetUserStats(query);

      res.json(stats);
    } catch (error) {
      handleError(error, res, 'Failed to get user statistics');
    }
  }

  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const searchTerm = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const query = new SearchUsersQuery(searchTerm, limit);
      const users = await this.queryHandler.handleSearchUsers(query);

      res.json(users.map(user => user.toPlainObject()));
    } catch (error) {
      handleError(error, res, 'Failed to search users');
    }
  }
}