/**
 * Analytics Domain - Metric Entity
 * Core metric measurement entity with timestamps and dimensions
 */

import { MetricValue, MetricUnit, MetricType } from '../value-objects/MetricValue';
import { DimensionCollection, Dimension } from '../value-objects/Dimension';

export type MetricStatus = 'active' | 'archived' | 'deprecated';

export class Metric {
  private constructor(
    private readonly _id: number,
    private readonly _userId: number,
    private readonly _workflowId: number | null,
    private readonly _integrationId: number | null,
    private readonly _name: string,
    private readonly _value: MetricValue,
    private readonly _dimensions: DimensionCollection,
    private readonly _timestamp: Date,
    private readonly _status: MetricStatus = 'active',
    private readonly _metadata: Record<string, any> = {},
    private readonly _createdAt: Date = new Date()
  ) {
    this.validateMetric();
  }

  static create(
    id: number,
    userId: number,
    name: string,
    value: MetricValue,
    options: {
      workflowId?: number | null;
      integrationId?: number | null;
      dimensions?: Dimension[];
      timestamp?: Date;
      status?: MetricStatus;
      metadata?: Record<string, any>;
    } = {}
  ): Metric {
    return new Metric(
      id,
      userId,
      options.workflowId || null,
      options.integrationId || null,
      name,
      value,
      new DimensionCollection(options.dimensions || []),
      options.timestamp || new Date(),
      options.status || 'active',
      options.metadata || {},
      new Date()
    );
  }

  static workflowMetric(
    id: number,
    userId: number,
    workflowId: number,
    name: string,
    value: MetricValue,
    dimensions: Dimension[] = []
  ): Metric {
    const enrichedDimensions = [
      Dimension.user(userId),
      Dimension.workflow(workflowId),
      ...dimensions
    ];
    
    return new Metric(
      id,
      userId,
      workflowId,
      null,
      name,
      value,
      new DimensionCollection(enrichedDimensions),
      new Date(),
      'active',
      { source: 'workflow_execution' }
    );
  }

  static integrationMetric(
    id: number,
    userId: number,
    integrationId: number,
    name: string,
    value: MetricValue,
    dimensions: Dimension[] = []
  ): Metric {
    const enrichedDimensions = [
      Dimension.user(userId),
      Dimension.integration(integrationId),
      ...dimensions
    ];
    
    return new Metric(
      id,
      userId,
      null,
      integrationId,
      name,
      value,
      new DimensionCollection(enrichedDimensions),
      new Date(),
      'active',
      { source: 'integration_execution' }
    );
  }

  static systemMetric(
    id: number,
    userId: number,
    name: string,
    value: MetricValue,
    dimensions: Dimension[] = []
  ): Metric {
    const enrichedDimensions = [
      Dimension.user(userId),
      Dimension.category('system'),
      ...dimensions
    ];
    
    return new Metric(
      id,
      userId,
      null,
      null,
      name,
      value,
      new DimensionCollection(enrichedDimensions),
      new Date(),
      'active',
      { source: 'system_monitoring' }
    );
  }

  get id(): number {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get workflowId(): number | null {
    return this._workflowId;
  }

  get integrationId(): number | null {
    return this._integrationId;
  }

  get name(): string {
    return this._name;
  }

  get value(): MetricValue {
    return this._value;
  }

  get dimensions(): DimensionCollection {
    return this._dimensions;
  }

  get timestamp(): Date {
    return new Date(this._timestamp);
  }

  get status(): MetricStatus {
    return this._status;
  }

  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get isWorkflowMetric(): boolean {
    return this._workflowId !== null;
  }

  get isIntegrationMetric(): boolean {
    return this._integrationId !== null;
  }

  get isSystemMetric(): boolean {
    return this._workflowId === null && this._integrationId === null;
  }

  get age(): number {
    return Date.now() - this._timestamp.getTime();
  }

  get ageInHours(): number {
    return this.age / (1000 * 60 * 60);
  }

  get ageInDays(): number {
    return this.age / (1000 * 60 * 60 * 24);
  }

  hasTag(tag: string): boolean {
    return this._metadata.tags && Array.isArray(this._metadata.tags) && 
           this._metadata.tags.includes(tag);
  }

  hasDimension(name: string): boolean {
    return this._dimensions.has(name);
  }

  getDimension(name: string): Dimension | undefined {
    return this._dimensions.get(name);
  }

  getDimensionValue(name: string): string | undefined {
    const dimension = this._dimensions.get(name);
    return dimension ? dimension.value : undefined;
  }

  matchesFilters(filters: Record<string, string>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      const dimension = this._dimensions.get(key);
      if (!dimension || dimension.value !== value) {
        return false;
      }
    }
    return true;
  }

