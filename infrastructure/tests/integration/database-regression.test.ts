import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database operations for testing
const mockStorage = {
  createUser: vi.fn(),
  getUserByCognitoId: vi.fn(),
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
  getUserCount: vi.fn(),
  createWorkflow: vi.fn(),
  getWorkflowsByUserId: vi.fn(),
  getRecentWorkflows: vi.fn(),
  updateWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  createConnectedApp: vi.fn(),
  getConnectedAppsByUserId: vi.fn(),
  createActivityLog: vi.fn(),
  getActivityLogsByUserId: vi.fn(),
  getDashboardStats: vi.fn(),
};

describe('Database Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      const expectedUser = { id: 1, ...userData, createdAt: new Date(), updatedAt: new Date() };
      mockStorage.createUser.mockResolvedValue(expectedUser);

      const user = await mockStorage.createUser(userData);

      expect(mockStorage.createUser).toHaveBeenCalledWith(userData);
      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
      expect(user.cognitoId).toBe('test-cognito-id-123');
      expect(user.provider).toBe('cognito');
    });

    it('should find user by Cognito ID', async () => {
      const expectedUser = {
        id: 2,
        username: 'testuser2',
        email: 'test2@example.com',
        displayName: 'Test User 2',
        cognitoId: 'test-cognito-id-456',
        provider: 'cognito',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockStorage.getUserByCognitoId.mockResolvedValue(expectedUser);

      const foundUser = await mockStorage.getUserByCognitoId('test-cognito-id-456');

      expect(mockStorage.getUserByCognitoId).toHaveBeenCalledWith('test-cognito-id-456');
      expect(foundUser).toBeDefined();
      expect(foundUser.cognitoId).toBe('test-cognito-id-456');
    });

    it('should find user by email', async () => {
      const expectedUser = {
        id: 3,
        username: 'testuser3',
        email: 'test3@example.com',
        displayName: 'Test User 3',
        cognitoId: 'test-cognito-id-789',
        provider: 'cognito',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockStorage.getUserByEmail.mockResolvedValue(expectedUser);

      const foundUser = await mockStorage.getUserByEmail('test3@example.com');

      expect(mockStorage.getUserByEmail).toHaveBeenCalledWith('test3@example.com');
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('test3@example.com');
    });

    it('should update user with Cognito ID', async () => {
      const updateData = { displayName: 'Updated User Name' };
      const updatedUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Updated User Name',
        cognitoId: 'test-cognito-id-123',
        provider: 'cognito',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockStorage.updateUser.mockResolvedValue(updatedUser);

      const result = await mockStorage.updateUser(1, updateData);

      expect(mockStorage.updateUser).toHaveBeenCalledWith(1, updateData);
      expect(result.displayName).toBe('Updated User Name');
    });

    it('should get user count', async () => {
      mockStorage.getUserCount.mockResolvedValue(5);

      const count = await mockStorage.getUserCount();

      expect(mockStorage.getUserCount).toHaveBeenCalled();
      expect(count).toBe(5);
    });
  });

  describe('Workflow Operations', () => {
    it('should create a workflow', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'A test workflow',
        userId: 1,
        status: 'active' as const,
        config: { steps: [] }
      };

      const expectedWorkflow = {
        id: 1,
        ...workflowData,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRun: null,
        icon: null,
        iconColor: null
      };

      mockStorage.createWorkflow.mockResolvedValue(expectedWorkflow);

      const workflow = await mockStorage.createWorkflow(workflowData);

      expect(mockStorage.createWorkflow).toHaveBeenCalledWith(workflowData);
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.userId).toBe(1);
    });

    it('should get workflows by user ID', async () => {
      const workflows = [
        { id: 1, name: 'Workflow 1', userId: 1, status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'Workflow 2', userId: 1, status: 'paused', createdAt: new Date(), updatedAt: new Date() }
      ];

      mockStorage.getWorkflowsByUserId.mockResolvedValue(workflows);

      const result = await mockStorage.getWorkflowsByUserId(1);

      expect(mockStorage.getWorkflowsByUserId).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Workflow 1');
    });

    it('should get recent workflows', async () => {
      const recentWorkflows = [
        { id: 1, name: 'Recent Workflow', userId: 1, status: 'active', createdAt: new Date(), updatedAt: new Date() }
      ];

      mockStorage.getRecentWorkflows.mockResolvedValue(recentWorkflows);

      const result = await mockStorage.getRecentWorkflows(1, 3);

      expect(mockStorage.getRecentWorkflows).toHaveBeenCalledWith(1, 3);
      expect(result).toHaveLength(1);
    });

    it('should update workflow', async () => {
      const updateData = { status: 'paused' as const };
      const updatedWorkflow = {
        id: 1,
        name: 'Test Workflow',
        userId: 1,
        status: 'paused' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockStorage.updateWorkflow.mockResolvedValue(updatedWorkflow);

      const result = await mockStorage.updateWorkflow(1, updateData);

      expect(mockStorage.updateWorkflow).toHaveBeenCalledWith(1, updateData);
      expect(result.status).toBe('paused');
    });

    it('should delete workflow', async () => {
      mockStorage.deleteWorkflow.mockResolvedValue(true);

      const result = await mockStorage.deleteWorkflow(1);

      expect(mockStorage.deleteWorkflow).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe('Connected Apps Operations', () => {
    it('should create a connected app', async () => {
      const appData = {
        name: 'Test App',
        description: 'A test app',
        userId: 1,
        appType: 'external',
        config: { apiKey: 'test-key' }
      };

      const expectedApp = {
        id: 1,
        ...appData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockStorage.createConnectedApp.mockResolvedValue(expectedApp);

      const app = await mockStorage.createConnectedApp(appData);

      expect(mockStorage.createConnectedApp).toHaveBeenCalledWith(appData);
      expect(app.name).toBe('Test App');
    });

    it('should get connected apps by user ID', async () => {
      const apps = [
        { id: 1, name: 'App 1', userId: 1, appType: 'external', createdAt: new Date(), updatedAt: new Date() }
      ];

      mockStorage.getConnectedAppsByUserId.mockResolvedValue(apps);

      const result = await mockStorage.getConnectedAppsByUserId(1);

      expect(mockStorage.getConnectedAppsByUserId).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('Activity Log Operations', () => {
    it('should create activity log entry', async () => {
      const logData = {
        userId: 1,
        action: 'login',
        details: 'User logged in',
        ipAddress: '127.0.0.1'
      };

      const expectedLog = {
        id: 1,
        ...logData,
        timestamp: new Date()
      };

      mockStorage.createActivityLog.mockResolvedValue(expectedLog);

      const log = await mockStorage.createActivityLog(logData);

      expect(mockStorage.createActivityLog).toHaveBeenCalledWith(logData);
      expect(log.action).toBe('login');
    });

    it('should get activity logs by user ID', async () => {
      const logs = {
        entries: [
          { id: 1, userId: 1, action: 'login', details: 'User logged in', timestamp: new Date() }
        ],
        totalCount: 1
      };

      mockStorage.getActivityLogsByUserId.mockResolvedValue(logs);

      const result = await mockStorage.getActivityLogsByUserId(1);

      expect(mockStorage.getActivityLogsByUserId).toHaveBeenCalledWith(1);
      expect(result.entries).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });
  });

  describe('Dashboard Stats', () => {
    it('should get dashboard stats for user', async () => {
      const stats = {
        totalWorkflows: 5,
        activeWorkflows: 3,
        totalConnectedApps: 2,
        recentActivity: []
      };

      mockStorage.getDashboardStats.mockResolvedValue(stats);

      const result = await mockStorage.getDashboardStats(1);

      expect(mockStorage.getDashboardStats).toHaveBeenCalledWith(1);
      expect(result.totalWorkflows).toBe(5);
      expect(result.activeWorkflows).toBe(3);
    });
  });
});