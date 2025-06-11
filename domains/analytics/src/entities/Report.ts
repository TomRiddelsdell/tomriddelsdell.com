import { TimeRange } from '../value-objects/TimeRange';
import { DimensionCollection } from '../value-objects/Dimension';
import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';
import { DomainEvent } from '../../../shared-kernel/src/events/DomainEvent';

export class ReportId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainException('ReportId cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: ReportId): boolean {
    return this.value === other.value;
  }

  static generate(): ReportId {
    return new ReportId(`report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }

  static fromString(value: string): ReportId {
    return new ReportId(value);
  }
}

export enum ReportType {
  PERFORMANCE = 'performance',
  USAGE = 'usage',
  ERROR_ANALYSIS = 'error_analysis',
  CUSTOM = 'custom',
  SUMMARY = 'summary',
  TREND_ANALYSIS = 'trend_analysis'
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  HTML = 'html'
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM format
  day?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  dayOfMonth?: number; // 1-31
}

export interface ReportData {
  metrics: any[];
  aggregations: Record<string, number>;
  charts: any[];
  summary: {
    totalRecords: number;
    timeRange: string;
    generatedAt: Date;
  };
}

export class ReportGeneratedEvent extends DomainEvent {
  constructor(
    reportId: string,
    public readonly reportName: string,
    public readonly reportType: ReportType,
    public readonly format: ReportFormat,
    public readonly dataSize: number
  ) {
    super(reportId, 'ReportGenerated');
  }

  getPayload() {
    return {
      reportName: this.reportName,
      reportType: this.reportType,
      format: this.format,
      dataSize: this.dataSize
    };
  }
}

export class Report {
  private domainEvents: DomainEvent[] = [];
  private data?: ReportData;

  private constructor(
    private readonly id: ReportId,
    private readonly name: string,
    private readonly type: ReportType,
    private readonly timeRange: TimeRange,
    private readonly dimensions: DimensionCollection,
    private readonly userId: string,
    private status: ReportStatus = ReportStatus.PENDING,
    private readonly format: ReportFormat = ReportFormat.JSON,
    private readonly description?: string,
    private readonly scheduleConfig?: ScheduleConfig,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private completedAt?: Date,
    private expiresAt?: Date
  ) {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Report name cannot be empty');
    }
    if (!userId || userId.trim().length === 0) {
      throw new DomainException('Report must have a user ID');
    }
    
    // Set expiration date (default 30 days from creation)
    if (!expiresAt) {
      this.expiresAt = new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000));
    }
  }

  static create(
    name: string,
    type: ReportType,
    timeRange: TimeRange,
    dimensions: DimensionCollection,
    userId: string,
    options: {
      id?: ReportId;
      format?: ReportFormat;
      description?: string;
      scheduleConfig?: ScheduleConfig;
      expiresAt?: Date;
    } = {}
  ): Report {
    return new Report(
      options.id || ReportId.generate(),
      name,
      type,
      timeRange,
      dimensions,
      userId,
      ReportStatus.PENDING,
      options.format || ReportFormat.JSON,
      options.description,
      options.scheduleConfig,
      new Date(),
      new Date(),
      undefined,
      options.expiresAt
    );
  }

  static scheduled(
    name: string,
    type: ReportType,
    timeRange: TimeRange,
    dimensions: DimensionCollection,
    userId: string,
    scheduleConfig: ScheduleConfig,
    options: {
      id?: ReportId;
      format?: ReportFormat;
      description?: string;
    } = {}
  ): Report {
    return new Report(
      options.id || ReportId.generate(),
      name,
      type,
      timeRange,
      dimensions,
      userId,
      ReportStatus.PENDING,
      options.format || ReportFormat.JSON,
      options.description,
      scheduleConfig
    );
  }

  // Factory methods for common reports
  static performanceReport(
    userId: string,
    timeRange: TimeRange,
    workflowId?: string
  ): Report {
    const dimensions = new DimensionCollection();
    if (workflowId) {
      // Add workflow dimension if specified
    }

    return Report.create(
      'Workflow Performance Report',
      ReportType.PERFORMANCE,
      timeRange,
      dimensions,
      userId,
      {
        description: 'Analysis of workflow execution performance and response times',
        format: ReportFormat.PDF
      }
    );
  }

  static usageReport(
    userId: string,
    timeRange: TimeRange
  ): Report {
    const dimensions = new DimensionCollection();

    return Report.create(
      'Platform Usage Report',
      ReportType.USAGE,
      timeRange,
      dimensions,
      userId,
      {
        description: 'Platform usage statistics and user activity analysis',
        format: ReportFormat.HTML
      }
    );
  }

  static errorAnalysisReport(
    userId: string,
    timeRange: TimeRange
  ): Report {
    const dimensions = new DimensionCollection();

    return Report.create(
      'Error Analysis Report',
      ReportType.ERROR_ANALYSIS,
      timeRange,
      dimensions,
      userId,
      {
        description: 'Analysis of system errors and failure patterns',
        format: ReportFormat.CSV
      }
    );
  }

  static weeklyPerformanceSummary(userId: string): Report {
    return Report.scheduled(
      'Weekly Performance Summary',
      ReportType.SUMMARY,
      TimeRange.last7Days(),
      new DimensionCollection(),
      userId,
      {
        frequency: 'weekly',
        day: 'monday',
        time: '09:00'
      },
      {
        description: 'Weekly summary of platform performance metrics',
        format: ReportFormat.PDF
      }
    );
  }

  // Business methods
  startGeneration(): void {
    if (this.status !== ReportStatus.PENDING) {
      throw new DomainException('Report must be pending to start generation');
    }
    
    this.status = ReportStatus.GENERATING;
    this.updatedAt = new Date();
  }

  completeGeneration(data: ReportData): void {
    if (this.status !== ReportStatus.GENERATING) {
      throw new DomainException('Report must be generating to complete');
    }

    this.status = ReportStatus.COMPLETED;
    this.data = data;
    this.completedAt = new Date();
    this.updatedAt = new Date();

    const event = new ReportGeneratedEvent(
      this.id.toString(),
      this.name,
      this.type,
      this.format,
      this.calculateDataSize()
    );

    this.domainEvents.push(event);
  }

  markAsFailed(error?: string): void {
    this.status = ReportStatus.FAILED;
    this.updatedAt = new Date();
    // Could store error message in additional field if needed
  }

  expire(): void {
    this.status = ReportStatus.EXPIRED;
    this.data = undefined; // Clear data to save space
    this.updatedAt = new Date();
  }

  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  isScheduled(): boolean {
    return this.scheduleConfig !== undefined;
  }

  canBeViewed(): boolean {
    return this.status === ReportStatus.COMPLETED && !this.isExpired();
  }

  getNextScheduledRun(): Date | null {
    if (!this.scheduleConfig) return null;

    const now = new Date();
    const nextRun = new Date(now);

    switch (this.scheduleConfig.frequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        const targetDay = this.getWeekdayNumber(this.scheduleConfig.day!);
        const currentDay = now.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
        nextRun.setDate(now.getDate() + daysUntilTarget);
        break;
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1);
        if (this.scheduleConfig.dayOfMonth) {
          nextRun.setDate(this.scheduleConfig.dayOfMonth);
        }
        break;
    }

    if (this.scheduleConfig.time) {
      const [hours, minutes] = this.scheduleConfig.time.split(':');
      nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    return nextRun;
  }

  private getWeekdayNumber(day: string): number {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.indexOf(day);
  }

  private calculateDataSize(): number {
    if (!this.data) return 0;
    return JSON.stringify(this.data).length;
  }

  // Getters
  getId(): ReportId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getType(): ReportType {
    return this.type;
  }

  getTimeRange(): TimeRange {
    return this.timeRange;
  }

  getDimensions(): DimensionCollection {
    return this.dimensions;
  }

  getUserId(): string {
    return this.userId;
  }

  getStatus(): ReportStatus {
    return this.status;
  }

  getFormat(): ReportFormat {
    return this.format;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getScheduleConfig(): ScheduleConfig | undefined {
    return this.scheduleConfig ? { ...this.scheduleConfig } : undefined;
  }

  getData(): ReportData | undefined {
    return this.data ? { ...this.data } : undefined;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getCompletedAt(): Date | undefined {
    return this.completedAt;
  }

  getExpiresAt(): Date | undefined {
    return this.expiresAt;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  markEventsAsCommitted(): void {
    this.domainEvents = [];
  }

  equals(other: Report): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return `${this.name} [${this.type}] - ${this.status}`;
  }
}