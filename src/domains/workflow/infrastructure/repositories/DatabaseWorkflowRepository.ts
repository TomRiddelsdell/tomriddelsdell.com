import { Workflow } from '../../domain/entities/Workflow';
import { IWorkflowRepository } from '../../domain/repositories/IWorkflowRepository';
import { WorkflowId } from '../../../shared/kernel/value-objects/WorkflowId';
import { UserId } from '../../../shared/kernel/value-objects/UserId';
import { db } from '../../../../server/db';
import { workflows } from '../../../../shared/schema';
import { eq, desc, and, like, count } from 'drizzle-orm';

export class DatabaseWorkflowRepository implements IWorkflowRepository {
  async findById(id: WorkflowId): Promise<Workflow | null> {
    const result = await db.select().from(workflows).where(eq(workflows.id, id.getValue())).limit(1);
    
    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return Workflow.fromPersistence(
      row.id,
      row.userId,
      row.name,
      row.description || '',
      row.status,
      row.config,
      row.createdAt,
      row.updatedAt,
      row.lastRun || undefined,
      0, // execution count not stored in current schema
      row.icon || undefined,
      row.iconColor || undefined
    );
  }

  async findByUserId(userId: UserId): Promise<Workflow[]> {
    const results = await db.select()
      .from(workflows)
      .where(eq(workflows.userId, userId.getValue()))
      .orderBy(desc(workflows.updatedAt));

    return results.map(row => Workflow.fromPersistence(
      row.id,
      row.userId,
      row.name,
      row.description || '',
      row.status,
      row.config,
      row.createdAt,
      row.updatedAt,
      row.lastRun || undefined,
      0,
      row.icon || undefined,
      row.iconColor || undefined
    ));
  }

  async findRecentByUserId(userId: UserId, limit: number = 3): Promise<Workflow[]> {
    const results = await db.select()
      .from(workflows)
      .where(eq(workflows.userId, userId.getValue()))
      .orderBy(desc(workflows.lastRun))
      .limit(limit);

    return results.map(row => Workflow.fromPersistence(
      row.id,
      row.userId,
      row.name,
      row.description || '',
      row.status,
      row.config,
      row.createdAt,
      row.updatedAt,
      row.lastRun || undefined,
      0,
      row.icon || undefined,
      row.iconColor || undefined
    ));
  }

  async findActiveByUserId(userId: UserId): Promise<Workflow[]> {
    const results = await db.select()
      .from(workflows)
      .where(and(
        eq(workflows.userId, userId.getValue()),
        eq(workflows.status, 'active')
      ))
      .orderBy(desc(workflows.updatedAt));

    return results.map(row => Workflow.fromPersistence(
      row.id,
      row.userId,
      row.name,
      row.description || '',
      row.status,
      row.config,
      row.createdAt,
      row.updatedAt,
      row.lastRun || undefined,
      0,
      row.icon || undefined,
      row.iconColor || undefined
    ));
  }

  async save(workflow: Workflow): Promise<void> {
    const data = workflow.toPlainObject();
    
    const result = await db.insert(workflows).values({
      userId: data.userId,
      name: data.name,
      description: data.description,
      status: data.status,
      config: data.config,
      icon: data.icon,
      iconColor: data.iconColor
    }).returning();

    // Update the workflow with the assigned ID
    if (result.length > 0) {
      // Note: In a real implementation, we'd need to update the entity's ID
      // For now, we assume the repository handles this correctly
    }
  }

  async update(workflow: Workflow): Promise<void> {
    const data = workflow.toPlainObject();
    
    await db.update(workflows)
      .set({
        name: data.name,
        description: data.description,
        status: data.status,
        config: data.config,
        lastRun: data.lastRun,
        icon: data.icon,
        iconColor: data.iconColor,
        updatedAt: new Date()
      })
      .where(eq(workflows.id, data.id));
  }

  async delete(id: WorkflowId): Promise<void> {
    await db.delete(workflows).where(eq(workflows.id, id.getValue()));
  }

  async findAll(): Promise<Workflow[]> {
    const results = await db.select().from(workflows).orderBy(desc(workflows.createdAt));

    return results.map(row => Workflow.fromPersistence(
      row.id,
      row.userId,
      row.name,
      row.description || '',
      row.status,
      row.config,
      row.createdAt,
      row.updatedAt,
      row.lastRun || undefined,
      0,
      row.icon || undefined,
      row.iconColor || undefined
    ));
  }

  async countByUserId(userId: UserId): Promise<number> {
    const result = await db.select({ count: count() })
      .from(workflows)
      .where(eq(workflows.userId, userId.getValue()));

    return result[0]?.count || 0;
  }

  async countActiveByUserId(userId: UserId): Promise<number> {
    const result = await db.select({ count: count() })
      .from(workflows)
      .where(and(
        eq(workflows.userId, userId.getValue()),
        eq(workflows.status, 'active')
      ));

    return result[0]?.count || 0;
  }

  async findByStatus(status: string): Promise<Workflow[]> {
    const results = await db.select()
      .from(workflows)
      .where(eq(workflows.status, status))
      .orderBy(desc(workflows.updatedAt));

    return results.map(row => Workflow.fromPersistence(
      row.id,
      row.userId,
      row.name,
      row.description || '',
      row.status,
      row.config,
      row.createdAt,
      row.updatedAt,
      row.lastRun || undefined,
      0,
      row.icon || undefined,
      row.iconColor || undefined
    ));
  }

  async searchByName(query: string, userId?: UserId): Promise<Workflow[]> {
    let whereClause = like(workflows.name, `%${query}%`);
    
    if (userId) {
      whereClause = and(whereClause, eq(workflows.userId, userId.getValue()));
    }

    const results = await db.select()
      .from(workflows)
      .where(whereClause)
      .orderBy(desc(workflows.updatedAt));

    return results.map(row => Workflow.fromPersistence(
      row.id,
      row.userId,
      row.name,
      row.description || '',
      row.status,
      row.config,
      row.createdAt,
      row.updatedAt,
      row.lastRun || undefined,
      0,
      row.icon || undefined,
      row.iconColor || undefined
    ));
  }
}