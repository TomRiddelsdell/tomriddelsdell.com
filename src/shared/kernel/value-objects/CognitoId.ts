export class CognitoId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('CognitoId cannot be empty');
    }
    this.value = value.trim();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: CognitoId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(value: string): CognitoId {
    return new CognitoId(value);
  }
}