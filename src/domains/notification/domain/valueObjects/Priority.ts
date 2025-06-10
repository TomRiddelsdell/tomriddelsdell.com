/**
 * Notification Domain - Phase 5
 * Priority Value Object
 */

export enum PriorityLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export class Priority {
  private constructor(private readonly level: PriorityLevel) {}

  static low(): Priority {
    return new Priority(PriorityLevel.LOW);
  }

  static normal(): Priority {
    return new Priority(PriorityLevel.NORMAL);
  }

  static high(): Priority {
    return new Priority(PriorityLevel.HIGH);
  }

  static urgent(): Priority {
    return new Priority(PriorityLevel.URGENT);
  }

  static fromString(value: string): Priority {
    const level = Object.values(PriorityLevel).find(l => l === value.toLowerCase());
    if (!level) {
      throw new Error(`Invalid priority level: ${value}`);
    }
    return new Priority(level);
  }

  getLevel(): PriorityLevel {
    return this.level;
  }

  getValue(): string {
    return this.level;
  }

  equals(other: Priority): boolean {
    return this.level === other.level;
  }

  toString(): string {
    return this.level;
  }

  /**
   * Get numeric value for priority comparison and sorting
   */
  getNumericValue(): number {
    switch (this.level) {
      case PriorityLevel.LOW:
        return 1;
      case PriorityLevel.NORMAL:
        return 2;
      case PriorityLevel.HIGH:
        return 3;
      case PriorityLevel.URGENT:
        return 4;
      default:
        return 2; // Default to normal
    }
  }

  /**
   * Get delivery timeout in milliseconds based on priority
   */
  getDeliveryTimeout(): number {
    switch (this.level) {
      case PriorityLevel.URGENT:
        return 30 * 1000; // 30 seconds
      case PriorityLevel.HIGH:
        return 5 * 60 * 1000; // 5 minutes
      case PriorityLevel.NORMAL:
        return 30 * 60 * 1000; // 30 minutes
      case PriorityLevel.LOW:
        return 2 * 60 * 60 * 1000; // 2 hours
      default:
        return 30 * 60 * 1000;
    }
  }

  /**
   * Get retry count based on priority
   */
  getMaxRetries(): number {
    switch (this.level) {
      case PriorityLevel.URGENT:
        return 5;
      case PriorityLevel.HIGH:
        return 3;
      case PriorityLevel.NORMAL:
        return 2;
      case PriorityLevel.LOW:
        return 1;
      default:
        return 2;
    }
  }

  isHigherThan(other: Priority): boolean {
    return this.getNumericValue() > other.getNumericValue();
  }

  isLowerThan(other: Priority): boolean {
    return this.getNumericValue() < other.getNumericValue();
  }
}