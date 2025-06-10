import { IntegrationConfig } from '../../domain/entities/Integration';
import { DataSchema } from '../../domain/value-objects/DataSchema';
import { SyncDirection, ConflictResolution, SyncSchedule } from '../../domain/entities/SyncJob';

export class CreateIntegrationCommand {
  constructor(
    public readonly userId: number,
    public readonly name: string,
    public readonly description: string,
    public readonly config: IntegrationConfig,
    public readonly tags: string[] = []
  ) {}
}

export class UpdateIntegrationCommand {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number,
    public readonly name?: string,
    public readonly description?: string,
    public readonly config?: IntegrationConfig,
    public readonly tags?: string[]
  ) {}
}

export class ActivateIntegrationCommand {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class DeactivateIntegrationCommand {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class DeleteIntegrationCommand {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class ExecuteIntegrationCommand {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number,
    public readonly requestData?: any,
    public readonly headers?: Record<string, string>,
    public readonly ipAddress?: string,
    public readonly triggeredBy: 'manual' | 'webhook' | 'schedule' | 'workflow' = 'manual'
  ) {}
}

export class TestIntegrationCommand {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class RefreshCredentialsCommand {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class CreateDataMappingCommand {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number,
    public readonly name: string,
    public readonly description: string,
    public readonly sourceSchema: DataSchema,
    public readonly targetSchema: DataSchema
  ) {}
}

export class UpdateDataMappingCommand {
  constructor(
    public readonly mappingId: string,
    public readonly integrationId: number,
    public readonly userId: number,
    public readonly name?: string,
    public readonly description?: string
  ) {}
}

export class DeleteDataMappingCommand {
  constructor(
    public readonly mappingId: string,
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class CreateSyncJobCommand {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number,
    public readonly name: string,
    public readonly description: string,
    public readonly direction: SyncDirection,
    public readonly sourceSchema: DataSchema,
    public readonly targetSchema: DataSchema,
    public readonly schedule: SyncSchedule,
    public readonly conflictResolution: ConflictResolution = 'source_wins',
    public readonly batchSize: number = 100
  ) {}
}

export class UpdateSyncJobCommand {
  constructor(
    public readonly jobId: string,
    public readonly integrationId: number,
    public readonly userId: number,
    public readonly name?: string,
    public readonly description?: string,
    public readonly schedule?: SyncSchedule,
    public readonly conflictResolution?: ConflictResolution,
    public readonly batchSize?: number
  ) {}
}

export class ExecuteSyncJobCommand {
  constructor(
    public readonly jobId: string,
    public readonly integrationId: number,
    public readonly userId: number,
    public readonly isManual: boolean = true
  ) {}
}

export class DeleteSyncJobCommand {
  constructor(
    public readonly jobId: string,
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class CloneIntegrationCommand {
  constructor(
    public readonly sourceIntegrationId: number,
    public readonly userId: number,
    public readonly newName: string,
    public readonly includeCredentials: boolean = false
  ) {}
}