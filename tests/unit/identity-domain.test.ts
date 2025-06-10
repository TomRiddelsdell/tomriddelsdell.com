import { describe, it, expect, beforeEach } from 'vitest';
import { User, UserRole, AuthProvider } from '../../src/domains/identity/domain/entities/User';
import { UserId } from '../../src/shared/kernel/value-objects/UserId';
import { Email } from '../../src/shared/kernel/value-objects/Email';
import { CognitoId } from '../../src/shared/kernel/value-objects/CognitoId';
import { UserRegisteredEvent, UserAuthenticatedEvent } from '../../src/shared/kernel/events/DomainEvent';

describe('Identity Domain', () => {
  describe('Value Objects', () => {
    it('should create valid UserId', () => {
      const userId = UserId.fromNumber(123);
      expect(userId.getValue()).toBe(123);
    });

    it('should throw error for invalid UserId', () => {
      expect(() => UserId.fromNumber(0)).toThrow('UserId must be a positive number');
      expect(() => UserId.fromNumber(-1)).toThrow('UserId must be a positive number');
    });

    it('should create valid Email', () => {
      const email = Email.fromString('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw error for invalid Email', () => {
      expect(() => Email.fromString('invalid-email')).toThrow('Invalid email format');
      expect(() => Email.fromString('')).toThrow('Invalid email format');
    });

    it('should create valid CognitoId', () => {
      const cognitoId = CognitoId.fromString('cognito-123');
      expect(cognitoId.getValue()).toBe('cognito-123');
    });

    it('should throw error for empty CognitoId', () => {
      expect(() => CognitoId.fromString('')).toThrow('CognitoId cannot be empty');
    });
  });

  describe('User Entity', () => {
    let user: User;

    beforeEach(() => {
      user = User.create(
        UserId.fromNumber(1),
        Email.fromString('test@example.com'),
        CognitoId.fromString('cognito-123'),
        'testuser',
        'Test User'
      );
    });

    it('should create user with default values', () => {
      expect(user.getId().getValue()).toBe(1);
      expect(user.getEmail().getValue()).toBe('test@example.com');
      expect(user.getCognitoId().getValue()).toBe('cognito-123');
      expect(user.getUsername()).toBe('testuser');
      expect(user.getDisplayName()).toBe('Test User');
      expect(user.getRole()).toBe(UserRole.USER);
      expect(user.isActiveUser()).toBe(true);
      expect(user.getLoginCount()).toBe(0);
    });

    it('should emit UserRegisteredEvent when created', () => {
      const events = user.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserRegisteredEvent);
      expect((events[0] as UserRegisteredEvent).userId).toBe('1');
      expect((events[0] as UserRegisteredEvent).email).toBe('test@example.com');
    });

    it('should handle authentication correctly', () => {
      const ipAddress = '192.168.1.1';
      user.authenticate(ipAddress);

      expect(user.getLoginCount()).toBe(1);
      expect(user.getLastLogin()).toBeDefined();

      const events = user.getDomainEvents();
      const authEvent = events.find(e => e instanceof UserAuthenticatedEvent) as UserAuthenticatedEvent;
      expect(authEvent).toBeDefined();
      expect(authEvent.userId).toBe('1');
      expect(authEvent.ipAddress).toBe(ipAddress);
    });

    it('should update profile correctly', () => {
      user.updateProfile('New Display Name', 'es');
      expect(user.getDisplayName()).toBe('New Display Name');
    });

    it('should change role correctly', () => {
      user.changeRole(UserRole.ADMIN);
      expect(user.getRole()).toBe(UserRole.ADMIN);
      expect(user.isAdmin()).toBe(true);
    });

    it('should handle deactivation', () => {
      user.deactivate();
      expect(user.isActiveUser()).toBe(false);

      expect(() => user.authenticate()).toThrow('User account is inactive');
    });

    it('should convert to plain object correctly', () => {
      const plainObject = user.toPlainObject();
      expect(plainObject.id).toBe(1);
      expect(plainObject.email).toBe('test@example.com');
      expect(plainObject.cognitoId).toBe('cognito-123');
      expect(plainObject.username).toBe('testuser');
      expect(plainObject.role).toBe(UserRole.USER);
      expect(plainObject.provider).toBe(AuthProvider.COGNITO);
    });
  });
});