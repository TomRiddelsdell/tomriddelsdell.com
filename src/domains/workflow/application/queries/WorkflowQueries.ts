export class GetWorkflowQuery {
  constructor(
    public readonly workflowId: number,
    public readonly userId: number
  ) {}
}

export class GetWorkflowsByUserQuery {
  constructor(
    public readonly userId: number,
    public readonly status?: string
  ) {}
}

export class GetRecentWorkflowsQuery {
  constructor(
    public readonly userId: number,
    public readonly limit: number = 3
  ) {}
}

export class GetWorkflowStatsQuery {
  constructor(
    public readonly userId: number
  ) {}
}

export class GetTemplatesQuery {
  constructor(
    public readonly popular?: boolean,
    public readonly limit?: number
  ) {}
}

export class GetConnectedAppsQuery {
  constructor(
    public readonly userId: number,
    public readonly connectedOnly?: boolean
  ) {}
}

export class GetAvailableAppsQuery {
  constructor() {}
}

export class ValidateWorkflowQuery {
  constructor(
    public readonly workflowId: number
  ) {}
}

export class SearchWorkflowsQuery {
  constructor(
    public readonly query: string,
    public readonly userId?: number
  ) {}
}