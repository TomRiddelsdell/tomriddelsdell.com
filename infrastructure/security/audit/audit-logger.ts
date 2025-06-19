/**
 * Security Audit Logging System
 * Tracks all administrative actions and security events
 */

import { db } from '../../database/config/db';
import { auditLogs } from '../../../domains/shared-kernel/src/schema';

export interface AuditEvent {
  userId: number;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export class AuditLogger {
  /**
   * Log administrative action
   */
  static async logAdminAction(event: AuditEvent): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        details: event.details || null,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(event: {
    userId?: number;
    action: 'login' | 'logout' | 'failed_login' | 'session_expired';
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    await this.logAdminAction({
      userId: event.userId || 0,
      action: event.action,
      resource: 'authentication',
      details: event.details,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      success: event.success,
      errorMessage: event.errorMessage
    });
  }

  /**
   * Log privilege escalation attempts
   */
  static async logPrivilegeEscalation(event: {
    userId: number;
    attemptedAction: string;
    requiredRole: string;
    currentRole: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAdminAction({
      userId: event.userId,
      action: 'privilege_escalation_attempt',
      resource: 'authorization',
      details: {
        attemptedAction: event.attemptedAction,
        requiredRole: event.requiredRole,
        currentRole: event.currentRole
      },
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      success: false,
      errorMessage: 'Insufficient privileges'
    });
  }

  /**
   * Get audit logs for admin review
   */
  static async getAuditLogs(filters: {
    userId?: number;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      // Implementation would use Drizzle query builder with filters
      // For now, return basic structure
      return [];
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      throw new Error('Audit log retrieval failed');
    }
  }
}

/**
 * Middleware to automatically log admin actions
 */
export function auditMiddleware(action: string, resource: string) {
  return (req: any, res: any, next: any) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Log the action after response
      const success = res.statusCode < 400;
      
      AuditLogger.logAdminAction({
        userId: req.user?.id || 0,
        action,
        resource,
        resourceId: req.params?.id,
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        success,
        errorMessage: success ? undefined : (typeof data === 'string' ? data : JSON.stringify(data))
      }).catch(console.error);
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}