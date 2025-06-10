import type { Express, Request, Response } from "express";
import { storage } from "./storage";

export function isAdmin(req: Request, res: Response, next: Function) {
  // Simple admin check - in production this should be more robust
  const user = req.session?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export async function registerAdminRoutes(app: Express) {
  // Admin routes would be implemented here
  app.get('/api/admin/users', isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
}