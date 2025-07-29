import { db } from './db';
import { IStorage } from './storage';
import { 
  users, connectedApps, templates, activityLogs,
  User, InsertUser, ConnectedApp, InsertConnectedApp,
  Template, ActivityLogEntry, InsertActivityLog, DashboardStats, InsertTemplate
} from '../../../domains/shared-kernel/src/schema';
import { eq, desc, and, sql, gt, gte, count, lt } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByCognitoId(cognitoId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cognitoId, cognitoId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result.count;
  }

  async getActiveUserCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));
    return result.count;
  }

  async getNewUserCount(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, cutoffDate));
    return result.count;
  }

  async trackUserLogin(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        lastLogin: new Date(),
        loginCount: sql`COALESCE(${users.loginCount}, 0) + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    // Log the login activity
    await this.createActivityLog({
      userId,
      eventType: 'login',
      status: 'success',
      details: { timestamp: new Date().toISOString() }
    });
  }

  async getTotalLoginCount(): Promise<number> {
    const [result] = await db
      .select({ total: sql`SUM(COALESCE(${users.loginCount}, 0))` })
      .from(users);
    return Number(result.total) || 0;
  }
  
  // Workflow operations - temporarily disabled (workflow table not yet implemented)
  async getWorkflow(id: number): Promise<any | undefined> {
    // TODO: Implement when workflow schema is added
    return undefined;
  }

  async getWorkflowsByUserId(userId: number): Promise<any[]> {
    // TODO: Implement when workflow schema is added
    return [];
  }

  async getRecentWorkflows(userId: number, limit: number = 3): Promise<any[]> {
    // TODO: Implement when workflow schema is added
    return [];
  }

  async createWorkflow(workflow: any): Promise<any> {
    // TODO: Implement when workflow schema is added
    throw new Error('Workflow creation not yet implemented');
  }

  async updateWorkflow(id: number, workflowData: any): Promise<any | undefined> {
    // TODO: Implement when workflow schema is added
    return undefined;
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    // TODO: Implement when workflow schema is added
    return false;
  }

  // Connected app operations
  async getConnectedApp(id: number): Promise<ConnectedApp | undefined> {
    const [app] = await db.select().from(connectedApps).where(eq(connectedApps.id, id));
    return app;
  }

  async getConnectedAppsByUserId(userId: number): Promise<ConnectedApp[]> {
    return await db
      .select()
      .from(connectedApps)
      .where(eq(connectedApps.userId, userId))
      .orderBy(desc(connectedApps.updatedAt));
  }

  async getAvailableApps(): Promise<ConnectedApp[]> {
    // Sample implementations - in a real app, you might query from a list of
    // supported service integrations
    return [
      {
        id: 1,
        name: "Google Drive",
        description: "Connect to Google Drive to access your files",
        icon: "google-drive",
        status: "available",
        userId: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {},
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null
      },
      {
        id: 2,
        name: "Slack",
        description: "Connect to Slack for messaging integration",
        icon: "slack",
        status: "available",
        userId: 0, 
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {},
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null
      }
    ];
  }

  async createConnectedApp(app: InsertConnectedApp): Promise<ConnectedApp> {
    const [newApp] = await db.insert(connectedApps).values(app).returning();
    return newApp;
  }

  async updateConnectedApp(id: number, appData: Partial<ConnectedApp>): Promise<ConnectedApp | undefined> {
    const [updatedApp] = await db
      .update(connectedApps)
      .set({ ...appData, updatedAt: new Date() })
      .where(eq(connectedApps.id, id))
      .returning();
    return updatedApp;
  }

  async deleteConnectedApp(id: number): Promise<boolean> {
    const result = await db.delete(connectedApps).where(eq(connectedApps.id, id));
    return result.rowCount > 0;
  }

  // Template operations
  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async getPopularTemplates(limit: number = 5): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .orderBy(desc(templates.usersCount))
      .limit(limit);
  }

  // Activity log operations
  async getActivityLog(id: number): Promise<ActivityLogEntry | undefined> {
    const [log] = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
    return log;
  }

  async getActivityLogsByUserId(
    userId: number, 
    page: number = 1, 
    perPage: number = 20
  ): Promise<{ entries: ActivityLogEntry[]; totalCount: number }> {
    const offset = (page - 1) * perPage;
    
    const entries = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp))
      .limit(perPage)
      .offset(offset);
    
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId));
    
    return {
      entries,
      totalCount
    };
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLogEntry> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  async getLoginActivity(
    page: number = 1, 
    limit: number = 20
  ): Promise<{ entries: ActivityLogEntry[]; totalCount: number }> {
    const offset = (page - 1) * limit;
    
    const entries = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.eventType, 'login'))
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit)
      .offset(offset);
    
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(eq(activityLogs.eventType, 'login'));
    
    return {
      entries,
      totalCount
    };
  }

  // Dashboard operations
  async getDashboardStats(userId: number): Promise<DashboardStats> {
    // Calculate tasks automated based on activity logs
    const [{ count: tasksAutomated }] = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.eventType, 'run'),
        eq(activityLogs.status, 'success')
      ));
    
    // Count connected apps
    const [{ count: connectedAppsCount }] = await db
      .select({ count: count() })
      .from(connectedApps)
      .where(eq(connectedApps.userId, userId));
    
    // Calculate time saved - a sample implementation
    // In a real app, you might have a more sophisticated formula
    const timeSavedMinutes = tasksAutomated * 5; // Assume each automated task saves 5 minutes
    const hours = Math.floor(timeSavedMinutes / 60);
    const minutes = timeSavedMinutes % 60;
    const timeSaved = `${hours}h ${minutes}m`;
    
    return {
      totalUsers: await this.getUserCount(),
      activeUsers: await this.getActiveUserCount(),
      requestsPerMinute: 0, // TODO: Implement from monitoring
      averageResponseTime: 0, // TODO: Implement from monitoring
      errorRate: 0, // TODO: Implement from monitoring
      uptime: 100, // TODO: Implement from monitoring
      connectedApps: connectedAppsCount,
      timeSaved
    };
  }
}