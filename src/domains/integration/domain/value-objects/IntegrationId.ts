export class IntegrationId {
  private constructor(private readonly value: number) {
    if (value <= 0) {
      throw new Error('IntegrationId must be a positive number');
    }
  }

  static fromNumber(value: number): IntegrationId {
    return new IntegrationId(value);
  }

  getValue(): number {
    return this.value;
  }

  equals(other: IntegrationId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }
}