import { Integration } from '../../domain/entities/Integration';
import { DataMapping } from '../../domain/entities/DataMapping';
import { SyncJob } from '../../domain/entities/SyncJob';
import { IntegrationExecutionService } from '../../domain/services/IntegrationExecutionService';
import {
  GetIntegrationQuery,
  GetIntegrationsByUserQuery,
  GetIntegrationHealthQuery,
  GetIntegrationMetricsQuery,
  GetIntegrationExecutionHistoryQuery,
  SearchIntegrationsQuery,
  GetDataMappingQuery,
  GetDataMappingsByIntegrationQuery,
  ValidateDataMappingQuery,
  GetSyncJobQuery,
  GetSyncJobsByIntegrationQuery,
  GetSyncJobExecutionHistoryQuery,
  GetUpcomingSyncJobsQuery,
  GetIntegrationStatsQuery,
  GetAvailableIntegrationTypesQuery,
  GetIntegrationTemplatesQuery
} from '../queries/IntegrationQueries';

export class IntegrationQueryHandler {
  constructor(
    private readonly integrationExecutionService: IntegrationExecutionService
  ) {}

  async handleGetIntegration(query: GetIntegrationQuery): Promise<Integration | null> {
    try {
      // In production, retrieve from repository
      // For now, return mock data
      const mockIntegration = this.createMockIntegration(query.integrationId, query.userId);
      
      // Verify user authorization
      if (mockIntegration.getUserId() !== query.userId) {
        throw new Error('Unauthorized access to integration');
      }
      
      return mockIntegration;
    } catch (error) {
      console.error('Error retrieving integration:', error);
      return null;
    }
  }

  async handleGetIntegrationsByUser(query: GetIntegrationsByUserQuery): Promise<{
    integrations: Integration[];
    totalCount: number;
  }> {
    try {
      // In production, query repository with filters and pagination
      const mockIntegrations = [
        this.createMockIntegration(1, query.userId, 'Salesforce Integration', 'active'),
        this.createMockIntegration(2, query.userId, 'Gmail Integration', 'active'),
        this.createMockIntegration(3, query.userId, 'Slack Integration', 'paused')
      ];

      // Apply filters
      let filteredIntegrations = mockIntegrations;
      
      if (query.status) {
        filteredIntegrations = filteredIntegrations.filter(i => i.getStatus() === query.status);
      }
      
      if (query.type) {
        filteredIntegrations = filteredIntegrations.filter(i => i.getConfig().type === query.type);
      }
      
      if (query.tags && query.tags.length > 0) {
        filteredIntegrations = filteredIntegrations.filter(i => 
          query.tags!.some(tag => i.getTags().includes(tag))
        );
      }

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      const paginatedIntegrations = filteredIntegrations.slice(offset, offset + limit);

      return {
        integrations: paginatedIntegrations,
        totalCount: filteredIntegrations.length
      };
    } catch (error) {
      console.error('Error retrieving integrations:', error);
      return { integrations: [], totalCount: 0 };
    }
  }

  async handleGetIntegrationHealth(query: GetIntegrationHealthQuery): Promise<any> {
    try {
      const integration = await this.handleGetIntegration({
        integrationId: query.integrationId,
        userId: query.userId
      });

      if (!integration) {
        throw new Error('Integration not found');
      }

      return this.integrationExecutionService.getIntegrationHealth(integration);
    } catch (error) {
      console.error('Error retrieving integration health:', error);
      return {
        status: 'critical',
        score: 0,
        issues: ['Unable to retrieve health status'],
        recommendations: ['Check integration configuration']
      };
    }
  }

