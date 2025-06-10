import { WorkflowId } from '../../../shared/kernel/value-objects/WorkflowId';
import { UserId } from '../../../shared/kernel/value-objects/UserId';
import { WorkflowCreatedEvent, WorkflowStatusChangedEvent, WorkflowExecutedEvent, WorkflowDeletedEvent } from '../../../shared/kernel/events/DomainEvent';
import { DomainEntity } from '../../../shared/kernel/base/DomainEntity';

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error'
}

export interface WorkflowConfig {
  steps: WorkflowStep[];
  triggers?: WorkflowTrigger[];
  settings?: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections?: string[];
}

export interface WorkflowTrigger {
  type: 'schedule' | 'webhook' | 'manual';
  config: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  logs: WorkflowExecutionLog[];
}

export interface WorkflowExecutionLog {
  stepId: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, any>;
}

export class Workflow extends DomainEntity {
  private constructor(
    private readonly id: WorkflowId,
    private readonly userId: UserId,
    private name: string,
    private description: string,
    private status: WorkflowStatus,
    private config: WorkflowConfig,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private lastRun?: Date,
    private executionCount: number = 0,
    private icon?: string,
    private iconColor?: string
  ) {
    super();
  }

  public static create(
    id: WorkflowId,
    userId: UserId,
    name: string,
    description: string,
    config: WorkflowConfig,
    icon?: string,
    iconColor?: string
  ): Workflow {
    const workflow = new Workflow(
      id,
      userId,
      name,
      description,
      WorkflowStatus.DRAFT,
      config,
      new Date(),
      new Date(),
      undefined,
      0,
      icon,
      iconColor
    );

    workflow.addDomainEvent(new WorkflowCreatedEvent(
      id.getValue().toString(),
      userId.getValue().toString(),
      name
    ));

    return workflow;
  }

  public static fromPersistence(
    id: number,
    userId: number,
    name: string,
    description: string,
    status: string,
    config: WorkflowConfig,
    createdAt: Date,
    updatedAt: Date,
    lastRun?: Date,
    executionCount: number = 0,
    icon?: string,
    iconColor?: string
  ): Workflow {
    return new Workflow(
      WorkflowId.fromNumber(id),
      UserId.fromNumber(userId),
      name,
      description,
      status as WorkflowStatus,
      config,
      createdAt,
      updatedAt,
      lastRun,
      executionCount,
      icon,
      iconColor
    );
  }

  // Getters
  public getId(): WorkflowId {
    return this.id;
  }

  public getUserId(): UserId {
    return this.userId;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getStatus(): WorkflowStatus {
    return this.status;
  }

  public getConfig(): WorkflowConfig {
    return this.config;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public getLastRun(): Date | undefined {
    return this.lastRun;
  }

  public getExecutionCount(): number {
    return this.executionCount;
  }

  public getIcon(): string | undefined {
    return this.icon;
  }

  public getIconColor(): string | undefined {
    return this.iconColor;
  }

  // Business Logic
  public updateDetails(name: string, description: string): void {
    this.name = name;
    this.description = description;
    this.updatedAt = new Date();
  }

  public updateConfig(config: WorkflowConfig): void {
    this.config = config;
    this.updatedAt = new Date();
  }

  public activate(): void {
    if (this.status === WorkflowStatus.DRAFT && this.config.steps.length === 0) {
      throw new Error('Cannot activate workflow without steps');
    }

    const oldStatus = this.status;
    this.status = WorkflowStatus.ACTIVE;
    this.updatedAt = new Date();

    this.addDomainEvent(new WorkflowStatusChangedEvent(
      this.id.getValue().toString(),
      this.userId.getValue().toString(),
      this.status,
      new Date(),
      oldStatus
    ));
  }

  public pause(): void {
    if (this.status !== WorkflowStatus.ACTIVE) {
      throw new Error('Can only pause active workflows');
    }

    const oldStatus = this.status;
    this.status = WorkflowStatus.PAUSED;
    this.updatedAt = new Date();

    this.addDomainEvent(new WorkflowStatusChangedEvent(
      this.id.getValue().toString(),
      this.userId.getValue().toString(),
      this.status,
      new Date(),
      oldStatus
    ));
  }

  public markAsError(errorMessage: string): void {
    const oldStatus = this.status;
    this.status = WorkflowStatus.ERROR;
    this.updatedAt = new Date();

    this.addDomainEvent(new WorkflowStatusChangedEvent(
      this.id.getValue().toString(),
      this.userId.getValue().toString(),
      this.status,
      new Date(),
      oldStatus,
      errorMessage
    ));
  }

  public execute(ipAddress?: string): WorkflowExecution {
    if (this.status !== WorkflowStatus.ACTIVE) {
      throw new Error('Can only execute active workflows');
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const execution: WorkflowExecution = {
      id: executionId,
      startedAt: new Date(),
      status: 'running',
      logs: []
    };

    this.lastRun = new Date();
    this.executionCount++;
    this.updatedAt = new Date();

    this.addDomainEvent(new WorkflowExecutedEvent(
      this.id.getValue().toString(),
      this.userId.getValue().toString(),
      executionId,
      new Date(),
      ipAddress
    ));

    return execution;
  }

  public markForDeletion(): void {
    if (!this.canBeDeleted()) {
      throw new Error('Cannot delete active workflow. Pause it first.');
    }

    this.addDomainEvent(new WorkflowDeletedEvent(
      this.id.getValue().toString(),
      this.userId.getValue().toString()
    ));
  }

  public canBeDeleted(): boolean {
    return this.status === WorkflowStatus.DRAFT || this.status === WorkflowStatus.PAUSED;
  }

  public isActive(): boolean {
    return this.status === WorkflowStatus.ACTIVE;
  }

  public hasSteps(): boolean {
    return this.config.steps.length > 0;
  }

  public clone(newName: string): Workflow {
    const cloned = new Workflow(
      WorkflowId.fromNumber(0), // Will be assigned by repository
      this.userId,
      newName,
      `Copy of ${this.description}`,
      WorkflowStatus.DRAFT,
      { ...this.config }, // Deep copy config
      new Date(),
      new Date(),
      undefined,
      0,
      this.icon,
      this.iconColor
    );

    return cloned;
  }

  public toPlainObject(): any {
    return {
      id: this.id.getValue(),
      userId: this.userId.getValue(),
      name: this.name,
      description: this.description,
      status: this.status,
      config: this.config,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastRun: this.lastRun,
      executionCount: this.executionCount,
      icon: this.icon,
      iconColor: this.iconColor
    };
  }
}