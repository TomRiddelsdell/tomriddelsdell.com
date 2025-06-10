export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor() {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }

  abstract getEventName(): string;
}

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly cognitoId: string
  ) {
    super();
  }

  getEventName(): string {
    return 'UserRegistered';
  }
}

export class UserAuthenticatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly ipAddress?: string
  ) {
    super();
  }

  getEventName(): string {
    return 'UserAuthenticated';
  }
}

export class UserSignedOutEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly sessionDuration: number
  ) {
    super();
  }

  getEventName(): string {
    return 'UserSignedOut';
  }
}