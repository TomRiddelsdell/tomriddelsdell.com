import { IStorage } from '../../../../server/storage';
import { WorkflowCommandHandler } from '../../application/handlers/WorkflowCommandHandler';
import { WorkflowQueryHandler } from '../../application/handlers/WorkflowQueryHandler';
import {
  CreateWorkflowCommand,
  UpdateWorkflowCommand,
  ActivateWorkflowCommand,
  PauseWorkflowCommand,
  ExecuteWorkflowCommand,
  DeleteWorkflowCommand,
  CloneWorkflowCommand,
  CreateFromTemplateCommand,
  ConnectAppCommand,
  DisconnectAppCommand
} from '../../application/commands/WorkflowCommands';
import {
  GetWorkflowQuery,
  GetWorkflowsByUserQuery,
  GetRecentWorkflowsQuery,
  GetWorkflowStatsQuery,
  GetTemplatesQuery,
  GetConnectedAppsQuery,
  GetAvailableAppsQuery,
  ValidateWorkflowQuery,
  SearchWorkflowsQuery
} from '../../application/queries/WorkflowQueries';

/**
 * Adapter to bridge between the legacy storage interface and the new DDD Workflow domain
 * This maintains backward compatibility while introducing proper domain structure
 */
export class WorkflowAdapter {
  constructor(
    private commandHandler: WorkflowCommandHandler,
    private queryHandler: WorkflowQueryHandler,
    private legacyStorage: IStorage
  ) {}

  // Legacy workflow operations with DDD implementation
  async createWorkflow(userId: number, name: string, description: string, config: any, icon?: string, iconColor?: string) {
    const command = new CreateWorkflowCommand(userId, name, description, config, icon, iconColor);
    const result = await this.commandHandler.handleCreateWorkflow(command);
    
    if (!result.success) {
      throw new Error(result.errorMessage || 'Failed to create workflow');
    }

    // Return format expected by legacy system
    const workflow = await this.getWorkflow(result.workflowId!, userId);
    return workflow;
  }

  async updateWorkflow(workflowId: number, userId: number, workflowData: any) {
    const command = new UpdateWorkflowCommand(
      workflowId,
      userId,
      workflowData.name,
      workflowData.description,
      workflowData.config,
      workflowData.icon,
      workflowData.iconColor
    );
    
    const result = await this.commandHandler.handleUpdateWorkflow(command);
    
    if (!result.success) {
      throw new Error(result.errorMessage || 'Failed to update workflow');
    }

    return await this.getWorkflow(workflowId, userId);
  }

  async deleteWorkflow(workflowId: number, userId: number): Promise<boolean> {
    const command = new DeleteWorkflowCommand(workflowId, userId);
    const result = await this.commandHandler.handleDeleteWorkflow(command);
    return result.success;
  }

  async getWorkflow(workflowId: number, userId: number) {
    const query = new GetWorkflowQuery(workflowId, userId);
    const workflow = await this.queryHandler.handleGetWorkflow(query);
    
    if (!workflow) {
      return undefined;
    }

    // Convert domain entity to legacy format
    return this.convertWorkflowToLegacyFormat(workflow);
  }

  async getWorkflowsByUserId(userId: number) {
    const query = new GetWorkflowsByUserQuery(userId);
    const workflows = await this.queryHandler.handleGetWorkflowsByUser(query);
    return workflows.map(w => this.convertWorkflowToLegacyFormat(w));
  }

  async getRecentWorkflows(userId: number, limit: number = 3) {
    const query = new GetRecentWorkflowsQuery(userId, limit);
    const workflows = await this.queryHandler.handleGetRecentWorkflows(query);
    return workflows.map(w => this.convertWorkflowToLegacyFormat(w));
  }

  async activateWorkflow(workflowId: number, userId: number) {
    const command = new ActivateWorkflowCommand(workflowId, userId);
    const result = await this.commandHandler.handleActivateWorkflow(command);
    
    if (!result.success) {
      throw new Error(result.errorMessage || 'Failed to activate workflow');
    }

    return await this.getWorkflow(workflowId, userId);
  }

  async pauseWorkflow(workflowId: number, userId: number) {
    const command = new PauseWorkflowCommand(workflowId, userId);
    const result = await this.commandHandler.handlePauseWorkflow(command);
    
    if (!result.success) {
      throw new Error(result.errorMessage || 'Failed to pause workflow');
    }

    return await this.getWorkflow(workflowId, userId);
  }

  async executeWorkflow(workflowId: number, userId: number, ipAddress?: string) {
    const command = new ExecuteWorkflowCommand(workflowId, userId, ipAddress);
    const result = await this.commandHandler.handleExecuteWorkflow(command);
    
    if (!result.success) {
      throw new Error(result.errorMessage || 'Failed to execute workflow');
    }

    return {
      executionId: result.executionId,
      success: result.success
    };
  }

