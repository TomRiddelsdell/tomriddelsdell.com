export class UserId {
  private readonly value: number;

  constructor(value: number) {
    if (!value || value <= 0) {
      throw new Error('UserId must be a positive number');
    }
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }

  static fromNumber(value: number): UserId {
    return new UserId(value);
  }
}