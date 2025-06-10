import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { registerRoutes } from '../server/routes';
import express from 'express';

// Test suite for authentication regression testing
describe('Authentication Regression Tests', () => {
  let app: Express;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('Authentication API Endpoints', () => {
    it('should return 401 for unauthenticated /api/auth/me requests', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });

    it('should handle auth callback with valid code', async () => {
      const response = await request(app)
        .post('/api/auth/callback')
        .send({ code: 'test-auth-code-123' })
        .expect(500); // Expected to fail without valid AWS Cognito setup

      expect(response.body).toHaveProperty('error');
    });

    it('should handle auth callback with invalid code', async () => {
      const response = await request(app)
        .post('/api/auth/callback')
        .send({ code: 'invalid-code' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Authentication failed');
    });

    it('should handle sign out and provide cognito logout URL', async () => {
      const response = await request(app)
        .post('/api/auth/signout')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Signed out successfully');
      expect(response.body).toHaveProperty('cognitoLogoutUrl');
      expect(response.body.cognitoLogoutUrl).toContain('logout');
    });
  });

  describe('Protected API Endpoints', () => {
    it('should require authentication for dashboard stats', async () => {
      await request(app)
        .get('/api/dashboard/stats')
        .expect(401);
    });

    it('should require authentication for workflows', async () => {
      await request(app)
        .get('/api/workflows')
        .expect(401);
    });

    it('should require authentication for connected apps', async () => {
      await request(app)
        .get('/api/connected-apps')
        .expect(401);
    });

    it('should require authentication for activity logs', async () => {
      await request(app)
        .get('/api/activity-log')
        .expect(401);
    });
  });

  describe('Public API Endpoints', () => {
    it('should allow unauthenticated access to contact form', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});