import { Workflow, WorkflowStatus } from '../../domain/entities/Workflow';
import { Template } from '../../domain/entities/Template';
import { ConnectedApp } from '../../domain/entities/ConnectedApp';
import { IWorkflowRepository } from '../../domain/repositories/IWorkflowRepository';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository';
import { IConnectedAppRepository } from '../../domain/repositories/IConnectedAppRepository';
import { WorkflowExecutionService } from '../../domain/services/WorkflowExecutionService';
import { WorkflowId } from '../../../shared/kernel/value-objects/WorkflowId';
import { UserId } from '../../../shared/kernel/value-objects/UserId';
import { TemplateId } from '../../../shared/kernel/value-objects/TemplateId';
import { ConnectedAppId } from '../../../shared/kernel/value-objects/ConnectedAppId';
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
} from '../commands/WorkflowCommands';

export interface WorkflowOperationResult {
  success: boolean;
  workflowId?: number;
  errorMessage?: string;
}

export interface ExecutionResult {
  success: boolean;
  executionId?: string;
  errorMessage?: string;
}

export class WorkflowCommandHandler {
  constructor(
    private workflowRepository: IWorkflowRepository,
    private templateRepository: ITemplateRepository,
    private connectedAppRepository: IConnectedAppRepository,
    private executionService: WorkflowExecutionService
  ) {}