  async handleGetIntegrationMetrics(query: GetIntegrationMetricsQuery): Promise<any> {
    try {
      const integration = await this.handleGetIntegration({
        integrationId: query.integrationId,
        userId: query.userId
      });

      if (!integration) {
        throw new Error('Integration not found');
      }

      const metrics = integration.getMetrics();
      
      // In production, calculate time-series metrics based on date range
      return {
        ...metrics,
        period: {
          startDate: query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: query.endDate || new Date()
        },
        trends: {
          successRateChange: 2.5, // Percentage change
          responseTimeChange: -150, // Milliseconds change
          requestVolumeChange: 15 // Request count change
        }
      };
    } catch (error) {
      console.error('Error retrieving integration metrics:', error);
      return null;
    }
  }

  async handleGetIntegrationExecutionHistory(query: GetIntegrationExecutionHistoryQuery): Promise<{
    executions: any[];
    totalCount: number;
  }> {
    try {
      // In production, retrieve from execution history table
      const mockExecutions = [
        {
          id: 'exec_1',
          integrationId: query.integrationId,
          status: 'completed',
          startTime: new Date(Date.now() - 3600000),
          endTime: new Date(Date.now() - 3500000),
          duration: 100000,
          requestsCount: 5,
          responseData: { status: 'success' },
          triggeredBy: 'manual'
        },
        {
          id: 'exec_2',
          integrationId: query.integrationId,
          status: 'failed',
          startTime: new Date(Date.now() - 7200000),
          endTime: new Date(Date.now() - 7100000),
          duration: 100000,
          requestsCount: 2,
          errorMessage: 'Authentication failed',
          triggeredBy: 'schedule'
        }
      ];

      const offset = query.offset || 0;
      const limit = query.limit || 20;
      const paginatedExecutions = mockExecutions.slice(offset, offset + limit);

      return {
        executions: paginatedExecutions,
        totalCount: mockExecutions.length
      };
    } catch (error) {
      console.error('Error retrieving execution history:', error);
      return { executions: [], totalCount: 0 };
    }
  }

