export class CreateWorkflowCommand {
  constructor(
    public readonly userId: number,
    public readonly name: string,
    public readonly description: string,
    public readonly config: any,
    public readonly icon?: string,
    public readonly iconColor?: string
  ) {}
}

export class UpdateWorkflowCommand {
  constructor(
    public readonly workflowId: number,
    public readonly userId: number,
    public readonly name?: string,
    public readonly description?: string,
    public readonly config?: any,
    public readonly icon?: string,
    public readonly iconColor?: string
  ) {}
}

export class ActivateWorkflowCommand {
  constructor(
    public readonly workflowId: number,
    public readonly userId: number
  ) {}
}

export class PauseWorkflowCommand {
  constructor(
    public readonly workflowId: number,
    public readonly userId: number
  ) {}
}

export class ExecuteWorkflowCommand {
  constructor(
    public readonly workflowId: number,
    public readonly userId: number,
    public readonly ipAddress?: string
  ) {}
}

export class DeleteWorkflowCommand {
  constructor(
    public readonly workflowId: number,
    public readonly userId: number
  ) {}
}

export class CloneWorkflowCommand {
  constructor(
    public readonly workflowId: number,
    public readonly userId: number,
    public readonly newName: string
  ) {}
}

export class CreateFromTemplateCommand {
  constructor(
    public readonly templateId: number,
    public readonly userId: number,
    public readonly workflowName: string
  ) {}
}

export class ConnectAppCommand {
  constructor(
    public readonly userId: number,
    public readonly appName: string,
    public readonly accessToken: string,
    public readonly refreshToken?: string,
    public readonly tokenExpiry?: Date
  ) {}
}

export class DisconnectAppCommand {
  constructor(
    public readonly appId: number,
    public readonly userId: number
  ) {}
}