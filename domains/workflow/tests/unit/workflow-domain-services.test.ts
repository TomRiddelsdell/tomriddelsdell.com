import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowValidationService } from '../../src/domain-services/WorkflowValidationService';
import { Workflow, WorkflowStatus, TriggerType, WorkflowId, WorkflowAction } from '../../src/entities/Workflow';
import { UserId } from '../../../shared-kernel/src/value-objects/UserId';
import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';

describe('Workflow Domain Services - Pure DDD', () => {
  let validationService: WorkflowValidationService;
  let workflow: Workflow;

  beforeEach(() => {
    validationService = new WorkflowValidationService();
    workflow = Workflow.create(
      WorkflowId.fromNumber(1),
      UserId.generate(),
      'Test Workflow',
      'Test Description'
    );
  });

  describe('WorkflowValidationService', () => {
    it('should reject workflows without actions', () => {
      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).toThrow(DomainException);
    });

    it('should validate workflows with proper actions', () => {
      const validActions: WorkflowAction[] = [
        {
          id: 'email-1',
          type: 'email',
          config: {
            to: 'test@example.com',
            subject: 'Test Email',
            body: 'Test body'
          },
          order: 1
        }
      ];

      workflow.updateActions(validActions);

      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).not.toThrow();
    });

    it('should reject workflows with too many actions', () => {
      const tooManyActions: WorkflowAction[] = Array.from({ length: 51 }, (_, i) => ({
        id: `action-${i}`,
        type: 'email',
        config: { to: 'test@example.com', subject: 'Test', body: 'Test' },
        order: i
      }));

      workflow.updateActions(tooManyActions);

      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).toThrow(DomainException);
    });

    it('should reject workflows with duplicate action orders', () => {
      const invalidActions: WorkflowAction[] = [
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test', body: 'Test' },
          order: 1
        },
        {
          id: 'action-2',
          type: 'webhook',
          config: { url: 'https://example.com/webhook', method: 'POST' },
          order: 1 // Duplicate order
        }
      ];

      workflow.updateActions(invalidActions);

      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).toThrow(DomainException);
    });

    it('should validate email action configurations', () => {
      const invalidEmailAction: WorkflowAction[] = [
        {
          id: 'email-1',
          type: 'email',
          config: {
            // Missing required fields
            subject: 'Test Email'
          },
          order: 1
        }
      ];

      workflow.updateActions(invalidEmailAction);

      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).toThrow(DomainException);
    });

    it('should validate webhook action configurations', () => {
      const invalidWebhookAction: WorkflowAction[] = [
        {
          id: 'webhook-1',
          type: 'webhook',
          config: {
            url: 'invalid-url', // Invalid URL format
            method: 'POST'
          },
          order: 1
        }
      ];

      workflow.updateActions(invalidWebhookAction);

      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).toThrow(DomainException);
    });

    it('should validate delay action configurations', () => {
      const validDelayAction: WorkflowAction[] = [
        {
          id: 'delay-1',
          type: 'delay',
          config: {
            duration: 5000 // 5 seconds
          },
          order: 1
        }
      ];

      workflow.updateActions(validDelayAction);

      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).not.toThrow();

      // Test invalid delay - too long
      const invalidDelayAction: WorkflowAction[] = [
        {
          id: 'delay-2',
          type: 'delay',
          config: {
            duration: 86400001 // More than 24 hours
          },
          order: 1
        }
      ];

      workflow.updateActions(invalidDelayAction);

      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).toThrow(DomainException);
    });

    it('should validate condition action configurations', () => {
      const validConditionAction: WorkflowAction[] = [
        {
          id: 'condition-1',
          type: 'condition',
          config: {
            condition: 'data.status === "active"'
          },
          order: 1
        }
      ];

      workflow.updateActions(validConditionAction);

      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).not.toThrow();

      // Test empty condition
      const invalidConditionAction: WorkflowAction[] = [
        {
          id: 'condition-2',
          type: 'condition',
          config: {
            condition: ''
          },
          order: 1
        }
      ];

      workflow.updateActions(invalidConditionAction);

      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).toThrow(DomainException);
    });

    it('should prevent deletion of active workflows', () => {
      const validActions: WorkflowAction[] = [
        {
          id: 'action-1',
          type: 'email',
          config: { to: 'test@example.com', subject: 'Test', body: 'Test' },
          order: 1
        }
      ];

      workflow.updateActions(validActions);
      workflow.activate();

      expect(() => {
        validationService.validateWorkflowForDeletion(workflow);
      }).toThrow(DomainException);
    });

    it('should allow deletion of inactive workflows', () => {
      expect(() => {
        validationService.validateWorkflowForDeletion(workflow);
      }).not.toThrow();

      workflow.pause();
      expect(() => {
        validationService.validateWorkflowForDeletion(workflow);
      }).not.toThrow();
    });

    it('should handle custom action types gracefully', () => {
      const customAction: WorkflowAction[] = [
        {
          id: 'custom-1',
          type: 'customAction',
          config: { customProperty: 'value' },
          order: 1
        }
      ];

      workflow.updateActions(customAction);

      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).not.toThrow();
    });

    it('should reject invalid custom action types', () => {
      const invalidCustomAction: WorkflowAction[] = [
        {
          id: 'invalid-1',
          type: '123-invalid', // Invalid format
          config: {},
          order: 1
        }
      ];

      workflow.updateActions(invalidCustomAction);

      expect(() => {
        validationService.validateWorkflowForActivation(workflow);
      }).toThrow(DomainException);
    });
  });
});