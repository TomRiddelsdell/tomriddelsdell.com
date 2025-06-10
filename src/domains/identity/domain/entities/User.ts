import { UserId } from '../../../../shared/kernel/value-objects/UserId';
import { Email } from '../../../../shared/kernel/value-objects/Email';
import { CognitoId } from '../../../../shared/kernel/value-objects/CognitoId';
import { DomainEvent, UserRegisteredEvent, UserAuthenticatedEvent } from '../../../../shared/kernel/events/DomainEvent';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  EDITOR = 'editor'
}

export enum AuthProvider {
  COGNITO = 'cognito',
  GOOGLE = 'google',
  AWS = 'aws'
}

export class User {
  private domainEvents: DomainEvent[] = [];

  constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private readonly cognitoId: CognitoId,
    private username: string,
    private displayName: string | null,
    private photoURL: string | null,
    private role: UserRole,
    private provider: AuthProvider,
    private preferredLanguage: string,
    private isActive: boolean,
    private loginCount: number,
    private lastLogin: Date | null,
    private lastIP: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  // Getters
  getId(): UserId {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getCognitoId(): CognitoId {
    return this.cognitoId;
  }

  getUsername(): string {
    return this.username;
  }

  getDisplayName(): string | null {
    return this.displayName;
  }

  getRole(): UserRole {
    return this.role;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isActiveUser(): boolean {
    return this.isActive;
  }

  getLoginCount(): number {
    return this.loginCount;
  }

  getLastLogin(): Date | null {
    return this.lastLogin;
  }

  // Business methods
  authenticate(ipAddress?: string): void {
    if (!this.isActive) {
      throw new Error('User account is inactive');
    }

    this.loginCount += 1;
    this.lastLogin = new Date();
    this.lastIP = ipAddress || null;
    this.updatedAt = new Date();

    this.addDomainEvent(new UserAuthenticatedEvent(
      this.id.toString(),
      this.email.toString(),
      ipAddress
    ));
  }

  updateProfile(displayName?: string, preferredLanguage?: string): void {
    if (displayName !== undefined) {
      this.displayName = displayName;
    }
    if (preferredLanguage !== undefined) {
      this.preferredLanguage = preferredLanguage;
    }
    this.updatedAt = new Date();
  }

  changeRole(newRole: UserRole): void {
    this.role = newRole;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  // Domain events
  addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // Factory method
  static create(
    id: UserId,
    email: Email,
    cognitoId: CognitoId,
    username: string,
    displayName?: string,
    provider: AuthProvider = AuthProvider.COGNITO
  ): User {
    const user = new User(
      id,
      email,
      cognitoId,
      username,
      displayName || null,
      null, // photoURL
      UserRole.USER,
      provider,
      'en', // default language
      true, // isActive
      0, // loginCount
      null, // lastLogin
      null, // lastIP
      new Date(), // createdAt
      new Date() // updatedAt
    );

    user.addDomainEvent(new UserRegisteredEvent(
      id.toString(),
      email.toString(),
      cognitoId.toString()
    ));

    return user;
  }

  // Conversion methods
  toPlainObject() {
    return {
      id: this.id.getValue(),
      email: this.email.getValue(),
      cognitoId: this.cognitoId.getValue(),
      username: this.username,
      displayName: this.displayName,
      photoURL: this.photoURL,
      role: this.role,
      provider: this.provider,
      preferredLanguage: this.preferredLanguage,
      isActive: this.isActive,
      loginCount: this.loginCount,
      lastLogin: this.lastLogin,
      lastIP: this.lastIP,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}