  async handleSearchIntegrations(query: SearchIntegrationsQuery): Promise<{
    integrations: Integration[];
    totalCount: number;
  }> {
    try {
      // In production, perform full-text search with filters
      const allIntegrations = await this.handleGetIntegrationsByUser({
        userId: query.userId,
        limit: 1000 // Get all for search
      });

      let results = allIntegrations.integrations;

      // Apply search term filter
      if (query.searchTerm) {
        const searchLower = query.searchTerm.toLowerCase();
        results = results.filter(integration =>
          integration.getName().toLowerCase().includes(searchLower) ||
          integration.getDescription().toLowerCase().includes(searchLower) ||
          integration.getTags().some(tag => tag.includes(searchLower))
        );
      }

      // Apply additional filters
      if (query.filters) {
        if (query.filters.status) {
          results = results.filter(i => query.filters!.status!.includes(i.getStatus()));
        }
        
        if (query.filters.type) {
          results = results.filter(i => query.filters!.type!.includes(i.getConfig().type));
        }
        
        if (query.filters.tags) {
          results = results.filter(i => 
            query.filters!.tags!.some(tag => i.getTags().includes(tag))
          );
        }
        
        if (query.filters.createdAfter) {
          results = results.filter(i => i.getCreatedAt() >= query.filters!.createdAfter!);
        }
        
        if (query.filters.createdBefore) {
          results = results.filter(i => i.getCreatedAt() <= query.filters!.createdBefore!);
        }
      }

      // Apply sorting
      if (query.sortBy) {
        results.sort((a, b) => {
          let comparison = 0;
          
          switch (query.sortBy) {
            case 'name':
              comparison = a.getName().localeCompare(b.getName());
              break;
            case 'created_at':
              comparison = a.getCreatedAt().getTime() - b.getCreatedAt().getTime();
              break;
            case 'last_run':
              const aLastRun = a.getMetrics().lastExecutedAt?.getTime() || 0;
              const bLastRun = b.getMetrics().lastExecutedAt?.getTime() || 0;
              comparison = aLastRun - bLastRun;
              break;
            case 'status':
              comparison = a.getStatus().localeCompare(b.getStatus());
              break;
          }
          
          return query.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      const paginatedResults = results.slice(offset, offset + limit);

      return {
        integrations: paginatedResults,
        totalCount: results.length
      };
    } catch (error) {
      console.error('Error searching integrations:', error);
      return { integrations: [], totalCount: 0 };
    }
  }

  async handleGetDataMapping(query: GetDataMappingQuery): Promise<DataMapping | null> {
    try {
      // In production, retrieve from repository
      return this.createMockDataMapping(query.mappingId, query.integrationId);
    } catch (error) {
      console.error('Error retrieving data mapping:', error);
      return null;
    }
  }

  async handleGetDataMappingsByIntegration(query: GetDataMappingsByIntegrationQuery): Promise<DataMapping[]> {
    try {
      // In production, retrieve from repository
      return [
        this.createMockDataMapping('mapping_1', query.integrationId),
        this.createMockDataMapping('mapping_2', query.integrationId)
      ];
    } catch (error) {
      console.error('Error retrieving data mappings:', error);
      return [];
    }
  }

  async handleValidateDataMapping(query: ValidateDataMappingQuery): Promise<any> {
    try {
      const mapping = await this.handleGetDataMapping({
        mappingId: query.mappingId,
        integrationId: query.integrationId,
        userId: query.userId
      });

      if (!mapping) {
        throw new Error('Data mapping not found');
      }

      return mapping.validateMapping();
    } catch (error) {
      console.error('Error validating data mapping:', error);
      return {
        isValid: false,
        errors: ['Unable to validate mapping'],
        warnings: []
      };
    }
  }

  async handleGetSyncJob(query: GetSyncJobQuery): Promise<SyncJob | null> {
    try {
      // In production, retrieve from repository
      return this.createMockSyncJob(query.jobId, query.integrationId);
    } catch (error) {
      console.error('Error retrieving sync job:', error);
      return null;
    }
  }

  async handleGetSyncJobsByIntegration(query: GetSyncJobsByIntegrationQuery): Promise<SyncJob[]> {
    try {
      // In production, retrieve from repository with status filter
      const mockJobs = [
        this.createMockSyncJob('job_1', query.integrationId, 'active'),
        this.createMockSyncJob('job_2', query.integrationId, 'pending')
      ];

      if (query.status) {
        return mockJobs.filter(job => job.getStatus() === query.status);
      }

      return mockJobs;
    } catch (error) {
      console.error('Error retrieving sync jobs:', error);
      return [];
    }
  }

  async handleGetUpcomingSyncJobs(query: GetUpcomingSyncJobsQuery): Promise<{
    jobs: Array<{ job: SyncJob; nextRunAt: Date; integration: Integration }>;
  }> {
    try {
      const hoursAhead = query.hoursAhead || 24;
      const cutoffTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);

      // In production, query across all user's integrations
      const mockUpcoming = [
        {
          job: this.createMockSyncJob('job_1', 1),
          nextRunAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          integration: this.createMockIntegration(1, query.userId)
        },
        {
          job: this.createMockSyncJob('job_2', 2),
          nextRunAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
          integration: this.createMockIntegration(2, query.userId)
        }
      ];

      return {
        jobs: mockUpcoming.filter(item => item.nextRunAt <= cutoffTime)
      };
    } catch (error) {
      console.error('Error retrieving upcoming sync jobs:', error);
      return { jobs: [] };
    }
  }

  async handleGetIntegrationStats(query: GetIntegrationStatsQuery): Promise<any> {
    try {
      // In production, aggregate stats from all user integrations
      return {
        totalIntegrations: 5,
        activeIntegrations: 3,
        pausedIntegrations: 1,
        failedIntegrations: 1,
        totalExecutions: 1250,
        successfulExecutions: 1100,
        failedExecutions: 150,
        averageResponseTime: 750,
        dataTransferred: '2.5 GB',
        period: query.period || 'month',
        trends: {
          executionGrowth: 15.2,
          successRateChange: 2.1,
          performanceChange: -5.3
        }
      };
    } catch (error) {
      console.error('Error retrieving integration stats:', error);
      return null;
    }
  }

  async handleGetAvailableIntegrationTypes(): Promise<any[]> {
    try {
      return [
        {
          type: 'api',
          name: 'REST API',
          description: 'Connect to REST APIs',
          authTypes: ['api_key', 'oauth2', 'basic', 'bearer'],
          capabilities: ['read', 'write', 'webhook']
        },
        {
          type: 'database',
          name: 'Database',
          description: 'Connect to databases',
          authTypes: ['basic', 'custom'],
          capabilities: ['read', 'write', 'sync']
        },
        {
          type: 'file',
          name: 'File System',
          description: 'Process files',
          authTypes: ['custom'],
          capabilities: ['read', 'write', 'watch']
        },
        {
          type: 'email',
          name: 'Email',
          description: 'Email integration',
          authTypes: ['oauth2', 'basic'],
          capabilities: ['read', 'send', 'webhook']
        }
      ];
    } catch (error) {
      console.error('Error retrieving integration types:', error);
      return [];
    }
  }

  async handleGetIntegrationTemplates(query: GetIntegrationTemplatesQuery): Promise<any[]> {
    try {
      const templates = [
        {
          id: 'salesforce_contacts',
          name: 'Salesforce Contacts Sync',
          type: 'api',
          category: 'crm',
          description: 'Sync contacts between Salesforce and your application',
          config: {
            type: 'api',
            endpoints: [],
            auth: { type: 'oauth2' }
          }
        },
        {
          id: 'gmail_automation',
          name: 'Gmail Email Automation',
          type: 'email',
          category: 'communication',
          description: 'Automate email processing with Gmail',
          config: {
            type: 'email',
            endpoints: [],
            auth: { type: 'oauth2' }
          }
        }
      ];

      let filtered = templates;

      if (query.type) {
        filtered = filtered.filter(t => t.type === query.type);
      }

      if (query.category) {
        filtered = filtered.filter(t => t.category === query.category);
      }

      return filtered;
    } catch (error) {
      console.error('Error retrieving integration templates:', error);
      return [];
    }
  }

  private createMockIntegration(id: number, userId: number, name?: string, status?: string): Integration {
    const integrationId = { getValue: () => id } as any;
    
    return Integration.restore(
      integrationId,
      userId,
      name || `Integration ${id}`,
      `Description for integration ${id}`,
      status as any || 'active',
      {
        type: 'api',
        endpoints: [],
        auth: { type: 'api_key', credentials: { apiKey: 'test' } }
      } as any,
      new Date(Date.now() - 86400000),
      new Date(),
      {
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        averageResponseTime: 250,
        uptime: 95,
        lastExecutedAt: new Date(Date.now() - 3600000)
      },
      ['automation', 'api'],
      true
    );
  }

  private createMockDataMapping(id: string, integrationId: number): DataMapping {
    const sourceSchema = { getName: () => 'Source', getFields: () => [] } as any;
    const targetSchema = { getName: () => 'Target', getFields: () => [] } as any;
    
    return DataMapping.restore(
      id,
      integrationId.toString(),
      `Mapping ${id}`,
      `Description for mapping ${id}`,
      sourceSchema,
      targetSchema,
      [],
      new Date(Date.now() - 86400000),
      new Date()
    );
  }

  private createMockSyncJob(id: string, integrationId: number, status?: string): SyncJob {
    const integrationIdObj = { getValue: () => integrationId } as any;
    const sourceSchema = { getName: () => 'Source' } as any;
    const targetSchema = { getName: () => 'Target' } as any;
    const schedule = { type: 'interval', interval: 3600000, enabled: true } as any;
    
    return SyncJob.restore(
      id,
      integrationIdObj,
      `Sync Job ${id}`,
      `Description for sync job ${id}`,
      'pull',
      sourceSchema,
      targetSchema,
      schedule,
      status as any || 'pending',
      new Date(Date.now() - 86400000),
      new Date()
    );
  }
}