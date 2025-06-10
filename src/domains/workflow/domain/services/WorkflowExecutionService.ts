import { Workflow, WorkflowExecution, WorkflowExecutionLog } from '../entities/Workflow';
import { ConnectedApp } from '../entities/ConnectedApp';
import { IWorkflowRepository } from '../repositories/IWorkflowRepository';
import { IConnectedAppRepository } from '../repositories/IConnectedAppRepository';
import { WorkflowId } from '../../../shared/kernel/value-objects/WorkflowId';
import { UserId } from '../../../shared/kernel/value-objects/UserId';

export interface ExecutionContext {
  workflow: Workflow;
  connectedApps: ConnectedApp[];
  userId: UserId;
  ipAddress?: string;
}

export interface ExecutionResult {
  execution: WorkflowExecution;
  success: boolean;
  errorMessage?: string;
  logs: WorkflowExecutionLog[];
}

export class WorkflowExecutionService {
  constructor(
    private workflowRepository: IWorkflowRepository,
    private connectedAppRepository: IConnectedAppRepository
  ) {}

  async executeWorkflow(workflowId: WorkflowId, userId: UserId, ipAddress?: string): Promise<ExecutionResult> {
    const workflow = await this.workflowRepository.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (!workflow.getUserId().equals(userId)) {
      throw new Error('Unauthorized to execute this workflow');
    }

    if (!workflow.isActive()) {
      throw new Error('Cannot execute inactive workflow');
    }

    // Get connected apps for this workflow
    const connectedApps = await this.connectedAppRepository.findByUserId(userId);
    
    // Create execution context
    const context: ExecutionContext = {
      workflow,
      connectedApps,
      userId,
      ipAddress
    };

    // Execute the workflow
    const execution = workflow.execute(ipAddress);
    const logs: WorkflowExecutionLog[] = [];

    try {
      // Process each step in the workflow
      const result = await this.processWorkflowSteps(context, execution, logs);
      
      // Update execution status
      execution.status = result.success ? 'completed' : 'failed';
      execution.completedAt = new Date();
      execution.logs = logs;

      // Save workflow with updated execution count
      await this.workflowRepository.update(workflow);

      return {
        execution,
        success: result.success,
        errorMessage: result.errorMessage,
        logs
      };

    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      
      const errorLog: WorkflowExecutionLog = {
        stepId: 'execution',
        timestamp: new Date(),
        level: 'error',
        message: error instanceof Error ? error.message : 'Unknown execution error',
        data: { error: error instanceof Error ? error.stack : error }
      };
      
      logs.push(errorLog);
      execution.logs = logs;

      // Mark workflow as error state
      workflow.markAsError(errorLog.message);
      await this.workflowRepository.update(workflow);

      return {
        execution,
        success: false,
        errorMessage: errorLog.message,
        logs
      };
    }
  }

  private async processWorkflowSteps(
    context: ExecutionContext,
    execution: WorkflowExecution,
    logs: WorkflowExecutionLog[]
  ): Promise<{ success: boolean; errorMessage?: string }> {
    const { workflow, connectedApps } = context;
    const config = workflow.getConfig();

    // Validate connected apps are available
    for (const step of config.steps) {
      if (step.config.requiresApp) {
        const requiredApp = connectedApps.find(app => app.getName() === step.config.appName);
        if (!requiredApp || !requiredApp.isConnected()) {
          const errorMessage = `Required app ${step.config.appName} is not connected`;
          logs.push({
            stepId: step.id,
            timestamp: new Date(),
            level: 'error',
            message: errorMessage,
            data: { stepName: step.name, requiredApp: step.config.appName }
          });
          return { success: false, errorMessage };
        }
      }
    }

    // Process each step
    for (const step of config.steps) {
      const stepResult = await this.processStep(step, context, logs);
      if (!stepResult.success) {
        return { success: false, errorMessage: stepResult.errorMessage };
      }
    }

    logs.push({
      stepId: 'completion',
      timestamp: new Date(),
      level: 'info',
      message: 'Workflow execution completed successfully',
      data: { executionId: execution.id, stepCount: config.steps.length }
    });

    return { success: true };
  }

  private async processStep(
    step: any,
    context: ExecutionContext,
    logs: WorkflowExecutionLog[]
  ): Promise<{ success: boolean; errorMessage?: string }> {
    const startTime = new Date();
    
    logs.push({
      stepId: step.id,
      timestamp: startTime,
      level: 'info',
      message: `Starting step: ${step.name}`,
      data: { stepType: step.type, stepConfig: step.config }
    });

    try {
      // Simulate step processing based on type
      await this.executeStepByType(step, context);
      
      logs.push({
        stepId: step.id,
        timestamp: new Date(),
        level: 'info',
        message: `Step completed: ${step.name}`,
        data: { 
          stepType: step.type, 
          duration: new Date().getTime() - startTime.getTime()
        }
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Step execution failed';
      
      logs.push({
        stepId: step.id,
        timestamp: new Date(),
        level: 'error',
        message: `Step failed: ${step.name} - ${errorMessage}`,
        data: { 
          stepType: step.type,
          error: error instanceof Error ? error.stack : error,
          duration: new Date().getTime() - startTime.getTime()
        }
      });

      return { success: false, errorMessage };
    }
  }

  private async executeStepByType(step: any, context: ExecutionContext): Promise<void> {
    const { connectedApps } = context;
    
    switch (step.type) {
      case 'trigger':
        // Handle trigger steps
        await this.delay(100);
        break;
        
      case 'action':
        // Handle action steps that might require connected apps
        if (step.config.requiresApp) {
          const app = connectedApps.find(a => a.getName() === step.config.appName);
          if (!app || !app.hasValidToken()) {
            throw new Error(`App ${step.config.appName} authentication failed`);
          }
        }
        await this.delay(500);
        break;
        
      case 'condition':
        // Handle conditional logic
        await this.delay(50);
        break;
        
      case 'transform':
        // Handle data transformation
        await this.delay(200);
        break;
        
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  async validateWorkflow(workflowId: WorkflowId): Promise<{ isValid: boolean; errors: string[] }> {
    const workflow = await this.workflowRepository.findById(workflowId);
    if (!workflow) {
      return { isValid: false, errors: ['Workflow not found'] };
    }

    const errors: string[] = [];
    const config = workflow.getConfig();

    if (!config.steps || config.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    // Validate step connections
    for (const step of config.steps) {
      if (step.connections) {
        for (const connectionId of step.connections) {
          const targetStep = config.steps.find(s => s.id === connectionId);
          if (!targetStep) {
            errors.push(`Step ${step.name} references non-existent step ${connectionId}`);
          }
        }
      }
    }

    // Check for required apps
    const connectedApps = await this.connectedAppRepository.findByUserId(workflow.getUserId());
    for (const step of config.steps) {
      if (step.config.requiresApp) {
        const requiredApp = connectedApps.find(app => app.getName() === step.config.appName);
        if (!requiredApp) {
          errors.push(`Step ${step.name} requires app ${step.config.appName} which is not connected`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}