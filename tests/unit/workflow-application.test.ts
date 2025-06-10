import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowCommandHandler } from '../../src/domains/workflow/application/handlers/WorkflowCommandHandler';
import { WorkflowQueryHandler } from '../../src/domains/workflow/application/handlers/WorkflowQueryHandler';
import { WorkflowExecutionService } from '../../src/domains/workflow/domain/services/WorkflowExecutionService';
import { IWorkflowRepository } from '../../src/domains/workflow/domain/repositories/IWorkflowRepository';
import { ITemplateRepository } from '../../src/domains/workflow/domain/repositories/ITemplateRepository';
import { IConnectedAppRepository } from '../../src/domains/workflow/domain/repositories/IConnectedAppRepository';
import { Workflow, WorkflowStatus } from '../../src/domains/workflow/domain/entities/Workflow';
import { Template } from '../../src/domains/workflow/domain/entities/Template';
import { ConnectedApp } from '../../src/domains/workflow/domain/entities/ConnectedApp';
import { WorkflowId } from '../../src/shared/kernel/value-objects/WorkflowId';
import { UserId } from '../../src/shared/kernel/value-objects/UserId';
import { TemplateId } from '../../src/shared/kernel/value-objects/TemplateId';
import { ConnectedAppId } from '../../src/shared/kernel/value-objects/ConnectedAppId';
import {
  CreateWorkflowCommand,
  UpdateWorkflowCommand,
  ActivateWorkflowCommand,
  ExecuteWorkflowCommand,
  DeleteWorkflowCommand
} from '../../src/domains/workflow/application/commands/WorkflowCommands';
import {
  GetWorkflowQuery,
  GetWorkflowsByUserQuery,
  GetWorkflowStatsQuery
} from '../../src/domains/workflow/application/queries/WorkflowQueries';

