import { 
  User, InsertUser, 
  Workflow, InsertWorkflow, 
  ConnectedApp, InsertConnectedApp, 
  Template, InsertTemplate, 
  ActivityLogEntry, InsertActivityLog,
  DashboardStats
} from "../../../domains/shared-kernel/src/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCognitoId(cognitoId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  getActiveUserCount(): Promise<number>;
  getNewUserCount(days: number): Promise<number>;
  trackUserLogin(userId: number): Promise<void>;
  getTotalLoginCount(): Promise<number>;
  
  // Workflow operations 
  getWorkflow(id: number): Promise<Workflow | undefined>;
  getWorkflowsByUserId(userId: number): Promise<Workflow[]>;
  getRecentWorkflows(userId: number, limit?: number): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflowData: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;
  
  // Connected app operations
  getConnectedApp(id: number): Promise<ConnectedApp | undefined>;
  getConnectedAppsByUserId(userId: number): Promise<ConnectedApp[]>;
  getAvailableApps(): Promise<ConnectedApp[]>;
  createConnectedApp(app: InsertConnectedApp): Promise<ConnectedApp>;
  updateConnectedApp(id: number, appData: Partial<ConnectedApp>): Promise<ConnectedApp | undefined>;
  deleteConnectedApp(id: number): Promise<boolean>;
  
  // Template operations
  getTemplate(id: number): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getPopularTemplates(limit?: number): Promise<Template[]>;
  
  // Activity log operations
  getActivityLog(id: number): Promise<ActivityLogEntry | undefined>;
  getActivityLogsByUserId(userId: number, page?: number, perPage?: number): Promise<{
    entries: ActivityLogEntry[];
    totalCount: number;
  }>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLogEntry>;
  getLoginActivity(page?: number, limit?: number): Promise<{
    entries: ActivityLogEntry[];
    totalCount: number;
  }>;
  
  // Dashboard operations
  getDashboardStats(userId: number): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workflows: Map<number, Workflow>;
  private connectedApps: Map<number, ConnectedApp>;
  private templates: Map<number, Template>;
  private activityLogs: Map<number, ActivityLogEntry>;
  private availableApps: ConnectedApp[];
  
  private userId: number;
  private workflowId: number;
  private appId: number;
  private templateId: number;
  private logId: number;

  constructor() {
    this.users = new Map();
    this.workflows = new Map();
    this.connectedApps = new Map();
    this.templates = new Map();
    this.activityLogs = new Map();
    this.availableApps = [];
    
    this.userId = 1;
    this.workflowId = 1;
    this.appId = 1;
    this.templateId = 1;
    this.logId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByCognitoId(cognitoId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.cognitoId === cognitoId
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  async getActiveUserCount(): Promise<number> {
    return Array.from(this.users.values()).filter(user => user.isActive).length;
  }

  async getNewUserCount(days: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    return Array.from(this.users.values()).filter(user => 
      user.createdAt && user.createdAt > cutoffDate
    ).length;
  }

  async trackUserLogin(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      this.users.set(userId, user);
    }
  }

  async getTotalLoginCount(): Promise<number> {
    return Array.from(this.users.values()).reduce((total, user) => 
      total + (user.loginCount || 0), 0
    );
  }

  async getLoginActivity(page: number = 1, limit: number = 20): Promise<{
    entries: ActivityLogEntry[];
    totalCount: number;
  }> {
    const loginLogs = Array.from(this.activityLogs.values())
      .filter(log => log.action === 'login')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const totalCount = loginLogs.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedLogs = loginLogs.slice(start, end);
    
    return {
      entries: paginatedLogs,
      totalCount
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      lastLogin: now,
      createdAt: now,
      updatedAt: now,
      role: 'user',
      isActive: true,
      loginCount: 0,
      lastIP: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      ...userData,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Workflow operations
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getWorkflowsByUserId(userId: number): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(
      (workflow) => workflow.userId === userId
    );
  }

  async getRecentWorkflows(userId: number, limit: number = 3): Promise<Workflow[]> {
    return Array.from(this.workflows.values())
      .filter((workflow) => workflow.userId === userId)
      .sort((a, b) => {
        // Sort by last run date or creation date if no runs
        const aDate = a.lastRun || a.createdAt;
        const bDate = b.lastRun || b.createdAt;
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, limit);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = this.workflowId++;
    const now = new Date();
    const workflow: Workflow = {
      ...insertWorkflow,
      id,
      createdAt: now,
      updatedAt: now,
      lastRun: null
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: number, workflowData: Partial<Workflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updatedWorkflow = {
      ...workflow,
      ...workflowData,
      updatedAt: new Date()
    };
    
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // Connected app operations
  async getConnectedApp(id: number): Promise<ConnectedApp | undefined> {
    return this.connectedApps.get(id);
  }

  async getConnectedAppsByUserId(userId: number): Promise<ConnectedApp[]> {
    return Array.from(this.connectedApps.values()).filter(
      (app) => app.userId === userId
    );
  }

  async getAvailableApps(): Promise<ConnectedApp[]> {
    return this.availableApps;
  }

  async createConnectedApp(insertApp: InsertConnectedApp): Promise<ConnectedApp> {
    const id = this.appId++;
    const now = new Date();
    const app: ConnectedApp = {
      ...insertApp,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.connectedApps.set(id, app);
    return app;
  }

  async updateConnectedApp(id: number, appData: Partial<ConnectedApp>): Promise<ConnectedApp | undefined> {
    const app = this.connectedApps.get(id);
    if (!app) return undefined;
    
    const updatedApp = {
      ...app,
      ...appData,
      updatedAt: new Date()
    };
    
    this.connectedApps.set(id, updatedApp);
    return updatedApp;
  }

  async deleteConnectedApp(id: number): Promise<boolean> {
    return this.connectedApps.delete(id);
  }

  // Template operations
  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getPopularTemplates(limit: number = 5): Promise<Template[]> {
    return Array.from(this.templates.values())
      .sort((a, b) => b.usersCount - a.usersCount)
      .slice(0, limit);
  }

  // Activity log operations
  async getActivityLog(id: number): Promise<ActivityLogEntry | undefined> {
    return this.activityLogs.get(id);
  }

  async getActivityLogsByUserId(userId: number, page: number = 1, perPage: number = 20): Promise<{
    entries: ActivityLogEntry[];
    totalCount: number;
  }> {
    const logs = Array.from(this.activityLogs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const totalCount = logs.length;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedLogs = logs.slice(start, end);
    
    return {
      entries: paginatedLogs,
      totalCount
    };
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLogEntry> {
    const id = this.logId++;
    const now = new Date();
    const log: ActivityLogEntry = {
      ...insertLog,
      id,
      timestamp: now
    };
    this.activityLogs.set(id, log);
    return log;
  }

  // Dashboard operations
  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const userWorkflows = await this.getWorkflowsByUserId(userId);
    const activeWorkflows = userWorkflows.filter(w => w.status === 'active').length;
    
    const connectedApps = (await this.getConnectedAppsByUserId(userId)).length;
    
    // Calculate statistics based on actual user data
    const tasksAutomated = userWorkflows.reduce((sum, workflow) => {
      return sum + (workflow.status === 'active' ? 10 : 0);
    }, 0);
    
    const hoursPerWorkflow = 2;
    const timeSaved = `${userWorkflows.length * hoursPerWorkflow}h`;
    
    return {
      activeWorkflows,
      tasksAutomated,
      connectedApps,
      timeSaved
    };
  }
}

// Switch from in-memory storage to database storage
import { DatabaseStorage } from './DatabaseStorage';
export const storage = new DatabaseStorage();
