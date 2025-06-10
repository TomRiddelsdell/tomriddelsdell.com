export class GetIntegrationQuery {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class GetIntegrationsByUserQuery {
  constructor(
    public readonly userId: number,
    public readonly status?: string,
    public readonly type?: string,
    public readonly tags?: string[],
    public readonly limit?: number,
    public readonly offset?: number
  ) {}
}

export class GetIntegrationHealthQuery {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class GetIntegrationMetricsQuery {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number,
    public readonly startDate?: Date,
    public readonly endDate?: Date
  ) {}
}

export class GetIntegrationExecutionHistoryQuery {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number,
    public readonly limit?: number,
    public readonly offset?: number
  ) {}
}

export class SearchIntegrationsQuery {
  constructor(
    public readonly userId: number,
    public readonly searchTerm: string,
    public readonly filters?: {
      status?: string[];
      type?: string[];
      tags?: string[];
      createdAfter?: Date;
      createdBefore?: Date;
    },
    public readonly sortBy?: 'name' | 'created_at' | 'last_run' | 'status',
    public readonly sortOrder?: 'asc' | 'desc',
    public readonly limit?: number,
    public readonly offset?: number
  ) {}
}

export class GetDataMappingQuery {
  constructor(
    public readonly mappingId: string,
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class GetDataMappingsByIntegrationQuery {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class ValidateDataMappingQuery {
  constructor(
    public readonly mappingId: string,
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class GetSyncJobQuery {
  constructor(
    public readonly jobId: string,
    public readonly integrationId: number,
    public readonly userId: number
  ) {}
}

export class GetSyncJobsByIntegrationQuery {
  constructor(
    public readonly integrationId: number,
    public readonly userId: number,
    public readonly status?: string
  ) {}
}

export class GetSyncJobExecutionHistoryQuery {
  constructor(
    public readonly jobId: string,
    public readonly integrationId: number,
    public readonly userId: number,
    public readonly limit?: number,
    public readonly offset?: number
  ) {}
}

export class GetUpcomingSyncJobsQuery {
  constructor(
    public readonly userId: number,
    public readonly hoursAhead?: number
  ) {}
}

export class GetIntegrationStatsQuery {
  constructor(
    public readonly userId: number,
    public readonly period?: 'day' | 'week' | 'month' | 'year'
  ) {}
}

export class GetAvailableIntegrationTypesQuery {
  constructor() {}
}

export class GetIntegrationTemplatesQuery {
  constructor(
    public readonly type?: string,
    public readonly category?: string
  ) {}
}