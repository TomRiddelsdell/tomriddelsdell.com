import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  TIMER = 'timer',
  PERCENTAGE = 'percentage',
  BYTES = 'bytes'
}

export class MetricValue {
  private constructor(
    public readonly value: number,
    public readonly type: MetricType,
    public readonly unit: string,
    public readonly precision: number = 0,
    public readonly timestamp: Date = new Date()
  ) {
    if (value < 0 && type !== MetricType.GAUGE) {
      throw new DomainException(`${type} values cannot be negative`);
    }
  }

  static counter(value: number, unit: string = 'count'): MetricValue {
    if (value < 0) {
      throw new DomainException('Counter values cannot be negative');
    }
    return new MetricValue(Math.floor(value), MetricType.COUNTER, unit, 0);
  }

  static gauge(value: number, unit: string = 'units', precision: number = 1): MetricValue {
    return new MetricValue(value, MetricType.GAUGE, unit, precision);
  }

  static timer(milliseconds: number): MetricValue {
    if (milliseconds < 0) {
      throw new DomainException('Timer values cannot be negative');
    }
    return new MetricValue(milliseconds, MetricType.TIMER, 'milliseconds', 0);
  }

  static percentage(value: number, precision: number = 1): MetricValue {
    if (value < 0 || value > 100) {
      throw new DomainException('Percentage values must be between 0 and 100');
    }
    return new MetricValue(value, MetricType.PERCENTAGE, 'percentage', precision);
  }

  static bytes(value: number): MetricValue {
    if (value < 0) {
      throw new DomainException('Byte values cannot be negative');
    }
    return new MetricValue(value, MetricType.BYTES, 'bytes', 0);
  }

  get formattedValue(): string {
    return this.value.toFixed(this.precision);
  }

  get displayValue(): string {
    switch (this.type) {
      case MetricType.PERCENTAGE:
        return `${this.formattedValue}%`;
      
      case MetricType.TIMER:
        return this.formatDuration(this.value);
      
      case MetricType.BYTES:
        return this.formatBytes(this.value);
      
      default:
        return this.formattedValue;
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  }

  equals(other: MetricValue): boolean {
    return this.value === other.value && 
           this.type === other.type && 
           this.unit === other.unit;
  }

  isGreaterThan(threshold: number): boolean {
    return this.value > threshold;
  }

  isLessThan(threshold: number): boolean {
    return this.value < threshold;
  }

  isBetween(min: number, max: number): boolean {
    return this.value >= min && this.value <= max;
  }
}