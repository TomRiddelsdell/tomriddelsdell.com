import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '@server/routes';
import { storage } from '@server/storage';

let app: express.Application;
let server: any;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  server = await registerRoutes(app);
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
        .get('/api/auth/status')
        .expect(200);
        
      expect(response.body).toHaveProperty('user');
    });

    it('should handle signup with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'securepassword123',
        username: 'newuser'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should reject signup with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'short'
      };

      await request(app)
        .post('/api/auth/signup')
        .send(invalidData)
        .expect(400);
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

      expect(response.body).toHaveProperty('success', true);
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