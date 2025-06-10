/**
 * Notification Domain - Phase 5
 * NotificationId Value Object
 */

export class NotificationId {
  private constructor(private readonly value: string) {
    this.validate(value);
  }

  static create(value?: string): NotificationId {
    if (value) {
      return new NotificationId(value);
    }
    return new NotificationId(this.generateId());
  }

  static fromString(value: string): NotificationId {
    return new NotificationId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: NotificationId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('NotificationId cannot be empty');
    }

    if (value.length > 50) {
      throw new Error('NotificationId cannot exceed 50 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      throw new Error('NotificationId can only contain alphanumeric characters, underscores, and dashes');
    }
  }

  private static generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `notif_${timestamp}_${random}`;
  }
}