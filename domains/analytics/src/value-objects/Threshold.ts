import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';

export enum ThresholdOperator {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  BETWEEN = 'between',
  NOT_BETWEEN = 'not_between'
}

export enum ThresholdSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export class Threshold {
  private constructor(
    public readonly operator: ThresholdOperator,
    public readonly value: number,
    public readonly severity: ThresholdSeverity,
    public readonly secondValue?: number
  ) {
    if (operator === ThresholdOperator.BETWEEN || operator === ThresholdOperator.NOT_BETWEEN) {
      if (secondValue === undefined) {
        throw new DomainException('Between operators require a second value');
      }
      if (value >= secondValue) {
        throw new DomainException('First value must be less than second value for range operators');
      }
    }
  }

  static greaterThan(value: number, severity: ThresholdSeverity = ThresholdSeverity.WARNING): Threshold {
    return new Threshold(ThresholdOperator.GREATER_THAN, value, severity);
  }

  static lessThan(value: number, severity: ThresholdSeverity = ThresholdSeverity.WARNING): Threshold {
    return new Threshold(ThresholdOperator.LESS_THAN, value, severity);
  }

  static equals(value: number, severity: ThresholdSeverity = ThresholdSeverity.INFO): Threshold {
    return new Threshold(ThresholdOperator.EQUALS, value, severity);
  }

  static notEquals(value: number, severity: ThresholdSeverity = ThresholdSeverity.WARNING): Threshold {
    return new Threshold(ThresholdOperator.NOT_EQUALS, value, severity);
  }

  static greaterThanOrEqual(value: number, severity: ThresholdSeverity = ThresholdSeverity.WARNING): Threshold {
    return new Threshold(ThresholdOperator.GREATER_THAN_OR_EQUAL, value, severity);
  }

  static lessThanOrEqual(value: number, severity: ThresholdSeverity = ThresholdSeverity.WARNING): Threshold {
    return new Threshold(ThresholdOperator.LESS_THAN_OR_EQUAL, value, severity);
  }

  static between(min: number, max: number, severity: ThresholdSeverity = ThresholdSeverity.INFO): Threshold {
    return new Threshold(ThresholdOperator.BETWEEN, min, severity, max);
  }

  static notBetween(min: number, max: number, severity: ThresholdSeverity = ThresholdSeverity.WARNING): Threshold {
    return new Threshold(ThresholdOperator.NOT_BETWEEN, min, severity, max);
  }

  evaluate(value: number): boolean {
    switch (this.operator) {
      case ThresholdOperator.GREATER_THAN:
        return value > this.value;
      
      case ThresholdOperator.LESS_THAN:
        return value < this.value;
      
      case ThresholdOperator.EQUALS:
        return value === this.value;
      
      case ThresholdOperator.NOT_EQUALS:
        return value !== this.value;
      
      case ThresholdOperator.GREATER_THAN_OR_EQUAL:
        return value >= this.value;
      
      case ThresholdOperator.LESS_THAN_OR_EQUAL:
        return value <= this.value;
      
      case ThresholdOperator.BETWEEN:
        return value >= this.value && value <= this.secondValue!;
      
      case ThresholdOperator.NOT_BETWEEN:
        return value < this.value || value > this.secondValue!;
      
      default:
        throw new DomainException(`Unknown threshold operator: ${this.operator}`);
    }
  }

  getDescription(): string {
    switch (this.operator) {
      case ThresholdOperator.GREATER_THAN:
        return `greater than ${this.value}`;
      
      case ThresholdOperator.LESS_THAN:
        return `less than ${this.value}`;
      
      case ThresholdOperator.EQUALS:
        return `equals ${this.value}`;
      
      case ThresholdOperator.NOT_EQUALS:
        return `not equals ${this.value}`;
      
      case ThresholdOperator.GREATER_THAN_OR_EQUAL:
        return `greater than or equal to ${this.value}`;
      
      case ThresholdOperator.LESS_THAN_OR_EQUAL:
        return `less than or equal to ${this.value}`;
      
      case ThresholdOperator.BETWEEN:
        return `between ${this.value} and ${this.secondValue}`;
      
      case ThresholdOperator.NOT_BETWEEN:
        return `not between ${this.value} and ${this.secondValue}`;
      
      default:
        return 'unknown condition';
    }
  }

  equals(other: Threshold): boolean {
    return this.operator === other.operator &&
           this.value === other.value &&
           this.severity === other.severity &&
           this.secondValue === other.secondValue;
  }

  toString(): string {
    return `${this.severity.toUpperCase()}: ${this.getDescription()}`;
  }
}