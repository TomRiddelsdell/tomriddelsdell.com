import { IStorage } from '../../server/storage';
import { IntegrationAdapter } from './infrastructure/adapters/IntegrationAdapter';
import { IntegrationExecutionService } from './domain/services/IntegrationExecutionService';
import { DataTransformationService } from './domain/services/DataTransformationService';
import { IntegrationCommandHandler } from './application/handlers/IntegrationCommandHandler';
import { IntegrationQueryHandler } from './application/handlers/IntegrationQueryHandler';

/**
 * Integration Module - Phase 3 DDD Implementation
 * Provides centralized access to integration domain functionality
 * while maintaining backward compatibility with existing system
 */
export class IntegrationModule {
  private static instance: IntegrationModule;
  private readonly adapter: IntegrationAdapter;
  private readonly executionService: IntegrationExecutionService;
  private readonly transformationService: DataTransformationService;
  private readonly commandHandler: IntegrationCommandHandler;
  private readonly queryHandler: IntegrationQueryHandler;

  private constructor(storage: IStorage) {
    this.executionService = new IntegrationExecutionService();
    this.transformationService = new DataTransformationService();
    this.commandHandler = new IntegrationCommandHandler(
      this.executionService,
      this.transformationService
    );
    this.queryHandler = new IntegrationQueryHandler(this.executionService);
    this.adapter = new IntegrationAdapter(storage);
  }

  static initialize(storage: IStorage): IntegrationModule {
    if (!IntegrationModule.instance) {
      IntegrationModule.instance = new IntegrationModule(storage);
    }
    return IntegrationModule.instance;
  }

  static getInstance(): IntegrationModule {
    if (!IntegrationModule.instance) {
      throw new Error('IntegrationModule must be initialized first');
    }
    return IntegrationModule.instance;
  }

  // Public API for integration management
  getAdapter(): IntegrationAdapter {
    return this.adapter;
  }

  getExecutionService(): IntegrationExecutionService {
    return this.executionService;
  }

  getTransformationService(): DataTransformationService {
    return this.transformationService;
  }

  getCommandHandler(): IntegrationCommandHandler {
    return this.commandHandler;
  }

  getQueryHandler(): IntegrationQueryHandler {
    return this.queryHandler;
  }

  // Convenience methods for common operations
  async createIntegration(integrationData: {
    userId: number;
    name: string;
    description: string;
    type: string;
    config: any;
    tags?: string[];
  }) {
    return this.adapter.createIntegrationWithValidation(integrationData);
  }

  async executeIntegration(
    integrationId: number,
    userId: number,
    requestData?: any,
    options?: {
      headers?: Record<string, string>;
      ipAddress?: string;
      triggeredBy?: 'manual' | 'webhook' | 'schedule' | 'workflow';
    }
  ) {
    return this.adapter.executeIntegrationWithMetrics(integrationId, userId, requestData, options);
  }

  async testIntegration(integrationId: number, userId: number) {
    return this.adapter.testIntegrationConnection(integrationId, userId);
  }

  async getIntegrations(userId: number, options?: {
    includeHealth?: boolean;
    includeMetrics?: boolean;
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.adapter.getIntegrationsWithAnalytics(userId, options);
  }

  async getDashboardStats(userId: number) {
    return this.adapter.getEnhancedDashboardStats(userId);
  }

  async transformData(sourceData: any, mappingConfig: any, userId: number) {
    return this.adapter.transformData(sourceData, mappingConfig, userId);
  }

  async getHealthSummary(userId: number) {
    return this.adapter.getIntegrationsHealthSummary(userId);
  }

  async logActivity(userId: number, activityData: {
    integrationId?: number;
    eventType: string;
    status: 'success' | 'failure' | 'warning';
    details: any;
    ipAddress?: string;
  }) {
    return this.adapter.logIntegrationActivity(userId, activityData);
  }

  // Backward compatibility methods
  async getConnectedApps(userId: number) {
    return this.adapter.getConnectedApps(userId);
  }

  async getAvailableApps() {
    return this.adapter.getAvailableApps();
  }

  async createConnectedApp(appData: any) {
    return this.adapter.createConnectedApp(appData);
  }

  async updateConnectedApp(id: number, appData: any) {
    return this.adapter.updateConnectedApp(id, appData);
  }

  async deleteConnectedApp(id: number) {
    return this.adapter.deleteConnectedApp(id);
  }
}