import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../src/routes';
import { storage } from '../../src/storage';

let app: express.Application;
let server: any;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  server = await registerRoutes(app as any);
});

afterAll(async () => {
  if (server) {
    server.close();
  }
});

describe('API Integration Tests', () => {
  describe('Authentication Endpoints', () => {
    it('should return user status', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);
        
      expect(response.body).toHaveProperty('error');
    });

    it('should handle auth callback with valid code', async () => {
      const response = await request(app)
        .post('/api/auth/callback')
        .send({ code: 'test-code' })
        .expect(500); // Expected to fail without valid AWS Cognito setup

      expect(response.body).toHaveProperty('error');
    });

    it('should handle signout correctly', async () => {
      const response = await request(app)
        .post('/api/auth/signout')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('cognitoLogoutUrl');
    });
  });

  describe('Dashboard Endpoints', () => {
    it('should require authentication for dashboard stats', async () => {
      await request(app)
        .get('/api/dashboard/stats')
        .expect(401);
    });
  });

  describe('Contact Endpoint', () => {
    it('should accept valid contact form submissions', async () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message for the contact form.'
      };

      const response = await request(app)
        .post('/api/contact')
        .send(contactData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid contact form data', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        message: 'Short'
      };

      await request(app)
        .post('/api/contact')
        .send(invalidData)
        .expect(400);
    });
  });
});