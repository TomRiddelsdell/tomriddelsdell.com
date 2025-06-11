import { describe, it, expect, beforeEach } from 'vitest';
import { Workflow, WorkflowStatus, TriggerType, WorkflowId } from '../../src/entities/Workflow';
import { WorkflowAggregate } from '../../src/aggregates/WorkflowAggregate';
import { UserId } from '../../../shared-kernel/src/value-objects/UserId';
import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';
import { WorkflowCreatedEvent, WorkflowExecutedEvent } from '../../../shared-kernel/src/events/DomainEvent';

describe('Workflow Domain - Pure DDD Architecture', () => {
  describe('Value Objects', () => {
    it('should create valid WorkflowId', () => {
      const workflowId = WorkflowId.fromNumber(123);
      expect(workflowId.getValue()).toBe(123);
      expect(workflowId.toString()).toBe('123');
    });

    it('should enforce WorkflowId validation', () => {
      expect(() => WorkflowId.fromNumber(0)).toThrow('WorkflowId must be a positive number');
      expect(() => WorkflowId.fromNumber(-1)).toThrow('WorkflowId must be a positive number');
    });

    it('should support WorkflowId equality', () => {
      const id1 = WorkflowId.fromNumber(123);
      const id2 = WorkflowId.fromNumber(123);
      const id3 = WorkflowId.fromNumber(456);
      
      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });
  });

  describe('Workflow Aggregate Root', () => {
    let workflowAggregate: WorkflowAggregate;
    let userId: UserId;

    beforeEach(() => {
      userId = UserId.generate();
      workflowAggregate = WorkflowAggregate.create(
        userId,
        'Test Workflow',
        'A test workflow for DDD validation',
        TriggerType.MANUAL
      );
    });

    it('should enforce business rules during creation', () => {
      expect(() => {
        WorkflowAggregate.create(userId, '', 'Description', TriggerType.MANUAL);
      }).toThrow(DomainException);

      expect(() => {
        WorkflowAggregate.create(userId, 'a'.repeat(101), 'Description', TriggerType.MANUAL);
      }).toThrow(DomainException);

      expect(() => {
        WorkflowAggregate.create(userId, '   ', 'Description', TriggerType.MANUAL);
      }).toThrow(DomainException);
    });

    it('should create aggregate with proper domain events', () => {
      const events = workflowAggregate.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(WorkflowCreatedEvent);
    });

    it('should prevent activation without valid configuration', () => {
      expect(() => {
        workflowAggregate.activateWorkflow();
      }).toThrow(DomainException);
    });

    it('should allow activation with valid configuration', () => {
      const workflow = workflowAggregate.getWorkflow();
      workflow.updateActions([
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test' },
          order: 1
        }
      ]);

      expect(() => {
        workflowAggregate.activateWorkflow();
      }).not.toThrow();

      expect(workflow.getStatus()).toBe(WorkflowStatus.ACTIVE);
    });

    it('should manage domain events properly', () => {
      const workflow = workflowAggregate.getWorkflow();
      workflow.updateActions([
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test' },
          order: 1
        }
      ]);

      workflowAggregate.activateWorkflow();
      expect(workflowAggregate.getDomainEvents().length).toBeGreaterThan(0);

      workflowAggregate.clearDomainEvents();
      expect(workflowAggregate.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('Workflow Entity - Rich Domain Model', () => {
    let workflow: Workflow;

    beforeEach(() => {
      workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.generate(),
        'Test Workflow',
        'Test Description'
      );
    });

    it('should create workflow with proper business defaults', () => {
      expect(workflow.getId().getValue()).toBe(1);
      expect(workflow.getName()).toBe('Test Workflow');
      expect(workflow.getDescription()).toBe('Test Description');
      expect(workflow.getStatus()).toBe(WorkflowStatus.DRAFT);
      expect(workflow.getActions()).toHaveLength(0);
    });

    it('should emit domain events for business operations', () => {
      const events = workflow.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(WorkflowCreatedEvent);
    });

    it('should enforce business rules for action updates', () => {
      const validActions = [
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test', body: 'Test' },
          order: 1
        }
      ];

      expect(() => {
        workflow.updateActions(validActions);
      }).not.toThrow();

      expect(workflow.getActions()).toHaveLength(1);
    });

    it('should handle status transitions with business logic', () => {
      // Cannot activate without actions
      expect(() => {
        workflow.activate();
      }).toThrow(DomainException);

      // Add valid actions
      workflow.updateActions([
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test', body: 'Test' },
          order: 1
        }
      ]);

      // Now activation should work
      expect(() => {
        workflow.activate();
      }).not.toThrow();

      expect(workflow.getStatus()).toBe(WorkflowStatus.ACTIVE);
    });

    it('should maintain entity consistency during execution', () => {
      workflow.updateActions([
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test', body: 'Test' },
          order: 1
        }
      ]);

      workflow.activate();
      workflow.execute({});

      const events = workflow.getDomainEvents();
      const execEvent = events.find(e => e instanceof WorkflowExecutedEvent);
      expect(execEvent).toBeDefined();
    });

    it('should provide proper data representation', () => {
      const plainObject = workflow.toPlainObject();
      expect(plainObject.id).toBe(1);
      expect(plainObject.name).toBe('Test Workflow');
      expect(plainObject.status).toBe(WorkflowStatus.DRAFT);
    });

    it('should enforce business invariants', () => {
      // Test duplicate action IDs
      const duplicateActions = [
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test1@example.com', subject: 'Test 1' },
          order: 1
        },
        {
          id: 'action-1', // Duplicate ID
          type: 'email',
          config: { to: 'test2@example.com', subject: 'Test 2' },
          order: 2
        }
      ];

      expect(() => {
        workflow.updateActions(duplicateActions);
      }).toThrow(DomainException);
    });

    it('should handle workflow pause and resume', () => {
      workflow.updateActions([
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test' },
          order: 1
        }
      ]);

      workflow.activate();
      expect(workflow.getStatus()).toBe(WorkflowStatus.ACTIVE);

      workflow.pause();
      expect(workflow.getStatus()).toBe(WorkflowStatus.PAUSED);

      workflow.resume();
      expect(workflow.getStatus()).toBe(WorkflowStatus.ACTIVE);
    });

    it('should handle error states properly', () => {
      workflow.updateActions([
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test' },
          order: 1
        }
      ]);

      workflow.activate();
      workflow.markAsError(new Error('Execution failed'));

      expect(workflow.getStatus()).toBe(WorkflowStatus.ERROR);
      expect(workflow.getLastError()).toBe('Execution failed');
    });
  });

  describe('Workflow Business Rules', () => {
    let workflow: Workflow;

    beforeEach(() => {
      workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.generate(),
        'Business Rules Test',
        'Testing business rules'
      );
    });

    it('should enforce maximum action limit', () => {
      const tooManyActions = Array.from({ length: 51 }, (_, i) => ({
        id: `action-${i}`,
        type: 'email',
        config: { to: 'test@example.com', subject: `Test ${i}` },
        order: i + 1
      }));

      expect(() => {
        workflow.updateActions(tooManyActions);
      }).toThrow(DomainException);
    });

    it('should validate action ordering', () => {
      const invalidOrderActions = [
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test 1' },
          order: 1
        },
        {
          id: 'action-2',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test 2' },
          order: 1 // Duplicate order
        }
      ];

      expect(() => {
        workflow.updateActions(invalidOrderActions);
      }).toThrow(DomainException);
    });

    it('should prevent modification of active workflows', () => {
      workflow.updateActions([
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test' },
          order: 1
        }
      ]);

      workflow.activate();

      expect(() => {
        workflow.updateActions([
          {
            id: 'action-2',
            type: 'email',
            config: { to: 'test@example.com', subject: 'Modified' },
            order: 1
          }
        ]);
      }).toThrow(DomainException);
    });

    it('should allow modification of draft workflows', () => {
      expect(workflow.getStatus()).toBe(WorkflowStatus.DRAFT);

      const newActions = [
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test' },
          order: 1
        }
      ];

      expect(() => {
        workflow.updateActions(newActions);
      }).not.toThrow();

      expect(workflow.getActions()).toHaveLength(1);
    });
  });
});