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

// Workflow Domain Events
export class WorkflowCreatedEvent extends DomainEvent {
  constructor(
    public readonly workflowId: string,
    public readonly userId: string,
    public readonly name: string
  ) {
    super();
  }

  getEventName(): string {
    return 'WorkflowCreated';
  }
}

export class WorkflowStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly workflowId: string,
    public readonly userId: string,
    public readonly newStatus: string,
    public readonly timestamp: Date,
    public readonly oldStatus?: string,
    public readonly reason?: string
  ) {
    super();
  }

  getEventName(): string {
    return 'WorkflowStatusChanged';
  }
}

export class WorkflowExecutedEvent extends DomainEvent {
  constructor(
    public readonly workflowId: string,
    public readonly userId: string,
    public readonly executionId: string,
    public readonly timestamp: Date,
    public readonly ipAddress?: string
  ) {
    super();
  }

  getEventName(): string {
    return 'WorkflowExecuted';
  }
}

export class WorkflowDeletedEvent extends DomainEvent {
  constructor(
    public readonly workflowId: string,
    public readonly userId: string
  ) {
    super();
  }

  getEventName(): string {
    return 'WorkflowDeleted';
  }
}

export class TemplateUsedEvent extends DomainEvent {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
    public readonly workflowId: string
  ) {
    super();
  }

  getEventName(): string {
    return 'TemplateUsed';
  }
}

export class ConnectedAppLinkedEvent extends DomainEvent {
  constructor(
    public readonly appId: string,
    public readonly userId: string,
    public readonly workflowId: string
  ) {
    super();
  }

  getEventName(): string {
    return 'ConnectedAppLinked';
  }
}