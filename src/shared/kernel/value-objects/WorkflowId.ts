export class WorkflowId {
  private constructor(private readonly value: number) {
    if (value <= 0) {
      throw new Error('WorkflowId must be a positive number');
    }
  }

  public static fromNumber(value: number): WorkflowId {
    return new WorkflowId(value);
  }

  public getValue(): number {
    return this.value;
  }

  public equals(other: WorkflowId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value.toString();
  }
}