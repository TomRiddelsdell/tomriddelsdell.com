export abstract class DomainEvent {
  readonly occurredAt: Date;
  readonly eventId: string;

  constructor(
    readonly aggregateId: string,
    readonly eventType: string
  ) {
    this.occurredAt = new Date();
    this.eventId = `${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class UserRegisteredEvent extends DomainEvent {
  public readonly userId: string;
  public readonly email: string;
  public readonly cognitoId: string;

  constructor(userId: string, email: string, cognitoId: string) {
    super(userId, 'UserRegistered');
    this.userId = userId;
    this.email = email;
    this.cognitoId = cognitoId;
  }
}

export class UserAuthenticatedEvent extends DomainEvent {
  constructor(
    userId: string,
    readonly email: string,
    readonly ipAddress?: string
  ) {
    super(userId, 'UserAuthenticated');
  }
}

export class NotificationSentEvent extends DomainEvent {
  constructor(
    notificationId: string,
    readonly userId: string,
    readonly channel: string,
    readonly status: 'sent' | 'delivered' | 'failed'
  ) {
    super(notificationId, 'NotificationSent');
  }
}