import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../../server/storage';

describe('Database Storage', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    // Clear demo data for clean test environment
    storage['workflows'].clear();
    storage['users'].clear();
    storage['connectedApps'].clear();
    storage['activityLogs'].clear();
    storage['templates'].clear();
  });

  describe('User Operations', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      const user = await storage.createUser(userData);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
      expect(user.id).toBeDefined();
    });

    it('should retrieve user by email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      const createdUser = await storage.createUser(userData);
      const retrievedUser = await storage.getUserByEmail(userData.email);
      
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
    });

    it('should return undefined for non-existent user', async () => {
      const user = await storage.getUserByEmail('nonexistent@example.com');
      expect(user).toBeUndefined();
    });

    it('should update user data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      const user = await storage.createUser(userData);
      const updatedUser = await storage.updateUser(user.id, { displayName: 'Updated Name' });
      
      expect(updatedUser?.displayName).toBe('Updated Name');
    });
  });

  describe('Workflow Operations (Legacy Interface)', () => {
    it('should create a new workflow', async () => {
      const workflowData = {
        userId: 1,
        name: 'Test Workflow',
        description: 'A test workflow',
        status: 'draft' as const,
        config: { steps: [] }
      };

      const workflow = await storage.createWorkflow(workflowData);
      
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe(workflowData.name);
      expect(workflow.status).toBe(workflowData.status);
      expect(workflow.config).toEqual(workflowData.config);
    });

    it('should retrieve workflows by user ID', async () => {
      const userId = 1;
      const workflowData = {
        userId,
        name: 'Test Workflow',
        description: 'A test workflow',
        status: 'active' as const,
        config: { steps: [] }
      };

      await storage.createWorkflow(workflowData);
      const workflows = await storage.getWorkflowsByUserId(userId);
      
      expect(workflows).toHaveLength(1);
      expect(workflows[0].name).toBe(workflowData.name);
      expect(workflows[0].userId).toBe(userId);
    });

    it('should update workflow data', async () => {
      const workflowData = {
        userId: 1,
        name: 'Test Workflow',
        description: 'A test workflow',
        status: 'draft' as const,
        config: { steps: [] }
      };

      const workflow = await storage.createWorkflow(workflowData);
      const updatedWorkflow = await storage.updateWorkflow(workflow.id, { 
        name: 'Updated Workflow',
        status: 'active' as const 
      });
      
      expect(updatedWorkflow?.name).toBe('Updated Workflow');
      expect(updatedWorkflow?.status).toBe('active');
    });

    it('should delete a workflow', async () => {
      const workflowData = {
        userId: 1,
        name: 'Test Workflow',
        description: 'A test workflow',
        status: 'draft' as const,
        config: { steps: [] }
      };

      const workflow = await storage.createWorkflow(workflowData);
      const deleted = await storage.deleteWorkflow(workflow.id);
      
      expect(deleted).toBe(true);
      
      const retrievedWorkflow = await storage.getWorkflow(workflow.id);
      expect(retrievedWorkflow).toBeUndefined();
    });

    it('should get recent workflows', async () => {
      const userId = 1;
      
      // Create multiple workflows
      for (let i = 1; i <= 3; i++) {
        await storage.createWorkflow({
          userId,
          name: `Workflow ${i}`,
          description: `Test workflow ${i}`,
          status: 'active' as const,
          config: { steps: [] }
        });
      }

      const recentWorkflows = await storage.getRecentWorkflows(userId, 2);
      
      expect(recentWorkflows).toHaveLength(2);
      expect(recentWorkflows[0].userId).toBe(userId);
    });
  });

  describe('Dashboard Stats with Integration Metrics', () => {
    it('should return enhanced dashboard statistics', async () => {
      const userId = 1;
      
      // Create test data to ensure meaningful stats
      await storage.createWorkflow({
        userId,
        name: 'Active Workflow',
        description: 'Test workflow',
        status: 'active',
        config: { steps: [] }
      });

      await storage.createConnectedApp({
        userId,
        name: 'Test Integration',
        description: 'Test app',
        icon: 'test',
        status: 'connected',
        config: { apiKey: 'test' }
      });

      const stats = await storage.getDashboardStats(userId);
      
      expect(stats).toBeDefined();
      expect(typeof stats.activeWorkflows).toBe('number');
      expect(typeof stats.tasksAutomated).toBe('number');
      expect(typeof stats.connectedApps).toBe('number');
      expect(typeof stats.timeSaved).toBe('string');
      expect(stats.activeWorkflows).toBeGreaterThanOrEqual(0);
      expect(stats.connectedApps).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty user statistics', async () => {
      const userId = 999; // Non-existent user
      const stats = await storage.getDashboardStats(userId);
      
      expect(stats).toBeDefined();
      expect(stats.activeWorkflows).toBe(0);
      expect(stats.connectedApps).toBe(0);
      expect(stats.tasksAutomated).toBe(0);
    });
  });
});