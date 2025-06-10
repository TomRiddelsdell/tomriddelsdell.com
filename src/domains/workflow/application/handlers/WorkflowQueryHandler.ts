import { Workflow } from '../../domain/entities/Workflow';
import { Template } from '../../domain/entities/Template';
import { ConnectedApp } from '../../domain/entities/ConnectedApp';
import { IWorkflowRepository } from '../../domain/repositories/IWorkflowRepository';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository';
import { IConnectedAppRepository } from '../../domain/repositories/IConnectedAppRepository';
import { WorkflowExecutionService } from '../../domain/services/WorkflowExecutionService';
import { WorkflowId } from '../../../shared/kernel/value-objects/WorkflowId';
import { UserId } from '../../../shared/kernel/value-objects/UserId';
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
} from '../queries/WorkflowQueries';

export interface WorkflowStatsResult {
  totalWorkflows: number;
  activeWorkflows: number;
  pausedWorkflows: number;
  connectedApps: number;
  templatesUsed: number;
  executionCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class WorkflowQueryHandler {
  constructor(
    private workflowRepository: IWorkflowRepository,
    private templateRepository: ITemplateRepository,
    private connectedAppRepository: IConnectedAppRepository,
    private executionService: WorkflowExecutionService
  ) {}

  async handleGetWorkflow(query: GetWorkflowQuery): Promise<Workflow | null> {
    const workflow = await this.workflowRepository.findById(WorkflowId.fromNumber(query.workflowId));
    
    if (workflow && !workflow.getUserId().equals(UserId.fromNumber(query.userId))) {
      throw new Error('Unauthorized to access this workflow');
    }
    
    return workflow;
  }

  async handleGetWorkflowsByUser(query: GetWorkflowsByUserQuery): Promise<Workflow[]> {
    const workflows = await this.workflowRepository.findByUserId(UserId.fromNumber(query.userId));
    
    if (query.status) {
      return workflows.filter(w => w.getStatus() === query.status);
    }
    
    return workflows;
  }

  async handleGetRecentWorkflows(query: GetRecentWorkflowsQuery): Promise<Workflow[]> {
    return await this.workflowRepository.findRecentByUserId(
      UserId.fromNumber(query.userId),
      query.limit
    );
  }

  async handleGetWorkflowStats(query: GetWorkflowStatsQuery): Promise<WorkflowStatsResult> {
    const userId = UserId.fromNumber(query.userId);
    
    const [
      workflows,
      connectedApps
    ] = await Promise.all([
      this.workflowRepository.findByUserId(userId),
      this.connectedAppRepository.findByUserId(userId)
    ]);

    const activeWorkflows = workflows.filter(w => w.isActive()).length;
    const pausedWorkflows = workflows.filter(w => w.getStatus() === 'paused').length;
    const connectedAppsCount = connectedApps.filter(a => a.isConnected()).length;
    const totalExecutions = workflows.reduce((sum, w) => sum + w.getExecutionCount(), 0);

    return {
      totalWorkflows: workflows.length,
      activeWorkflows,
      pausedWorkflows,
      connectedApps: connectedAppsCount,
      templatesUsed: 0, // Would need to track this separately
      executionCount: totalExecutions
    };
  }

  async handleGetTemplates(query: GetTemplatesQuery): Promise<Template[]> {
    if (query.popular) {
      return await this.templateRepository.findPopular(query.limit);
    }
    
    return await this.templateRepository.findAll();
  }

  async handleGetConnectedApps(query: GetConnectedAppsQuery): Promise<ConnectedApp[]> {
    const apps = await this.connectedAppRepository.findByUserId(UserId.fromNumber(query.userId));
    
    if (query.connectedOnly) {
      return apps.filter(app => app.isConnected());
    }
    
    return apps;
  }

  async handleGetAvailableApps(query: GetAvailableAppsQuery): Promise<ConnectedApp[]> {
    return await this.connectedAppRepository.findAvailable();
  }

  async handleValidateWorkflow(query: ValidateWorkflowQuery): Promise<ValidationResult> {
    return await this.executionService.validateWorkflow(WorkflowId.fromNumber(query.workflowId));
  }

  async handleSearchWorkflows(query: SearchWorkflowsQuery): Promise<Workflow[]> {
    return await this.workflowRepository.searchByName(
      query.query,
      query.userId ? UserId.fromNumber(query.userId) : undefined
    );
  }
}