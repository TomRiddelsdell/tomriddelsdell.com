import { IStorage } from '../../../../server/storage';
import { Integration } from '../../domain/entities/Integration';
import { IntegrationExecutionService } from '../../domain/services/IntegrationExecutionService';
import { DataTransformationService } from '../../domain/services/DataTransformationService';
import { IntegrationCommandHandler } from '../../application/handlers/IntegrationCommandHandler';
import { IntegrationQueryHandler } from '../../application/handlers/IntegrationQueryHandler';
import {
  CreateIntegrationCommand,
  UpdateIntegrationCommand,
  ExecuteIntegrationCommand,
  TestIntegrationCommand
} from '../../application/commands/IntegrationCommands';
import {
  GetIntegrationsByUserQuery,
  GetIntegrationHealthQuery,
  GetIntegrationStatsQuery
} from '../../application/queries/IntegrationQueries';

/**
 * Adapter layer that maintains backward compatibility with existing storage interface
 * while providing access to the new Integration domain functionality
 */
export class IntegrationAdapter {
  private readonly commandHandler: IntegrationCommandHandler;
  private readonly queryHandler: IntegrationQueryHandler;
  private readonly executionService: IntegrationExecutionService;
  private readonly transformationService: DataTransformationService;

  constructor(private readonly storage: IStorage) {
    this.executionService = new IntegrationExecutionService();
    this.transformationService = new DataTransformationService();
    this.commandHandler = new IntegrationCommandHandler(
      this.executionService,
      this.transformationService
    );
    this.queryHandler = new IntegrationQueryHandler(this.executionService);
  }

