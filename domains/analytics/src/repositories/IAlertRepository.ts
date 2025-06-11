import { Alert, AlertId, AlertStatus } from '../entities/Alert';

export interface AlertQueryOptions {
  status?: AlertStatus;
  metricNames?: string[];
  severities?: string[];
  limit?: number;
  offset?: number;
}

export interface IAlertRepository {
  save(alert: Alert): Promise<void>;
  findById(id: AlertId): Promise<Alert | null>;
  findByStatus(status: AlertStatus): Promise<Alert[]>;
  findByMetricName(metricName: string): Promise<Alert[]>;
  findActiveAlerts(): Promise<Alert[]>;
  findByQuery(options: AlertQueryOptions): Promise<Alert[]>;
  count(): Promise<number>;
  countByStatus(status: AlertStatus): Promise<number>;
  delete(id: AlertId): Promise<void>;
}