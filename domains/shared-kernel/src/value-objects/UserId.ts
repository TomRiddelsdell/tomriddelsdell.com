export class UserId {
  constructor(private readonly value: number) {
    if (value <= 0) {
      throw new Error('UserId must be a positive number');
    }
  }

  getValue(): number {
    return this.value;
  }

  toString(): string {
    return this.value.toString();
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  static fromNumber(value: number): UserId {
    return new UserId(value);
  }
}