  async handleCreateWorkflow(command: CreateWorkflowCommand): Promise<WorkflowOperationResult> {
    try {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(0), // Will be assigned by repository
        UserId.fromNumber(command.userId),
        command.name,
        command.description,
        command.config,
        command.icon,
        command.iconColor
      );

      await this.workflowRepository.save(workflow);

      return {
        success: true,
        workflowId: workflow.getId().getValue()
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to create workflow'
      };
    }
  }

  async handleUpdateWorkflow(command: UpdateWorkflowCommand): Promise<WorkflowOperationResult> {
    try {
      const workflow = await this.workflowRepository.findById(WorkflowId.fromNumber(command.workflowId));
      if (!workflow) {
        return { success: false, errorMessage: 'Workflow not found' };
      }

      if (!workflow.getUserId().equals(UserId.fromNumber(command.userId))) {
        return { success: false, errorMessage: 'Unauthorized to update this workflow' };
      }

      if (command.name !== undefined || command.description !== undefined) {
        workflow.updateDetails(
          command.name ?? workflow.getName(),
          command.description ?? workflow.getDescription()
        );
      }

      if (command.config !== undefined) {
        workflow.updateConfig(command.config);
      }

      await this.workflowRepository.update(workflow);

      return { success: true, workflowId: workflow.getId().getValue() };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to update workflow'
      };
    }
  }

  async handleActivateWorkflow(command: ActivateWorkflowCommand): Promise<WorkflowOperationResult> {
    try {
      const workflow = await this.workflowRepository.findById(WorkflowId.fromNumber(command.workflowId));
      if (!workflow) {
        return { success: false, errorMessage: 'Workflow not found' };
      }

      if (!workflow.getUserId().equals(UserId.fromNumber(command.userId))) {
        return { success: false, errorMessage: 'Unauthorized to activate this workflow' };
      }

      // Validate workflow before activation
      const validation = await this.executionService.validateWorkflow(WorkflowId.fromNumber(command.workflowId));
      if (!validation.isValid) {
        return { 
          success: false, 
          errorMessage: `Cannot activate workflow: ${validation.errors.join(', ')}` 
        };
      }

      workflow.activate();
      await this.workflowRepository.update(workflow);

      return { success: true, workflowId: workflow.getId().getValue() };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to activate workflow'
      };
    }
  }

  async handlePauseWorkflow(command: PauseWorkflowCommand): Promise<WorkflowOperationResult> {
    try {
      const workflow = await this.workflowRepository.findById(WorkflowId.fromNumber(command.workflowId));
      if (!workflow) {
        return { success: false, errorMessage: 'Workflow not found' };
      }

      if (!workflow.getUserId().equals(UserId.fromNumber(command.userId))) {
        return { success: false, errorMessage: 'Unauthorized to pause this workflow' };
      }

      workflow.pause();
      await this.workflowRepository.update(workflow);

      return { success: true, workflowId: workflow.getId().getValue() };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to pause workflow'
      };
    }
  }

  async handleExecuteWorkflow(command: ExecuteWorkflowCommand): Promise<ExecutionResult> {
    try {
      const result = await this.executionService.executeWorkflow(
        WorkflowId.fromNumber(command.workflowId),
        UserId.fromNumber(command.userId),
        command.ipAddress
      );

      return {
        success: result.success,
        executionId: result.execution.id,
        errorMessage: result.errorMessage
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to execute workflow'
      };
    }
  }

  async handleDeleteWorkflow(command: DeleteWorkflowCommand): Promise<WorkflowOperationResult> {
    try {
      const workflow = await this.workflowRepository.findById(WorkflowId.fromNumber(command.workflowId));
      if (!workflow) {
        return { success: false, errorMessage: 'Workflow not found' };
      }

      if (!workflow.getUserId().equals(UserId.fromNumber(command.userId))) {
        return { success: false, errorMessage: 'Unauthorized to delete this workflow' };
      }

      if (!workflow.canBeDeleted()) {
        return { 
          success: false, 
          errorMessage: 'Cannot delete active workflow. Please pause it first.' 
        };
      }

      workflow.markForDeletion();
      await this.workflowRepository.delete(WorkflowId.fromNumber(command.workflowId));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to delete workflow'
      };
    }
  }

  async handleCloneWorkflow(command: CloneWorkflowCommand): Promise<WorkflowOperationResult> {
    try {
      const originalWorkflow = await this.workflowRepository.findById(WorkflowId.fromNumber(command.workflowId));
      if (!originalWorkflow) {
        return { success: false, errorMessage: 'Original workflow not found' };
      }

      if (!originalWorkflow.getUserId().equals(UserId.fromNumber(command.userId))) {
        return { success: false, errorMessage: 'Unauthorized to clone this workflow' };
      }

      const clonedWorkflow = originalWorkflow.clone(command.newName);
      await this.workflowRepository.save(clonedWorkflow);

      return { success: true, workflowId: clonedWorkflow.getId().getValue() };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to clone workflow'
      };
    }
  }

  async handleCreateFromTemplate(command: CreateFromTemplateCommand): Promise<WorkflowOperationResult> {
    try {
      const template = await this.templateRepository.findById(TemplateId.fromNumber(command.templateId));
      if (!template) {
        return { success: false, errorMessage: 'Template not found' };
      }

      const workflow = Workflow.create(
        WorkflowId.fromNumber(0), // Will be assigned by repository
        UserId.fromNumber(command.userId),
        command.workflowName,
        template.getDescription(),
        template.getConfig(),
        template.getIconType(),
        template.getIconColor()
      );

      await this.workflowRepository.save(workflow);

      // Mark template as used
      template.markAsUsed(command.userId.toString(), workflow.getId().toString());
      await this.templateRepository.update(template);

      return { success: true, workflowId: workflow.getId().getValue() };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to create workflow from template'
      };
    }
  }

  async handleConnectApp(command: ConnectAppCommand): Promise<WorkflowOperationResult> {
    try {
      // Find existing app or create new one
      const existingApps = await this.connectedAppRepository.findByUserId(UserId.fromNumber(command.userId));
      let app = existingApps.find(a => a.getName() === command.appName);

      if (!app) {
        app = ConnectedApp.create(
          ConnectedAppId.fromNumber(0), // Will be assigned by repository
          UserId.fromNumber(command.userId),
          command.appName,
          `Connected ${command.appName} app`,
          command.appName.toLowerCase(),
          {}
        );
      }

      app.connect(command.accessToken, command.refreshToken, command.tokenExpiry);
      
      if (app.getId().getValue() === 0) {
        await this.connectedAppRepository.save(app);
      } else {
        await this.connectedAppRepository.update(app);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to connect app'
      };
    }
  }

  async handleDisconnectApp(command: DisconnectAppCommand): Promise<WorkflowOperationResult> {
    try {
      const app = await this.connectedAppRepository.findById(ConnectedAppId.fromNumber(command.appId));
      if (!app) {
        return { success: false, errorMessage: 'Connected app not found' };
      }

      if (!app.getUserId().equals(UserId.fromNumber(command.userId))) {
        return { success: false, errorMessage: 'Unauthorized to disconnect this app' };
      }

      app.disconnect();
      await this.connectedAppRepository.update(app);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to disconnect app'
      };
    }
  }
}