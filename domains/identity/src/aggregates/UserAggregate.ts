import { User, UserRole, AuthProvider } from '../entities/User';
import { UserId } from '../../../shared-kernel/src/value-objects/UserId';
import { Email } from '../../../shared-kernel/src/value-objects/Email';
import { CognitoId } from '../../../shared-kernel/src/value-objects/CognitoId';
import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';

/**
 * User Aggregate Root
 * Ensures consistency and encapsulates business rules for user operations
 */
export class UserAggregate {
  private constructor(private user: User) {}

  static register(
    email: Email,
    cognitoId: CognitoId,
    username: string,
    displayName?: string,
    provider: AuthProvider = AuthProvider.COGNITO
  ): UserAggregate {
    if (!username || username.trim().length === 0) {
      throw new DomainException('Username cannot be empty');
    }

    if (username.length < 3 || username.length > 50) {
      throw new DomainException('Username must be between 3 and 50 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new DomainException('Username can only contain letters, numbers, hyphens, and underscores');
    }

    const userId = new UserId(Date.now()); // Temporary ID generation
    const user = User.create(userId, email, cognitoId, username.trim(), displayName, provider);
    
    return new UserAggregate(user);
  }

  static fromEntity(user: User): UserAggregate {
    return new UserAggregate(user);
  }

  authenticate(ipAddress?: string): void {
    if (!this.user.isActiveUser()) {
      throw new DomainException('Cannot authenticate inactive user');
    }
    this.user.authenticate(ipAddress);
  }

  getUser(): User {
    return this.user;
  }

  getDomainEvents() {
    return this.user.getDomainEvents();
  }

  clearDomainEvents() {
    this.user.clearDomainEvents();
  }
}