import { db } from '../db';
import { users, activityLogs, InsertActivityLog, InsertUser } from '@shared/schema';
import { eq, and, desc, sql, gt, count } from 'drizzle-orm';

// User operations
export async function getAllUsers() {
  return await db.select().from(users).orderBy(users.createdAt);
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function updateUserRole(id: number, role: string) {
  const [updatedUser] = await db
    .update(users)
    .set({ 
      role, 
      updatedAt: new Date() 
    })
    .where(eq(users.id, id))
    .returning();
  
  return updatedUser;
}

export async function deactivateUser(id: number) {
  const [updatedUser] = await db
    .update(users)
    .set({
      isActive: false,
      updatedAt: new Date()
    })
    .where(eq(users.id, id))
    .returning();
    
  return updatedUser;
}

export async function trackUserLogin(id: number) {
  // Update the user's last login time and increment login count
  await db
    .update(users)
    .set({
      lastLogin: new Date(),
      loginCount: sql`COALESCE(${users.loginCount}, 0) + 1`
    })
    .where(eq(users.id, id));
    
  // Log this login activity
  await db.insert(activityLogs).values({
    userId: id,
    eventType: 'login',
    status: 'success',
    details: { timestamp: new Date().toISOString() }
  });
}

// Statistics and metrics
export async function getUserCount() {
  const [result] = await db
    .select({ count: count() })
    .from(users);
    
  return result.count;
}

export async function getActiveUserCount() {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.isActive, true));
    
  return result.count;
}

export async function getNewUserCount(days: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(gt(users.createdAt, cutoffDate));
    
  return result.count;
}

export async function getTotalLoginCount() {
  const [result] = await db
    .select({ total: sql`sum(COALESCE(${users.loginCount}, 0))` })
    .from(users);
    
  return result.total || 0;
}

// Activity and audit logs
export async function getLoginActivity(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  
  const entries = await db
    .select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      eventType: activityLogs.eventType,
      status: activityLogs.status,
      details: activityLogs.details,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress
    })
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