/**
 * Notification Domain - Phase 5
 * Channel Value Object
 */

export enum ChannelType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook'
}

export class Channel {
  private constructor(private readonly type: ChannelType) {}

  static email(): Channel {
    return new Channel(ChannelType.EMAIL);
  }

  static sms(): Channel {
    return new Channel(ChannelType.SMS);
  }

  static push(): Channel {
    return new Channel(ChannelType.PUSH);
  }

  static inApp(): Channel {
    return new Channel(ChannelType.IN_APP);
  }

  static webhook(): Channel {
    return new Channel(ChannelType.WEBHOOK);
  }

  static fromString(value: string): Channel {
    const type = Object.values(ChannelType).find(t => t === value.toLowerCase());
    if (!type) {
      throw new Error(`Invalid channel type: ${value}`);
    }
    return new Channel(type);
  }

  getType(): ChannelType {
    return this.type;
  }

  getValue(): string {
    return this.type;
  }

  equals(other: Channel): boolean {
    return this.type === other.type;
  }

  toString(): string {
    return this.type;
  }

  /**
   * Check if channel requires external configuration
   */
  requiresConfiguration(): boolean {
    return this.type !== ChannelType.IN_APP;
  }

  /**
   * Check if channel supports immediate delivery
   */
  supportsImmediateDelivery(): boolean {
    return [ChannelType.EMAIL, ChannelType.SMS, ChannelType.PUSH, ChannelType.IN_APP].includes(this.type);
  }

  /**
   * Check if channel supports scheduled delivery
   */
  supportsScheduledDelivery(): boolean {
    return [ChannelType.EMAIL, ChannelType.SMS, ChannelType.PUSH].includes(this.type);
  }

  /**
   * Check if channel supports bulk delivery
   */
  supportsBulkDelivery(): boolean {
    return [ChannelType.EMAIL, ChannelType.PUSH, ChannelType.WEBHOOK].includes(this.type);
  }

  /**
   * Get typical delivery speed in milliseconds
   */
  getTypicalDeliveryTime(): number {
    switch (this.type) {
      case ChannelType.IN_APP:
        return 100; // Immediate
      case ChannelType.PUSH:
        return 1000; // 1 second
      case ChannelType.SMS:
        return 5000; // 5 seconds
      case ChannelType.EMAIL:
        return 30000; // 30 seconds
      case ChannelType.WEBHOOK:
        return 10000; // 10 seconds
      default:
        return 30000;
    }
  }

  /**
   * Get maximum message size for channel
   */
  getMaxMessageSize(): number {
    switch (this.type) {
      case ChannelType.SMS:
        return 160; // Standard SMS length
      case ChannelType.PUSH:
        return 500; // Push notification limit
      case ChannelType.IN_APP:
        return 10000; // Rich content allowed
      case ChannelType.EMAIL:
        return 50000; // Large email content
      case ChannelType.WEBHOOK:
        return 100000; // JSON payload
      default:
        return 1000;
    }
  }

  /**
   * Check if channel supports rich content (HTML, images, etc.)
   */
  supportsRichContent(): boolean {
    return [ChannelType.EMAIL, ChannelType.IN_APP, ChannelType.WEBHOOK].includes(this.type);
  }

  /**
   * Get cost factor for delivery (relative scale)
   */
  getCostFactor(): number {
    switch (this.type) {
      case ChannelType.IN_APP:
        return 0; // Free
      case ChannelType.PUSH:
        return 0.1; // Very low cost
      case ChannelType.EMAIL:
        return 0.5; // Low cost
      case ChannelType.WEBHOOK:
        return 0.2; // Infrastructure cost
      case ChannelType.SMS:
        return 5.0; // Higher cost per message
      default:
        return 1.0;
    }
  }
}