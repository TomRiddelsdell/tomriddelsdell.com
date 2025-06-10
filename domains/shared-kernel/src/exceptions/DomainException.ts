export abstract class DomainException extends Error {
  public readonly errorCode: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    errorCode: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class UserNotFoundError extends DomainException {
  constructor(identifier: string) {
    super(
      `User not found: ${identifier}`,
      'USER_NOT_FOUND',
      { identifier }
    );
  }
}

export class InvalidEmailError extends DomainException {
  constructor(email: string) {
    super(
      `Invalid email format: ${email}`,
      'INVALID_EMAIL',
      { email }
    );
  }
}

export class WorkflowExecutionError extends DomainException {
  constructor(workflowId: string, reason: string) {
    super(
      `Workflow execution failed: ${reason}`,
      'WORKFLOW_EXECUTION_FAILED',
      { workflowId, reason }
    );
  }
}

export class NotificationDeliveryError extends DomainException {
  constructor(notificationId: string, channel: string, reason: string) {
    super(
      `Notification delivery failed on ${channel}: ${reason}`,
      'NOTIFICATION_DELIVERY_FAILED',
      { notificationId, channel, reason }
    );
  }
}