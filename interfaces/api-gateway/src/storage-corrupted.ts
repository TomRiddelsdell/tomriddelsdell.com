import { 
  User, InsertUser, 
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
  private apps: Map<number, ConnectedApp>;
  private templates: Map<number, Template>;
  private activityLogs: Map<number, ActivityLogEntry>;
  private availableApps: ConnectedApp[];
  
  private userId: number;
  private appId: number;
  private templateId: number;
  private logId: number;

  constructor() {
    this.users = new Map();
    this.apps = new Map();
    this.templates = new Map();
    this.activityLogs = new Map();
    this.availableApps = [];
    
    this.userId = 1;
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
      .filter(log => log.eventType === 'login')
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
      id,
      lastLogin: now,
      createdAt: now,
      updatedAt: now,
      role: 'user',
      isActive: true,
      loginCount: 0,
      lastIP: null,
      cognitoId: insertUser.cognitoId ?? null,
      username: insertUser.username,
      email: insertUser.email,
      displayName: insertUser.displayName ?? null,
      photoURL: insertUser.photoURL ?? null,
      provider: insertUser.provider ?? 'email',
      preferredLanguage: insertUser.preferredLanguage ?? 'en'
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

  // Connected app operations
  async getConnectedApp(id: number): Promise<ConnectedApp | undefined> {
    return this.apps.get(id);
  }

  async getConnectedAppsByUserId(userId: number): Promise<ConnectedApp[]> {
    return Array.from(this.apps.values()).filter(
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
      id,
      name: insertApp.name,
      createdAt: now,
      updatedAt: now,
      status: insertApp.status ?? 'connected',
      userId: insertApp.userId,
      description: insertApp.description ?? null,
      icon: insertApp.icon ?? null,
      config: insertApp.config ?? {},
      accessToken: insertApp.accessToken ?? null,
      refreshToken: insertApp.refreshToken ?? null,
      tokenExpiry: insertApp.tokenExpiry ?? null
    };
    this.apps.set(id, app);
    return app;
  }

  async updateConnectedApp(id: number, appData: Partial<ConnectedApp>): Promise<ConnectedApp | undefined> {
    const app = this.apps.get(id);
    if (!app) return undefined;
    
    const updatedApp = {
      ...app,
      ...appData,
      updatedAt: new Date()
    };
    
    this.apps.set(id, updatedApp);
    return updatedApp;
  }

  async deleteConnectedApp(id: number): Promise<boolean> {
    return this.apps.delete(id);
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
      id,
      status: insertLog.status,
      userId: insertLog.userId,
      eventType: insertLog.eventType,
      details: insertLog.details ?? {},
      timestamp: now,
      ipAddress: insertLog.ipAddress ?? null
    };
    this.activityLogs.set(id, log);
    return log;
  }

  // Dashboard operations
  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const connectedApps = (await this.getConnectedAppsByUserId(userId)).length;
    const timeSaved = `${connectedApps * 2}h`; // Estimated time saved per app
    
    // Return basic system-like stats (this is mock data)
    return {
      totalUsers: this.users.size,
      activeUsers: Array.from(this.users.values()).filter(u => u.isActive).length,
      requestsPerMinute: 25, // Mock value
      averageResponseTime: 150, // Mock value in ms
      errorRate: 0.02, // Mock 2% error rate
      uptime: 99.9, // Mock 99.9% uptime
      connectedApps,
      timeSaved
    };
  }
}

// Switch from in-memory storage to database storage
import { DatabaseStorage } from './DatabaseStorage';
export const storage = new DatabaseStorage();
