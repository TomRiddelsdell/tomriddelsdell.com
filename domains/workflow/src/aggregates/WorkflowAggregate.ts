import { Workflow, WorkflowStatus, TriggerType, WorkflowId } from '../entities/Workflow';
import { UserId } from '../../../shared-kernel/src/value-objects/UserId';
import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';

/**
 * Workflow Aggregate Root
 * Ensures consistency and encapsulates business rules for workflow operations
 */
export class WorkflowAggregate {
  private constructor(private workflow: Workflow) {}

  static create(
    userId: UserId,
    name: string,
    description: string,
    trigger: TriggerType = TriggerType.MANUAL
  ): WorkflowAggregate {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Workflow name cannot be empty');
    }

    if (name.length > 100) {
      throw new DomainException('Workflow name cannot exceed 100 characters');
    }

    const workflowId = WorkflowId.fromNumber(Date.now()); // Temporary ID generation
    const workflow = Workflow.create(workflowId, userId, name.trim(), description, trigger);
    
    return new WorkflowAggregate(workflow);
  }

  static fromEntity(workflow: Workflow): WorkflowAggregate {
    return new WorkflowAggregate(workflow);
  }

  activateWorkflow(): void {
    if (!this.hasValidConfiguration()) {
      throw new DomainException('Cannot activate workflow without valid configuration');
    }
    this.workflow.activate();
  }

  private hasValidConfiguration(): boolean {
    const actions = this.workflow.getActions();
    return actions.length > 0 && actions.every(action => 
      action.type && action.config && typeof action.order === 'number'
    );
  }

  getWorkflow(): Workflow {
    return this.workflow;
  }

  getDomainEvents() {
    return this.workflow.getDomainEvents();
  }

  clearDomainEvents() {
    this.workflow.clearDomainEvents();
  }
}