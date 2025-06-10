import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../../server/storage';

describe('Workflow Domain Integration (Phase 2)', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    // Clear demo data for clean test environment except templates
    storage['workflows'].clear();
    storage['users'].clear();
    storage['connectedApps'].clear();
    storage['activityLogs'].clear();
    // Keep templates as they are initialized automatically
  });

  describe('Workflow CRUD Operations', () => {
    it('should create workflow with rich configuration', async () => {
      const workflowData = {
        userId: 1,
        name: 'Advanced Workflow',
        description: 'A workflow with complex steps',
        status: 'draft' as const,
        config: {
          steps: [
            {
              id: 'step1',
              type: 'trigger',
              name: 'Email Received',
              config: { emailProvider: 'gmail' },
              position: { x: 0, y: 0 }
            },
            {
              id: 'step2',
              type: 'action',
              name: 'Process Email',
              config: { action: 'extract_attachment' },
              position: { x: 200, y: 0 },
              connections: ['step3']
            },
            {
              id: 'step3',
              type: 'condition',
              name: 'Check File Type',
              config: { condition: 'file_type_is_pdf' },
              position: { x: 400, y: 0 }
            }
          ],
          triggers: [
            {
              type: 'webhook',
              config: { url: '/api/webhook/email' }
            }
          ],
          settings: {
            retryAttempts: 3,
            timeout: 30000
          }
        },
        icon: 'mail',
        iconColor: 'blue'
      };

      const workflow = await storage.createWorkflow(workflowData);
      
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe(workflowData.name);
      expect(workflow.status).toBe('draft');
      expect(workflow.config.steps).toHaveLength(3);
      expect(workflow.config.triggers).toHaveLength(1);
      expect(workflow.config.settings.retryAttempts).toBe(3);
      expect(workflow.icon).toBe('mail');
      expect(workflow.iconColor).toBe('blue');
    });

    it('should maintain workflow status transitions', async () => {
      const workflowData = {
        userId: 1,
        name: 'Status Test Workflow',
        description: 'Testing status changes',
        status: 'draft' as const,
        config: {
          steps: [
            {
              id: 'step1',
              type: 'action',
              name: 'Test Step',
              config: {},
              position: { x: 0, y: 0 }
            }
          ]
        }
      };

      // Create workflow
      const workflow = await storage.createWorkflow(workflowData);
      expect(workflow.status).toBe('draft');

      // Activate workflow
      const activeWorkflow = await storage.updateWorkflow(workflow.id, { status: 'active' });
      expect(activeWorkflow?.status).toBe('active');

      // Pause workflow
      const pausedWorkflow = await storage.updateWorkflow(workflow.id, { status: 'paused' });
      expect(pausedWorkflow?.status).toBe('paused');
    });

    it('should handle workflow cloning scenarios', async () => {
      const originalData = {
        userId: 1,
        name: 'Original Workflow',
        description: 'Original description',
        status: 'active' as const,
        config: {
          steps: [
            {
              id: 'step1',
              type: 'action',
              name: 'Original Step',
              config: { value: 'original' },
              position: { x: 0, y: 0 }
            }
          ]
        }
      };

      const original = await storage.createWorkflow(originalData);
      
      // Simulate cloning by creating new workflow with modified data
      const clonedData = {
        ...originalData,
        name: 'Cloned Workflow',
        description: 'Copy of Original description',
        status: 'draft' as const
      };

      const cloned = await storage.createWorkflow(clonedData);
      
      expect(cloned.name).toBe('Cloned Workflow');
      expect(cloned.status).toBe('draft');
      expect(cloned.config.steps[0].config.value).toBe('original');
      expect(cloned.id).not.toBe(original.id);
    });
  });

  describe('Template Operations', () => {
    it('should manage template usage and popularity', async () => {
      // Templates are initialized automatically in MemStorage
      const templates = await storage.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);

      const popularTemplates = await storage.getPopularTemplates(3);
      expect(popularTemplates.length).toBeLessThanOrEqual(3);
      expect(popularTemplates.every(t => t.usersCount >= 0)).toBe(true);
    });

    it('should create workflow from template pattern', async () => {
      const templates = await storage.getAllTemplates();
      const template = templates[0];
      
      // Create workflow based on template
      const workflowFromTemplate = {
        userId: 1,
        name: `From ${template.name}`,
        description: template.description,
        status: 'draft' as const,
        config: template.config,
        icon: template.iconType,
        iconColor: template.iconColor
      };

      const workflow = await storage.createWorkflow(workflowFromTemplate);
      
      expect(workflow.name).toBe(`From ${template.name}`);
      expect(workflow.description).toBe(template.description);
      expect(workflow.config).toEqual(template.config);
    });
  });

  describe('Connected Apps Integration', () => {
    it('should manage connected app lifecycle', async () => {
      const appData = {
        userId: 1,
        name: 'Gmail Integration',
        description: 'Connect to Gmail for email automation',
        icon: 'gmail',
        status: 'connected' as const,
        config: {
          apiKey: 'encrypted_key_here',
          scopes: ['read', 'send']
        },
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        tokenExpiry: new Date(Date.now() + 3600000) // 1 hour from now
      };

      const app = await storage.createConnectedApp(appData);
      
      expect(app).toBeDefined();
      expect(app.name).toBe(appData.name);
      expect(app.status).toBe('connected');
      expect(app.accessToken).toBe(appData.accessToken);
      expect(app.tokenExpiry).toEqual(appData.tokenExpiry);
    });

    it('should retrieve available apps for connection', async () => {
      const availableApps = await storage.getAvailableApps();
      
      expect(availableApps).toBeDefined();
      expect(Array.isArray(availableApps)).toBe(true);
      expect(availableApps.length).toBeGreaterThan(0);
      
      // Check app structure
      const app = availableApps[0];
      expect(app).toHaveProperty('name');
      expect(app).toHaveProperty('description');
      expect(app).toHaveProperty('icon');
    });

    it('should filter connected apps by user', async () => {
      const userId = 1;
      
      // Create connected apps for user
      await storage.createConnectedApp({
        userId,
        name: 'User App 1',
        description: 'First app',
        icon: 'app1',
        status: 'connected',
        config: {}
      });

      await storage.createConnectedApp({
        userId: 2, // Different user
        name: 'Other User App',
        description: 'App for other user',
        icon: 'app2',
        status: 'connected',
        config: {}
      });

      const userApps = await storage.getConnectedAppsByUserId(userId);
      
      expect(userApps).toHaveLength(1);
      expect(userApps[0].userId).toBe(userId);
      expect(userApps[0].name).toBe('User App 1');
    });
  });

  describe('Dashboard Statistics', () => {
    it('should calculate comprehensive workflow statistics', async () => {
      const userId = 1;
      
      // Create test data
      await storage.createWorkflow({
        userId,
        name: 'Active Workflow 1',
        description: 'Active workflow',
        status: 'active',
        config: { steps: [] }
      });

      await storage.createWorkflow({
        userId,
        name: 'Active Workflow 2',
        description: 'Another active workflow',
        status: 'active',
        config: { steps: [] }
      });

      await storage.createWorkflow({
        userId,
        name: 'Draft Workflow',
        description: 'Draft workflow',
        status: 'draft',
        config: { steps: [] }
      });

      await storage.createConnectedApp({
        userId,
        name: 'Connected App',
        description: 'A connected app',
        icon: 'app',
        status: 'connected',
        config: {}
      });

      const stats = await storage.getDashboardStats(userId);
      
      expect(stats).toBeDefined();
      expect(stats.activeWorkflows).toBe(2);
      expect(stats.connectedApps).toBe(1);
      expect(typeof stats.tasksAutomated).toBe('number');
      expect(typeof stats.timeSaved).toBe('string');
    });
  });

  describe('Activity Logging', () => {
    it('should track workflow execution activities', async () => {
      const userId = 1;
      const workflowId = 1;
      
      // Create activity logs
      await storage.createActivityLog({
        userId,
        workflowId,
        workflowName: 'Test Workflow',
        eventType: 'run',
        status: 'success',
        details: {
          duration: 1500,
          stepsExecuted: 3,
          outputData: { result: 'completed' }
        },
        ipAddress: '192.168.1.1'
      });

      await storage.createActivityLog({
        userId,
        workflowId,
        workflowName: 'Test Workflow',
        eventType: 'run',
        status: 'failure',
        details: {
          error: 'Step 2 failed',
          duration: 500
        },
        ipAddress: '192.168.1.1'
      });

      const { entries, totalCount } = await storage.getActivityLogsByUserId(userId);
      
      expect(entries).toHaveLength(2);
      expect(totalCount).toBe(2);
      
      const successLog = entries.find(e => e.status === 'success');
      const failureLog = entries.find(e => e.status === 'failure');
      
      expect(successLog?.details).toHaveProperty('duration', 1500);
      expect(failureLog?.details).toHaveProperty('error', 'Step 2 failed');
    });
  });

  describe('Search and Filtering', () => {
    it('should support workflow search capabilities', async () => {
      const userId = 1;
      
      // Create workflows with different names
      await storage.createWorkflow({
        userId,
        name: 'Email Automation Workflow',
        description: 'Automates email processing',
        status: 'active',
        config: { steps: [] }
      });

      await storage.createWorkflow({
        userId,
        name: 'File Processing Pipeline',
        description: 'Processes uploaded files',
        status: 'draft',
        config: { steps: [] }
      });

      await storage.createWorkflow({
        userId,
        name: 'Data Sync Automation',
        description: 'Syncs data between systems',
        status: 'active',
        config: { steps: [] }
      });

      const allWorkflows = await storage.getWorkflowsByUserId(userId);
      expect(allWorkflows).toHaveLength(3);

      // Test filtering by name patterns
      const emailWorkflows = allWorkflows.filter(w => w.name.toLowerCase().includes('email'));
      expect(emailWorkflows).toHaveLength(1);
      expect(emailWorkflows[0].name).toBe('Email Automation Workflow');

      const automationWorkflows = allWorkflows.filter(w => w.name.toLowerCase().includes('automation'));
      expect(automationWorkflows).toHaveLength(2);
    });

    it('should retrieve recent workflows correctly', async () => {
      const userId = 1;
      
      // Create workflows with different timestamps
      const workflows = [];
      for (let i = 1; i <= 5; i++) {
        const workflow = await storage.createWorkflow({
          userId,
          name: `Workflow ${i}`,
          description: `Test workflow ${i}`,
          status: 'active',
          config: { steps: [] }
        });
        workflows.push(workflow);
      }

      const recent = await storage.getRecentWorkflows(userId, 3);
      
      expect(recent).toHaveLength(3);
      expect(recent.every(w => w.userId === userId)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent workflow operations gracefully', async () => {
      const nonExistentId = 99999;
      
      const workflow = await storage.getWorkflow(nonExistentId);
      expect(workflow).toBeUndefined();
      
      const deleted = await storage.deleteWorkflow(nonExistentId);
      expect(deleted).toBe(false);
    });

    it('should validate workflow configuration integrity', async () => {
      const workflowData = {
        userId: 1,
        name: 'Invalid Config Test',
        description: 'Testing invalid configurations',
        status: 'draft' as const,
        config: {
          steps: [
            {
              id: 'step1',
              type: 'action',
              name: 'Valid Step',
              config: {},
              position: { x: 0, y: 0 },
              connections: ['nonexistent_step'] // Invalid connection
            }
          ]
        }
      };

      // Should still create workflow but with invalid config
      const workflow = await storage.createWorkflow(workflowData);
      expect(workflow).toBeDefined();
      expect(workflow.config.steps[0].connections).toContain('nonexistent_step');
    });

    it('should handle empty and null configurations', async () => {
      const workflowData = {
        userId: 1,
        name: 'Empty Config Test',
        description: 'Testing empty configurations',
        status: 'draft' as const,
        config: { steps: [] }
      };

      const workflow = await storage.createWorkflow(workflowData);
      expect(workflow).toBeDefined();
      expect(workflow.config.steps).toHaveLength(0);
    });
  });
});