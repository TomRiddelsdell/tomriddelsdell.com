import { Report, ReportId, ReportStatus, ReportType } from '../entities/Report';

export interface ReportQueryOptions {
  userId?: string;
  status?: ReportStatus;
  type?: ReportType;
  isScheduled?: boolean;
  limit?: number;
  offset?: number;
}

export interface IReportRepository {
  save(report: Report): Promise<void>;
  findById(id: ReportId): Promise<Report | null>;
  findByUserId(userId: string): Promise<Report[]>;
  findByStatus(status: ReportStatus): Promise<Report[]>;
  findScheduledReports(): Promise<Report[]>;
  findExpiredReports(): Promise<Report[]>;
  findByQuery(options: ReportQueryOptions): Promise<Report[]>;
  count(): Promise<number>;
  countByUser(userId: string): Promise<number>;
  delete(id: ReportId): Promise<void>;
  deleteExpired(): Promise<number>;
}