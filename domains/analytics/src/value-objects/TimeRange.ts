import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';

export enum TimeRangeType {
  LAST_HOUR = 'last_hour',
  LAST_24_HOURS = 'last_24_hours',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  CUSTOM = 'custom'
}

export enum TimeGranularity {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

export class TimeRange {
  private constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly type: TimeRangeType
  ) {
    if (startDate >= endDate) {
      throw new DomainException('Start date must be before end date');
    }
  }

  static lastHour(): TimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 60 * 60 * 1000);
    return new TimeRange(start, end, TimeRangeType.LAST_HOUR);
  }

  static last24Hours(): TimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    return new TimeRange(start, end, TimeRangeType.LAST_24_HOURS);
  }

  static last7Days(): TimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    return new TimeRange(start, end, TimeRangeType.LAST_7_DAYS);
  }

  static last30Days(): TimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return new TimeRange(start, end, TimeRangeType.LAST_30_DAYS);
  }

  static thisMonth(): TimeRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return new TimeRange(start, end, TimeRangeType.THIS_MONTH);
  }

  static lastMonth(): TimeRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return new TimeRange(start, end, TimeRangeType.LAST_MONTH);
  }

  static lastYear(): TimeRange {
    const now = new Date();
    const start = new Date(now.getFullYear() - 1, 0, 1);
    const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    return new TimeRange(start, end, TimeRangeType.CUSTOM);
  }

  static create(startDate: Date, endDate: Date): TimeRange {
    return new TimeRange(startDate, endDate, TimeRangeType.CUSTOM);
  }

  get durationMs(): number {
    return this.endDate.getTime() - this.startDate.getTime();
  }

  get durationHours(): number {
    return this.durationMs / (1000 * 60 * 60);
  }

  get durationDays(): number {
    return this.durationMs / (1000 * 60 * 60 * 24);
  }

  getOptimalGranularity(): TimeGranularity {
    const hours = this.durationHours;
    
    if (hours <= 2) return TimeGranularity.MINUTE;
    if (hours <= 48) return TimeGranularity.HOUR;
    if (hours <= 168) return TimeGranularity.DAY; // 7 days
    if (hours <= 720) return TimeGranularity.WEEK; // 30 days
    return TimeGranularity.MONTH;
  }

  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  overlaps(other: TimeRange): boolean {
    return this.startDate < other.endDate && this.endDate > other.startDate;
  }

  equals(other: TimeRange): boolean {
    return this.startDate.getTime() === other.startDate.getTime() &&
           this.endDate.getTime() === other.endDate.getTime() &&
           this.type === other.type;
  }

  toString(): string {
    if (this.type !== TimeRangeType.CUSTOM) {
      return this.type.replace('_', ' ');
    }
    return `${this.startDate.toISOString().split('T')[0]} to ${this.endDate.toISOString().split('T')[0]}`;
  }
}