  isStale(maxAgeMs: number): boolean {
    return this.age > maxAgeMs;
  }

  archive(): Metric {
    return new Metric(
      this._id,
      this._userId,
      this._workflowId,
      this._integrationId,
      this._name,
      this._value,
      this._dimensions,
      this._timestamp,
      'archived',
      { ...this._metadata, archivedAt: new Date().toISOString() },
      this._createdAt
    );
  }

  deprecate(reason?: string): Metric {
    const metadata: Record<string, any> = { ...this._metadata, deprecatedAt: new Date().toISOString() };
    if (reason) {
      metadata.deprecationReason = reason;
    }

    return new Metric(
      this._id,
      this._userId,
      this._workflowId,
      this._integrationId,
      this._name,
      this._value,
      this._dimensions,
      this._timestamp,
      'deprecated',
      metadata,
      this._createdAt
    );
  }

  addTag(tag: string): Metric {
    const tags = this._metadata.tags || [];
    if (!tags.includes(tag)) {
      tags.push(tag);
    }

    return new Metric(
      this._id,
      this._userId,
      this._workflowId,
      this._integrationId,
      this._name,
      this._value,
      this._dimensions,
      this._timestamp,
      this._status,
      { ...this._metadata, tags },
      this._createdAt
    );
  }

  withMetadata(key: string, value: any): Metric {
    return new Metric(
      this._id,
      this._userId,
      this._workflowId,
      this._integrationId,
      this._name,
      this._value,
      this._dimensions,
      this._timestamp,
      this._status,
      { ...this._metadata, [key]: value },
      this._createdAt
    );
  }

  toJSON(): Record<string, any> {
    return {
      id: this._id,
      userId: this._userId,
      workflowId: this._workflowId,
      integrationId: this._integrationId,
      name: this._name,
      value: this._value.toJSON(),
      dimensions: this._dimensions.toJSON(),
      timestamp: this._timestamp.toISOString(),
      status: this._status,
      metadata: this._metadata,
      createdAt: this._createdAt.toISOString(),
      age: this.age,
      isWorkflowMetric: this.isWorkflowMetric,
      isIntegrationMetric: this.isIntegrationMetric,
      isSystemMetric: this.isSystemMetric
    };
  }

  equals(other: Metric): boolean {
    return this._id === other._id &&
           this._userId === other._userId &&
           this._name === other._name &&
           this._timestamp.getTime() === other._timestamp.getTime();
  }

  private validateMetric(): void {
    if (this._id <= 0) {
      throw new Error('Metric ID must be positive');
    }

    if (this._userId <= 0) {
      throw new Error('User ID must be positive');
    }

    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Metric name cannot be empty');
    }

    if (this._name.length > 100) {
      throw new Error('Metric name cannot exceed 100 characters');
    }

    if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(this._name)) {
      throw new Error('Metric name must start with a letter and contain only letters, numbers, dots, hyphens, and underscores');
    }

    if (this._timestamp > new Date()) {
      throw new Error('Metric timestamp cannot be in the future');
    }

    // Validate that metric has appropriate context
    if (this._workflowId !== null && this._workflowId <= 0) {
      throw new Error('Workflow ID must be positive when specified');
    }

    if (this._integrationId !== null && this._integrationId <= 0) {
      throw new Error('Integration ID must be positive when specified');
    }
  }
}