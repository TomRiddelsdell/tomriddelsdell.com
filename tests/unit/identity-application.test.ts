import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthenticationService } from '../../src/domains/identity/domain/services/AuthenticationService';
import { AuthenticationCommandHandler } from '../../src/domains/identity/application/handlers/AuthenticationCommandHandler';
import { UserQueryHandler } from '../../src/domains/identity/application/handlers/UserQueryHandler';
import { IUserRepository } from '../../src/domains/identity/domain/repositories/IUserRepository';
import { User, UserRole, AuthProvider } from '../../src/domains/identity/domain/entities/User';
import { UserId } from '../../src/shared/kernel/value-objects/UserId';
import { Email } from '../../src/shared/kernel/value-objects/Email';
import { CognitoId } from '../../src/shared/kernel/value-objects/CognitoId';
import {
  AuthenticateOrCreateUserCommand,
  CreateUserCommand,
  UpdateUserProfileCommand
} from '../../src/domains/identity/application/commands/AuthenticateUserCommand';
import {
  GetUserByIdQuery,
  GetUserStatsQuery
} from '../../src/domains/identity/application/queries/GetUserQuery';

describe('Identity Application Layer', () => {
  let mockRepository: IUserRepository;
  let authService: AuthenticationService;
  let commandHandler: AuthenticationCommandHandler;
  let queryHandler: UserQueryHandler;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByCognitoId: vi.fn(),
      findByUsername: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
      findActiveUsers: vi.fn(),
      getUserCount: vi.fn(),
      getActiveUserCount: vi.fn(),
      getNewUserCount: vi.fn(),
      findByRole: vi.fn(),
      searchUsers: vi.fn()
    };

    authService = new AuthenticationService(mockRepository);
    commandHandler = new AuthenticationCommandHandler(authService);
    queryHandler = new UserQueryHandler(authService, mockRepository);
  });

  describe('AuthenticationService', () => {
    it('should authenticate existing user', async () => {
      const user = User.create(
        UserId.fromNumber(1),
        Email.fromString('test@example.com'),
        CognitoId.fromString('cognito-123'),
        'testuser'
      );

      mockRepository.findByCognitoId = vi.fn().mockResolvedValue(user);
      mockRepository.update = vi.fn().mockResolvedValue(undefined);

      const result = await authService.authenticateUser('cognito-123', '192.168.1.1');

      expect(result).toBe(user);
      expect(user.getLoginCount()).toBe(1);
      expect(mockRepository.update).toHaveBeenCalledWith(user);
    });

    it('should throw error for non-existent user', async () => {
      mockRepository.findByCognitoId = vi.fn().mockResolvedValue(null);

      await expect(authService.authenticateUser('non-existent')).rejects.toThrow('User not found');
    });

    it('should create new user when not exists', async () => {
      mockRepository.findByCognitoId = vi.fn().mockResolvedValue(null);
      mockRepository.findByEmail = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);
      mockRepository.update = vi.fn().mockResolvedValue(undefined);

      const userData = {
        email: 'new@example.com',
        cognitoId: 'new-cognito-123',
        username: 'newuser',
        displayName: 'New User'
      };

      const result = await authService.authenticateOrCreateUser(userData);

      expect(result.isNewUser).toBe(true);
      expect(result.user.getEmail().getValue()).toBe('new@example.com');
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('Command Handlers', () => {
    it('should handle AuthenticateOrCreateUserCommand', async () => {
      const user = User.create(
        UserId.fromNumber(1),
        Email.fromString('test@example.com'),
        CognitoId.fromString('cognito-123'),
        'testuser'
      );

      mockRepository.findByCognitoId = vi.fn().mockResolvedValue(user);
      mockRepository.update = vi.fn().mockResolvedValue(undefined);

      const command = new AuthenticateOrCreateUserCommand(
        'test@example.com',
        'cognito-123',
        'testuser',
        'Test User',
        'cognito',
        '192.168.1.1'
      );

      const result = await commandHandler.handleAuthenticateOrCreateUser(command);

      expect(result.user).toBe(user);
      expect(result.isNewUser).toBe(false);
    });
  });

  describe('Query Handlers', () => {
    it('should handle GetUserStatsQuery', async () => {
      mockRepository.getUserCount = vi.fn().mockResolvedValue(100);
      mockRepository.getActiveUserCount = vi.fn().mockResolvedValue(85);
      mockRepository.getNewUserCount = vi.fn().mockResolvedValue(10);

      const query = new GetUserStatsQuery(30);
      const result = await queryHandler.handleGetUserStats(query);

      expect(result).toEqual({
        totalUsers: 100,
        activeUsers: 85,
        newUsers: 10
      });
    });
  });
});