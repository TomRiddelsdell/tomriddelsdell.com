import { DatabaseWorkflowRepository } from './repositories/DatabaseWorkflowRepository';
import { WorkflowCommandHandler } from '../application/handlers/WorkflowCommandHandler';
import { WorkflowQueryHandler } from '../application/handlers/WorkflowQueryHandler';
import { WorkflowExecutionService } from '../domain/services/WorkflowExecutionService';
import { WorkflowAdapter } from './adapters/WorkflowAdapter';
import { IStorage } from '../../../server/storage';

/**
 * Dependency injection container for the Workflow domain
 * Wires up all the dependencies and provides a clean interface for integration
 */
export class WorkflowModule {
  private static instance: WorkflowModule;
  private workflowAdapter: WorkflowAdapter;

  private constructor(legacyStorage: IStorage) {
    // Create repositories
    const workflowRepository = new DatabaseWorkflowRepository();
    const templateRepository = new DatabaseWorkflowRepository(); // Simplified for now
    const connectedAppRepository = new DatabaseWorkflowRepository(); // Simplified for now

    // Create domain services
    const executionService = new WorkflowExecutionService(
      workflowRepository,
      connectedAppRepository
    );

    // Create application layer handlers
    const commandHandler = new WorkflowCommandHandler(
      workflowRepository,
      templateRepository,
      connectedAppRepository,
      executionService
    );

    const queryHandler = new WorkflowQueryHandler(
      workflowRepository,
      templateRepository,
      connectedAppRepository,
      executionService
    );

    // Create adapter for legacy integration
    this.workflowAdapter = new WorkflowAdapter(
      commandHandler,
      queryHandler,
      legacyStorage
    );
  }

  public static initialize(legacyStorage: IStorage): WorkflowModule {
    if (!WorkflowModule.instance) {
      WorkflowModule.instance = new WorkflowModule(legacyStorage);
    }
    return WorkflowModule.instance;
  }

  public static getInstance(): WorkflowModule {
    if (!WorkflowModule.instance) {
      throw new Error('WorkflowModule not initialized. Call initialize() first.');
    }
    return WorkflowModule.instance;
  }

  public getAdapter(): WorkflowAdapter {
    return this.workflowAdapter;
  }
}