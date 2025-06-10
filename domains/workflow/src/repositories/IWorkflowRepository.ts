import { Workflow, WorkflowId, WorkflowStatus } from '../entities/Workflow';
import { UserId } from '../../../shared-kernel/src/value-objects/UserId';

export interface IWorkflowRepository {
  save(workflow: Workflow): Promise<void>;
  findById(id: WorkflowId): Promise<Workflow | null>;
  findByUserId(userId: UserId): Promise<Workflow[]>;
  findRecentByUserId(userId: UserId, limit: number): Promise<Workflow[]>;
  findByStatus(status: WorkflowStatus): Promise<Workflow[]>;
  delete(id: WorkflowId): Promise<void>;
  count(): Promise<number>;
  countByUserId(userId: UserId): Promise<number>;
  countByStatus(status: WorkflowStatus): Promise<number>;
}