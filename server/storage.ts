import { 
  User, InsertUser, 
  Workflow, InsertWorkflow, 
  ConnectedApp, InsertConnectedApp, 
  Template, InsertTemplate, 
  ActivityLogEntry, InsertActivityLog,
  DashboardStats
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
    
    this.userId = 1;
    this.workflowId = 1;
    this.appId = 1;
    this.templateId = 1;
    this.logId = 1;
    
    // Initialize with some demo data
    this.initializeData();
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      lastLogin: now,
      createdAt: now,
      updatedAt: now,
      role: 'user'
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
    
    // For demo purposes we're using some arbitrary calculations
    const tasksAutomated = userWorkflows.length * 15;
    const timeSaved = `${userWorkflows.length * 4}h`;
    
    return {
      activeWorkflows,
      tasksAutomated,
      connectedApps,
      timeSaved
    };
  }

  // Initialize demo data
  private initializeData() {
    // Create demo user
    const demoUser: User = {
      id: this.userId++,
      username: 'sarahjohnson',
      email: 'sarah@example.com',
      password: 'password123', // In a real app, this would be hashed
      displayName: 'Sarah Johnson',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=256&h=256',
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: 'email',
      role: 'user',
      preferredLanguage: 'en'
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo workflows
    const workflow1: Workflow = {
      id: this.workflowId++,
      userId: demoUser.id,
      name: 'Social Media Content Scheduler',
      description: 'Automatically post content to multiple platforms',
      status: 'active',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(),
      lastRun: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      icon: '<RiRhythmLine />',
      iconColor: 'blue',
      config: {},
      connectedApps: ['FB', 'IG', 'TW'] // Not in schema but needed for UI
    };
    this.workflows.set(workflow1.id, workflow1);

    const workflow2: Workflow = {
      id: this.workflowId++,
      userId: demoUser.id,
      name: 'Newsletter Automation',
      description: 'Generate and send newsletters from your content',
      status: 'active',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      updatedAt: new Date(),
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      icon: '<RiMailSendLine />',
      iconColor: 'green',
      config: {},
      connectedApps: ['GM', 'SH'] // Not in schema but needed for UI
    };
    this.workflows.set(workflow2.id, workflow2);

    const workflow3: Workflow = {
      id: this.workflowId++,
      userId: demoUser.id,
      name: 'File Backup System',
      description: 'Automatically backup files to cloud storage',
      status: 'paused',
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
      updatedAt: new Date(),
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      icon: '<RiFileTransferLine />',
      iconColor: 'amber',
      config: {},
      connectedApps: ['GD', 'DB'] // Not in schema but needed for UI
    };
    this.workflows.set(workflow3.id, workflow3);

    // Create connected apps
    const app1: ConnectedApp = {
      id: this.appId++,
      userId: demoUser.id,
      name: 'Facebook',
      description: 'Connect to your Facebook account',
      icon: '<RiFacebookFill />',
      status: 'connected',
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {},
      accessToken: 'dummy-token',
      refreshToken: 'dummy-refresh-token',
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
    this.connectedApps.set(app1.id, app1);

    const app2: ConnectedApp = {
      id: this.appId++,
      userId: demoUser.id,
      name: 'Instagram',
      description: 'Connect to your Instagram account',
      icon: '<RiInstagramLine />',
      status: 'connected',
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {},
      accessToken: 'dummy-token',
      refreshToken: 'dummy-refresh-token',
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    this.connectedApps.set(app2.id, app2);

    const app3: ConnectedApp = {
      id: this.appId++,
      userId: demoUser.id,
      name: 'Twitter',
      description: 'Connect to your Twitter account',
      icon: '<RiTwitterFill />',
      status: 'connected',
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {},
      accessToken: 'dummy-token',
      refreshToken: 'dummy-refresh-token',
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    this.connectedApps.set(app3.id, app3);

    const app4: ConnectedApp = {
      id: this.appId++,
      userId: demoUser.id,
      name: 'YouTube',
      description: 'Connect to your YouTube account',
      icon: '<RiYoutubeFill />',
      status: 'connected',
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {},
      accessToken: 'dummy-token',
      refreshToken: null,
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    this.connectedApps.set(app4.id, app4);

    const app5: ConnectedApp = {
      id: this.appId++,
      userId: demoUser.id,
      name: 'Spotify',
      description: 'Connect to your Spotify account',
      icon: '<RiSpotifyFill />',
      status: 'connected',
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {},
      accessToken: 'dummy-token',
      refreshToken: 'dummy-refresh-token',
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    this.connectedApps.set(app5.id, app5);

    const app6: ConnectedApp = {
      id: this.appId++,
      userId: demoUser.id,
      name: 'Gmail',
      description: 'Connect to your Gmail account',
      icon: '<RiMailLine />',
      status: 'connected',
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {},
      accessToken: 'dummy-token',
      refreshToken: 'dummy-refresh-token',
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    this.connectedApps.set(app6.id, app6);

    const app7: ConnectedApp = {
      id: this.appId++,
      userId: demoUser.id,
      name: 'Sheets',
      description: 'Connect to Google Sheets',
      icon: '<RiFileList3Line />',
      status: 'connected',
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {},
      accessToken: 'dummy-token',
      refreshToken: 'dummy-refresh-token',
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    this.connectedApps.set(app7.id, app7);

    const app8: ConnectedApp = {
      id: this.appId++,
      userId: demoUser.id,
      name: 'Dropbox',
      description: 'Connect to your Dropbox account',
      icon: '<RiDropboxFill />',
      status: 'connected',
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {},
      accessToken: 'dummy-token',
      refreshToken: 'dummy-refresh-token',
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    this.connectedApps.set(app8.id, app8);

    // Setup available apps
    this.availableApps = [
      app1, app2, app3, app4, app5, app6, app7, app8,
      {
        id: this.appId++,
        userId: 0, // System app
        name: 'LinkedIn',
        description: 'Connect to your LinkedIn account',
        icon: '<RiLinkedinFill />',
        status: 'disconnected',
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {},
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null
      },
      {
        id: this.appId++,
        userId: 0, // System app
        name: 'Pinterest',
        description: 'Connect to your Pinterest account',
        icon: '<RiPinterestFill />',
        status: 'disconnected',
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {},
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null
      },
      {
        id: this.appId++,
        userId: 0, // System app
        name: 'Slack',
        description: 'Connect to your Slack workspace',
        icon: '<RiSlackFill />',
        status: 'disconnected',
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {},
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null
      }
    ];

    // Create templates
    const template1: Template = {
      id: this.templateId++,
      name: 'Social Media Cross-Posting',
      description: 'Post your content across multiple platforms automatically',
      iconType: 'share',
      iconColor: 'indigo',
      usersCount: 2400,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.templates.set(template1.id, template1);

    const template2: Template = {
      id: this.templateId++,
      name: 'Email Newsletter Automation',
      description: 'Create and send newsletters from your content',
      iconType: 'mail',
      iconColor: 'green',
      usersCount: 1800,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.templates.set(template2.id, template2);

    const template3: Template = {
      id: this.templateId++,
      name: 'Content Calendar',
      description: 'Schedule and organize your content creation',
      iconType: 'calendar',
      iconColor: 'amber',
      usersCount: 1500,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.templates.set(template3.id, template3);

    const template4: Template = {
      id: this.templateId++,
      name: 'Video Publishing Workflow',
      description: 'Streamline your video production process',
      iconType: 'video',
      iconColor: 'rose',
      usersCount: 1200,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.templates.set(template4.id, template4);

    const template5: Template = {
      id: this.templateId++,
      name: 'Audience Engagement',
      description: 'Automate responses to audience comments',
      iconType: 'message',
      iconColor: 'sky',
      usersCount: 950,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.templates.set(template5.id, template5);

    // Create activity logs
    const log1: ActivityLogEntry = {
      id: this.logId++,
      userId: demoUser.id,
      workflowId: workflow1.id,
      workflowName: workflow1.name,
      eventType: 'run',
      status: 'success',
      details: { message: 'Workflow executed successfully' },
      timestamp: new Date(),
      ipAddress: '192.168.1.1'
    };
    this.activityLogs.set(log1.id, log1);

    const log2: ActivityLogEntry = {
      id: this.logId++,
      userId: demoUser.id,
      workflowId: workflow2.id,
      workflowName: workflow2.name,
      eventType: 'run',
      status: 'success',
      details: { message: 'Newsletter sent to 150 subscribers' },
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      ipAddress: '192.168.1.1'
    };
    this.activityLogs.set(log2.id, log2);

    const log3: ActivityLogEntry = {
      id: this.logId++,
      userId: demoUser.id,
      workflowId: workflow3.id,
      workflowName: workflow3.name,
      eventType: 'update',
      status: 'success',
      details: { message: 'Workflow paused by user' },
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      ipAddress: '192.168.1.5'
    };
    this.activityLogs.set(log3.id, log3);

    const log4: ActivityLogEntry = {
      id: this.logId++,
      userId: demoUser.id,
      workflowId: workflow1.id,
      workflowName: workflow1.name,
      eventType: 'run',
      status: 'failure',
      details: { message: 'Failed to post to Twitter: API rate limit exceeded' },
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      ipAddress: '192.168.1.1'
    };
    this.activityLogs.set(log4.id, log4);

    // Add more logs for pagination demo
    for (let i = 0; i < 30; i++) {
      const randomWorkflow = [workflow1, workflow2, workflow3][Math.floor(Math.random() * 3)];
      const randomStatus = ['success', 'failure', 'warning', 'pending'][Math.floor(Math.random() * 4)];
      const randomDaysAgo = Math.floor(Math.random() * 14); // 0-14 days ago
      
      const log: ActivityLogEntry = {
        id: this.logId++,
        userId: demoUser.id,
        workflowId: randomWorkflow.id,
        workflowName: randomWorkflow.name,
        eventType: 'run',
        status: randomStatus,
        details: { message: `Automated log entry ${i}` },
        timestamp: new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.1.1'
      };
      this.activityLogs.set(log.id, log);
    }
  }
}

export const storage = new MemStorage();