  async cloneWorkflow(workflowId: number, userId: number, newName: string) {
    const command = new CloneWorkflowCommand(workflowId, userId, newName);
    const result = await this.commandHandler.handleCloneWorkflow(command);
    
    if (!result.success) {
      throw new Error(result.errorMessage || 'Failed to clone workflow');
    }

    return await this.getWorkflow(result.workflowId!, userId);
  }

  async createFromTemplate(templateId: number, userId: number, workflowName: string) {
    const command = new CreateFromTemplateCommand(templateId, userId, workflowName);
    const result = await this.commandHandler.handleCreateFromTemplate(command);
    
    if (!result.success) {
      throw new Error(result.errorMessage || 'Failed to create workflow from template');
    }

    return await this.getWorkflow(result.workflowId!, userId);
  }

  async getTemplates(popular?: boolean, limit?: number) {
    const query = new GetTemplatesQuery(popular, limit);
    const templates = await this.queryHandler.handleGetTemplates(query);
    return templates.map(t => this.convertTemplateToLegacyFormat(t));
  }

  async getConnectedApps(userId: number, connectedOnly?: boolean) {
    const query = new GetConnectedAppsQuery(userId, connectedOnly);
    const apps = await this.queryHandler.handleGetConnectedApps(query);
    return apps.map(a => this.convertConnectedAppToLegacyFormat(a));
  }

  async getAvailableApps() {
    const query = new GetAvailableAppsQuery();
    const apps = await this.queryHandler.handleGetAvailableApps(query);
    return apps.map(a => this.convertConnectedAppToLegacyFormat(a));
  }

  async connectApp(userId: number, appName: string, accessToken: string, refreshToken?: string, tokenExpiry?: Date) {
    const command = new ConnectAppCommand(userId, appName, accessToken, refreshToken, tokenExpiry);
    const result = await this.commandHandler.handleConnectApp(command);
    
    if (!result.success) {
      throw new Error(result.errorMessage || 'Failed to connect app');
    }

    return true;
  }

  async disconnectApp(appId: number, userId: number) {
    const command = new DisconnectAppCommand(appId, userId);
    const result = await this.commandHandler.handleDisconnectApp(command);
    return result.success;
  }

  async getDashboardStats(userId: number) {
    const query = new GetWorkflowStatsQuery(userId);
    const stats = await this.queryHandler.handleGetWorkflowStats(query);
    
    // Convert to legacy dashboard stats format
    return {
      activeWorkflows: stats.activeWorkflows,
      tasksAutomated: stats.executionCount,
      connectedApps: stats.connectedApps,
      timeSaved: `${Math.floor(stats.executionCount * 2.5)} hours` // Estimate
    };
  }

  async validateWorkflow(workflowId: number) {
    const query = new ValidateWorkflowQuery(workflowId);
    return await this.queryHandler.handleValidateWorkflow(query);
  }

  async searchWorkflows(searchQuery: string, userId?: number) {
    const query = new SearchWorkflowsQuery(searchQuery, userId);
    const workflows = await this.queryHandler.handleSearchWorkflows(query);
    return workflows.map(w => this.convertWorkflowToLegacyFormat(w));
  }

  // Conversion methods to maintain backward compatibility
  private convertWorkflowToLegacyFormat(workflow: any): any {
    const plainObject = workflow.toPlainObject();
    return {
      id: plainObject.id,
      userId: plainObject.userId,
      name: plainObject.name,
      description: plainObject.description,
      status: plainObject.status,
      config: plainObject.config,
      createdAt: plainObject.createdAt,
      updatedAt: plainObject.updatedAt,
      lastRun: plainObject.lastRun,
      icon: plainObject.icon,
      iconColor: plainObject.iconColor,
      // Add legacy fields that UI expects
      connectedApps: [] // Would need to fetch separately
    };
  }

  private convertTemplateToLegacyFormat(template: any): any {
    const plainObject = template.toPlainObject();
    return {
      id: plainObject.id,
      name: plainObject.name,
      description: plainObject.description,
      iconType: plainObject.iconType,
      iconColor: plainObject.iconColor,
      usersCount: plainObject.usersCount,
      config: plainObject.config,
      createdAt: plainObject.createdAt,
      updatedAt: plainObject.updatedAt
    };
  }

  private convertConnectedAppToLegacyFormat(app: any): any {
    const plainObject = app.toPlainObject();
    return {
      id: plainObject.id,
      userId: plainObject.userId,
      name: plainObject.name,
      description: plainObject.description,
      icon: plainObject.icon,
      status: plainObject.status,
      config: plainObject.config,
      createdAt: plainObject.createdAt,
      updatedAt: plainObject.updatedAt,
      accessToken: plainObject.accessToken,
      refreshToken: plainObject.refreshToken,
      tokenExpiry: plainObject.tokenExpiry
    };
  }
}