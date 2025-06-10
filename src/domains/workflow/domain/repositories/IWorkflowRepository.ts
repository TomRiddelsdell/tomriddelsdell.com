import { Workflow } from '../entities/Workflow';
import { WorkflowId } from '../../../shared/kernel/value-objects/WorkflowId';
import { UserId } from '../../../shared/kernel/value-objects/UserId';

export interface IWorkflowRepository {
  findById(id: WorkflowId): Promise<Workflow | null>;
  findByUserId(userId: UserId): Promise<Workflow[]>;
  findRecentByUserId(userId: UserId, limit?: number): Promise<Workflow[]>;
  findActiveByUserId(userId: UserId): Promise<Workflow[]>;
  save(workflow: Workflow): Promise<void>;
  update(workflow: Workflow): Promise<void>;
  delete(id: WorkflowId): Promise<void>;
  findAll(): Promise<Workflow[]>;
  countByUserId(userId: UserId): Promise<number>;
  countActiveByUserId(userId: UserId): Promise<number>;
  findByStatus(status: string): Promise<Workflow[]>;
  searchByName(query: string, userId?: UserId): Promise<Workflow[]>;
}