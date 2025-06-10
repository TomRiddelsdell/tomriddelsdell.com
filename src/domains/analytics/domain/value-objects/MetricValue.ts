/**
 * Analytics Domain - MetricValue Value Object
 * Represents a strongly typed measurement value with units and precision
 */

export type MetricUnit = 
  | 'count' 
  | 'percentage' 
  | 'milliseconds' 
  | 'seconds' 
  | 'minutes' 
  | 'hours' 
  | 'bytes' 
  | 'kilobytes' 
  | 'megabytes' 
  | 'requests' 
  | 'errors' 
  | 'rate' 
  | 'currency' 
  | 'custom';

export type MetricType = 
  | 'counter' 
  | 'gauge' 
  | 'histogram' 
  | 'timer' 
  | 'rate' 
  | 'distribution';

export class MetricValue {
  private constructor(
    private readonly _value: number,
    private readonly _unit: MetricUnit,
    private readonly _type: MetricType,
    private readonly _precision: number = 2
  ) {
    this.validateValue();
  }

  static create(
    value: number, 
    unit: MetricUnit, 
    type: MetricType, 
    precision: number = 2
  ): MetricValue {
    return new MetricValue(value, unit, type, precision);
  }

  static counter(value: number, unit: MetricUnit = 'count'): MetricValue {
    if (value < 0) {
      throw new Error('Counter values cannot be negative');
    }
    return new MetricValue(Math.floor(value), unit, 'counter', 0);
  }

  static gauge(value: number, unit: MetricUnit = 'count', precision: number = 2): MetricValue {
    return new MetricValue(value, unit, 'gauge', precision);
  }

  static timer(milliseconds: number): MetricValue {
    if (milliseconds < 0) {
      throw new Error('Timer values cannot be negative');
    }
    return new MetricValue(milliseconds, 'milliseconds', 'timer', 0);
  }

  static percentage(value: number, precision: number = 1): MetricValue {
    if (value < 0 || value > 100) {
      throw new Error('Percentage values must be between 0 and 100');
    }
    return new MetricValue(value, 'percentage', 'gauge', precision);
  }

  get value(): number {
    return this._value;
  }

  get unit(): MetricUnit {
    return this._unit;
  }

  get type(): MetricType {
    return this._type;
  }

  get precision(): number {
    return this._precision;
  }

  get formattedValue(): string {
    return this._value.toFixed(this._precision);
  }

  get displayValue(): string {
    const formatted = this.formattedValue;
    
    switch (this._unit) {
      case 'percentage':
        return `${formatted}%`;
      case 'milliseconds':
        return this.formatDuration(this._value);
      case 'bytes':
        return this.formatBytes(this._value);
      case 'currency':
        return `$${formatted}`;
      default:
        return `${formatted} ${this._unit}`;
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

  private validateValue(): void {
    if (!Number.isFinite(this._value)) {
      throw new Error('Metric value must be a finite number');
    }
    
    if (this._precision < 0 || this._precision > 10) {
      throw new Error('Precision must be between 0 and 10');
    }
  }

  toJSON(): Record<string, any> {
    return {
      value: this._value,
      unit: this._unit,
      type: this._type,
      precision: this._precision,
      formattedValue: this.formattedValue,
      displayValue: this.displayValue
    };
  }
}