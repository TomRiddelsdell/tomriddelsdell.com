export class TemplateId {
  private constructor(private readonly value: number) {
    if (value <= 0) {
      throw new Error('TemplateId must be a positive number');
    }
  }

  public static fromNumber(value: number): TemplateId {
    return new TemplateId(value);
  }

  public getValue(): number {
    return this.value;
  }

  public equals(other: TemplateId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value.toString();
  }
}