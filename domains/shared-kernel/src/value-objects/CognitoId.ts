export class CognitoId {
  constructor(private readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('Cognito ID cannot be empty');
    }
    
    // Allow flexible format for testing and different Cognito ID patterns
    if (value.length < 3) {
      throw new Error('Cognito ID must be at least 3 characters');
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