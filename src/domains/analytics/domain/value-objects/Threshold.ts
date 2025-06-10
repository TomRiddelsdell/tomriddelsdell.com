/**
 * Analytics Domain - Threshold Value Object
 * Represents alert trigger conditions with comparison operators
 */

export type ComparisonOperator = 
  | 'greater_than' 
  | 'greater_than_or_equal' 
  | 'less_than' 
  | 'less_than_or_equal' 
  | 'equal' 
  | 'not_equal' 
  | 'between' 
  | 'not_between';

export type ThresholdSeverity = 'low' | 'medium' | 'high' | 'critical';

export class Threshold {
  private constructor(
    private readonly _operator: ComparisonOperator,
    private readonly _value: number,
    private readonly _secondaryValue: number | null = null,
    private readonly _severity: ThresholdSeverity = 'medium'
  ) {
    this.validateThreshold();
  }

  static create(
    operator: ComparisonOperator, 
    value: number, 
    severity: ThresholdSeverity = 'medium'
  ): Threshold {
    return new Threshold(operator, value, null, severity);
  }

  static between(
    lowerBound: number, 
    upperBound: number, 
    severity: ThresholdSeverity = 'medium'
  ): Threshold {
    return new Threshold('between', lowerBound, upperBound, severity);
  }

  static notBetween(
    lowerBound: number, 
    upperBound: number, 
    severity: ThresholdSeverity = 'medium'
  ): Threshold {
    return new Threshold('not_between', lowerBound, upperBound, severity);
  }

  static greaterThan(value: number, severity: ThresholdSeverity = 'medium'): Threshold {
    return new Threshold('greater_than', value, null, severity);
  }

  static lessThan(value: number, severity: ThresholdSeverity = 'medium'): Threshold {
    return new Threshold('less_than', value, null, severity);
  }

  static equal(value: number, severity: ThresholdSeverity = 'medium'): Threshold {
    return new Threshold('equal', value, null, severity);
  }

  get operator(): ComparisonOperator {
    return this._operator;
  }

  get value(): number {
    return this._value;
  }

  get secondaryValue(): number | null {
    return this._secondaryValue;
  }

  get severity(): ThresholdSeverity {
    return this._severity;
  }

  get displayText(): string {
    switch (this._operator) {
      case 'greater_than':
        return `> ${this._value}`;
      case 'greater_than_or_equal':
        return `≥ ${this._value}`;
      case 'less_than':
        return `< ${this._value}`;
      case 'less_than_or_equal':
        return `≤ ${this._value}`;
      case 'equal':
        return `= ${this._value}`;
      case 'not_equal':
        return `≠ ${this._value}`;
      case 'between':
        return `${this._value} - ${this._secondaryValue}`;
      case 'not_between':
        return `not between ${this._value} - ${this._secondaryValue}`;
      default:
        return `${this._operator} ${this._value}`;
    }
  }

  evaluate(testValue: number): boolean {
    switch (this._operator) {
      case 'greater_than':
        return testValue > this._value;
      case 'greater_than_or_equal':
        return testValue >= this._value;
      case 'less_than':
        return testValue < this._value;
      case 'less_than_or_equal':
        return testValue <= this._value;
      case 'equal':
        return Math.abs(testValue - this._value) < Number.EPSILON;
      case 'not_equal':
        return Math.abs(testValue - this._value) >= Number.EPSILON;
      case 'between':
        if (this._secondaryValue === null) return false;
        return testValue >= this._value && testValue <= this._secondaryValue;
      case 'not_between':
        if (this._secondaryValue === null) return false;
        return testValue < this._value || testValue > this._secondaryValue;
      default:
        return false;
    }
  }

  withSeverity(severity: ThresholdSeverity): Threshold {
    return new Threshold(this._operator, this._value, this._secondaryValue, severity);
  }

  toJSON(): Record<string, any> {
    return {
      operator: this._operator,
      value: this._value,
      secondaryValue: this._secondaryValue,
      severity: this._severity,
      displayText: this.displayText
    };
  }

  equals(other: Threshold): boolean {
    return this._operator === other._operator &&
           this._value === other._value &&
           this._secondaryValue === other._secondaryValue &&
           this._severity === other._severity;
  }

  private validateThreshold(): void {
    if (!Number.isFinite(this._value)) {
      throw new Error('Threshold value must be a finite number');
    }

    if (this._secondaryValue !== null && !Number.isFinite(this._secondaryValue)) {
      throw new Error('Secondary threshold value must be a finite number');
    }

    if ((this._operator === 'between' || this._operator === 'not_between')) {
      if (this._secondaryValue === null) {
        throw new Error(`${this._operator} requires a secondary value`);
      }
      if (this._value > this._secondaryValue) {
        throw new Error('Lower bound must be less than or equal to upper bound');
      }
    }

    if (this._operator !== 'between' && this._operator !== 'not_between' && this._secondaryValue !== null) {
      throw new Error(`${this._operator} should not have a secondary value`);
    }
  }
}