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
    totalPages: number;
    currentPage: number;
  }>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLogEntry>;
  
  // Dashboard operations
  getDashboardStats(userId: number): Promise<DashboardStats>;
}

// Clean in-memory implementation without demo data
export class MemoryStorage implements IStorage {
  private users: Map<number, User>;
  private connectedApps: Map<number, ConnectedApp>;
  private templates: Map<number, Template>;
  private activityLogs: Map<number, ActivityLogEntry>;
  private availableApps: ConnectedApp[];
  
  private userId: number;
  private appId: number;
  private templateId: number;
  private logId: number;

  constructor() {
    this.users = new Map();
    this.connectedApps = new Map();
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
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByCognitoId(cognitoId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.cognitoId === cognitoId);
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
      lastIP: null,
      cognitoId: insertUser.cognitoId || null,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null,
      provider: insertUser.provider || 'cognito',
      preferredLanguage: insertUser.preferredLanguage || 'en'
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
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return Array.from(this.users.values()).filter(user => 
      user.createdAt && user.createdAt > cutoff
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
      updatedAt: now,
      status: insertApp.status || 'disconnected',
      description: insertApp.description || null,
      icon: insertApp.icon || null,
      config: insertApp.config || null,
      accessToken: insertApp.accessToken || null,
      refreshToken: insertApp.refreshToken || null,
      tokenExpiry: insertApp.tokenExpiry || null
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

  async getPopularTemplates(limit: number = 10): Promise<Template[]> {
    return Array.from(this.templates.values())
      .sort((a, b) => (b.usersCount || 0) - (a.usersCount || 0))
      .slice(0, limit);
  }

  // Activity log operations
  async getActivityLog(id: number): Promise<ActivityLogEntry | undefined> {
    return this.activityLogs.get(id);
  }

  async getActivityLogsByUserId(userId: number, page: number = 1, perPage: number = 20): Promise<{
    entries: ActivityLogEntry[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    const allLogs = Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const totalCount = allLogs.length;
    const totalPages = Math.ceil(totalCount / perPage);
    const startIndex = (page - 1) * perPage;
    const entries = allLogs.slice(startIndex, startIndex + perPage);
    
    return {
      entries,
      totalCount,
      totalPages,
      currentPage: page
    };
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLogEntry> {
    const id = this.logId++;
    const log: ActivityLogEntry = {
      ...insertLog,
      id,
      timestamp: new Date(),
      details: insertLog.details || {},
      ipAddress: insertLog.ipAddress || null
    };
    this.activityLogs.set(id, log);
    return log;
  }

  // Dashboard operations
  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const connectedApps = (await this.getConnectedAppsByUserId(userId)).length;
    
    // Calculate statistics based on actual user data  
    const timeSaved = `${connectedApps * 2}h`;
    
    return {
      totalUsers: await this.getUserCount(),
      activeUsers: await this.getActiveUserCount(),
      requestsPerMinute: 0,
      averageResponseTime: 0,
      errorRate: 0,
      uptime: 100,
      connectedApps,
      timeSaved
    };
  }
}

// Switch from in-memory storage to database storage
import { DatabaseStorage } from './DatabaseStorage';
export const storage = new DatabaseStorage();