export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidEmailException extends DomainException {
  constructor(email: string) {
    super(`Invalid email format: ${email}`);
  }
}

export class UserNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
  }
}

export class UserAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`User already exists with email: ${email}`);
  }
}

export class AuthenticationFailedException extends DomainException {
  constructor(reason: string) {
    super(`Authentication failed: ${reason}`);
  }
}