  // Enhanced integration management with domain logic
  async createIntegrationWithValidation(integrationData: {
    userId: number;
    name: string;
    description: string;
    type: string;
    config: any;
    tags?: string[];
  }): Promise<{ success: boolean; integration?: any; errors?: string[] }> {
    try {
      const command = new CreateIntegrationCommand(
        integrationData.userId,
        integrationData.name,
        integrationData.description,
        {
          type: integrationData.type as any,
          endpoints: integrationData.config.endpoints || [],
          auth: integrationData.config.auth,
          schema: integrationData.config.schema,
          rateLimits: integrationData.config.rateLimits,
          retryPolicy: integrationData.config.retryPolicy,
          timeout: integrationData.config.timeout
        },
        integrationData.tags || []
      );

      const result = await this.commandHandler.handleCreateIntegration(command);
      
      if (result.success) {
        // Also create in legacy storage for backward compatibility
        const connectedApp = await this.storage.createConnectedApp({
          userId: integrationData.userId,
          name: integrationData.name,
          description: integrationData.description,
          icon: integrationData.type,
          status: 'connected',
          config: integrationData.config
        });

        return {
          success: true,
          integration: {
            ...result.data.integration,
            legacyAppId: connectedApp.id
          }
        };
      }

      return {
        success: false,
        errors: [result.errorMessage || 'Failed to create integration']
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async executeIntegrationWithMetrics(
    integrationId: number,
    userId: number,
    requestData?: any,
    options?: {
      headers?: Record<string, string>;
      ipAddress?: string;
      triggeredBy?: 'manual' | 'webhook' | 'schedule' | 'workflow';
    }
  ): Promise<{
    success: boolean;
    executionId?: string;
    responseData?: any;
    transformedData?: any;
    metrics?: any;
    error?: string;
  }> {
    try {
      const command = new ExecuteIntegrationCommand(
        integrationId,
        userId,
        requestData,
        options?.headers,
        options?.ipAddress,
        options?.triggeredBy || 'manual'
      );

      const result = await this.commandHandler.handleExecuteIntegration(command);

      if (result.success) {
        // Log execution in legacy activity logs
        await this.storage.createActivityLog({
          userId,
          workflowId: null,
          workflowName: 'Integration Execution',
          eventType: 'integration_run',
          status: 'success',
          details: {
            integrationId,
            executionId: result.data.executionId,
            duration: result.data.duration,
            requestsCount: result.data.requestsCount,
            metrics: result.data.metrics
          },
          ipAddress: options?.ipAddress
        });
      } else {
        await this.storage.createActivityLog({
          userId,
          workflowId: null,
          workflowName: 'Integration Execution',
          eventType: 'integration_run',
          status: 'failure',
          details: {
            integrationId,
            error: result.errorMessage
          },
          ipAddress: options?.ipAddress
        });
      }

      return {
        success: result.success,
        executionId: result.data?.executionId,
        responseData: result.data?.responseData,
        transformedData: result.data?.transformedData,
        metrics: result.data?.metrics,
        error: result.errorMessage
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed'
      };
    }
  }

  async testIntegrationConnection(
    integrationId: number,
    userId: number
  ): Promise<{
    success: boolean;
    responseTime?: number;
    statusCode?: number;
    error?: string;
    healthStatus?: any;
  }> {
    try {
      const command = new TestIntegrationCommand(integrationId, userId);
      const result = await this.commandHandler.handleTestIntegration(command);

      if (result.success) {
        // Get comprehensive health status
        const healthQuery = new GetIntegrationHealthQuery(integrationId, userId);
        const health = await this.queryHandler.handleGetIntegrationHealth(healthQuery);

        return {
          success: true,
          responseTime: result.data.responseTime,
          statusCode: result.data.statusCode,
          healthStatus: health
        };
      }

      return {
        success: false,
        error: result.errorMessage,
        responseTime: result.data?.responseTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  async getIntegrationsWithAnalytics(userId: number, options?: {
    includeHealth?: boolean;
    includeMetrics?: boolean;
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    integrations: any[];
    totalCount: number;
    analytics?: any;
  }> {
    try {
      const query = new GetIntegrationsByUserQuery(
        userId,
        options?.status,
        options?.type,
        undefined,
        options?.limit,
        options?.offset
      );

      const result = await this.queryHandler.handleGetIntegrationsByUser(query);
      const integrations = [];

      for (const integration of result.integrations) {
        const integrationData: any = {
          id: integration.getId().getValue(),
          name: integration.getName(),
          description: integration.getDescription(),
          status: integration.getStatus(),
          type: integration.getConfig().type,
          createdAt: integration.getCreatedAt(),
          updatedAt: integration.getUpdatedAt(),
          tags: integration.getTags(),
          isActive: integration.isActive()
        };

        if (options?.includeHealth) {
          const health = await this.queryHandler.handleGetIntegrationHealth({
            integrationId: integration.getId().getValue(),
            userId
          });
          integrationData.health = health;
        }

        if (options?.includeMetrics) {
          integrationData.metrics = integration.getMetrics();
        }

        integrations.push(integrationData);
      }

      let analytics;
      if (options?.includeMetrics) {
        const statsQuery = new GetIntegrationStatsQuery(userId);
        analytics = await this.queryHandler.handleGetIntegrationStats(statsQuery);
      }

      return {
        integrations,
        totalCount: result.totalCount,
        analytics
      };
    } catch (error) {
      console.error('Error getting integrations with analytics:', error);
      return {
        integrations: [],
        totalCount: 0
      };
    }
  }

  // Enhanced dashboard statistics that include integration metrics
  async getEnhancedDashboardStats(userId: number): Promise<any> {
    try {
      const legacyStats = await this.storage.getDashboardStats(userId);
      const integrationStats = await this.queryHandler.handleGetIntegrationStats({
        userId,
        period: 'month'
      });

      return {
        ...legacyStats,
        integrations: {
          total: integrationStats.totalIntegrations,
          active: integrationStats.activeIntegrations,
          paused: integrationStats.pausedIntegrations,
          failed: integrationStats.failedIntegrations,
          totalExecutions: integrationStats.totalExecutions,
          successRate: (integrationStats.successfulExecutions / integrationStats.totalExecutions) * 100,
          averageResponseTime: integrationStats.averageResponseTime,
          dataTransferred: integrationStats.dataTransferred
        },
        trends: integrationStats.trends
      };
    } catch (error) {
      console.error('Error getting enhanced dashboard stats:', error);
      return this.storage.getDashboardStats(userId);
    }
  }

  // Transform data using domain services
  async transformData(
    sourceData: any,
    mappingConfig: any,
    userId: number
  ): Promise<{
    success: boolean;
    transformedData?: any;
    errors?: string[];
    warnings?: string[];
    statistics?: any;
  }> {
    try {
      // Create a mock data mapping for transformation
      const mockSchema = {
        getName: () => 'Source Schema',
        getFields: () => [],
        validateData: (data: any) => ({ isValid: true, errors: [] })
      } as any;

      const mapping = {
        validateMapping: () => ({ isValid: true, errors: [], warnings: [] }),
        transformData: (data: any) => {
          // Simple transformation based on mapping config
          if (mappingConfig.fieldMappings) {
            const result: any = {};
            mappingConfig.fieldMappings.forEach((fm: any) => {
              if (sourceData[fm.sourceField] !== undefined) {
                result[fm.targetField] = sourceData[fm.sourceField];
              }
            });
            return result;
          }
          return sourceData;
        }
      } as any;

      const context = {
        sourceData,
        targetSchema: mockSchema,
        userId,
        executionId: `transform_${Date.now()}`,
        customFunctions: mappingConfig.customFunctions,
        lookupTables: mappingConfig.lookupTables
      };

      const result = await this.transformationService.transformData(mapping, context);

      return {
        success: result.success,
        transformedData: result.transformedData,
        errors: result.errors.map(e => e.message),
        warnings: result.warnings,
        statistics: result.statistics
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Transformation failed']
      };
    }
  }

  // Backward compatibility methods that delegate to existing storage
  async getConnectedApps(userId: number) {
    return this.storage.getConnectedAppsByUserId(userId);
  }

  async getAvailableApps() {
    return this.storage.getAvailableApps();
  }

  async createConnectedApp(appData: any) {
    return this.storage.createConnectedApp(appData);
  }

  async updateConnectedApp(id: number, appData: any) {
    return this.storage.updateConnectedApp(id, appData);
  }

  async deleteConnectedApp(id: number) {
    return this.storage.deleteConnectedApp(id);
  }

  // Enhanced activity logging with integration context
  async logIntegrationActivity(
    userId: number,
    activityData: {
      integrationId?: number;
      eventType: string;
      status: 'success' | 'failure' | 'warning';
      details: any;
      ipAddress?: string;
    }
  ) {
    return this.storage.createActivityLog({
      userId,
      workflowId: null,
      workflowName: activityData.integrationId ? `Integration ${activityData.integrationId}` : 'Integration System',
      eventType: activityData.eventType,
      status: activityData.status,
      details: activityData.details,
      ipAddress: activityData.ipAddress
    });
  }

  // Health monitoring for all user integrations
  async getIntegrationsHealthSummary(userId: number): Promise<{
    healthy: number;
    warning: number;
    critical: number;
    totalIssues: number;
    recommendations: string[];
  }> {
    try {
      const integrationsResult = await this.queryHandler.handleGetIntegrationsByUser({
        userId,
        limit: 100
      });

      let healthy = 0;
      let warning = 0;
      let critical = 0;
      const allRecommendations: string[] = [];

      for (const integration of integrationsResult.integrations) {
        const health = await this.queryHandler.handleGetIntegrationHealth({
          integrationId: integration.getId().getValue(),
          userId
        });

        switch (health.status) {
          case 'healthy':
            healthy++;
            break;
          case 'warning':
            warning++;
            break;
          case 'critical':
            critical++;
            break;
        }

        allRecommendations.push(...health.recommendations);
      }

      // Remove duplicate recommendations
      const uniqueRecommendations = [...new Set(allRecommendations)];

      return {
        healthy,
        warning,
        critical,
        totalIssues: warning + critical,
        recommendations: uniqueRecommendations.slice(0, 5) // Top 5 recommendations
      };
    } catch (error) {
      console.error('Error getting integrations health summary:', error);
      return {
        healthy: 0,
        warning: 0,
        critical: 0,
        totalIssues: 0,
        recommendations: []
      };
    }
  }
}