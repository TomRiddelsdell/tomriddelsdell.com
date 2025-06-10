import { describe, it, expect, beforeEach } from 'vitest';
import { User, UserRole, AuthProvider } from '../../src/entities/User';
import { UserAggregate } from '../../src/aggregates/UserAggregate';
import { UserId } from '../../../shared-kernel/src/value-objects/UserId';
import { Email } from '../../../shared-kernel/src/value-objects/Email';
import { CognitoId } from '../../../shared-kernel/src/value-objects/CognitoId';
import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';
import { UserRegisteredEvent, UserAuthenticatedEvent } from '../../../shared-kernel/src/events/DomainEvent';

describe('Identity Domain - Pure DDD Architecture', () => {
  describe('Value Objects', () => {
    it('should create valid UserId', () => {
      const userId = UserId.fromNumber(123);
      expect(userId.getValue()).toBe(123);
    });

    it('should generate unique UserIds', () => {
      const userId1 = UserId.generate();
      const userId2 = UserId.generate();
      expect(userId1.equals(userId2)).toBe(false);
    });

    it('should throw error for invalid UserId', () => {
      expect(() => UserId.fromNumber(0)).toThrow('UserId must be a positive number');
      expect(() => UserId.fromNumber(-1)).toThrow('UserId must be a positive number');
    });

    it('should create valid Email', () => {
      const email = new Email('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw error for invalid Email', () => {
      expect(() => new Email('invalid-email')).toThrow();
      expect(() => new Email('')).toThrow();
    });

    it('should create valid CognitoId', () => {
      const cognitoId = new CognitoId('cognito-123');
      expect(cognitoId.getValue()).toBe('cognito-123');
    });

    it('should throw error for empty CognitoId', () => {
      expect(() => new CognitoId('')).toThrow();
    });
  });

  describe('User Aggregate Root', () => {
    let userAggregate: UserAggregate;
    let email: Email;
    let cognitoId: CognitoId;

    beforeEach(() => {
      email = new Email('test@example.com');
      cognitoId = new CognitoId('cognito-123');
      userAggregate = UserAggregate.register(email, cognitoId, 'testuser', 'Test User');
    });

    it('should enforce business rules during registration', () => {
      expect(() => {
        UserAggregate.register(email, cognitoId, '', 'Test User');
      }).toThrow(DomainException);

      expect(() => {
        UserAggregate.register(email, cognitoId, 'ab', 'Test User');
      }).toThrow(DomainException);

      expect(() => {
        UserAggregate.register(email, cognitoId, 'invalid@username', 'Test User');
      }).toThrow(DomainException);
    });

    it('should create aggregate with proper domain events', () => {
      const events = userAggregate.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserRegisteredEvent);
    });

    it('should handle authentication through aggregate', () => {
      const ipAddress = '192.168.1.1';
      userAggregate.authenticate(ipAddress);

      const user = userAggregate.getUser();
      expect(user.getLoginCount()).toBe(1);
      expect(user.getLastLogin()).toBeDefined();

      const events = userAggregate.getDomainEvents();
      const authEvent = events.find(e => e instanceof UserAuthenticatedEvent);
      expect(authEvent).toBeDefined();
    });

    it('should prevent authentication of inactive users', () => {
      const user = userAggregate.getUser();
      user.deactivate();
      
      expect(() => {
        userAggregate.authenticate();
      }).toThrow(DomainException);
    });

    it('should clear domain events after processing', () => {
      userAggregate.authenticate();
      expect(userAggregate.getDomainEvents().length).toBeGreaterThan(0);
      
      userAggregate.clearDomainEvents();
      expect(userAggregate.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('User Entity - Rich Domain Model', () => {
    let user: User;

    beforeEach(() => {
      user = User.create(
        UserId.fromNumber(1),
        new Email('test@example.com'),
        new CognitoId('cognito-123'),
        'testuser',
        'Test User'
      );
    });

    it('should create user with proper business defaults', () => {
      expect(user.getId().getValue()).toBe(1);
      expect(user.getEmail().getValue()).toBe('test@example.com');
      expect(user.getCognitoId().getValue()).toBe('cognito-123');
      expect(user.getUsername()).toBe('testuser');
      expect(user.getDisplayName()).toBe('Test User');
      expect(user.getRole()).toBe(UserRole.USER);
      expect(user.isActiveUser()).toBe(true);
      expect(user.getLoginCount()).toBe(0);
    });

    it('should emit domain events for business operations', () => {
      const events = user.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserRegisteredEvent);
    });

    it('should enforce business rules for authentication', () => {
      const ipAddress = '192.168.1.1';
      user.authenticate(ipAddress);

      expect(user.getLoginCount()).toBe(1);
      expect(user.getLastLogin()).toBeDefined();

      const events = user.getDomainEvents();
      const authEvent = events.find(e => e instanceof UserAuthenticatedEvent) as UserAuthenticatedEvent;
      expect(authEvent).toBeDefined();
      expect(authEvent.ipAddress).toBe(ipAddress);
    });

    it('should maintain entity consistency during updates', () => {
      user.updateProfile('New Display Name', 'es');
      expect(user.getDisplayName()).toBe('New Display Name');
    });

    it('should handle role transitions with business logic', () => {
      user.changeRole(UserRole.ADMIN);
      expect(user.getRole()).toBe(UserRole.ADMIN);
      expect(user.isAdmin()).toBe(true);
    });

    it('should enforce deactivation business rules', () => {
      user.deactivate();
      expect(user.isActiveUser()).toBe(false);

      expect(() => user.authenticate()).toThrow('User account is inactive');
    });

    it('should provide proper data representation', () => {
      const plainObject = user.toPlainObject();
      expect(plainObject.id).toBe(1);
      expect(plainObject.email).toBe('test@example.com');
      expect(plainObject.role).toBe(UserRole.USER);
      expect(plainObject.provider).toBe(AuthProvider.COGNITO);
    });
  });
});