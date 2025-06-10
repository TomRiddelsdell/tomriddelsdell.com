import { IntegrationId } from '../value-objects/IntegrationId';
import { DataSchema } from '../value-objects/DataSchema';

export type SyncJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
export type SyncDirection = 'push' | 'pull' | 'bidirectional';
export type ConflictResolution = 'source_wins' | 'target_wins' | 'merge' | 'manual' | 'skip';

export interface SyncSchedule {
  type: 'manual' | 'interval' | 'cron';
  interval?: number; // in milliseconds
  cronExpression?: string;
  timezone?: string;
  enabled: boolean;
}

export interface SyncResult {
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  recordsSkipped: number;
  conflicts: number;
  errors: SyncError[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface SyncError {
  recordId?: string;
  field?: string;
  errorType: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface SyncProgress {
  phase: 'initializing' | 'extracting' | 'transforming' | 'loading' | 'finalizing';
  totalRecords: number;
  processedRecords: number;
  percentage: number;
  currentRecord?: any;
  estimatedTimeRemaining?: number;
}

export class SyncJob {
  private constructor(
    private readonly id: string,
    private readonly integrationId: IntegrationId,
    private name: string,
    private description: string,
    private readonly direction: SyncDirection,
    private readonly sourceSchema: DataSchema,
    private readonly targetSchema: DataSchema,
    private schedule: SyncSchedule,
    private status: SyncJobStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private lastRunAt?: Date,
    private nextRunAt?: Date,
    private conflictResolution: ConflictResolution = 'source_wins',
    private batchSize: number = 100,
    private timeout: number = 300000, // 5 minutes
    private retryCount: number = 0,
    private maxRetries: number = 3,
    private results: SyncResult[] = [],
    private currentProgress?: SyncProgress,
    private filters: Record<string, any> = {},
    private isEnabled: boolean = true
  ) {}

  static create(
    id: string,
    integrationId: IntegrationId,
    name: string,
    description: string,
    direction: SyncDirection,
    sourceSchema: DataSchema,
    targetSchema: DataSchema,
    schedule: SyncSchedule
  ): SyncJob {
    const now = new Date();
    return new SyncJob(
      id,
      integrationId,
      name,
      description,
      direction,
      sourceSchema,
      targetSchema,
      schedule,
      'pending',
      now,
      now
    );
  }

  static restore(
    id: string,
    integrationId: IntegrationId,
    name: string,
    description: string,
    direction: SyncDirection,
    sourceSchema: DataSchema,
    targetSchema: DataSchema,
    schedule: SyncSchedule,
    status: SyncJobStatus,
    createdAt: Date,
    updatedAt: Date,
    lastRunAt?: Date,
    nextRunAt?: Date,
    conflictResolution: ConflictResolution = 'source_wins',
    batchSize: number = 100,
    timeout: number = 300000,
    retryCount: number = 0,
    maxRetries: number = 3,
    results: SyncResult[] = [],
    currentProgress?: SyncProgress,
    filters: Record<string, any> = {},
    isEnabled: boolean = true
  ): SyncJob {
    return new SyncJob(
      id,
      integrationId,
      name,
      description,
      direction,
      sourceSchema,
      targetSchema,
      schedule,
      status,
      createdAt,
      updatedAt,
      lastRunAt,
      nextRunAt,
      conflictResolution,
      batchSize,
      timeout,
      retryCount,
      maxRetries,
      results,
      currentProgress,
      filters,
      isEnabled
    );
  }

  getId(): string {
    return this.id;
  }

  getIntegrationId(): IntegrationId {
    return this.integrationId;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getDirection(): SyncDirection {
    return this.direction;
  }

  getSourceSchema(): DataSchema {
    return this.sourceSchema;
  }

  getTargetSchema(): DataSchema {
    return this.targetSchema;
  }

  getSchedule(): SyncSchedule {
    return { ...this.schedule };
  }

  getStatus(): SyncJobStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getLastRunAt(): Date | undefined {
    return this.lastRunAt;
  }

  getNextRunAt(): Date | undefined {
    return this.nextRunAt;
  }

  getConflictResolution(): ConflictResolution {
    return this.conflictResolution;
  }

  getBatchSize(): number {
    return this.batchSize;
  }

  getTimeout(): number {
    return this.timeout;
  }

  getRetryCount(): number {
    return this.retryCount;
  }

  getMaxRetries(): number {
    return this.maxRetries;
  }

  getResults(): SyncResult[] {
    return [...this.results];
  }

  getCurrentProgress(): SyncProgress | undefined {
    return this.currentProgress ? { ...this.currentProgress } : undefined;
  }

  getFilters(): Record<string, any> {
    return { ...this.filters };
  }

  isJobEnabled(): boolean {
    return this.isEnabled;
  }

  canRun(): boolean {
    return this.isEnabled && 
           this.status !== 'running' && 
           this.status !== 'cancelled' &&
           this.schedule.enabled;
  }

  shouldRunNow(): boolean {
    if (!this.canRun() || !this.nextRunAt) {
      return false;
    }
    return new Date() >= this.nextRunAt;
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Sync job name cannot be empty');
    }
    this.name = name.trim();
    this.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.description = description || '';
    this.updatedAt = new Date();
  }

  updateSchedule(schedule: SyncSchedule): void {
    this.validateSchedule(schedule);
    this.schedule = { ...schedule };
    this.calculateNextRun();
    this.updatedAt = new Date();
  }

  updateConflictResolution(resolution: ConflictResolution): void {
    this.conflictResolution = resolution;
    this.updatedAt = new Date();
  }

  updateBatchSize(batchSize: number): void {
    if (batchSize <= 0 || batchSize > 10000) {
      throw new Error('Batch size must be between 1 and 10000');
    }
    this.batchSize = batchSize;
    this.updatedAt = new Date();
  }

  updateTimeout(timeout: number): void {
    if (timeout <= 0 || timeout > 3600000) { // Max 1 hour
      throw new Error('Timeout must be between 1 and 3600000 milliseconds');
    }
    this.timeout = timeout;
    this.updatedAt = new Date();
  }

  updateMaxRetries(maxRetries: number): void {
    if (maxRetries < 0 || maxRetries > 10) {
      throw new Error('Max retries must be between 0 and 10');
    }
    this.maxRetries = maxRetries;
    this.updatedAt = new Date();
  }

  updateFilters(filters: Record<string, any>): void {
    this.filters = { ...filters };
    this.updatedAt = new Date();
  }

  start(): void {
    if (!this.canRun()) {
      throw new Error(`Cannot start sync job in status: ${this.status}`);
    }

    // Check if this is a retry (status was 'pending') before changing status
    const isRetry = this.status === 'pending';
    
    this.status = 'running';
    this.lastRunAt = new Date();
    // Only reset retry count if this is a fresh start, not a retry
    if (!isRetry) {
      this.retryCount = 0;
    }
    this.currentProgress = {
      phase: 'initializing',
      totalRecords: 0,
      processedRecords: 0,
      percentage: 0
    };
    this.updatedAt = new Date();
  }

  updateProgress(progress: Partial<SyncProgress>): void {
    if (this.status !== 'running') {
      throw new Error('Cannot update progress for non-running job');
    }

    this.currentProgress = {
      ...this.currentProgress!,
      ...progress,
      percentage: progress.totalRecords && progress.processedRecords 
        ? (progress.processedRecords / progress.totalRecords) * 100 
        : this.currentProgress?.percentage || 0
    };
    this.updatedAt = new Date();
  }

  complete(result: SyncResult): void {
    if (this.status !== 'running') {
      throw new Error('Cannot complete non-running job');
    }

    this.status = 'completed';
    this.results.push(result);
    this.currentProgress = undefined;
    this.calculateNextRun();
    
    // Keep only last 50 results
    if (this.results.length > 50) {
      this.results = this.results.slice(-50);
    }
    
    this.updatedAt = new Date();
  }

  fail(errors: SyncError[]): void {
    if (this.status !== 'running') {
      throw new Error('Cannot fail non-running job');
    }

    const result: SyncResult = {
      recordsProcessed: this.currentProgress?.processedRecords || 0,
      recordsSucceeded: 0,
      recordsFailed: this.currentProgress?.processedRecords || 0,
      recordsSkipped: 0,
      conflicts: 0,
      errors,
      startTime: this.lastRunAt || new Date(),
      endTime: new Date(),
      duration: this.lastRunAt ? Date.now() - this.lastRunAt.getTime() : 0
    };

    this.results.push(result);
    this.currentProgress = undefined;

    // Check if we should retry
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.status = 'pending';
      this.calculateNextRun(true); // Schedule retry
    } else {
      this.status = 'failed';
      this.calculateNextRun();
    }

    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status !== 'running' && this.status !== 'pending') {
      throw new Error(`Cannot cancel sync job in status: ${this.status}`);
    }

    this.status = 'cancelled';
    this.currentProgress = undefined;
    this.updatedAt = new Date();
  }

  pause(): void {
    if (this.status !== 'running') {
      throw new Error('Can only pause running jobs');
    }

    this.status = 'paused';
    this.updatedAt = new Date();
  }

  resume(): void {
    if (this.status !== 'paused') {
      throw new Error('Can only resume paused jobs');
    }

    this.status = 'running';
    this.updatedAt = new Date();
  }

  enable(): void {
    this.isEnabled = true;
    this.calculateNextRun();
    this.updatedAt = new Date();
  }

  disable(): void {
    this.isEnabled = false;
    this.nextRunAt = undefined;
    this.updatedAt = new Date();
  }

  runManually(): void {
    if (!this.canRun()) {
      throw new Error(`Cannot run sync job manually in status: ${this.status}`);
    }

    this.start();
  }

  private validateSchedule(schedule: SyncSchedule): void {
    if (schedule.type === 'interval') {
      if (!schedule.interval || schedule.interval <= 0) {
        throw new Error('Interval schedule requires a positive interval value');
      }
      if (schedule.interval < 60000) { // Minimum 1 minute
        throw new Error('Interval must be at least 60000 milliseconds (1 minute)');
      }
    }

    if (schedule.type === 'cron') {
      if (!schedule.cronExpression) {
        throw new Error('Cron schedule requires a cron expression');
      }
      // Basic cron validation - in production, use a proper cron parser
      const cronParts = schedule.cronExpression.split(' ');
      if (cronParts.length < 5 || cronParts.length > 6) {
        throw new Error('Invalid cron expression format');
      }
    }
  }

  private calculateNextRun(isRetry: boolean = false): void {
    if (!this.isEnabled || !this.schedule.enabled) {
      this.nextRunAt = undefined;
      return;
    }

    const now = new Date();

    if (isRetry) {
      // Calculate retry delay with exponential backoff
      const baseDelay = 60000; // 1 minute
      const delay = baseDelay * Math.pow(2, this.retryCount - 1);
      this.nextRunAt = new Date(now.getTime() + delay);
      return;
    }

    switch (this.schedule.type) {
      case 'manual':
        this.nextRunAt = undefined;
        break;

      case 'interval':
        if (this.schedule.interval) {
          this.nextRunAt = new Date(now.getTime() + this.schedule.interval);
        }
        break;

      case 'cron':
        if (this.schedule.cronExpression) {
          // Simplified cron calculation - in production, use a proper cron library
          this.nextRunAt = this.calculateNextCronRun(this.schedule.cronExpression, now);
        }
        break;
    }
  }

  private calculateNextCronRun(cronExpression: string, from: Date): Date {
    // Simplified cron calculation - in production, use a library like node-cron
    // For now, just add 1 hour as a placeholder
    return new Date(from.getTime() + 3600000);
  }

  getExecutionStatistics(): {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    successRate: number;
    averageDuration: number;
    averageRecordsProcessed: number;
    lastSuccessAt?: Date;
    lastFailureAt?: Date;
  } {
    if (this.results.length === 0) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        successRate: 0,
        averageDuration: 0,
        averageRecordsProcessed: 0
      };
    }

