import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { and, eq } from "drizzle-orm";
import { users } from "@shared/schema";

// Middleware to check if user is an admin
export function isAdmin(req: Request, res: Response, next: Function) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  next();
}

// Register admin routes
export async function registerAdminRoutes(app: Express) {
  // Get all users (admin only)
  app.get('/api/admin/users', isAdmin, async (req: Request, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      
      // Don't send password hashes to the client
      const safeUsers = allUsers.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });
  
  // Get login activity
  app.get('/api/admin/activity', isAdmin, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      
      const loginActivity = await storage.getLoginActivity(pageNum, limitNum);
      res.json(loginActivity);
    } catch (error) {
      console.error('Error fetching login activity:', error);
      res.status(500).json({ message: 'Failed to fetch login activity' });
    }
  });
  
  // Update user role/status
  app.patch('/api/admin/users/:userId', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { role, isActive } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Prevent admins from demoting themselves
      if (userId === req.session.user.id && role && role !== 'admin') {
        return res.status(400).json({ 
          message: 'Administrators cannot change their own role'
        });
      }
      
      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Log this action
      await storage.createActivityLog({
        userId: req.session.user.id,
        eventType: 'user_update',
        status: 'success',
        details: {
          targetUserId: userId,
          changes: updateData
        },
        ipAddress: req.ip
      });
      
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });
  
  // Usage statistics
  app.get('/api/admin/stats', isAdmin, async (req: Request, res: Response) => {
    try {
      const totalUsers = await storage.getUserCount();
      const activeUsers = await storage.getActiveUserCount();
      const newUsersToday = await storage.getNewUserCount(1); // last 24 hours
      const loginCount = await storage.getTotalLoginCount();
      
      res.json({
        totalUsers,
        activeUsers,
        newUsersToday,
        loginCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });
}