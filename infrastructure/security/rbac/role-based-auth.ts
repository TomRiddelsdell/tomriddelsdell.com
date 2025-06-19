/**
 * Enhanced Role-Based Access Control (RBAC) Security Module
 * Implements secure role validation with multiple security layers
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../../database/config/db';
import { users } from '../../../domains/shared-kernel/src/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    cognitoId: string;
    permissions?: string[];
  };
}

/**
 * Enhanced authentication middleware with role verification
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sessionUserId = (req.session as any)?.userId;
    
    if (!sessionUserId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Always verify user exists and is active from database
    const currentUser = await db.select()
      .from(users)
      .where(eq(users.id, sessionUserId))
      .limit(1);

    if (!currentUser[0]) {
      // Clear invalid session
      req.session.destroy(() => {});
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!currentUser[0].isActive) {
      return res.status(403).json({ 
        error: 'Account deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Attach verified user to request
    req.user = {
      id: currentUser[0].id,
      email: currentUser[0].email,
      role: currentUser[0].role,
      cognitoId: currentUser[0].cognitoId || '',
      permissions: getPermissionsForRole(currentUser[0].role)
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication verification failed',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Role-based authorization middleware factory
 */
export function requireRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      // Log unauthorized access attempt
      console.warn(`Unauthorized access attempt: User ${req.user.email} (role: ${req.user.role}) attempted to access resource requiring roles: ${roles.join(', ')}`);
      
      return res.status(403).json({ 
        error: 'Insufficient privileges',
        code: 'INSUFFICIENT_PRIVILEGES',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
}

/**
 * Permission-based authorization middleware
 */
export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!req.user.permissions?.includes(permission)) {
      console.warn(`Permission denied: User ${req.user.email} attempted to access resource requiring permission: ${permission}`);
      
      return res.status(403).json({ 
        error: 'Permission denied',
        code: 'PERMISSION_DENIED',
        required: permission
      });
    }

    next();
  };
}

/**
 * Map roles to permissions for fine-grained access control
 */
function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    'admin': [
      'user:read',
      'user:write', 
      'user:delete',
      'system:read',
      'system:write',
      'monitoring:read',
      'monitoring:write',
      'audit:read'
    ],
    'user': [
      'profile:read',
      'profile:write',
      'workflow:read',
      'workflow:write'
    ],
    'viewer': [
      'profile:read',
      'workflow:read'
    ]
  };

  return rolePermissions[role] || [];
}

/**
 * Enhanced admin-only middleware with additional security checks
 */
export const requireAdmin = [
  requireAuth,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Additional admin verification from database
    try {
      const adminUser = await db.select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!adminUser[0] || adminUser[0].role !== 'admin') {
        console.warn(`Admin privilege escalation attempt: User ${req.user!.email} session claims admin but database shows role: ${adminUser[0]?.role}`);
        
        // Clear potentially compromised session
        req.session.destroy(() => {});
        
        return res.status(403).json({ 
          error: 'Admin privileges revoked',
          code: 'PRIVILEGES_REVOKED'
        });
      }

      next();
    } catch (error) {
      console.error('Admin verification error:', error);
      return res.status(500).json({ 
        error: 'Admin verification failed',
        code: 'ADMIN_VERIFICATION_ERROR'
      });
    }
  }
];

/**
 * Session integrity validation
 */
export function validateSessionIntegrity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionUser = (req.session as any)?.user;
  const sessionUserId = (req.session as any)?.userId;

  // Validate session data consistency
  if (sessionUser && sessionUserId) {
    if (sessionUser.id !== sessionUserId) {
      console.warn(`Session integrity violation: User ID mismatch - session.user.id: ${sessionUser.id}, session.userId: ${sessionUserId}`);
      req.session.destroy(() => {});
      return res.status(401).json({ 
        error: 'Session integrity violation',
        code: 'SESSION_INTEGRITY_VIOLATION'
      });
    }
  }

  next();
}