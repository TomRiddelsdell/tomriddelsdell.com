/**
 * Analytics Domain - Report Entity
 * Analytics report entity with data, visualizations, and metadata
 */

import { TimeRange } from '../value-objects/TimeRange';
import { DimensionCollection, Dimension } from '../value-objects/Dimension';

export type ReportType = 
  | 'dashboard_summary' 
  | 'workflow_performance' 
  | 'integration_health' 
  | 'user_activity' 
  | 'system_metrics' 
  | 'custom';

export type ReportFormat = 'json' | 'csv' | 'pdf' | 'html';

export type ScheduleFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface ReportData {
  metrics: Record<string, any>;
  charts: Array<{
    type: string;
    title: string;
    data: any[];
    config: Record<string, any>;
  }>;
  tables: Array<{
    title: string;
    headers: string[];
    rows: any[][];
  }>;
  summary: {
    totalRecords: number;
    timeRange: TimeRange;
    generatedAt: Date;
    executionTime: number;
  };
}

export interface ScheduleConfig {
  frequency: ScheduleFrequency;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  hour?: number; // 0-23
  timezone?: string;
  recipients?: string[];
}

export class Report {
  private constructor(
    private readonly _id: number,
    private readonly _userId: number,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _type: ReportType,
    private readonly _timeRange: TimeRange,
    private readonly _filters: DimensionCollection,
    private readonly _data: ReportData | null = null,
    private readonly _scheduleConfig: ScheduleConfig | null = null,
    private readonly _lastGenerated: Date | null = null,
    private readonly _generationStatus: 'pending' | 'generating' | 'completed' | 'failed' = 'pending',
    private readonly _errorMessage: string | null = null,
    private readonly _createdAt: Date = new Date(),
    private readonly _updatedAt: Date = new Date()
  ) {
    this.validateReport();
  }

  static create(
    id: number,
    userId: number,
    name: string,
    description: string,
    type: ReportType,
    timeRange: TimeRange,
    filters: Dimension[] = []
  ): Report {
    return new Report(
      id,
      userId,
      name,
      description,
      type,
      timeRange,
      new DimensionCollection(filters),
      null,
      null,
      null,
      'pending',
      null,
      new Date(),
      new Date()
    );
  }

  static scheduled(
    id: number,
    userId: number,
    name: string,
    description: string,
    type: ReportType,
    timeRange: TimeRange,
    scheduleConfig: ScheduleConfig,
    filters: Dimension[] = []
  ): Report {
    return new Report(
      id,
      userId,
      name,
      description,
      type,
      timeRange,
      new DimensionCollection(filters),
      null,
      scheduleConfig,
      null,
      'pending',
      null,
      new Date(),
      new Date()
    );
  }

