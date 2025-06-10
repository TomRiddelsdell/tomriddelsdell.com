import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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

// Mock data types (for referencing in UI components)
export type DashboardStats = {
  activeWorkflows: number;
  tasksAutomated: number;
  connectedApps: number;
  timeSaved: string;
};
