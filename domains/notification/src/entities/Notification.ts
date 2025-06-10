import { UserId } from '../../../shared-kernel/src/value-objects/UserId';
import { DomainEvent, NotificationSentEvent } from '../../../shared-kernel/src/events/DomainEvent';

export class NotificationId {
  constructor(private readonly value: number) {
    if (value <= 0) {
      throw new Error('NotificationId must be a positive number');
    }
  }

  getValue(): number {
    return this.value;
  }

  toString(): string {
    return this.value.toString();
  }

  equals(other: NotificationId): boolean {
    return this.value === other.value;
  }

  static fromNumber(value: number): NotificationId {
    return new NotificationId(value);
  }
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export class Notification {
  private domainEvents: DomainEvent[] = [];

  constructor(
    private readonly id: NotificationId,
    private readonly userId: UserId,
    private readonly channel: NotificationChannel,
    private title: string,
    private message: string,
    private status: NotificationStatus,
    private priority: NotificationPriority,
    private scheduledAt: Date | null,
    private sentAt: Date | null,
    private deliveredAt: Date | null,
    private failureReason: string | null,
    private retryCount: number,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  // Getters
  getId(): NotificationId {
    return this.id;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getChannel(): NotificationChannel {
    return this.channel;
  }

  getTitle(): string {
    return this.title;
  }

  getMessage(): string {
    return this.message;
  }

  getStatus(): NotificationStatus {
    return this.status;
  }

  getPriority(): NotificationPriority {
    return this.priority;
  }

  isPending(): boolean {
    return this.status === NotificationStatus.PENDING;
  }

  isSent(): boolean {
    return this.status === NotificationStatus.SENT;
  }

  isDelivered(): boolean {
    return this.status === NotificationStatus.DELIVERED;
  }

  hasFailed(): boolean {
    return this.status === NotificationStatus.FAILED;
  }

  getRetryCount(): number {
    return this.retryCount;
  }

  // Business methods
  markAsSent(): void {
    if (this.status !== NotificationStatus.PENDING) {
      throw new Error('Can only mark pending notifications as sent');
    }

    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
    this.updatedAt = new Date();

    this.addDomainEvent(new NotificationSentEvent(
      this.id.toString(),
      this.userId.toString(),
      this.channel,
      'sent'
    ));
  }

  markAsDelivered(): void {
    if (this.status !== NotificationStatus.SENT) {
      throw new Error('Can only mark sent notifications as delivered');
    }

    this.status = NotificationStatus.DELIVERED;
    this.deliveredAt = new Date();
    this.updatedAt = new Date();

    this.addDomainEvent(new NotificationSentEvent(
      this.id.toString(),
      this.userId.toString(),
      this.channel,
      'delivered'
    ));
  }

  markAsFailed(reason: string): void {
    this.status = NotificationStatus.FAILED;
    this.failureReason = reason;
    this.updatedAt = new Date();

    this.addDomainEvent(new NotificationSentEvent(
      this.id.toString(),
      this.userId.toString(),
      this.channel,
      'failed'
    ));
  }

  retry(): void {
    if (this.status !== NotificationStatus.FAILED) {
      throw new Error('Can only retry failed notifications');
    }

    if (this.retryCount >= 3) {
      throw new Error('Maximum retry attempts exceeded');
    }

    this.status = NotificationStatus.PENDING;
    this.retryCount += 1;
    this.failureReason = null;
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status !== NotificationStatus.PENDING) {
      throw new Error('Can only cancel pending notifications');
    }

    this.status = NotificationStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  updateContent(title?: string, message?: string): void {
    if (this.status !== NotificationStatus.PENDING) {
      throw new Error('Can only update content of pending notifications');
    }

    if (title !== undefined) {
      this.title = title;
    }
    if (message !== undefined) {
      this.message = message;
    }
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
    id: NotificationId,
    userId: UserId,
    channel: NotificationChannel,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    scheduledAt?: Date
  ): Notification {
    return new Notification(
      id,
      userId,
      channel,
      title,
      message,
      NotificationStatus.PENDING,
      priority,
      scheduledAt || null,
      null,
      null,
      null,
      0,
      new Date(),
      new Date()
    );
  }

  // Conversion methods
  toPlainObject() {
    return {
      id: this.id.getValue(),
      userId: this.userId.getValue(),
      channel: this.channel,
      title: this.title,
      message: this.message,
      status: this.status,
      priority: this.priority,
      scheduledAt: this.scheduledAt,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      failureReason: this.failureReason,
      retryCount: this.retryCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}