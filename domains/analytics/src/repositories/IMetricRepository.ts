import { Metric, MetricId } from '../entities/Metric';
import { DimensionCollection } from '../value-objects/Dimension';
import { TimeRange } from '../value-objects/TimeRange';

export interface MetricQueryOptions {
  timeRange: TimeRange;
  dimensions?: DimensionCollection;
  metricNames?: string[];
  categories?: string[];
  sources?: string[];
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface MetricAggregation {
  metricName: string;
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
  median?: number;
  percentile95?: number;
}

export interface IMetricRepository {
  save(metric: Metric): Promise<void>;
  saveMany(metrics: Metric[]): Promise<void>;
  findById(id: MetricId): Promise<Metric | null>;
  findByQuery(options: MetricQueryOptions): Promise<Metric[]>;
  findRecentMetrics(metricName: string, minutes: number): Promise<Metric[]>;
  aggregate(options: MetricQueryOptions): Promise<MetricAggregation[]>;
  countByTimeRange(timeRange: TimeRange): Promise<number>;
  deleteOlderThan(date: Date): Promise<number>;
  getMetricNames(): Promise<string[]>;
  getUniqueValues(dimensionType: string): Promise<string[]>;
}