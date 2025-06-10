export class ConnectedAppId {
  private constructor(private readonly value: number) {
    if (value <= 0) {
      throw new Error('ConnectedAppId must be a positive number');
    }
  }

  public static fromNumber(value: number): ConnectedAppId {
    return new ConnectedAppId(value);
  }

  public getValue(): number {
    return this.value;
  }

  public equals(other: ConnectedAppId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value.toString();
  }
}