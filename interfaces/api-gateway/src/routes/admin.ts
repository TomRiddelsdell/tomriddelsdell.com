import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import type { Session } from 'express-session';

// Middleware to check if user is an admin
export function isAdmin(req: Request, res: Response, next: Function) {
  // Check if user is logged in and has admin role
  if (req.session?.user && req.session.user.role === 'admin') {
    next();
  } else {
    // If not admin, return 403 Forbidden
    res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required'
    });
  }
}

// Register admin routes
export async function registerAdminRoutes(app: Express) {
  // Get all users (admin only)
  app.get('/api/admin/users', isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json({
        success: true,
        data: users.map(user => ({
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          role: user.role,
          isActive: user.isActive,
          loginCount: user.loginCount
        }))
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      res.status(500).json({ success: false, message: 'Error getting users' });
    }
  });
  
  // Get login activity (admin only)
  app.get('/api/admin/activity', isAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const activityData = await storage.getLoginActivity(page, limit);
      
      res.json({
        success: true,
        data: {
          entries: activityData.entries,
          totalCount: activityData.totalCount,
          page,
          limit
        }
      });
    } catch (error) {
      console.error('Error getting login activity:', error);
      res.status(500).json({ success: false, message: 'Error getting login activity' });
    }
  });
  
  // Update user role (admin only)
  app.patch('/api/admin/users/:userId', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { role, isActive } = req.body;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      let updatedUser;
      
      if (role) {
        // Update user role
        updatedUser = await storage.updateUser(userId, { role });
        
        // Log this action
        await storage.createActivityLog({
          userId: req.session.user?.id || 0,
          eventType: 'admin_action',
          status: 'success',
          details: {
            action: 'update_role',
            targetUserId: userId,
            newRole: role
          }
        });
      }
      
      if (isActive !== undefined) {
        // Update user active status
        updatedUser = await storage.updateUser(userId, { isActive });
        
        // Log this action
        await storage.createActivityLog({
          userId: req.session.user?.id || 0,
          eventType: 'admin_action',
          status: 'success',
          details: {
            action: 'update_status',
            targetUserId: userId,
            isActive
          }
        });
      }
      
      res.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, message: 'Error updating user' });
    }
  });
  
  // Get dashboard stats (admin only)
  app.get('/api/admin/stats', isAdmin, async (req: Request, res: Response) => {
    try {
      const userCount = await storage.getUserCount();
      const activeUserCount = await storage.getActiveUserCount();
      const newUserCount = await storage.getNewUserCount(30);  // New users in last 30 days
      const totalLoginCount = await storage.getTotalLoginCount();
      
      res.json({
        success: true,
        data: {
          totalUsers: userCount,
          activeUsers: activeUserCount,
          newUsers: newUserCount,
          totalLogins: totalLoginCount
        }
      });
    } catch (error) {
      console.error('Error getting admin stats:', error);
      res.status(500).json({ success: false, message: 'Error getting admin stats' });
    }
  });
}