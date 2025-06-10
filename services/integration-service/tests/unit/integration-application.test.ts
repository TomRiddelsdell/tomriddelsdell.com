import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntegrationExecutionService } from '../../src/domains/integration/domain/services/IntegrationExecutionService';
import { DataTransformationService } from '../../src/domains/integration/domain/services/DataTransformationService';
import { IntegrationCommandHandler } from '../../src/domains/integration/application/handlers/IntegrationCommandHandler';
import { IntegrationQueryHandler } from '../../src/domains/integration/application/handlers/IntegrationQueryHandler';
import {
  CreateIntegrationCommand,
  ExecuteIntegrationCommand,
  TestIntegrationCommand,
  CreateDataMappingCommand,
  CreateSyncJobCommand
} from '../../src/domains/integration/application/commands/IntegrationCommands';
import {
  GetIntegrationsByUserQuery,
  GetIntegrationHealthQuery,
  GetIntegrationStatsQuery
} from '../../src/domains/integration/application/queries/IntegrationQueries';

describe('Integration Application Layer - Phase 3', () => {
  let executionService: IntegrationExecutionService;
  let transformationService: DataTransformationService;
  let commandHandler: IntegrationCommandHandler;
  let queryHandler: IntegrationQueryHandler;

  beforeEach(() => {
    executionService = new IntegrationExecutionService();
    transformationService = new DataTransformationService();
    commandHandler = new IntegrationCommandHandler(executionService, transformationService);
    queryHandler = new IntegrationQueryHandler(executionService);
  });

  describe('Command Handling', () => {
    it('should create integration with validation', async () => {
      const command = new CreateIntegrationCommand(
        1,
        'Test API Integration',
        'Integration for testing API connections',
        {
          type: 'api',
          endpoints: [{
            url: 'https://api.example.com',
            method: 'GET'
          } as any],
          auth: {
            type: 'api_key',
            credentials: { apiKey: 'test-key-123' }
          } as any,
          rateLimits: {
            requestsPerMinute: 60,
            requestsPerHour: 1000
          }
        },
        ['api', 'external']
      );

      const result = await commandHandler.handleCreateIntegration(command);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.integration.name).toBe('Test API Integration');
      expect(result.data.integration.status).toBe('draft');
      expect(result.data.integration.tags).toEqual(['api', 'external']);
    });

    it('should reject integration with invalid configuration', async () => {
      const command = new CreateIntegrationCommand(
        1,
        'Invalid Integration',
        'Integration with invalid config',
        {
          type: 'api',
          endpoints: [], // Empty endpoints should fail validation
          auth: {
            type: 'api_key',
            credentials: { apiKey: 'test-key' }
          } as any
        },
        []
      );

      const result = await commandHandler.handleCreateIntegration(command);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Integration has no configured endpoints');
    });

    it('should execute integration and return metrics', async () => {
      const command = new ExecuteIntegrationCommand(
        1,
        1,
        { testData: 'value' },
        { 'Custom-Header': 'test' },
        '192.168.1.1',
        'manual'
      );

      const result = await commandHandler.handleExecuteIntegration(command);

      expect(result.success).toBe(true);
      expect(result.data.executionId).toBeDefined();
      expect(result.data.duration).toBeGreaterThan(0);
      expect(result.data.metrics).toBeDefined();
      expect(result.data.metrics.networkTime).toBeGreaterThanOrEqual(0);
    });

    it('should test integration connection', async () => {
      const command = new TestIntegrationCommand(1, 1);

      const result = await commandHandler.handleTestIntegration(command);

      expect(result.success).toBe(true);
      expect(result.data.responseTime).toBeGreaterThan(0);
      expect(result.data.statusCode).toBe(200);
    });

    it('should create data mapping with schema validation', async () => {
      const sourceSchema = {
        getName: () => 'Source Schema',
        getVersion: () => '1.0',
        getFields: () => [
          { name: 'id', type: 'number', required: true },
          { name: 'name', type: 'string', required: true }
        ]
      } as any;

      const targetSchema = {
        getName: () => 'Target Schema',
        getVersion: () => '1.0',
        getFields: () => [
          { name: 'userId', type: 'number', required: true },
          { name: 'fullName', type: 'string', required: true }
        ]
      } as any;

      const command = new CreateDataMappingCommand(
        1,
        1,
        'User Data Mapping',
        'Maps user data between systems',
        sourceSchema,
        targetSchema
      );

      const result = await commandHandler.handleCreateDataMapping(command);

      expect(result.success).toBe(true);
      expect(result.data.mappingId).toBeDefined();
      expect(result.data.mapping.name).toBe('User Data Mapping');
    });

    it('should create sync job with schedule validation', async () => {
      const sourceSchema = { getName: () => 'Source' } as any;
      const targetSchema = { getName: () => 'Target' } as any;
      const schedule = {
        type: 'interval' as const,
        interval: 3600000, // 1 hour
        enabled: true
      };

      const command = new CreateSyncJobCommand(
        1,
        1,
        'Hourly Data Sync',
        'Syncs data every hour',
        'pull',
        sourceSchema,
        targetSchema,
        schedule,
        'source_wins',
        100
      );

      const result = await commandHandler.handleCreateSyncJob(command);

      expect(result.success).toBe(true);
      expect(result.data.jobId).toBeDefined();
      expect(result.data.syncJob.name).toBe('Hourly Data Sync');
      expect(result.data.syncJob.direction).toBe('pull');
    });
  });

  describe('Query Handling', () => {
    it('should get integrations by user with filtering', async () => {
      const query = new GetIntegrationsByUserQuery(
        1,
        'active',
        'api',
        ['automation'],
        10,
        0
      );

      const result = await queryHandler.handleGetIntegrationsByUser(query);

      expect(result.integrations).toBeDefined();
      expect(Array.isArray(result.integrations)).toBe(true);
      expect(result.totalCount).toBeGreaterThanOrEqual(0);

      // Verify filtering works
      if (result.integrations.length > 0) {
        result.integrations.forEach(integration => {
          expect(integration.getStatus()).toBe('active');
          expect(integration.getConfig().type).toBe('api');
        });
      }
    });

    it('should get integration health status', async () => {
      const query = new GetIntegrationHealthQuery(1, 1);

      const result = await queryHandler.handleGetIntegrationHealth(query);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(['healthy', 'warning', 'critical']).toContain(result.status);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should get integration statistics with trends', async () => {
      const query = new GetIntegrationStatsQuery(1, 'month');

      const result = await queryHandler.handleGetIntegrationStats(query);

      expect(result).toBeDefined();
      expect(result.totalIntegrations).toBeGreaterThanOrEqual(0);
      expect(result.activeIntegrations).toBeGreaterThanOrEqual(0);
      expect(result.totalExecutions).toBeGreaterThanOrEqual(0);
      expect(result.period).toBe('month');
      expect(result.trends).toBeDefined();
    });

    it('should search integrations with full-text search', async () => {
      const searchQuery = {
        userId: 1,
        searchTerm: 'API',
        filters: {
          status: ['active', 'paused'],
          type: ['api'],
          createdAfter: new Date('2024-01-01')
        },
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
        limit: 5,
        offset: 0
      };

      const result = await queryHandler.handleSearchIntegrations(searchQuery);

      expect(result.integrations).toBeDefined();
      expect(result.totalCount).toBeGreaterThanOrEqual(0);

      // Verify search and filtering
      if (result.integrations.length > 0) {
        result.integrations.forEach(integration => {
          const name = integration.getName().toLowerCase();
          const description = integration.getDescription().toLowerCase();
          const tags = integration.getTags();
          
          const containsSearchTerm = 
            name.includes('api') || 
            description.includes('api') ||
            tags.some(tag => tag.includes('api'));
          
          expect(containsSearchTerm).toBe(true);
        });
      }
    });

    it('should get upcoming sync jobs', async () => {
      const query = {
        userId: 1,
        hoursAhead: 24
      };

      const result = await queryHandler.handleGetUpcomingSyncJobs(query);

      expect(result.jobs).toBeDefined();
      expect(Array.isArray(result.jobs)).toBe(true);

      // Verify all jobs are within the time window
      const cutoffTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      result.jobs.forEach(item => {
        expect(item.nextRunAt).toBeDefined();
        expect(item.nextRunAt <= cutoffTime).toBe(true);
        expect(item.job).toBeDefined();
        expect(item.integration).toBeDefined();
      });
    });

    it('should get available integration types', async () => {
      const result = await queryHandler.handleGetAvailableIntegrationTypes();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach(type => {
        expect(type.type).toBeDefined();
        expect(type.name).toBeDefined();
        expect(type.description).toBeDefined();
        expect(Array.isArray(type.authTypes)).toBe(true);
        expect(Array.isArray(type.capabilities)).toBe(true);
      });
    });

    it('should get integration templates by category', async () => {
      const query = {
        type: 'api',
        category: 'crm'
      };

      const result = await queryHandler.handleGetIntegrationTemplates(query);

      expect(Array.isArray(result)).toBe(true);

      result.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.type).toBe('api');
        expect(template.category).toBe('crm');
        expect(template.config).toBeDefined();
      });
    });
  });

  describe('Data Transformation Service', () => {
    it('should transform data with field mappings', async () => {
      const mockMapping = {
        validateMapping: () => ({ isValid: true, errors: [], warnings: [] }),
        getSourceSchema: () => ({
          validateData: () => ({ isValid: true, errors: [] })
        }),
        transformData: (data: any) => ({
          userId: data.id,
          fullName: `${data.firstName} ${data.lastName}`,
          email: data.emailAddress
        })
      } as any;

      const context = {
        sourceData: {
          id: 123,
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john.doe@example.com'
        },
        targetSchema: {
          validateData: () => ({ isValid: true, errors: [] })
        } as any,
        userId: 1,
        executionId: 'exec_123'
      };

      const result = await transformationService.transformData(mockMapping, context);

      expect(result.success).toBe(true);
      expect(result.transformedData).toBeDefined();
      expect(result.transformedData.userId).toBe(123);
      expect(result.transformedData.fullName).toBe('John Doe');
      expect(result.statistics).toBeDefined();
    });

    it('should handle transformation errors gracefully', async () => {
      const mockMapping = {
        validateMapping: () => ({ isValid: false, errors: ['Invalid mapping'], warnings: [] })
      } as any;

      const context = {
        sourceData: { test: 'data' },
        targetSchema: {} as any,
        userId: 1,
        executionId: 'exec_123'
      };

      const result = await transformationService.transformData(mockMapping, context);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Invalid mapping');
    });

    it('should validate transformation configuration', () => {
      const validMapping = {
        id: 'map1',
        type: 'field' as const,
        sourceField: 'name',
        targetField: 'fullName',
        transformation: 'format' as const,
        transformationConfig: { format: 'uppercase' },
        required: true
      };

      const invalidMapping = {
        id: 'map2',
        type: 'field' as const,
        sourceField: 'email',
        targetField: 'emailAddress',
        transformation: 'lookup' as const,
        // Missing transformationConfig for lookup
        required: false
      };

      const validResult = transformationService.validateTransformationConfig(validMapping);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = transformationService.validateTransformationConfig(invalidMapping);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Execution Service', () => {
    it('should validate integration before execution', async () => {
      const mockIntegration = {
        isActive: () => true,
        canExecute: () => true,
        getConfig: () => ({
          endpoints: [{ url: 'https://api.example.com' }],
          auth: {
            isExpired: () => false,
            needsRefresh: () => false
          }
        }),
        recordExecution: vi.fn()
      } as any;

      const validation = await executionService.validateIntegration(mockIntegration);

      expect(validation.isValid).toBe(true);
      expect(validation.canExecute).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should prevent execution of invalid integration', async () => {
      const mockIntegration = {
        isActive: () => false,
        canExecute: () => false,
        getConfig: () => ({
          endpoints: [],
          auth: {
            isExpired: () => true,
            needsRefresh: () => false
          }
        })
      } as any;

      const validation = await executionService.validateIntegration(mockIntegration);

      expect(validation.isValid).toBe(false);
      expect(validation.canExecute).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Integration is not active');
      expect(validation.errors).toContain('Authentication credentials have expired');
    });

    it('should execute integration with comprehensive metrics', async () => {
      const mockIntegration = {
        isActive: () => true,
        canExecute: () => true,
        getConfig: () => ({
          type: 'api',
          endpoints: [{ url: 'https://api.example.com' }],
          auth: {
            isExpired: () => false,
            needsRefresh: () => false
          }
        }),
        recordExecution: vi.fn()
      } as any;

      const context = {
        integrationId: { getValue: () => 1 } as any,
        userId: 1,
        requestData: { test: 'data' },
        triggeredBy: 'manual' as const
      };

      const result = await executionService.executeIntegration(
        mockIntegration,
        context,
        [],
        undefined
      );

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.networkTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.transformationTime).toBeGreaterThanOrEqual(0);
      expect(mockIntegration.recordExecution).toHaveBeenCalledWith(true, expect.any(Number));
    });

    it('should get comprehensive integration health assessment', () => {
      const mockIntegration = {
        getHealthStatus: () => ({
          status: 'warning',
          issues: ['High response time', 'Credential expiring soon']
        }),
        getMetrics: () => ({
          totalRequests: 1000,
          successfulRequests: 850,
          averageResponseTime: 2500,
          lastExecutedAt: new Date(Date.now() - 86400000) // 1 day ago
        }),
        getConfig: () => ({
          auth: {
            isExpired: () => false,
            needsRefresh: () => true
          }
        })
      } as any;

      const health = executionService.getIntegrationHealth(mockIntegration);

      expect(health.status).toBe('warning');
      expect(health.score).toBeGreaterThan(0);
      expect(health.score).toBeLessThan(100);
      expect(health.issues.length).toBeGreaterThan(0);
      expect(health.recommendations.length).toBeGreaterThan(0);
      expect(health.recommendations).toContain('Schedule credential refresh soon');
    });

    it('should test integration connection with timeout handling', async () => {
      const mockIntegration = {
        isActive: () => true,
        canExecute: () => true,
        getConfig: () => ({
          endpoints: [{ url: 'https://api.example.com' }],
          auth: { isExpired: () => false }
        }),
        recordExecution: vi.fn()
      } as any;

      const result = await executionService.testIntegrationConnection(mockIntegration);

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(mockIntegration.recordExecution).toHaveBeenCalled();
    });
  });
});