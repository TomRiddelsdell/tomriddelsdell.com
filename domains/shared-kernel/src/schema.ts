import { pgTable, text, serial, integer, boolean, timestamp, json, decimal, bigint, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - now linked to Cognito
export const users = pgTable("users", {
  id: serial("id").primaryKey(), // Local database ID
  cognitoId: text("cognito_id").unique(), // AWS Cognito User ID
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  provider: text("provider").default("cognito").notNull(), // 'cognito', 'google', 'aws', etc.
  role: text("role").default("user").notNull(), // 'user', 'admin', 'editor', etc.
  preferredLanguage: text("preferred_language").default("en").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  loginCount: integer("login_count").default(0),
  lastIP: text("last_ip"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  cognitoId: true,
  displayName: true,
  photoURL: true,
  provider: true,
  preferredLanguage: true,
});

// Workflows table
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { enum: ['active', 'paused', 'error', 'draft'] }).notNull().default('draft'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastRun: timestamp("last_run"),
  icon: text("icon"),
  iconColor: text("icon_color"),
  config: json("config").notNull(),
});

export const insertWorkflowSchema = createInsertSchema(workflows).pick({
  userId: true,
  name: true,
  description: true,
  status: true,
  icon: true,
  iconColor: true,
  config: true,
});

// Connected Apps table
export const connectedApps = pgTable("connected_apps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  status: text("status", { enum: ['connected', 'disconnected', 'error'] }).notNull().default('disconnected'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  config: json("config"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
});

export const insertConnectedAppSchema = createInsertSchema(connectedApps).pick({
  userId: true,
  name: true,
  description: true,
  icon: true,
  status: true,
  config: true,
  accessToken: true,
  refreshToken: true,
  tokenExpiry: true,
});

// Workflow Connections table
export const workflowConnections = pgTable("workflow_connections", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id),
  appId: integer("app_id").notNull().references(() => connectedApps.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkflowConnectionSchema = createInsertSchema(workflowConnections).pick({
  workflowId: true,
  appId: true,
});

// Templates table
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconType: text("icon_type").notNull(), // 'share', 'mail', 'calendar', etc.
  iconColor: text("icon_color").notNull(), // 'indigo', 'green', 'amber', etc.
  usersCount: integer("users_count").default(0).notNull(),
  config: json("config").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTemplateSchema = createInsertSchema(templates).pick({
  name: true,
  description: true,
  iconType: true,
  iconColor: true,
  config: true,
});

// Activity Log table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  workflowId: integer("workflow_id").references(() => workflows.id),
  workflowName: text("workflow_name"),
  eventType: text("event_type").notNull(), // 'run', 'error', 'update', etc.
  status: text("status").notNull(), // 'success', 'failure', 'warning', 'pending'
  details: json("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  workflowId: true,
  workflowName: true,
  eventType: true,
  status: true,
  details: true,
  ipAddress: true,
});

// Types exported for TypeScript
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

export type InsertConnectedApp = z.infer<typeof insertConnectedAppSchema>;
export type ConnectedApp = typeof connectedApps.$inferSelect;

export type InsertWorkflowConnection = z.infer<typeof insertWorkflowConnectionSchema>;
export type WorkflowConnection = typeof workflowConnections.$inferSelect;

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLogEntry = typeof activityLogs.$inferSelect;

// Monitoring and system health tables
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  cpuUsage: decimal("cpu_usage", { precision: 5, scale: 2 }).notNull(),
  cpuCores: integer("cpu_cores").notNull(),
  memoryUsed: bigint("memory_used", { mode: "number" }).notNull(),
  memoryTotal: bigint("memory_total", { mode: "number" }).notNull(),
  memoryPercentage: decimal("memory_percentage", { precision: 5, scale: 2 }).notNull(),
  databaseConnections: integer("database_connections").notNull(),
  databaseMaxConnections: integer("database_max_connections").notNull(),
  databaseQueryTime: decimal("database_query_time", { precision: 8, scale: 3 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceHealth = pgTable("service_health", {
  id: serial("id").primaryKey(),
  service: varchar("service", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // healthy, degraded, unhealthy
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  responseTime: integer("response_time"), // in milliseconds
  error: text("error"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  responseTime: integer("response_time").notNull(), // in milliseconds
  statusCode: integer("status_code").notNull(),
  userId: integer("user_id").references(() => users.id),
  correlationId: varchar("correlation_id", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 100 }),
  details: json("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  duration: integer("duration"), // in milliseconds
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const configurationStatus = pgTable("configuration_status", {
  id: serial("id").primaryKey(),
  component: varchar("component", { length: 100 }).notNull(),
  isValid: boolean("is_valid").notNull(),
  errors: json("errors").notNull(),
  warnings: json("warnings").notNull(),
  lastChecked: timestamp("last_checked", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Create insert schemas for monitoring tables
export const insertSystemMetricsSchema = createInsertSchema(systemMetrics).pick({
  timestamp: true,
  cpuUsage: true,
  cpuCores: true,
  memoryUsed: true,
  memoryTotal: true,
  memoryPercentage: true,
  databaseConnections: true,
  databaseMaxConnections: true,
  databaseQueryTime: true,
});

export const insertServiceHealthSchema = createInsertSchema(serviceHealth).pick({
  service: true,
  status: true,
  timestamp: true,
  responseTime: true,
  error: true,
  metadata: true,
});

export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).pick({
  timestamp: true,
  endpoint: true,
  method: true,
  responseTime: true,
  statusCode: true,
  userId: true,
  correlationId: true,
});

export const insertAuditLogsSchema = createInsertSchema(auditLogs).pick({
  timestamp: true,
  userId: true,
  action: true,
  resource: true,
  resourceId: true,
  details: true,
  ipAddress: true,
  userAgent: true,
  duration: true,
});

export const insertConfigurationStatusSchema = createInsertSchema(configurationStatus).pick({
  component: true,
  isValid: true,
  errors: true,
  warnings: true,
  lastChecked: true,
});

// Type exports for monitoring
export type InsertSystemMetrics = z.infer<typeof insertSystemMetricsSchema>;
export type SystemMetrics = typeof systemMetrics.$inferSelect;

export type InsertServiceHealth = z.infer<typeof insertServiceHealthSchema>;
export type ServiceHealth = typeof serviceHealth.$inferSelect;

export type InsertPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;

export type InsertAuditLogs = z.infer<typeof insertAuditLogsSchema>;
export type AuditLogs = typeof auditLogs.$inferSelect;

export type InsertConfigurationStatus = z.infer<typeof insertConfigurationStatusSchema>;
export type ConfigurationStatus = typeof configurationStatus.$inferSelect;

// Enhanced dashboard stats type
export type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  activeWorkflows: number;
  tasksAutomated: number;
  connectedApps: number;
  timeSaved: string;
};
