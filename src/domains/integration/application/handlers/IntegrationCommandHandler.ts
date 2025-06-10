import { Integration } from '../../domain/entities/Integration';
import { DataMapping } from '../../domain/entities/DataMapping';
import { SyncJob } from '../../domain/entities/SyncJob';
import { IntegrationId } from '../../domain/value-objects/IntegrationId';
import { IntegrationExecutionService } from '../../domain/services/IntegrationExecutionService';
import { DataTransformationService } from '../../domain/services/DataTransformationService';
import {
  CreateIntegrationCommand,
  UpdateIntegrationCommand,
  ActivateIntegrationCommand,
  DeactivateIntegrationCommand,
  DeleteIntegrationCommand,
  ExecuteIntegrationCommand,
  TestIntegrationCommand,
  RefreshCredentialsCommand,
  CreateDataMappingCommand,
  UpdateDataMappingCommand,
  DeleteDataMappingCommand,
  CreateSyncJobCommand,
  UpdateSyncJobCommand,
  ExecuteSyncJobCommand,
  DeleteSyncJobCommand,
  CloneIntegrationCommand
} from '../commands/IntegrationCommands';

export interface CommandResult {
  success: boolean;
  data?: any;
  errorMessage?: string;
  warnings?: string[];
}

export class IntegrationCommandHandler {
  constructor(
    private readonly integrationExecutionService: IntegrationExecutionService,
    private readonly dataTransformationService: DataTransformationService
  ) {}

  async handleCreateIntegration(command: CreateIntegrationCommand): Promise<CommandResult> {
    try {
      const integrationId = IntegrationId.fromNumber(Date.now()); // In production, use proper ID generation
      
      const integration = Integration.create(
        integrationId,
        command.userId,
        command.name,
        command.description,
        command.config
      );

      // Add tags if provided
      command.tags.forEach(tag => integration.addTag(tag));

      // Validate integration configuration
      const validation = await this.integrationExecutionService.validateIntegration(integration);
      if (!validation.canExecute) {
        return {
          success: false,
          errorMessage: `Integration validation failed: ${validation.errors.join(', ')}`,
          warnings: validation.warnings
        };
      }

      return {
        success: true,
        data: {
          integrationId: integration.getId().getValue(),
          integration: this.serializeIntegration(integration)
        },
        warnings: validation.warnings
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to create integration'
      };
    }
  }

  async handleUpdateIntegration(command: UpdateIntegrationCommand): Promise<CommandResult> {
    try {
      // In production, retrieve integration from repository
      const integrationId = IntegrationId.fromNumber(command.integrationId);
      
      // Mock integration for now - in production, get from repository
      const integration = Integration.create(
        integrationId,
        command.userId,
        'Existing Integration',
        'Description',
        { type: 'api', endpoints: [], auth: { type: 'api_key', credentials: { apiKey: 'test' } } } as any
      );

      // Apply updates
      if (command.name) {
        integration.updateName(command.name);
      }

      if (command.description !== undefined) {
        integration.updateDescription(command.description);
      }

      if (command.config) {
        integration.updateConfiguration(command.config);
      }

      if (command.tags) {
        // Clear existing tags and add new ones
        const currentTags = integration.getTags();
        currentTags.forEach(tag => integration.removeTag(tag));
        command.tags.forEach(tag => integration.addTag(tag));
      }

      // Validate updated configuration
      const validation = await this.integrationExecutionService.validateIntegration(integration);

      return {
        success: true,
        data: {
          integration: this.serializeIntegration(integration)
        },
        warnings: validation.warnings
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to update integration'
      };
    }
  }

