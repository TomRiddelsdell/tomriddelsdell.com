export class CognitoId {
  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(private readonly value: string) {
    if (!CognitoId.UUID_REGEX.test(value)) {
      throw new Error('Invalid Cognito ID format - must be a valid UUID');
    }
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: CognitoId): boolean {
    return this.value === other.value;
  }

  static fromString(value: string): CognitoId {
    return new CognitoId(value);
  }
}