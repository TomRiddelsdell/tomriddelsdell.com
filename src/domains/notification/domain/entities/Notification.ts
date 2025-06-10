/**
 * Notification Domain - Phase 5
 * Notification Entity
 */

import { NotificationId } from '../valueObjects/NotificationId';
import { Priority, PriorityLevel } from '../valueObjects/Priority';
import { Channel, ChannelType } from '../valueObjects/Channel';

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
  EXPIRED = 'expired'
}

export enum NotificationType {
  WELCOME = 'welcome',
  ALERT = 'alert',
  REMINDER = 'reminder',
  REPORT = 'report',
  WORKFLOW_STATUS = 'workflow_status',
  INTEGRATION_STATUS = 'integration_status',
  SYSTEM_UPDATE = 'system_update',
  SECURITY = 'security'
}

export interface NotificationMetadata {
  templateId?: string;
  templateVariables?: Record<string, any>;
  correlationId?: string;
  sourceWorkflowId?: string;
  sourceIntegrationId?: string;
  retryCount?: number;
  deliveryAttempts?: DeliveryAttempt[];
  customData?: Record<string, any>;
}

export interface DeliveryAttempt {
  channel: ChannelType;
  attemptedAt: Date;
  success: boolean;
  errorMessage?: string;
  responseTime?: number;
  deliveryId?: string;
}

export class Notification {
  private constructor(
    private readonly id: NotificationId,
    private readonly userId: number,
    private title: string,
    private content: string,
    private readonly type: NotificationType,
    private priority: Priority,
    private status: NotificationStatus,
    private channels: Channel[],
    private readonly createdAt: Date,
    private scheduledAt?: Date,
    private sentAt?: Date,
    private deliveredAt?: Date,
    private readAt?: Date,
    private expiresAt?: Date,
    private metadata: NotificationMetadata = {}
  ) {}

  static create(
    userId: number,
    title: string,
    content: string,
    type: NotificationType,
    priority: Priority = Priority.normal(),
    channels: Channel[] = [Channel.inApp()],
    scheduledAt?: Date,
    expiresAt?: Date,
    metadata: NotificationMetadata = {}
  ): Notification {
    const id = NotificationId.create();
    const now = new Date();

    return new Notification(
      id,
      userId,
      title,
      content,
      type,
      priority,
      NotificationStatus.PENDING,
      channels,
      now,
      scheduledAt,
      undefined, // sentAt
      undefined, // deliveredAt
      undefined, // readAt
      expiresAt,
      metadata
    );
  }

  static fromPersistence(data: {
    id: string;
    userId: number;
    title: string;
    content: string;
    type: NotificationType;
    priority: PriorityLevel;
    status: NotificationStatus;
    channels: ChannelType[];
    createdAt: Date;
    scheduledAt?: Date;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    expiresAt?: Date;
    metadata?: NotificationMetadata;
  }): Notification {
    return new Notification(
      NotificationId.fromString(data.id),
      data.userId,
      data.title,
      data.content,
      data.type,
      Priority.fromString(data.priority),
      data.status,
      data.channels.map(c => Channel.fromString(c)),
      data.createdAt,
      data.scheduledAt,
      data.sentAt,
      data.deliveredAt,
      data.readAt,
      data.expiresAt,
      data.metadata || {}
    );
  }

  // Getters
  getId(): NotificationId {
    return this.id;
  }

  getUserId(): number {
    return this.userId;
  }

  getTitle(): string {
    return this.title;
  }

  getContent(): string {
    return this.content;
  }

  getType(): NotificationType {
    return this.type;
  }

  getPriority(): Priority {
    return this.priority;
  }

  getStatus(): NotificationStatus {
    return this.status;
  }

  getChannels(): Channel[] {
    return [...this.channels];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getScheduledAt(): Date | undefined {
    return this.scheduledAt;
  }

  getSentAt(): Date | undefined {
    return this.sentAt;
  }

  getDeliveredAt(): Date | undefined {
    return this.deliveredAt;
  }

  getReadAt(): Date | undefined {
    return this.readAt;
  }

  getExpiresAt(): Date | undefined {
    return this.expiresAt;
  }

  getMetadata(): NotificationMetadata {
    return { ...this.metadata };
  }

  // Business logic methods
  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (title.length > 200) {
      throw new Error('Title cannot exceed 200 characters');
    }
    this.title = title.trim();
  }

  updateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }
    if (content.length > 10000) {
      throw new Error('Content cannot exceed 10000 characters');
    }
    this.content = content.trim();
  }

  updatePriority(priority: Priority): void {
    if (this.status !== NotificationStatus.PENDING) {
      throw new Error('Cannot update priority of non-pending notification');
    }
    this.priority = priority;
  }

  addChannel(channel: Channel): void {
    if (this.status !== NotificationStatus.PENDING) {
      throw new Error('Cannot add channels to non-pending notification');
    }
    if (!this.channels.some(c => c.equals(channel))) {
      this.channels.push(channel);
    }
  }

  removeChannel(channel: Channel): void {
    if (this.status !== NotificationStatus.PENDING) {
      throw new Error('Cannot remove channels from non-pending notification');
    }
    this.channels = this.channels.filter(c => !c.equals(channel));
    if (this.channels.length === 0) {
      throw new Error('Notification must have at least one channel');
    }
  }

  schedule(scheduledAt: Date): void {
    if (this.status !== NotificationStatus.PENDING) {
      throw new Error('Cannot schedule non-pending notification');
    }
    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }
    this.scheduledAt = scheduledAt;
  }

  markAsSent(): void {
    if (this.status !== NotificationStatus.PENDING) {
      throw new Error('Can only mark pending notifications as sent');
    }
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
  }

  markAsDelivered(): void {
    if (this.status !== NotificationStatus.SENT) {
      throw new Error('Can only mark sent notifications as delivered');
    }
    this.status = NotificationStatus.DELIVERED;
    this.deliveredAt = new Date();
  }

  markAsRead(): void {
    if (![NotificationStatus.SENT, NotificationStatus.DELIVERED].includes(this.status)) {
      throw new Error('Can only mark sent or delivered notifications as read');
    }
    this.status = NotificationStatus.READ;
    this.readAt = new Date();
  }

  markAsFailed(errorMessage?: string): void {
    if (this.status === NotificationStatus.READ) {
      throw new Error('Cannot mark read notifications as failed');
    }
    this.status = NotificationStatus.FAILED;
    
    if (errorMessage) {
      this.metadata.customData = {
        ...this.metadata.customData,
        lastError: errorMessage,
        failedAt: new Date().toISOString()
      };
    }
  }

  addDeliveryAttempt(attempt: DeliveryAttempt): void {
    if (!this.metadata.deliveryAttempts) {
      this.metadata.deliveryAttempts = [];
    }
    this.metadata.deliveryAttempts.push(attempt);
    this.metadata.retryCount = (this.metadata.retryCount || 0) + 1;
  }

  updateMetadata(metadata: Partial<NotificationMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata };
  }

  // Query methods
  isReadyToSend(): boolean {
    if (this.status !== NotificationStatus.PENDING) {
      return false;
    }

    if (this.isExpired()) {
      return false;
    }

    if (this.scheduledAt && this.scheduledAt > new Date()) {
      return false;
    }

    return true;
  }

  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return this.expiresAt <= new Date();
  }

  hasChannel(channel: Channel): boolean {
    return this.channels.some(c => c.equals(channel));
  }

  getRetryCount(): number {
    return this.metadata.retryCount || 0;
  }

  canRetry(): boolean {
    const maxRetries = this.priority.getMaxRetries();
    return this.getRetryCount() < maxRetries && this.status === NotificationStatus.FAILED;
  }

  getDeliveryAttempts(): DeliveryAttempt[] {
    return this.metadata.deliveryAttempts || [];
  }

  getLastDeliveryAttempt(): DeliveryAttempt | undefined {
    const attempts = this.getDeliveryAttempts();
    return attempts[attempts.length - 1];
  }

  hasSuccessfulDelivery(): boolean {
    return this.getDeliveryAttempts().some(attempt => attempt.success);
  }

  getSuccessfulChannels(): ChannelType[] {
    return this.getDeliveryAttempts()
      .filter(attempt => attempt.success)
      .map(attempt => attempt.channel);
  }

  getFailedChannels(): ChannelType[] {
    return this.getDeliveryAttempts()
      .filter(attempt => !attempt.success)
      .map(attempt => attempt.channel);
  }

  // Validation methods
  validateForDelivery(): string[] {
    const errors: string[] = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!this.content || this.content.trim().length === 0) {
      errors.push('Content is required');
    }

    if (this.channels.length === 0) {
      errors.push('At least one channel is required');
    }

    if (this.isExpired()) {
      errors.push('Notification has expired');
    }

    // Channel-specific validation
    for (const channel of this.channels) {
      const maxSize = channel.getMaxMessageSize();
      if (this.content.length > maxSize) {
        errors.push(`Content exceeds maximum size for ${channel.getValue()} channel (${maxSize} characters)`);
      }
    }

    return errors;
  }

  equals(other: Notification): boolean {
    return this.id.equals(other.id);
  }
}