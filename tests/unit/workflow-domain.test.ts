import { describe, it, expect, beforeEach } from 'vitest';
import { Workflow, WorkflowStatus } from '../../src/domains/workflow/domain/entities/Workflow';
import { Template, TemplateIconType, TemplateIconColor } from '../../src/domains/workflow/domain/entities/Template';
import { ConnectedApp, AppConnectionStatus } from '../../src/domains/workflow/domain/entities/ConnectedApp';
import { WorkflowId } from '../../src/shared/kernel/value-objects/WorkflowId';
import { UserId } from '../../src/shared/kernel/value-objects/UserId';
import { TemplateId } from '../../src/shared/kernel/value-objects/TemplateId';
import { ConnectedAppId } from '../../src/shared/kernel/value-objects/ConnectedAppId';
import { WorkflowCreatedEvent, WorkflowStatusChangedEvent, WorkflowExecutedEvent } from '../../src/shared/kernel/events/DomainEvent';

describe('Workflow Domain', () => {
  describe('Value Objects', () => {
    it('should create valid WorkflowId', () => {
      const workflowId = WorkflowId.fromNumber(123);
      expect(workflowId.getValue()).toBe(123);
    });

    it('should throw error for invalid WorkflowId', () => {
      expect(() => WorkflowId.fromNumber(0)).toThrow('WorkflowId must be a positive number');
      expect(() => WorkflowId.fromNumber(-1)).toThrow('WorkflowId must be a positive number');
    });

    it('should create valid TemplateId', () => {
      const templateId = TemplateId.fromNumber(456);
      expect(templateId.getValue()).toBe(456);
    });

    it('should create valid ConnectedAppId', () => {
      const appId = ConnectedAppId.fromNumber(789);
      expect(appId.getValue()).toBe(789);
    });
  });

  describe('Workflow Entity', () => {
    let workflow: Workflow;

    beforeEach(() => {
      workflow = Workflow.create(
        WorkflowId.fromNumber(1),
        UserId.fromNumber(1),
        'Test Workflow',
        'A test workflow',
        { steps: [], triggers: [] }
      );
    });

    it('should create workflow with default values', () => {
      expect(workflow.getId().getValue()).toBe(1);
      expect(workflow.getUserId().getValue()).toBe(1);
      expect(workflow.getName()).toBe('Test Workflow');
      expect(workflow.getDescription()).toBe('A test workflow');
      expect(workflow.getStatus()).toBe(WorkflowStatus.DRAFT);
      expect(workflow.getExecutionCount()).toBe(0);
    });

    it('should emit WorkflowCreatedEvent when created', () => {
      const events = workflow.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(WorkflowCreatedEvent);
      expect((events[0] as WorkflowCreatedEvent).workflowId).toBe('1');
      expect((events[0] as WorkflowCreatedEvent).name).toBe('Test Workflow');
    });

    it('should update workflow details correctly', () => {
      workflow.updateDetails('Updated Name', 'Updated description');
      expect(workflow.getName()).toBe('Updated Name');
      expect(workflow.getDescription()).toBe('Updated description');
    });

    it('should update configuration', () => {
      const newConfig = { steps: [{ id: '1', type: 'action', name: 'Step 1', config: {}, position: { x: 0, y: 0 } }], triggers: [] };
      workflow.updateConfig(newConfig);
      expect(workflow.getConfig()).toEqual(newConfig);
    });

    it('should handle activation correctly', () => {
      // Add steps first
      const config = { 
        steps: [{ id: '1', type: 'action', name: 'Step 1', config: {}, position: { x: 0, y: 0 } }], 
        triggers: [] 
      };
      workflow.updateConfig(config);
      
      workflow.activate();
      expect(workflow.getStatus()).toBe(WorkflowStatus.ACTIVE);
      expect(workflow.isActive()).toBe(true);

      const events = workflow.getDomainEvents();
      const statusEvent = events.find(e => e instanceof WorkflowStatusChangedEvent) as WorkflowStatusChangedEvent;
      expect(statusEvent).toBeDefined();
      expect(statusEvent.newStatus).toBe(WorkflowStatus.ACTIVE);
    });

    it('should prevent activation without steps', () => {
      expect(() => workflow.activate()).toThrow('Cannot activate workflow without steps');
    });

    it('should handle pausing correctly', () => {
      // Activate first
      const config = { 
        steps: [{ id: '1', type: 'action', name: 'Step 1', config: {}, position: { x: 0, y: 0 } }], 
        triggers: [] 
      };
      workflow.updateConfig(config);
      workflow.activate();
      
      workflow.pause();
      expect(workflow.getStatus()).toBe(WorkflowStatus.PAUSED);
      expect(workflow.isActive()).toBe(false);
    });

    it('should prevent pausing non-active workflows', () => {
      expect(() => workflow.pause()).toThrow('Can only pause active workflows');
    });

    it('should handle execution correctly', () => {
      // Setup for execution
      const config = { 
        steps: [{ id: '1', type: 'action', name: 'Step 1', config: {}, position: { x: 0, y: 0 } }], 
        triggers: [] 
      };
      workflow.updateConfig(config);
      workflow.activate();

      const execution = workflow.execute('192.168.1.1');
      
      expect(execution.id).toBeDefined();
      expect(execution.status).toBe('running');
      expect(workflow.getExecutionCount()).toBe(1);
      expect(workflow.getLastRun()).toBeDefined();

      const events = workflow.getDomainEvents();
      const execEvent = events.find(e => e instanceof WorkflowExecutedEvent) as WorkflowExecutedEvent;
      expect(execEvent).toBeDefined();
      expect(execEvent.executionId).toBe(execution.id);
    });

    it('should prevent execution of inactive workflows', () => {
      expect(() => workflow.execute()).toThrow('Can only execute active workflows');
    });

    it('should handle error state correctly', () => {
      workflow.markAsError('Test error');
      expect(workflow.getStatus()).toBe(WorkflowStatus.ERROR);
    });

    it('should clone workflow correctly', () => {
      const cloned = workflow.clone('Cloned Workflow');
      expect(cloned.getName()).toBe('Cloned Workflow');
      expect(cloned.getDescription()).toBe('Copy of A test workflow');
      expect(cloned.getStatus()).toBe(WorkflowStatus.DRAFT);
      expect(cloned.getExecutionCount()).toBe(0);
    });

    it('should validate deletion permissions', () => {
      expect(workflow.canBeDeleted()).toBe(true); // Draft workflows can be deleted
      
      const config = { 
        steps: [{ id: '1', type: 'action', name: 'Step 1', config: {}, position: { x: 0, y: 0 } }], 
        triggers: [] 
      };
      workflow.updateConfig(config);
      workflow.activate();
      
      expect(workflow.canBeDeleted()).toBe(false); // Active workflows cannot be deleted
    });
  });

  describe('Template Entity', () => {
    let template: Template;

    beforeEach(() => {
      template = Template.create(
        TemplateId.fromNumber(1),
        'Test Template',
        'A test template',
        TemplateIconType.AUTOMATION,
        TemplateIconColor.BLUE,
        { steps: [], triggers: [] }
      );
    });

    it('should create template with default values', () => {
      expect(template.getId().getValue()).toBe(1);
      expect(template.getName()).toBe('Test Template');
      expect(template.getDescription()).toBe('A test template');
      expect(template.getIconType()).toBe(TemplateIconType.AUTOMATION);
      expect(template.getIconColor()).toBe(TemplateIconColor.BLUE);
      expect(template.getUsersCount()).toBe(0);
      expect(template.getIsActive()).toBe(true);
    });

    it('should track template usage', () => {
      template.markAsUsed('user123', 'workflow456');
      expect(template.getUsersCount()).toBe(1);
    });

    it('should determine popularity correctly', () => {
      expect(template.isPopular()).toBe(false);
      
      // Simulate many uses
      for (let i = 0; i < 100; i++) {
        template.markAsUsed(`user${i}`, `workflow${i}`);
      }
      
      expect(template.isPopular()).toBe(true);
    });

    it('should handle deactivation', () => {
      template.deactivate();
      expect(template.getIsActive()).toBe(false);
      
      template.activate();
      expect(template.getIsActive()).toBe(true);
    });

    it('should validate deletion permissions', () => {
      expect(template.canBeDeleted()).toBe(true); // No users
      
      template.markAsUsed('user1', 'workflow1');
      expect(template.canBeDeleted()).toBe(false); // Has users
    });
  });

  describe('ConnectedApp Entity', () => {
    let app: ConnectedApp;

    beforeEach(() => {
      app = ConnectedApp.create(
        ConnectedAppId.fromNumber(1),
        UserId.fromNumber(1),
        'Test App',
        'A test connected app',
        'test-icon',
        { apiKey: 'test-key' }
      );
    });

    it('should create connected app with default values', () => {
      expect(app.getId().getValue()).toBe(1);
      expect(app.getUserId().getValue()).toBe(1);
      expect(app.getName()).toBe('Test App');
      expect(app.getDescription()).toBe('A test connected app');
      expect(app.getStatus()).toBe(AppConnectionStatus.DISCONNECTED);
      expect(app.isConnected()).toBe(false);
    });

    it('should handle connection correctly', () => {
      const expiryDate = new Date(Date.now() + 3600000); // 1 hour from now
      app.connect('access-token', 'refresh-token', expiryDate);
      
      expect(app.getStatus()).toBe(AppConnectionStatus.CONNECTED);
      expect(app.isConnected()).toBe(true);
      expect(app.getAccessToken()).toBe('access-token');
      expect(app.getRefreshToken()).toBe('refresh-token');
      expect(app.hasValidToken()).toBe(true);
    });

    it('should handle disconnection correctly', () => {
      app.connect('access-token');
      expect(app.isConnected()).toBe(true);
      
      app.disconnect();
      expect(app.getStatus()).toBe(AppConnectionStatus.DISCONNECTED);
      expect(app.isConnected()).toBe(false);
      expect(app.getAccessToken()).toBeUndefined();
    });

    it('should validate token expiry correctly', () => {
      const expiredDate = new Date(Date.now() - 3600000); // 1 hour ago
      app.connect('access-token', 'refresh-token', expiredDate);
      
      expect(app.hasValidToken()).toBe(false);
    });

    it('should detect when token refresh is needed', () => {
      const soonToExpire = new Date(Date.now() + 60000); // 1 minute from now
      app.connect('access-token', 'refresh-token', soonToExpire);
      
      expect(app.needsTokenRefresh()).toBe(true);
    });

    it('should handle token refresh', () => {
      app.connect('old-token', 'refresh-token', new Date());
      
      const newExpiry = new Date(Date.now() + 3600000);
      app.refreshAccessToken('new-token', newExpiry);
      
      expect(app.getAccessToken()).toBe('new-token');
      expect(app.getTokenExpiry()).toBe(newExpiry);
    });

    it('should prevent refresh without refresh token', () => {
      app.connect('access-token'); // No refresh token
      
      expect(() => app.refreshAccessToken('new-token')).toThrow('No refresh token available');
    });

    it('should handle error state', () => {
      app.markAsError('Connection failed');
      expect(app.getStatus()).toBe(AppConnectionStatus.ERROR);
    });

    it('should prevent linking disconnected apps to workflows', () => {
      expect(() => app.linkToWorkflow('workflow123')).toThrow('Cannot link disconnected app to workflow');
    });
  });
});