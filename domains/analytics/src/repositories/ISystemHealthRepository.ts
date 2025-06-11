import { SystemHealth, ComponentId, HealthStatus, ComponentType } from '../entities/SystemHealth';

export interface HealthQueryOptions {
  status?: HealthStatus;
  type?: ComponentType;
  limit?: number;
  offset?: number;
}

export interface ISystemHealthRepository {
  save(health: SystemHealth): Promise<void>;
  findById(id: ComponentId): Promise<SystemHealth | null>;
  findByStatus(status: HealthStatus): Promise<SystemHealth[]>;
  findByType(type: ComponentType): Promise<SystemHealth[]>;
  findAll(): Promise<SystemHealth[]>;
  findByQuery(options: HealthQueryOptions): Promise<SystemHealth[]>;
  getOverallHealthStatus(): Promise<{
    healthy: number;
    warning: number;
    critical: number;
    down: number;
  }>;
  delete(id: ComponentId): Promise<void>;
}