  async handleActivateIntegration(command: ActivateIntegrationCommand): Promise<CommandResult> {
    try {
      const integrationId = IntegrationId.fromNumber(command.integrationId);
      
      // Mock integration - in production, get from repository
      const integration = Integration.create(
        integrationId,
        command.userId,
        'Test Integration',
        'Description',
        { 
          type: 'api', 
          endpoints: [{ url: 'https://api.example.com', method: 'GET' } as any], 
          auth: { type: 'api_key', credentials: { apiKey: 'test' } } as any 
        }
      );

      // Validate before activation
      const validation = await this.integrationExecutionService.validateIntegration(integration);
      if (!validation.canExecute) {
        return {
          success: false,
          errorMessage: `Cannot activate integration: ${validation.errors.join(', ')}`
        };
      }

      integration.activate();

      return {
        success: true,
        data: {
          integration: this.serializeIntegration(integration)
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to activate integration'
      };
    }
  }

  async handleDeactivateIntegration(command: DeactivateIntegrationCommand): Promise<CommandResult> {
    try {
      const integrationId = IntegrationId.fromNumber(command.integrationId);
      
      // Mock integration - in production, get from repository
      const integration = Integration.create(
        integrationId,
        command.userId,
        'Test Integration',
        'Description',
        { type: 'api', endpoints: [], auth: { type: 'api_key', credentials: { apiKey: 'test' } } as any }
      );

      integration.pause();

      return {
        success: true,
        data: {
          integration: this.serializeIntegration(integration)
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to deactivate integration'
      };
    }
  }

  async handleDeleteIntegration(command: DeleteIntegrationCommand): Promise<CommandResult> {
    try {
      const integrationId = IntegrationId.fromNumber(command.integrationId);
      
      // In production, check if integration has active sync jobs or dependencies
      // For now, just return success
      
      return {
        success: true,
        data: {
          deletedIntegrationId: command.integrationId
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to delete integration'
      };
    }
  }

  async handleExecuteIntegration(command: ExecuteIntegrationCommand): Promise<CommandResult> {
    try {
      const integrationId = IntegrationId.fromNumber(command.integrationId);
      
      // Mock integration and connections - in production, get from repositories
      const integration = Integration.create(
        integrationId,
        command.userId,
        'Test Integration',
        'Description',
        { 
          type: 'api', 
          endpoints: [{ url: 'https://api.example.com', method: 'GET' } as any], 
          auth: { type: 'api_key', credentials: { apiKey: 'test' } } as any 
        }
      );

      integration.activate();

      const executionContext = {
        integrationId,
        userId: command.userId,
        requestData: command.requestData,
        headers: command.headers,
        ipAddress: command.ipAddress,
        triggeredBy: command.triggeredBy
      };

      const result = await this.integrationExecutionService.executeIntegration(
        integration,
        executionContext,
        [], // Mock API connections
        undefined // Mock data mapping
      );

      return {
        success: result.success,
        data: {
          executionId: result.executionId,
          duration: result.duration,
          requestsCount: result.requestsCount,
          responseData: result.responseData,
          transformedData: result.transformedData,
          metrics: result.metrics
        },
        errorMessage: result.errors.length > 0 ? result.errors.map(e => e.message).join('; ') : undefined
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to execute integration'
      };
    }
  }

  async handleTestIntegration(command: TestIntegrationCommand): Promise<CommandResult> {
    try {
      const integrationId = IntegrationId.fromNumber(command.integrationId);
      
      // Mock integration - in production, get from repository
      const integration = Integration.create(
        integrationId,
        command.userId,
        'Test Integration',
        'Description',
        { 
          type: 'api', 
          endpoints: [{ url: 'https://api.example.com', method: 'GET' } as any], 
          auth: { type: 'api_key', credentials: { apiKey: 'test' } } as any 
        }
      );

      const testResult = await this.integrationExecutionService.testIntegrationConnection(integration);

      return {
        success: testResult.success,
        data: {
          responseTime: testResult.responseTime,
          statusCode: testResult.statusCode,
          error: testResult.error
        },
        errorMessage: testResult.error
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to test integration'
      };
    }
  }

  async handleRefreshCredentials(command: RefreshCredentialsCommand): Promise<CommandResult> {
    try {
      const integrationId = IntegrationId.fromNumber(command.integrationId);
      
      // In production, get integration from repository and refresh actual credentials
      // For now, simulate successful refresh
      
      return {
        success: true,
        data: {
          message: 'Credentials refreshed successfully',
          refreshedAt: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to refresh credentials'
      };
    }
  }

  async handleCreateDataMapping(command: CreateDataMappingCommand): Promise<CommandResult> {
    try {
      const mappingId = `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const dataMapping = DataMapping.create(
        mappingId,
        command.integrationId.toString(),
        command.name,
        command.description,
        command.sourceSchema,
        command.targetSchema
      );

      return {
        success: true,
        data: {
          mappingId: dataMapping.getId(),
          mapping: this.serializeDataMapping(dataMapping)
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to create data mapping'
      };
    }
  }

  async handleUpdateDataMapping(command: UpdateDataMappingCommand): Promise<CommandResult> {
    try {
      // In production, get mapping from repository
      // For now, simulate successful update
      
      return {
        success: true,
        data: {
          mappingId: command.mappingId,
          updatedAt: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to update data mapping'
      };
    }
  }

  async handleDeleteDataMapping(command: DeleteDataMappingCommand): Promise<CommandResult> {
    try {
      // In production, delete from repository
      
      return {
        success: true,
        data: {
          deletedMappingId: command.mappingId
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to delete data mapping'
      };
    }
  }

  async handleCreateSyncJob(command: CreateSyncJobCommand): Promise<CommandResult> {
    try {
      const jobId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const integrationId = IntegrationId.fromNumber(command.integrationId);
      
      const syncJob = SyncJob.create(
        jobId,
        integrationId,
        command.name,
        command.description,
        command.direction,
        command.sourceSchema,
        command.targetSchema,
        command.schedule
      );

      syncJob.updateConflictResolution(command.conflictResolution);
      syncJob.updateBatchSize(command.batchSize);

      return {
        success: true,
        data: {
          jobId: syncJob.getId(),
          syncJob: this.serializeSyncJob(syncJob)
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to create sync job'
      };
    }
  }

  async handleUpdateSyncJob(command: UpdateSyncJobCommand): Promise<CommandResult> {
    try {
      // In production, get sync job from repository and apply updates
      
      return {
        success: true,
        data: {
          jobId: command.jobId,
          updatedAt: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to update sync job'
      };
    }
  }

  async handleExecuteSyncJob(command: ExecuteSyncJobCommand): Promise<CommandResult> {
    try {
      // In production, get sync job from repository and execute
      
      return {
        success: true,
        data: {
          jobId: command.jobId,
          executionId: `exec_${Date.now()}`,
          startedAt: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to execute sync job'
      };
    }
  }

  async handleDeleteSyncJob(command: DeleteSyncJobCommand): Promise<CommandResult> {
    try {
      // In production, delete from repository
      
      return {
        success: true,
        data: {
          deletedJobId: command.jobId
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to delete sync job'
      };
    }
  }

  async handleCloneIntegration(command: CloneIntegrationCommand): Promise<CommandResult> {
    try {
      const sourceId = IntegrationId.fromNumber(command.sourceIntegrationId);
      const newId = IntegrationId.fromNumber(Date.now());
      
      // In production, get source integration from repository
      // For now, simulate cloning
      
      return {
        success: true,
        data: {
          newIntegrationId: newId.getValue(),
          clonedFrom: sourceId.getValue(),
          name: command.newName
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to clone integration'
      };
    }
  }

  private serializeIntegration(integration: Integration): any {
    return {
      id: integration.getId().getValue(),
      userId: integration.getUserId(),
      name: integration.getName(),
      description: integration.getDescription(),
      status: integration.getStatus(),
      config: integration.getConfig(),
      createdAt: integration.getCreatedAt(),
      updatedAt: integration.getUpdatedAt(),
      metrics: integration.getMetrics(),
      tags: integration.getTags(),
      isActive: integration.isActive()
    };
  }

  private serializeDataMapping(mapping: DataMapping): any {
    return {
      id: mapping.getId(),
      integrationId: mapping.getIntegrationId(),
      name: mapping.getName(),
      description: mapping.getDescription(),
      sourceSchema: mapping.getSourceSchema(),
      targetSchema: mapping.getTargetSchema(),
      mappings: mapping.getMappings(),
      createdAt: mapping.getCreatedAt(),
      updatedAt: mapping.getUpdatedAt(),
      version: mapping.getVersion(),
      isActive: mapping.isActiveMappingActive()
    };
  }

  private serializeSyncJob(syncJob: SyncJob): any {
    return {
      id: syncJob.getId(),
      integrationId: syncJob.getIntegrationId().getValue(),
      name: syncJob.getName(),
      description: syncJob.getDescription(),
      direction: syncJob.getDirection(),
      schedule: syncJob.getSchedule(),
      status: syncJob.getStatus(),
      createdAt: syncJob.getCreatedAt(),
      updatedAt: syncJob.getUpdatedAt(),
      lastRunAt: syncJob.getLastRunAt(),
      nextRunAt: syncJob.getNextRunAt(),
      conflictResolution: syncJob.getConflictResolution(),
      batchSize: syncJob.getBatchSize(),
      isEnabled: syncJob.isJobEnabled()
    };
  }
}