describe('Workflow Application Layer', () => {
  let mockWorkflowRepository: IWorkflowRepository;
  let mockTemplateRepository: ITemplateRepository;
  let mockConnectedAppRepository: IConnectedAppRepository;
  let executionService: WorkflowExecutionService;
  let commandHandler: WorkflowCommandHandler;
  let queryHandler: WorkflowQueryHandler;

  beforeEach(() => {
    mockWorkflowRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findRecentByUserId: vi.fn(),
      findActiveByUserId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
      countByUserId: vi.fn(),
      countActiveByUserId: vi.fn(),
      findByStatus: vi.fn(),
      searchByName: vi.fn()
    };

    mockTemplateRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findPopular: vi.fn(),
      findActive: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByName: vi.fn(),
      findByIconType: vi.fn()
    };

    mockConnectedAppRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findConnectedByUserId: vi.fn(),
      findAvailable: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
      findByStatus: vi.fn(),
      searchByName: vi.fn()
    };

    executionService = new WorkflowExecutionService(
      mockWorkflowRepository,
      mockConnectedAppRepository
    );

    commandHandler = new WorkflowCommandHandler(
      mockWorkflowRepository,
      mockTemplateRepository,
      mockConnectedAppRepository,
      executionService
    );

    queryHandler = new WorkflowQueryHandler(
      mockWorkflowRepository,
      mockTemplateRepository,
      mockConnectedAppRepository,
      executionService
    );
  });

  describe('Command Handlers', () => {
    it('should handle CreateWorkflowCommand', async () => {
      const command = new CreateWorkflowCommand(
        1,
        'Test Workflow',
        'A test workflow',
        { steps: [], triggers: [] }
      );

      mockWorkflowRepository.save = vi.fn().mockResolvedValue(undefined);

      const result = await commandHandler.handleCreateWorkflow(command);

      expect(result.success).toBe(true);
      expect(mockWorkflowRepository.save).toHaveBeenCalled();
    });

    it('should handle UpdateWorkflowCommand', async () => {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'Description',
        { steps: [], triggers: [] }
      );

      mockWorkflowRepository.findById = vi.fn().mockResolvedValue(workflow);
      mockWorkflowRepository.update = vi.fn().mockResolvedValue(undefined);

      const command = new UpdateWorkflowCommand(
        1,
        1,
        'Updated Name',
        'Updated Description'
      );

      const result = await commandHandler.handleUpdateWorkflow(command);

      expect(result.success).toBe(true);
      expect(mockWorkflowRepository.update).toHaveBeenCalled();
    });

    it('should handle ActivateWorkflowCommand with validation', async () => {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'Description',
        { steps: [{ id: '1', type: 'action', name: 'Step 1', config: {}, position: { x: 0, y: 0 } }], triggers: [] }
      );

      mockWorkflowRepository.findById = vi.fn().mockResolvedValue(workflow);
      mockWorkflowRepository.update = vi.fn().mockResolvedValue(undefined);
      mockConnectedAppRepository.findByUserId = vi.fn().mockResolvedValue([]);

      const command = new ActivateWorkflowCommand(1, 1);

      const result = await commandHandler.handleActivateWorkflow(command);

      expect(result.success).toBe(true);
      expect(mockWorkflowRepository.update).toHaveBeenCalled();
    });

    it('should prevent activation of workflow without steps', async () => {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'Description',
        { steps: [], triggers: [] }
      );

      mockWorkflowRepository.findById = vi.fn().mockResolvedValue(workflow);
      mockConnectedAppRepository.findByUserId = vi.fn().mockResolvedValue([]);

      const command = new ActivateWorkflowCommand(1, 1);

      const result = await commandHandler.handleActivateWorkflow(command);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Workflow must have at least one step');
    });

    it('should handle ExecuteWorkflowCommand', async () => {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'Description',
        { steps: [{ id: '1', type: 'action', name: 'Step 1', config: {}, position: { x: 0, y: 0 } }], triggers: [] }
      );
      workflow.activate();

      mockWorkflowRepository.findById = vi.fn().mockResolvedValue(workflow);
      mockWorkflowRepository.update = vi.fn().mockResolvedValue(undefined);
      mockConnectedAppRepository.findByUserId = vi.fn().mockResolvedValue([]);

      const command = new ExecuteWorkflowCommand(1, 1, '192.168.1.1');

      const result = await commandHandler.handleExecuteWorkflow(command);

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();
    });

    it('should handle DeleteWorkflowCommand', async () => {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'Description',
        { steps: [], triggers: [] }
      );

      mockWorkflowRepository.findById = vi.fn().mockResolvedValue(workflow);
      mockWorkflowRepository.delete = vi.fn().mockResolvedValue(undefined);

      const command = new DeleteWorkflowCommand(1, 1);

      const result = await commandHandler.handleDeleteWorkflow(command);

      expect(result.success).toBe(true);
      expect(mockWorkflowRepository.delete).toHaveBeenCalled();
    });

    it('should prevent deletion of active workflows', async () => {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'Description',
        { steps: [{ id: '1', type: 'action', name: 'Step 1', config: {}, position: { x: 0, y: 0 } }], triggers: [] }
      );
      workflow.activate();

      mockWorkflowRepository.findById = vi.fn().mockResolvedValue(workflow);

      const command = new DeleteWorkflowCommand(1, 1);

      const result = await commandHandler.handleDeleteWorkflow(command);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Cannot delete active workflow');
    });
  });

  describe('Query Handlers', () => {
    it('should handle GetWorkflowQuery', async () => {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'Description',
        { steps: [], triggers: [] }
      );

      mockWorkflowRepository.findById = vi.fn().mockResolvedValue(workflow);

      const query = new GetWorkflowQuery(1, 1);
      const result = await queryHandler.handleGetWorkflow(query);

      expect(result).toBe(workflow);
      expect(mockWorkflowRepository.findById).toHaveBeenCalledWith(WorkflowId.fromNumber(1));
    });

    it('should handle GetWorkflowsByUserQuery', async () => {
      const workflows = [
        Workflow.create(
          WorkflowId.fromNumber(1),
          UserId.fromNumber(1),
          'Workflow 1',
          'Description',
          { steps: [], triggers: [] }
        ),
        Workflow.create(
          WorkflowId.fromNumber(2),
          UserId.fromNumber(1),
          'Workflow 2',
          'Description',
          { steps: [], triggers: [] }
        )
      ];

      mockWorkflowRepository.findByUserId = vi.fn().mockResolvedValue(workflows);

      const query = new GetWorkflowsByUserQuery(1);
      const result = await queryHandler.handleGetWorkflowsByUser(query);

      expect(result).toHaveLength(2);
      expect(mockWorkflowRepository.findByUserId).toHaveBeenCalledWith(UserId.fromNumber(1));
    });

    it('should handle GetWorkflowStatsQuery', async () => {
      const workflows = [
        Workflow.create(
          WorkflowId.fromNumber(1),
          UserId.fromNumber(1),
          'Active Workflow',
          'Description',
          { steps: [{ id: '1', type: 'action', name: 'Step 1', config: {}, position: { x: 0, y: 0 } }], triggers: [] }
        )
      ];
      workflows[0].activate();

      mockWorkflowRepository.findByUserId = vi.fn().mockResolvedValue(workflows);
      mockConnectedAppRepository.findByUserId = vi.fn().mockResolvedValue([]);

      const query = new GetWorkflowStatsQuery(1);
      const result = await queryHandler.handleGetWorkflowStats(query);

      expect(result.totalWorkflows).toBe(1);
      expect(result.activeWorkflows).toBe(1);
      expect(result.pausedWorkflows).toBe(0);
      expect(result.connectedApps).toBe(0);
    });

    it('should enforce authorization for workflow access', async () => {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'Description',
        { steps: [], triggers: [] }
      );

      mockWorkflowRepository.findById = vi.fn().mockResolvedValue(workflow);

      const query = new GetWorkflowQuery(1, 2); // Different user ID

      await expect(queryHandler.handleGetWorkflow(query)).rejects.toThrow('Unauthorized');
    });
  });

  describe('Workflow Execution Service', () => {
    it('should validate workflow before execution', async () => {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'Description',
        { steps: [], triggers: [] }
      );

      mockWorkflowRepository.findById = vi.fn().mockResolvedValue(workflow);

      const validation = await executionService.validateWorkflow(WorkflowId.fromNumber(1));

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Workflow must have at least one step');
    });

    it('should validate workflow with valid steps', async () => {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'Description',
        { 
          steps: [
            { id: '1', type: 'trigger', name: 'Start', config: {}, position: { x: 0, y: 0 } },
            { id: '2', type: 'action', name: 'Process', config: {}, position: { x: 100, y: 0 } }
          ], 
          triggers: [] 
        }
      );

      mockWorkflowRepository.findById = vi.fn().mockResolvedValue(workflow);
      mockConnectedAppRepository.findByUserId = vi.fn().mockResolvedValue([]);

      const validation = await executionService.validateWorkflow(WorkflowId.fromNumber(1));

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should execute workflow successfully', async () => {
      const workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'Description',
        { 
          steps: [
            { id: '1', type: 'trigger', name: 'Start', config: {}, position: { x: 0, y: 0 } },
            { id: '2', type: 'action', name: 'Process', config: {}, position: { x: 100, y: 0 } }
          ], 
          triggers: [] 
        }
      );
      workflow.activate();

      mockWorkflowRepository.findById = vi.fn().mockResolvedValue(workflow);
      mockWorkflowRepository.update = vi.fn().mockResolvedValue(undefined);
      mockConnectedAppRepository.findByUserId = vi.fn().mockResolvedValue([]);

      const result = await executionService.executeWorkflow(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        '192.168.1.1'
      );

      expect(result.success).toBe(true);
      expect(result.execution.id).toBeDefined();
      expect(result.execution.status).toBe('completed');
      expect(result.logs.length).toBeGreaterThan(0);
    });
  });
});