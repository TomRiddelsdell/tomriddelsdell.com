import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole, AuthProvider } from '../../domain/entities/User';
import { UserId } from '../../../../shared/kernel/value-objects/UserId';
import { Email } from '../../../../shared/kernel/value-objects/Email';
import { CognitoId } from '../../../../shared/kernel/value-objects/CognitoId';
import { db } from '../../../../../server/db';
import { users } from '../../../../../shared/schema';
import { eq, count, gte, sql } from 'drizzle-orm';

export class DatabaseUserRepository implements IUserRepository {
  async findById(id: UserId): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id.getValue())).limit(1);
    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email.getValue())).limit(1);
    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByCognitoId(cognitoId: CognitoId): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.cognitoId, cognitoId.getValue())).limit(1);
    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async save(user: User): Promise<void> {
    const userData = user.toPlainObject();
    await db.insert(users).values({
      email: userData.email,
      cognitoId: userData.cognitoId,
      username: userData.username,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      role: userData.role,
      provider: userData.provider,
      preferredLanguage: userData.preferredLanguage,
      isActive: userData.isActive,
      loginCount: userData.loginCount,
      lastLogin: userData.lastLogin,
      lastIP: userData.lastIP
    });
  }

  async update(user: User): Promise<void> {
    const userData = user.toPlainObject();
    await db.update(users)
      .set({
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: userData.role,
        preferredLanguage: userData.preferredLanguage,
        isActive: userData.isActive,
        loginCount: userData.loginCount,
        lastLogin: userData.lastLogin,
        lastIP: userData.lastIP,
        updatedAt: userData.updatedAt
      })
      .where(eq(users.id, userData.id));
  }

  async delete(id: UserId): Promise<void> {
    await db.delete(users).where(eq(users.id, id.getValue()));
  }

  async findAll(): Promise<User[]> {
    const result = await db.select().from(users);
    return result.map(row => this.mapToEntity(row));
  }

  async findActiveUsers(): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.isActive, true));
    return result.map(row => this.mapToEntity(row));
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0].count;
  }

  async getActiveUserCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    return result[0].count;
  }

  async getNewUserCount(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await db.select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, cutoffDate));
    
    return result[0].count;
  }

  async findByRole(role: string): Promise<User[]> {
    const result = await db.select().from(users).where(eq(users.role, role));
    return result.map(row => this.mapToEntity(row));
  }

  async searchUsers(query: string, limit: number = 50): Promise<User[]> {
    const result = await db.select()
      .from(users)
      .where(sql`${users.email} ILIKE ${'%' + query + '%'} OR ${users.displayName} ILIKE ${'%' + query + '%'} OR ${users.username} ILIKE ${'%' + query + '%'}`)
      .limit(limit);
    
    return result.map(row => this.mapToEntity(row));
  }

  private mapToEntity(row: any): User {
    return new User(
      UserId.fromNumber(row.id),
      Email.fromString(row.email),
      CognitoId.fromString(row.cognitoId),
      row.username,
      row.displayName,
      row.photoURL,
      row.role as UserRole,
      row.provider as AuthProvider,
      row.preferredLanguage,
      row.isActive,
      row.loginCount,
      row.lastLogin,
      row.lastIP,
      row.createdAt,
      row.updatedAt
    );
  }
}