    const successfulRuns = this.results.filter(r => r.recordsFailed === 0).length;
    const failedRuns = this.results.length - successfulRuns;
    const successRate = (successfulRuns / this.results.length) * 100;

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalDuration / this.results.length;

    const totalRecords = this.results.reduce((sum, r) => sum + r.recordsProcessed, 0);
    const averageRecordsProcessed = totalRecords / this.results.length;

    const lastSuccess = this.results
      .slice()
      .reverse()
      .find(r => r.recordsFailed === 0);

    const lastFailure = this.results
      .slice()
      .reverse()
      .find(r => r.recordsFailed > 0);

    return {
      totalRuns: this.results.length,
      successfulRuns,
      failedRuns,
      successRate,
      averageDuration,
      averageRecordsProcessed,
      lastSuccessAt: lastSuccess?.endTime,
      lastFailureAt: lastFailure?.endTime
    };
  }

  needsAttention(): boolean {
    if (!this.isEnabled) {
      return false;
    }

    // Check if job has been failing consistently
    const recentResults = this.results.slice(-5);
    if (recentResults.length >= 3) {
      const recentFailures = recentResults.filter(r => r.recordsFailed > 0);
      if (recentFailures.length >= 3) {
        return true;
      }
    }

    // Check if job hasn't run in a while (for scheduled jobs)
    if (this.schedule.type !== 'manual' && this.lastRunAt) {
      const expectedInterval = this.schedule.type === 'interval' 
        ? this.schedule.interval! 
        : 86400000; // 1 day for cron jobs

      const timeSinceLastRun = Date.now() - this.lastRunAt.getTime();
      if (timeSinceLastRun > expectedInterval * 2) {
        return true;
      }
    }

    // Check if job is stuck in running state
    if (this.status === 'running' && this.lastRunAt) {
      const runDuration = Date.now() - this.lastRunAt.getTime();
      if (runDuration > this.timeout * 2) {
        return true;
      }
    }

    return false;
  }

  clone(newId: string, newName: string): SyncJob {
    return SyncJob.create(
      newId,
      this.integrationId,
      newName,
      `Copy of ${this.description}`,
      this.direction,
      this.sourceSchema,
      this.targetSchema,
      { ...this.schedule, enabled: false }
    );
  }
}