  get id(): number {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get type(): ReportType {
    return this._type;
  }

  get timeRange(): TimeRange {
    return this._timeRange;
  }

  get filters(): DimensionCollection {
    return this._filters;
  }

  get data(): ReportData | null {
    return this._data ? { ...this._data } : null;
  }

  get scheduleConfig(): ScheduleConfig | null {
    return this._scheduleConfig ? { ...this._scheduleConfig } : null;
  }

  get lastGenerated(): Date | null {
    return this._lastGenerated ? new Date(this._lastGenerated) : null;
  }

  get generationStatus(): 'pending' | 'generating' | 'completed' | 'failed' {
    return this._generationStatus;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get isScheduled(): boolean {
    return this._scheduleConfig !== null && this._scheduleConfig.frequency !== 'none';
  }

  get isGenerated(): boolean {
    return this._generationStatus === 'completed' && this._data !== null;
  }

  get isGenerating(): boolean {
    return this._generationStatus === 'generating';
  }

  get hasFailed(): boolean {
    return this._generationStatus === 'failed';
  }

  get displayName(): string {
    return `${this._name} (${this._type})`;
  }

  get age(): number {
    if (!this._lastGenerated) return Infinity;
    return Date.now() - this._lastGenerated.getTime();
  }

  get isStale(): boolean {
    if (!this._lastGenerated) return true;
    
    const staleThresholds: Record<ScheduleFrequency, number> = {
      none: 24 * 60 * 60 * 1000, // 1 day
      daily: 25 * 60 * 60 * 1000, // 25 hours
      weekly: 8 * 24 * 60 * 60 * 1000, // 8 days
      monthly: 32 * 24 * 60 * 60 * 1000, // 32 days
      quarterly: 95 * 24 * 60 * 60 * 1000 // 95 days
    };

    const threshold = this._scheduleConfig ? 
      staleThresholds[this._scheduleConfig.frequency] : 
      staleThresholds.none;

    return this.age > threshold;
  }

  startGeneration(): Report {
    return new Report(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._type,
      this._timeRange,
      this._filters,
      null,
      this._scheduleConfig,
      this._lastGenerated,
      'generating',
      null,
      this._createdAt,
      new Date()
    );
  }

  completeGeneration(data: ReportData): Report {
    return new Report(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._type,
      this._timeRange,
      this._filters,
      data,
      this._scheduleConfig,
      new Date(),
      'completed',
      null,
      this._createdAt,
      new Date()
    );
  }

  failGeneration(errorMessage: string): Report {
    return new Report(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._type,
      this._timeRange,
      this._filters,
      this._data,
      this._scheduleConfig,
      this._lastGenerated,
      'failed',
      errorMessage,
      this._createdAt,
      new Date()
    );
  }

  updateSchedule(scheduleConfig: ScheduleConfig): Report {
    return new Report(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._type,
      this._timeRange,
      this._filters,
      this._data,
      scheduleConfig,
      this._lastGenerated,
      this._generationStatus,
      this._errorMessage,
      this._createdAt,
      new Date()
    );
  }

  updateTimeRange(timeRange: TimeRange): Report {
    return new Report(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._type,
      timeRange,
      this._filters,
      null, // Clear data when time range changes
      this._scheduleConfig,
      null,
      'pending',
      null,
      this._createdAt,
      new Date()
    );
  }

  updateFilters(filters: Dimension[]): Report {
    return new Report(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._type,
      this._timeRange,
      new DimensionCollection(filters),
      null, // Clear data when filters change
      this._scheduleConfig,
      null,
      'pending',
      null,
      this._createdAt,
      new Date()
    );
  }

  updateDetails(name: string, description: string): Report {
    return new Report(
      this._id,
      this._userId,
      name,
      description,
      this._type,
      this._timeRange,
      this._filters,
      this._data,
      this._scheduleConfig,
      this._lastGenerated,
      this._generationStatus,
      this._errorMessage,
      this._createdAt,
      new Date()
    );
  }

  getNextScheduledGeneration(): Date | null {
    if (!this.isScheduled || !this._scheduleConfig) {
      return null;
    }

    const now = new Date();
    const config = this._scheduleConfig;
    let next = new Date(now);

    switch (config.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        if (config.hour !== undefined) {
          next.setHours(config.hour, 0, 0, 0);
        }
        break;

      case 'weekly':
        const daysUntilNext = (7 + (config.dayOfWeek || 0) - now.getDay()) % 7;
        next.setDate(next.getDate() + (daysUntilNext || 7));
        if (config.hour !== undefined) {
          next.setHours(config.hour, 0, 0, 0);
        }
        break;

      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        if (config.dayOfMonth !== undefined) {
          next.setDate(config.dayOfMonth);
        }
        if (config.hour !== undefined) {
          next.setHours(config.hour, 0, 0, 0);
        }
        break;

      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        if (config.dayOfMonth !== undefined) {
          next.setDate(config.dayOfMonth);
        }
        if (config.hour !== undefined) {
          next.setHours(config.hour, 0, 0, 0);
        }
        break;

      default:
        return null;
    }

    return next;
  }

  exportData(format: ReportFormat): string | Buffer | null {
    if (!this.isGenerated || !this._data) {
      return null;
    }

    switch (format) {
      case 'json':
        return JSON.stringify(this._data, null, 2);
      
      case 'csv':
        return this.convertToCSV();
      
      case 'html':
        return this.convertToHTML();
      
      default:
        return null;
    }
  }

  toJSON(): Record<string, any> {
    return {
      id: this._id,
      userId: this._userId,
      name: this._name,
      description: this._description,
      type: this._type,
      timeRange: this._timeRange.toJSON(),
      filters: this._filters.toJSON(),
      data: this._data,
      scheduleConfig: this._scheduleConfig,
      lastGenerated: this._lastGenerated?.toISOString() || null,
      generationStatus: this._generationStatus,
      errorMessage: this._errorMessage,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      isScheduled: this.isScheduled,
      isGenerated: this.isGenerated,
      isGenerating: this.isGenerating,
      hasFailed: this.hasFailed,
      displayName: this.displayName,
      age: this.age,
      isStale: this.isStale,
      nextScheduledGeneration: this.getNextScheduledGeneration()?.toISOString() || null
    };
  }

  private convertToCSV(): string {
    if (!this._data) return '';

    let csv = '';
    
    // Add tables to CSV
    this._data.tables.forEach(table => {
      csv += `${table.title}\n`;
      csv += table.headers.join(',') + '\n';
      table.rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });
      csv += '\n';
    });

    return csv;
  }

  private convertToHTML(): string {
    if (!this._data) return '';

    let html = `
      <html>
        <head>
          <title>${this._name}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>${this._name}</h1>
          <p>${this._description}</p>
          <div class="summary">
            <h3>Summary</h3>
            <p>Generated: ${this._data.summary.generatedAt}</p>
            <p>Time Range: ${this._data.summary.timeRange.formatDisplayName()}</p>
            <p>Total Records: ${this._data.summary.totalRecords}</p>
          </div>
    `;

    this._data.tables.forEach(table => {
      html += `
        <h3>${table.title}</h3>
        <table>
          <thead>
            <tr>${table.headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${table.rows.map(row => 
              `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
      `;
    });

    html += '</body></html>';
    return html;
  }

  private validateReport(): void {
    if (this._id <= 0) {
      throw new Error('Report ID must be positive');
    }

    if (this._userId <= 0) {
      throw new Error('User ID must be positive');
    }

    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Report name cannot be empty');
    }

    if (this._name.length > 200) {
      throw new Error('Report name cannot exceed 200 characters');
    }

    if (!this._timeRange.isValid) {
      throw new Error('Time range must be valid');
    }

    if (this._scheduleConfig && this._scheduleConfig.frequency !== 'none') {
      if (this._scheduleConfig.recipients && this._scheduleConfig.recipients.length === 0) {
        throw new Error('Scheduled reports must have at least one recipient');
      }
    }
  }
}