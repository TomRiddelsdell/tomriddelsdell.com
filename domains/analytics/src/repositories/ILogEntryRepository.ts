import { LogEntry, LogEntryId, LogLevel, LogCategory } from '../entities/LogEntry';
import { TimeRange } from '../value-objects/TimeRange';

export interface LogQueryOptions {
  timeRange?: TimeRange;
  level?: LogLevel;
  category?: LogCategory;
  source?: string;
  userId?: string;
  tags?: string[];
  searchText?: string;
  limit?: number;
  offset?: number;
}

export interface LogAggregation {
  level: LogLevel;
  count: number;
  category: LogCategory;
  source: string;
  timeRange: string;
}

export interface ILogEntryRepository {
  save(logEntry: LogEntry): Promise<void>;
  saveMany(logEntries: LogEntry[]): Promise<void>;
  findById(id: LogEntryId): Promise<LogEntry | null>;
  findByQuery(options: LogQueryOptions): Promise<LogEntry[]>;
  findRecent(minutes: number, level?: LogLevel): Promise<LogEntry[]>;
  findErrors(timeRange: TimeRange): Promise<LogEntry[]>;
  aggregate(options: LogQueryOptions): Promise<LogAggregation[]>;
  count(options?: LogQueryOptions): Promise<number>;
  deleteOlderThan(date: Date): Promise<number>;
  getLogSources(): Promise<string[]>;
}