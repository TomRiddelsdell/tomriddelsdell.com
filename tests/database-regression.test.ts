import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DatabaseStorage } from '../server/DatabaseStorage';
import { db } from '../server/db';
import { users, workflows, connectedApps, activityLogs } from '../shared/schema';
import { eq } from 'drizzle-orm';

describe('Database Regression Tests', () => {
  let storage: DatabaseStorage;
  
  beforeAll(async () => {
    storage = new DatabaseStorage();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await db.delete(activityLogs);
    await db.delete(connectedApps);
    await db.delete(workflows);
    await db.delete(users);
  });

  describe('User Operations', () => {
    it('should create a user with Cognito ID', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        cognitoId: 'test-cognito-id-123',
        provider: 'cognito'
      };

      const user = await storage.createUser(userData);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
      expect(user.cognitoId).toBe('test-cognito-id-123');
      expect(user.provider).toBe('cognito');
    });

    it('should find user by Cognito ID', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        displayName: 'Test User 2',
        cognitoId: 'test-cognito-id-456',
        provider: 'cognito'
      };

      const createdUser = await storage.createUser(userData);
      const foundUser = await storage.getUserByCognitoId('test-cognito-id-456');

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe('test2@example.com');
    });

    it('should find user by email', async () => {
      const userData = {
        username: 'testuser3',
        email: 'test3@example.com',
        displayName: 'Test User 3',
        cognitoId: 'test-cognito-id-789',
        provider: 'cognito'
      };

      await storage.createUser(userData);
      const foundUser = await storage.getUserByEmail('test3@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('test3@example.com');
    });

    it('should update user with Cognito ID', async () => {
      const userData = {
        username: 'testuser4',
        email: 'test4@example.com',
        displayName: 'Test User 4',
        provider: 'local'
      };

      const createdUser = await storage.createUser(userData);
      const updatedUser = await storage.updateUser(createdUser.id, {
        cognitoId: 'new-cognito-id',
        provider: 'cognito'
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.cognitoId).toBe('new-cognito-id');
      expect(updatedUser?.provider).toBe('cognito');
    });

    it('should get user count', async () => {
      await storage.createUser({
        username: 'user1',
        email: 'user1@example.com',
        displayName: 'User 1',
        provider: 'cognito'
      });

      await storage.createUser({
        username: 'user2',
        email: 'user2@example.com',
        displayName: 'User 2',
        provider: 'cognito'
      });

      const count = await storage.getUserCount();
      expect(count).toBe(2);
    });
  });

  describe('Workflow Operations', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await storage.createUser({
        username: 'workflowuser',
        email: 'workflow@example.com',
        displayName: 'Workflow User',
        provider: 'cognito'
      });
    });

    it('should create a workflow', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'A test workflow',
        userId: testUser.id,
        config: { steps: [] },
        status: 'active' as const
      };

      const workflow = await storage.createWorkflow(workflowData);

      expect(workflow).toHaveProperty('id');
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.userId).toBe(testUser.id);
      expect(workflow.status).toBe('active');
    });

    it('should get workflows by user ID', async () => {
      await storage.createWorkflow({
        name: 'Workflow 1',
        description: 'First workflow',
        userId: testUser.id,
        config: { steps: [] },
        status: 'active' as const
      });

      await storage.createWorkflow({
        name: 'Workflow 2',
        description: 'Second workflow',
        userId: testUser.id,
        config: { steps: [] },
        status: 'paused' as const
      });

      const workflows = await storage.getWorkflowsByUserId(testUser.id);

      expect(workflows).toHaveLength(2);
      expect(workflows[0].name).toBe('Workflow 1');
      expect(workflows[1].name).toBe('Workflow 2');
    });

    it('should get recent workflows', async () => {
      await storage.createWorkflow({
        name: 'Recent Workflow',
        description: 'A recent workflow',
        userId: testUser.id,
        config: { steps: [] },
        status: 'active' as const
      });

      const recentWorkflows = await storage.getRecentWorkflows(testUser.id, 5);

      expect(recentWorkflows).toHaveLength(1);
      expect(recentWorkflows[0].name).toBe('Recent Workflow');
    });

    it('should update workflow', async () => {
      const workflow = await storage.createWorkflow({
        name: 'Original Name',
        description: 'Original description',
        userId: testUser.id,
        config: { steps: [] },
        status: 'draft' as const
      });

      const updatedWorkflow = await storage.updateWorkflow(workflow.id, {
        name: 'Updated Name',
        status: 'active' as const
      });

      expect(updatedWorkflow).toBeDefined();
      expect(updatedWorkflow?.name).toBe('Updated Name');
      expect(updatedWorkflow?.status).toBe('active');
    });

    it('should delete workflow', async () => {
      const workflow = await storage.createWorkflow({
        name: 'To Be Deleted',
        description: 'Will be deleted',
        userId: testUser.id,
        config: { steps: [] },
        status: 'draft' as const
      });

      const deleted = await storage.deleteWorkflow(workflow.id);
      expect(deleted).toBe(true);

      const found = await storage.getWorkflow(workflow.id);
      expect(found).toBeUndefined();
    });
  });

  describe('Connected Apps Operations', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await storage.createUser({
        username: 'appuser',
        email: 'app@example.com',
        displayName: 'App User',
        provider: 'cognito'
      });
    });

    it('should create a connected app', async () => {
      const appData = {
        name: 'Test App',
        description: 'A test app',
        userId: testUser.id,
        status: 'connected' as const,
        config: { apiKey: 'test-key' }
      };

      const app = await storage.createConnectedApp(appData);

      expect(app).toHaveProperty('id');
      expect(app.name).toBe('Test App');
      expect(app.userId).toBe(testUser.id);
      expect(app.status).toBe('connected');
    });

    it('should get connected apps by user ID', async () => {
      await storage.createConnectedApp({
        name: 'App 1',
        description: 'First app',
        userId: testUser.id,
        status: 'connected' as const,
        config: { apiKey: 'key1' }
      });

      await storage.createConnectedApp({
        name: 'App 2',
        description: 'Second app',
        userId: testUser.id,
        status: 'disconnected' as const,
        config: { apiKey: 'key2' }
      });

      const apps = await storage.getConnectedAppsByUserId(testUser.id);

      expect(apps).toHaveLength(2);
      expect(apps[0].name).toBe('App 1');
      expect(apps[1].name).toBe('App 2');
    });
  });

  describe('Activity Log Operations', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await storage.createUser({
        username: 'loguser',
        email: 'log@example.com',
        displayName: 'Log User',
        provider: 'cognito'
      });
    });

    it('should create activity log entry', async () => {
      const logData = {
        userId: testUser.id,
        eventType: 'login',
        status: 'success',
        details: { ip: '127.0.0.1' }
      };

      const log = await storage.createActivityLog(logData);

      expect(log).toHaveProperty('id');
      expect(log.userId).toBe(testUser.id);
      expect(log.eventType).toBe('login');
      expect(log.status).toBe('success');
    });

    it('should get activity logs by user ID', async () => {
      await storage.createActivityLog({
        userId: testUser.id,
        eventType: 'login',
        status: 'success',
        details: { ip: '127.0.0.1' }
      });

      await storage.createActivityLog({
        userId: testUser.id,
        eventType: 'logout',
        status: 'success',
        details: { ip: '127.0.0.1' }
      });

      const result = await storage.getActivityLogsByUserId(testUser.id, 1, 10);

      expect(result.entries).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });
  });

  describe('Dashboard Stats', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await storage.createUser({
        username: 'statsuser',
        email: 'stats@example.com',
        displayName: 'Stats User',
        provider: 'cognito'
      });
    });

    it('should get dashboard stats for user', async () => {
      // Create some test data
      await storage.createWorkflow({
        name: 'Active Workflow',
        description: 'An active workflow',
        userId: testUser.id,
        config: { steps: [] },
        status: 'active' as const
      });

      await storage.createConnectedApp({
        name: 'Connected App',
        description: 'A connected app',
        userId: testUser.id,
        status: 'connected' as const,
        config: { apiKey: 'test-key' }
      });

      const stats = await storage.getDashboardStats(testUser.id);

      expect(stats).toHaveProperty('activeWorkflows');
      expect(stats).toHaveProperty('connectedApps');
      expect(stats).toHaveProperty('tasksAutomated');
      expect(stats.activeWorkflows).toBeGreaterThanOrEqual(1);
    });
  });
});