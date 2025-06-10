import { UserId } from '../../../shared-kernel/src/value-objects/UserId';
import { DomainEvent, WorkflowCreatedEvent, WorkflowExecutedEvent } from '../../../shared-kernel/src/events/DomainEvent';

export class WorkflowId {
  constructor(private readonly value: number) {
    if (value <= 0) {
      throw new Error('WorkflowId must be a positive number');
    }
  }

  getValue(): number {
    return this.value;
  }

  toString(): string {
    return this.value.toString();
  }

  equals(other: WorkflowId): boolean {
    return this.value === other.value;
  }

  static fromNumber(value: number): WorkflowId {
    return new WorkflowId(value);
  }
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error',
  ARCHIVED = 'archived'
}

export enum TriggerType {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  WEBHOOK = 'webhook',
  EVENT = 'event'
}

export interface WorkflowAction {
  id: string;
  type: string;
  config: Record<string, any>;
  order: number;
}

export class Workflow {
  private domainEvents: DomainEvent[] = [];

  constructor(
    private readonly id: WorkflowId,
    private readonly userId: UserId,
    private name: string,
    private description: string,
    private status: WorkflowStatus,
    private trigger: TriggerType,
    private actions: WorkflowAction[],
    private config: Record<string, any>,
    private lastRun: Date | null,
    private runCount: number,
    private successCount: number,
    private errorCount: number,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  // Getters
  getId(): WorkflowId {
    return this.id;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getStatus(): WorkflowStatus {
    return this.status;
  }

  getTrigger(): TriggerType {
    return this.trigger;
  }

  getActions(): WorkflowAction[] {
    return [...this.actions];
  }

  isActive(): boolean {
    return this.status === WorkflowStatus.ACTIVE;
  }

  getRunCount(): number {
    return this.runCount;
  }

  getSuccessRate(): number {
    if (this.runCount === 0) return 0;
    return (this.successCount / this.runCount) * 100;
  }

  // Business methods
  activate(): void {
    if (this.status === WorkflowStatus.DRAFT && this.actions.length === 0) {
      throw new Error('Cannot activate workflow without actions');
    }

    this.status = WorkflowStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  pause(): void {
    if (this.status !== WorkflowStatus.ACTIVE) {
      throw new Error('Can only pause active workflows');
    }

    this.status = WorkflowStatus.PAUSED;
    this.updatedAt = new Date();
  }

  resume(): void {
    if (this.status !== WorkflowStatus.PAUSED) {
      throw new Error('Can only resume paused workflows');
    }

    this.status = WorkflowStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  markAsError(errorMessage?: string): void {
    this.status = WorkflowStatus.ERROR;
    this.errorCount += 1;
    this.updatedAt = new Date();
  }

  recordSuccessfulExecution(executionTime: number): void {
    this.runCount += 1;
    this.successCount += 1;
    this.lastRun = new Date();
    this.updatedAt = new Date();

    this.addDomainEvent(new WorkflowExecutedEvent(
      this.id.toString(),
      this.userId.toString(),
      'success',
      executionTime
    ));
  }

  recordFailedExecution(executionTime: number): void {
    this.runCount += 1;
    this.errorCount += 1;
    this.lastRun = new Date();
    this.status = WorkflowStatus.ERROR;
    this.updatedAt = new Date();

    this.addDomainEvent(new WorkflowExecutedEvent(
      this.id.toString(),
      this.userId.toString(),
      'failed',
      executionTime
    ));
  }

  updateDetails(name?: string, description?: string): void {
    if (name !== undefined) {
      this.name = name;
    }
    if (description !== undefined) {
      this.description = description;
    }
    this.updatedAt = new Date();
  }

  updateActions(actions: WorkflowAction[]): void {
    this.actions = [...actions];
    this.updatedAt = new Date();
  }

  // Domain events
  addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // Factory method
  static create(
    id: WorkflowId,
    userId: UserId,
    name: string,
    description: string,
    trigger: TriggerType = TriggerType.MANUAL,
    templateId?: number
  ): Workflow {
    const workflow = new Workflow(
      id,
      userId,
      name,
      description,
      WorkflowStatus.DRAFT,
      trigger,
      [],
      {},
      null,
      0,
      0,
      0,
      new Date(),
      new Date()
    );

    workflow.addDomainEvent(new WorkflowCreatedEvent(
      id.toString(),
      userId.toString(),
      name
    ));

    return workflow;
  }

  // Conversion methods
  toPlainObject() {
    return {
      id: this.id.getValue(),
      userId: this.userId.getValue(),
      name: this.name,
      description: this.description,
      status: this.status,
      trigger: this.trigger,
      actions: this.actions,
      config: this.config,
      lastRun: this.lastRun,
      runCount: this.runCount,
      successCount: this.successCount,
      errorCount: this.errorCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}