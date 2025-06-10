import { IntegrationId } from '../value-objects/IntegrationId';
import { ApiEndpoint } from '../value-objects/ApiEndpoint';
import { AuthCredentials } from '../value-objects/AuthCredentials';
import { DataSchema } from '../value-objects/DataSchema';

export type IntegrationStatus = 'draft' | 'active' | 'paused' | 'failed' | 'disconnected';
export type IntegrationType = 'api' | 'webhook' | 'database' | 'file' | 'email';

export interface IntegrationConfig {
  type: IntegrationType;
  endpoints: ApiEndpoint[];
  auth: AuthCredentials;
  schema?: DataSchema;
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  retryPolicy?: {
    maxAttempts: number;
    backoffMultiplier: number;
    maxDelay: number;
  };
  timeout?: number;
  webhookUrl?: string;
  customSettings?: Record<string, any>;
}

export interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastExecutedAt?: Date;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  uptime: number;
}

export class Integration {
  private constructor(
    private readonly id: IntegrationId,
    private readonly userId: number,
    private name: string,
    private description: string,
    private status: IntegrationStatus,
    private config: IntegrationConfig,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private metrics: IntegrationMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      uptime: 100
    },
    private tags: string[] = [],
    private isEnabled: boolean = true
  ) {}

  static create(
    id: IntegrationId,
    userId: number,
    name: string,
    description: string,
    config: IntegrationConfig
  ): Integration {
    const now = new Date();
    return new Integration(
      id,
      userId,
      name,
      description,
      'draft',
      config,
      now,
      now
    );
  }

  static restore(
    id: IntegrationId,
    userId: number,
    name: string,
    description: string,
    status: IntegrationStatus,
    config: IntegrationConfig,
    createdAt: Date,
    updatedAt: Date,
    metrics: IntegrationMetrics,
    tags: string[] = [],
    isEnabled: boolean = true
  ): Integration {
    return new Integration(
      id,
      userId,
      name,
      description,
      status,
      config,
      createdAt,
      updatedAt,
      metrics,
      tags,
      isEnabled
    );
  }

  getId(): IntegrationId {
    return this.id;
  }

  getUserId(): number {
    return this.userId;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getStatus(): IntegrationStatus {
    return this.status;
  }

  getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getMetrics(): IntegrationMetrics {
    return { ...this.metrics };
  }

  getTags(): string[] {
    return [...this.tags];
  }

  isActive(): boolean {
    return this.status === 'active' && this.isEnabled;
  }

  canExecute(): boolean {
    return this.isActive() && !this.config.auth.isExpired();
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Integration name cannot be empty');
    }
    this.name = name.trim();
    this.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.description = description || '';
    this.updatedAt = new Date();
  }

  updateConfiguration(config: IntegrationConfig): void {
    this.validateConfiguration(config);
    this.config = { ...config };
    this.updatedAt = new Date();
  }

  activate(): void {
    if (this.status === 'active') {
      return;
    }

    this.validateForActivation();
    this.status = 'active';
    this.updatedAt = new Date();
  }

  pause(): void {
    if (this.status !== 'active') {
      throw new Error('Only active integrations can be paused');
    }
    this.status = 'paused';
    this.updatedAt = new Date();
  }

  fail(reason?: string): void {
    this.status = 'failed';
    this.updatedAt = new Date();
    this.metrics.lastFailureAt = new Date();
  }

  disconnect(): void {
    this.status = 'disconnected';
    this.updatedAt = new Date();
  }

  enable(): void {
    this.isEnabled = true;
    this.updatedAt = new Date();
  }

  disable(): void {
    this.isEnabled = false;
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    if (!this.tags.includes(normalizedTag)) {
      this.tags.push(normalizedTag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    const index = this.tags.indexOf(normalizedTag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  recordExecution(success: boolean, responseTime: number, errorMessage?: string): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
      this.metrics.lastSuccessAt = new Date();
    } else {
      this.metrics.failedRequests++;
      this.metrics.lastFailureAt = new Date();
    }

    this.metrics.lastExecutedAt = new Date();
    
    // Update average response time
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalResponseTime / this.metrics.totalRequests;

    // Update uptime
    this.metrics.uptime = (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;

    this.updatedAt = new Date();
  }

  refreshCredentials(newCredentials: AuthCredentials): void {
    if (!this.config.auth.isRefreshable()) {
      throw new Error('Integration credentials are not refreshable');
    }
    
    this.config = {
      ...this.config,
      auth: newCredentials
    };
    this.updatedAt = new Date();
  }

  needsCredentialRefresh(): boolean {
    return this.config.auth.needsRefresh();
  }

  validateConfiguration(config: IntegrationConfig): void {
    if (!config.type) {
      throw new Error('Integration type is required');
    }

    if (!config.endpoints || config.endpoints.length === 0) {
      throw new Error('At least one endpoint is required');
    }

    if (!config.auth) {
      throw new Error('Authentication configuration is required');
    }

    // Validate rate limits
    if (config.rateLimits) {
      if (config.rateLimits.requestsPerMinute <= 0 || config.rateLimits.requestsPerHour <= 0) {
        throw new Error('Rate limits must be positive numbers');
      }
    }

    // Validate retry policy
    if (config.retryPolicy) {
      const { maxAttempts, backoffMultiplier, maxDelay } = config.retryPolicy;
      if (maxAttempts <= 0 || backoffMultiplier <= 0 || maxDelay <= 0) {
        throw new Error('Retry policy values must be positive numbers');
      }
    }
  }

  private validateForActivation(): void {
    this.validateConfiguration(this.config);

    if (this.config.auth.isExpired()) {
      throw new Error('Cannot activate integration with expired credentials');
    }

    if (!this.isEnabled) {
      throw new Error('Cannot activate disabled integration');
    }
  }

  getHealthStatus(): { status: string; issues: string[] } {
    const issues: string[] = [];
    let status = 'healthy';

    // Check if credentials are expired or expiring soon
    if (this.config.auth.isExpired()) {
      issues.push('Authentication credentials have expired');
      status = 'critical';
    } else if (this.config.auth.needsRefresh()) {
      issues.push('Authentication credentials need refresh');
      status = 'warning';
    }

    // Check failure rate
    if (this.metrics.totalRequests > 0) {
      const failureRate = (this.metrics.failedRequests / this.metrics.totalRequests) * 100;
      if (failureRate > 50) {
        issues.push(`High failure rate: ${failureRate.toFixed(1)}%`);
        status = 'critical';
      } else if (failureRate > 20) {
        issues.push(`Elevated failure rate: ${failureRate.toFixed(1)}%`);
        if (status === 'healthy') status = 'warning';
      }
    }

    // Check if integration hasn't been used recently
    if (this.metrics.lastExecutedAt) {
      const daysSinceLastExecution = (Date.now() - this.metrics.lastExecutedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastExecution > 30) {
        issues.push('Integration hasn\'t been used in over 30 days');
        if (status === 'healthy') status = 'warning';
      }
    }

    // Check status
    if (this.status === 'failed') {
      issues.push('Integration is in failed state');
      status = 'critical';
    } else if (this.status === 'disconnected') {
      issues.push('Integration is disconnected');
      status = 'critical';
    } else if (!this.isEnabled) {
      issues.push('Integration is disabled');
      if (status === 'healthy') status = 'warning';
    }

    return { status, issues };
  }

  clone(newId: IntegrationId, newName: string): Integration {
    const clonedConfig = {
      ...this.config,
      // Don't clone auth credentials for security
      auth: AuthCredentials.createCustom({})
    };

    return Integration.create(
      newId,
      this.userId,
      newName,
      `Copy of ${this.description}`,
      clonedConfig
    );
  }
}