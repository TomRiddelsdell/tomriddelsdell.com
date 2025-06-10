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

  describe('Workflow Business Logic', () => {
    it('should create workflow with comprehensive configuration', async () => {
      const workflowData: InsertWorkflow = {
        userId: 1,
        name: 'Advanced Email Workflow',
        description: 'Complex email processing workflow',
        status: 'draft',
        config: {
          steps: [
            {
              id: 'trigger-1',
              type: 'trigger',
              name: 'Email Received',
              config: { 
                provider: 'gmail',
                filters: ['label:important', 'from:client@example.com']
              },
              position: { x: 0, y: 0 }
            },
            {
              id: 'condition-1',
              type: 'condition',
              name: 'Check Attachment',
              config: { 
                condition: 'has_attachment',
                fileTypes: ['pdf', 'docx']
              },
              position: { x: 200, y: 0 },
              connections: ['action-1', 'action-2']
            },
            {
              id: 'action-1',
              type: 'action',
              name: 'Process Document',
              config: { 
                action: 'extract_text',
                outputFormat: 'json'
              },
              position: { x: 400, y: -50 }
            },
            {
              id: 'action-2',
              type: 'action',
              name: 'Send Notification',
              config: { 
                action: 'send_email',
                template: 'document_processed'
              },
              position: { x: 400, y: 50 }
            }
          ],
          triggers: [
            {
              type: 'webhook',
              config: { url: '/api/webhook/email-received' }
            }
          ],
          settings: {
            retryAttempts: 3,
            timeout: 30000,
            errorHandling: 'continue'
          }
        },
        icon: 'mail',
        iconColor: 'blue'
      };

      const workflow = await storage.createWorkflow(workflowData);

      expect(workflow.name).toBe('Advanced Email Workflow');
      expect(workflow.status).toBe('draft');
      expect(workflow.config.steps).toHaveLength(4);
      expect(workflow.config.steps[1].connections).toEqual(['action-1', 'action-2']);
      expect(workflow.config.settings.retryAttempts).toBe(3);
      expect(workflow.icon).toBe('mail');
    });

    it('should handle workflow status transitions correctly', async () => {
      const workflowData: InsertWorkflow = {
        userId: 1,
        name: 'Status Test Workflow',
        description: 'Testing status transitions',
        status: 'draft',
        config: {
          steps: [
            {
              id: 'step-1',
              type: 'action',
              name: 'Test Action',
              config: {},
              position: { x: 0, y: 0 }
            }
          ]
        }
      };

      // Create workflow in draft
      const workflow = await storage.createWorkflow(workflowData);
      expect(workflow.status).toBe('draft');

      // Activate workflow
      const activeWorkflow = await storage.updateWorkflow(workflow.id, { 
        status: 'active',
        lastRun: new Date()
      });
      expect(activeWorkflow?.status).toBe('active');
      expect(activeWorkflow?.lastRun).toBeInstanceOf(Date);

      // Pause workflow
      const pausedWorkflow = await storage.updateWorkflow(workflow.id, { status: 'paused' });
      expect(pausedWorkflow?.status).toBe('paused');

      // Deactivate workflow
      const inactiveWorkflow = await storage.updateWorkflow(workflow.id, { status: 'inactive' });
      expect(inactiveWorkflow?.status).toBe('inactive');
    });

    it('should validate complex workflow configurations', async () => {
      const complexConfig = {
        steps: [
          {
            id: 'start',
            type: 'trigger',
            name: 'Webhook Trigger',
            config: { endpoint: '/webhook' },
            position: { x: 0, y: 0 },
            connections: ['validate']
          },
          {
            id: 'validate',
            type: 'condition',
            name: 'Validate Input',
            config: { schema: 'user_data' },
            position: { x: 150, y: 0 },
            connections: ['process', 'error']
          },
          {
            id: 'process',
            type: 'action',
            name: 'Process Data',
            config: { processor: 'user_processor' },
            position: { x: 300, y: -50 },
            connections: ['notify']
          },
          {
            id: 'error',
            type: 'action',
            name: 'Handle Error',
            config: { action: 'log_error' },
            position: { x: 300, y: 50 }
          },
          {
            id: 'notify',
            type: 'action',
            name: 'Send Notification',
            config: { channel: 'email' },
            position: { x: 450, y: -50 }
          }
        ],
        triggers: [
          {
            type: 'schedule',
            config: { cron: '0 9 * * 1-5' }
          }
        ]
      };

      const workflow = await storage.createWorkflow({
        userId: 1,
        name: 'Complex Workflow',
        description: 'A complex multi-step workflow',
        status: 'draft',
        config: complexConfig
      });

      expect(workflow.config.steps).toHaveLength(5);
      expect(workflow.config.steps[1].connections).toEqual(['process', 'error']);
      expect(workflow.config.triggers[0].config.cron).toBe('0 9 * * 1-5');
    });

    it('should handle workflow execution tracking', async () => {
      const workflow = await storage.createWorkflow({
        userId: 1,
        name: 'Execution Test',
        description: 'Testing execution tracking',
        status: 'active',
        config: {
          steps: [
            {
              id: 'step1',
              type: 'action',
              name: 'Process',
              config: {},
              position: { x: 0, y: 0 }
            }
          ]
        }
      });

      // Record workflow execution
      const updatedWorkflow = await storage.updateWorkflow(workflow.id, {
        lastRun: new Date(),
        executionCount: (workflow.executionCount || 0) + 1
      });

      expect(updatedWorkflow?.lastRun).toBeInstanceOf(Date);
      expect(updatedWorkflow?.executionCount).toBe(1);
    });
  });

  describe('Template Operations', () => {
    it('should manage template popularity and usage tracking', async () => {
      const templates = await storage.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);

      const popularTemplates = await storage.getPopularTemplates(3);
      expect(popularTemplates.length).toBeLessThanOrEqual(3);
      
      // Verify popularity sorting
      for (let i = 1; i < popularTemplates.length; i++) {
        expect(popularTemplates[i-1].usersCount).toBeGreaterThanOrEqual(popularTemplates[i].usersCount);
      }
    });

    it('should instantiate workflow from template', async () => {
      const templates = await storage.getAllTemplates();
      const emailTemplate = templates.find(t => t.name.includes('Email')) || templates[0];
      
      // Create workflow from template
      const workflowFromTemplate = await storage.createWorkflow({
        userId: 1,
        name: `My ${emailTemplate.name}`,
        description: `Custom ${emailTemplate.description}`,
        status: 'draft',
        config: emailTemplate.config,
        icon: emailTemplate.iconType,
        iconColor: emailTemplate.iconColor
      });

      expect(workflowFromTemplate.name).toBe(`My ${emailTemplate.name}`);
      expect(workflowFromTemplate.config).toEqual(emailTemplate.config);
      expect(workflowFromTemplate.icon).toBe(emailTemplate.iconType);
    });

    it('should handle template configuration validation', async () => {
      const templates = await storage.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      templates.forEach(template => {
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.config).toBeDefined();
        
        // Handle cases where config might not have steps property
        if (template.config && typeof template.config === 'object') {
          if ('steps' in template.config) {
            expect(Array.isArray(template.config.steps)).toBe(true);
          }
        }
      });
    });
  });

  describe('Connected App Integration', () => {
    it('should manage OAuth app lifecycle', async () => {
      const appData = {
        userId: 1,
        name: 'Slack Integration',
        description: 'Connect to Slack for notifications',
        icon: 'slack',
        status: 'connected' as const,
        config: {
          clientId: 'slack_client_123',
          scopes: ['chat:write', 'channels:read']
        },
        accessToken: 'xoxb-access-token',
        refreshToken: 'xoxb-refresh-token',
        tokenExpiry: new Date(Date.now() + 3600000)
      };

      const app = await storage.createConnectedApp(appData);

      expect(app.name).toBe('Slack Integration');
      expect(app.status).toBe('connected');
      expect(app.config.scopes).toEqual(['chat:write', 'channels:read']);
      expect(app.accessToken).toBe('xoxb-access-token');
      expect(app.tokenExpiry).toBeInstanceOf(Date);
    });

    it('should handle token refresh scenarios', async () => {
      const initialApp = await storage.createConnectedApp({
        userId: 1,
        name: 'Google Sheets',
        description: 'Google Sheets integration',
        icon: 'sheets',
        status: 'connected',
        config: { clientId: 'google_client' },
        accessToken: 'old_access_token',
        refreshToken: 'refresh_token',
        tokenExpiry: new Date(Date.now() - 1000) // Expired
      });

      // Simulate token refresh
      const refreshedApp = await storage.updateConnectedApp(initialApp.id, {
        accessToken: 'new_access_token',
        tokenExpiry: new Date(Date.now() + 3600000)
      });

      expect(refreshedApp?.accessToken).toBe('new_access_token');
      expect(refreshedApp?.tokenExpiry?.getTime()).toBeGreaterThan(Date.now());
    });

    it('should manage app connection status transitions', async () => {
      const app = await storage.createConnectedApp({
        userId: 1,
        name: 'Test App',
        description: 'Test application',
        icon: 'test',
        status: 'disconnected',
        config: {}
      });

      // Connect app
      const connectedApp = await storage.updateConnectedApp(app.id, {
        status: 'connected',
        accessToken: 'access_token',
        tokenExpiry: new Date(Date.now() + 3600000)
      });

      expect(connectedApp?.status).toBe('connected');
      expect(connectedApp?.accessToken).toBe('access_token');

      // Disconnect app
      const disconnectedApp = await storage.updateConnectedApp(app.id, {
        status: 'disconnected',
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null
      });

      expect(disconnectedApp?.status).toBe('disconnected');
      expect(disconnectedApp?.accessToken).toBeNull();
    });
  });

  describe('Workflow Configuration Validation', () => {
    it('should validate step connections integrity', async () => {
      const configWithValidConnections = {
        steps: [
          {
            id: 'step1',
            type: 'trigger',
            name: 'Start',
            config: {},
            position: { x: 0, y: 0 },
            connections: ['step2']
          },
          {
            id: 'step2',
            type: 'action',
            name: 'Process',
            config: {},
            position: { x: 200, y: 0 },
            connections: ['step3']
          },
          {
            id: 'step3',
            type: 'action',
            name: 'End',
            config: {},
            position: { x: 400, y: 0 }
          }
        ]
      };

      const workflow = await storage.createWorkflow({
        userId: 1,
        name: 'Connection Test',
        description: 'Testing step connections',
        status: 'draft',
        config: configWithValidConnections
      });

      expect(workflow.config.steps[0].connections).toEqual(['step2']);
      expect(workflow.config.steps[1].connections).toEqual(['step3']);
    });

    it('should handle missing step connections gracefully', async () => {
      const configWithInvalidConnections = {
        steps: [
          {
            id: 'step1',
            type: 'trigger',
            name: 'Start',
            config: {},
            position: { x: 0, y: 0 },
            connections: ['nonexistent_step']
          }
        ]
      };

      const workflow = await storage.createWorkflow({
        userId: 1,
        name: 'Invalid Connection Test',
        description: 'Testing invalid connections',
        status: 'draft',
        config: configWithInvalidConnections
      });

      // Workflow should still be created but with invalid connections preserved
      expect(workflow.config.steps[0].connections).toEqual(['nonexistent_step']);
    });
  });
});