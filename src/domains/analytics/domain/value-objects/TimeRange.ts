/**
 * Analytics Domain - TimeRange Value Object
 * Represents date/time periods for analytics queries and aggregations
 */

export type TimeRangeType = 
  | 'last_hour' 
  | 'last_24_hours' 
  | 'last_7_days' 
  | 'last_30_days' 
  | 'last_90_days' 
  | 'last_year' 
  | 'custom' 
  | 'all_time';

export type TimeGranularity = 
  | 'minute' 
  | 'hour' 
  | 'day' 
  | 'week' 
  | 'month' 
  | 'year';

export class TimeRange {
  private constructor(
    private readonly _startTime: Date,
    private readonly _endTime: Date,
    private readonly _type: TimeRangeType = 'custom'
  ) {
    this.validateRange();
  }

  static create(startTime: Date, endTime: Date): TimeRange {
    return new TimeRange(startTime, endTime, 'custom');
  }

  static lastHour(): TimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 60 * 60 * 1000);
    return new TimeRange(start, end, 'last_hour');
  }

  static last24Hours(): TimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    return new TimeRange(start, end, 'last_24_hours');
  }

  static last7Days(): TimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    return new TimeRange(start, end, 'last_7_days');
  }

  static last30Days(): TimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return new TimeRange(start, end, 'last_30_days');
  }

  static last90Days(): TimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    return new TimeRange(start, end, 'last_90_days');
  }

  static lastYear(): TimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
    return new TimeRange(start, end, 'last_year');
  }

  static allTime(): TimeRange {
    const end = new Date();
    const start = new Date('2000-01-01'); // Reasonable start for analytics
    return new TimeRange(start, end, 'all_time');
  }

  static today(): TimeRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    return new TimeRange(start, end, 'custom');
  }

  static thisWeek(): TimeRange {
    const now = new Date();
    const start = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    return new TimeRange(start, end, 'custom');
  }

  static thisMonth(): TimeRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return new TimeRange(start, end, 'custom');
  }

  get startTime(): Date {
    return new Date(this._startTime);
  }

  get endTime(): Date {
    return new Date(this._endTime);
  }

  get type(): TimeRangeType {
    return this._type;
  }

  get durationMs(): number {
    return this._endTime.getTime() - this._startTime.getTime();
  }

  get durationDays(): number {
    return this.durationMs / (24 * 60 * 60 * 1000);
  }

  get durationHours(): number {
    return this.durationMs / (60 * 60 * 1000);
  }

  get isValid(): boolean {
    return this._startTime < this._endTime && 
           this._startTime <= new Date() &&
           this.durationMs > 0;
  }

  contains(timestamp: Date): boolean {
    return timestamp >= this._startTime && timestamp <= this._endTime;
  }

  overlaps(other: TimeRange): boolean {
    return this._startTime < other._endTime && this._endTime > other._startTime;
  }

  intersect(other: TimeRange): TimeRange | null {
    if (!this.overlaps(other)) {
      return null;
    }

    const start = new Date(Math.max(this._startTime.getTime(), other._startTime.getTime()));
    const end = new Date(Math.min(this._endTime.getTime(), other._endTime.getTime()));
    
    return new TimeRange(start, end, 'custom');
  }

  extend(milliseconds: number): TimeRange {
    return new TimeRange(
      new Date(this._startTime.getTime() - milliseconds),
      new Date(this._endTime.getTime() + milliseconds),
      'custom'
    );
  }

  shift(milliseconds: number): TimeRange {
    return new TimeRange(
      new Date(this._startTime.getTime() + milliseconds),
      new Date(this._endTime.getTime() + milliseconds),
      this._type === 'custom' ? 'custom' : this._type
    );
  }

  getOptimalGranularity(): TimeGranularity {
    const days = this.durationDays;
    
    if (days <= 1) return 'hour';
    if (days <= 7) return 'day';
    if (days <= 90) return 'week';
    if (days <= 365) return 'month';
    return 'year';
  }

  split(granularity: TimeGranularity): TimeRange[] {
    const ranges: TimeRange[] = [];
    let current = new Date(this._startTime);
    
    while (current < this._endTime) {
      const next = this.getNextBoundary(current, granularity);
      const rangeEnd = next > this._endTime ? this._endTime : next;
      
      ranges.push(new TimeRange(new Date(current), rangeEnd, 'custom'));
      current = next;
    }
    
    return ranges;
  }

  formatDisplayName(): string {
    switch (this._type) {
      case 'last_hour':
        return 'Last Hour';
      case 'last_24_hours':
        return 'Last 24 Hours';
      case 'last_7_days':
        return 'Last 7 Days';
      case 'last_30_days':
        return 'Last 30 Days';
      case 'last_90_days':
        return 'Last 90 Days';
      case 'last_year':
        return 'Last Year';
      case 'all_time':
        return 'All Time';
      default:
        return `${this.formatDate(this._startTime)} - ${this.formatDate(this._endTime)}`;
    }
  }

  toJSON(): Record<string, any> {
    return {
      startTime: this._startTime.toISOString(),
      endTime: this._endTime.toISOString(),
      type: this._type,
      durationMs: this.durationMs,
      durationDays: this.durationDays,
      displayName: this.formatDisplayName(),
      optimalGranularity: this.getOptimalGranularity()
    };
  }

  equals(other: TimeRange): boolean {
    return this._startTime.getTime() === other._startTime.getTime() &&
           this._endTime.getTime() === other._endTime.getTime() &&
           this._type === other._type;
  }

  private validateRange(): void {
    if (this._startTime >= this._endTime) {
      throw new Error('Start time must be before end time');
    }

    if (this._startTime > new Date()) {
      throw new Error('Start time cannot be in the future');
    }

    if (this.durationMs > 10 * 365 * 24 * 60 * 60 * 1000) {
      throw new Error('Time range cannot exceed 10 years');
    }
  }

  private getNextBoundary(date: Date, granularity: TimeGranularity): Date {
    const next = new Date(date);
    
    switch (granularity) {
      case 'minute':
        next.setMinutes(next.getMinutes() + 1, 0, 0);
        break;
      case 'hour':
        next.setHours(next.getHours() + 1, 0, 0, 0);
        break;
      case 'day':
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const daysToAdd = 7 - next.getDay();
        next.setDate(next.getDate() + daysToAdd);
        next.setHours(0, 0, 0, 0);
        break;
      case 'month':
        next.setMonth(next.getMonth() + 1, 1);
        next.setHours(0, 0, 0, 0);
        break;
      case 'year':
        next.setFullYear(next.getFullYear() + 1, 0, 1);
        next.setHours(0, 0, 0, 0);
        break;
    }
    
    return next;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}