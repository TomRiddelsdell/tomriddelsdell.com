import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Identity Domain Application Services Tests
 * 
 * Following DDD principles:
 * - Application Services orchestrate domain operations
 * - They handle cross-cutting concerns like transactions
 * - They translate between external interfaces and domain layer
 * - They enforce security and validation policies
 */

// Mock the domain layer following DDD dependency inversion
vi.mock('../../entities', () => ({
  User: vi.fn().mockImplementation((props) => ({
    id: props.id || 'user-123',
    email: props.email,
    displayName: props.displayName,
    cognitoId: props.cognitoId,
    role: props.role || 'user',
    isActive: props.isActive ?? true,
    changeEmail: vi.fn(),
    updateDisplayName: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    toDomainEvent: vi.fn()
  }))
}));

vi.mock('../../repositories', () => ({
  UserRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByCognitoId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn()
  }))
}));

interface User {
  id: string;
  email: string;
  displayName: string;
  cognitoId: string;
  role: string;
  isActive: boolean;
}

interface CreateUserCommand {
  email: string;
  displayName: string;
  cognitoId: string;
  role?: string;
}

interface UpdateUserCommand {
  id: string;
  email?: string;
  displayName?: string;
  role?: string;
}

/**
 * Identity Application Service
 * Orchestrates user management operations following DDD patterns
 */
class IdentityApplicationService {
  constructor(
    private userRepository: any,
    private eventPublisher: any
  ) {}

  async createUser(command: CreateUserCommand): Promise<User> {
    // Business rule: Check if user already exists
    const existingUser = await this.userRepository.findByCognitoId(command.cognitoId);
    if (existingUser) {
      throw new Error('User already exists with this Cognito ID');
    }

    // Business rule: Check if email is already taken
    const existingEmailUser = await this.userRepository.findByEmail(command.email);
    if (existingEmailUser) {
      throw new Error('User already exists with this email');
    }

    // Create domain entity
    const { User } = await import('../../src/entities');
    const user = new User({
      email: command.email,
      displayName: command.displayName,
      cognitoId: command.cognitoId,
      role: command.role || 'user'
    });

    // Save to repository
    const savedUser = await this.userRepository.save(user);
    
    // Publish domain event
    await this.eventPublisher.publish({
      type: 'UserCreated',
      aggregateId: savedUser.id,
      data: savedUser
    });

    return savedUser;
  }

  async updateUser(command: UpdateUserCommand): Promise<User> {
    const user = await this.userRepository.findById(command.id);
    if (!user) {
      throw new Error('User not found');
    }

    // Apply business rules through domain entity
    if (command.email) {
      user.changeEmail(command.email);
    }
    if (command.displayName) {
      user.updateDisplayName(command.displayName);
    }

    const updatedUser = await this.userRepository.save(user);
    
    // Publish domain event
    await this.eventPublisher.publish({
      type: 'UserUpdated',
      aggregateId: updatedUser.id,
      data: updatedUser
    });

    return updatedUser;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  async getUserByCognitoId(cognitoId: string): Promise<User | null> {
    return await this.userRepository.findByCognitoId(cognitoId);
  }

  async deactivateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.deactivate();
    await this.userRepository.save(user);
    
    await this.eventPublisher.publish({
      type: 'UserDeactivated',
      aggregateId: userId,
      data: { userId }
    });
  }
}

describe('Identity Application Service', () => {
  let service: IdentityApplicationService;
  let mockUserRepository: any;
  let mockEventPublisher: any;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByCognitoId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn()
    };

    mockEventPublisher = {
      publish: vi.fn().mockResolvedValue(undefined)
    };

    service = new IdentityApplicationService(mockUserRepository, mockEventPublisher);
  });

  describe('createUser', () => {
    it('should create a new user when valid data is provided', async () => {
      const command: CreateUserCommand = {
        email: 'test@example.com',
        displayName: 'Test User',
        cognitoId: 'cognito-123'
      };

      mockUserRepository.findByCognitoId.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue({
        id: 'user-123',
        ...command,
        role: 'user',
        isActive: true
      });

      const result = await service.createUser(command);

      expect(result).toMatchObject({
        email: command.email,
        displayName: command.displayName,
        cognitoId: command.cognitoId
      });
      expect(mockEventPublisher.publish).toHaveBeenCalledWith({
        type: 'UserCreated',
        aggregateId: 'user-123',
        data: expect.any(Object)
      });
    });

    it('should throw error when user already exists with same Cognito ID', async () => {
      const command: CreateUserCommand = {
        email: 'test@example.com',
        displayName: 'Test User',
        cognitoId: 'cognito-123'
      };

      mockUserRepository.findByCognitoId.mockResolvedValue({ id: 'existing-user' });

      await expect(service.createUser(command)).rejects.toThrow('User already exists with this Cognito ID');
    });

    it('should throw error when user already exists with same email', async () => {
      const command: CreateUserCommand = {
        email: 'test@example.com',
        displayName: 'Test User',
        cognitoId: 'cognito-123'
      };

      mockUserRepository.findByCognitoId.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(service.createUser(command)).rejects.toThrow('User already exists with this email');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const command: UpdateUserCommand = {
        id: 'user-123',
        email: 'updated@example.com',
        displayName: 'Updated User'
      };

      const existingUser = {
        id: 'user-123',
        email: 'old@example.com',
        displayName: 'Old User',
        changeEmail: vi.fn(),
        updateDisplayName: vi.fn()
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({
        ...existingUser,
        email: command.email,
        displayName: command.displayName
      });

      const result = await service.updateUser(command);

      expect(existingUser.changeEmail).toHaveBeenCalledWith(command.email);
      expect(existingUser.updateDisplayName).toHaveBeenCalledWith(command.displayName);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith({
        type: 'UserUpdated',
        aggregateId: 'user-123',
        data: expect.any(Object)
      });
    });

    it('should throw error when user not found', async () => {
      const command: UpdateUserCommand = {
        id: 'non-existent-user',
        email: 'test@example.com'
      };

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.updateUser(command)).rejects.toThrow('User not found');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const email = 'test@example.com';
      const expectedUser = { id: 'user-123', email };

      mockUserRepository.findByEmail.mockResolvedValue(expectedUser);

      const result = await service.getUserByEmail(email);

      expect(result).toBe(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should return null when user not found', async () => {
      const email = 'nonexistent@example.com';

      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await service.getUserByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('getUserByCognitoId', () => {
    it('should return user when found', async () => {
      const cognitoId = 'cognito-123';
      const expectedUser = { id: 'user-123', cognitoId };

      mockUserRepository.findByCognitoId.mockResolvedValue(expectedUser);

      const result = await service.getUserByCognitoId(cognitoId);

      expect(result).toBe(expectedUser);
      expect(mockUserRepository.findByCognitoId).toHaveBeenCalledWith(cognitoId);
    });

    it('should return null when user not found', async () => {
      const cognitoId = 'nonexistent-cognito-id';

      mockUserRepository.findByCognitoId.mockResolvedValue(null);

      const result = await service.getUserByCognitoId(cognitoId);

      expect(result).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        deactivate: vi.fn()
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(user);

      await service.deactivateUser(userId);

      expect(user.deactivate).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith({
        type: 'UserDeactivated',
        aggregateId: userId,
        data: { userId }
      });
    });

    it('should throw error when user not found', async () => {
      const userId = 'non-existent-user';

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.deactivateUser(userId)).rejects.toThrow('User not found');
    });
  });
});
