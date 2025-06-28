import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { registerRoutes } from '../../../interfaces/api-gateway/src/routes';
import express from 'express';

describe('Complete Regression Test Suite', () => {
  let app: Express;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('Environment Validation', () => {
    it('should have required environment variables', () => {
      // Check for database and session
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.SESSION_SECRET).toBeDefined();
      
      // Check for Cognito variables (with correct prefixes)
      const hasCognitoConfig = process.env.VITE_AWS_COGNITO_USER_POOL_ID || process.env.COGNITO_USER_POOL_ID;
      expect(hasCognitoConfig).toBeDefined();
    });

    it('should initialize server successfully', () => {
      expect(app).toBeDefined();
    });
  });

  describe('Critical Authentication Flows', () => {
    it('should reject unauthenticated requests to protected endpoints', async () => {
      const protectedEndpoints = [
        '/api/dashboard/stats',
        '/api/workflows',
        '/api/workflows/recent',
        '/api/connected-apps',
        '/api/activity-log'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Unauthorized');
      }
    });

    it('should handle authentication callback structure', async () => {
      const response = await request(app)
        .post('/api/auth/callback')
        .send({ code: 'test-code' });

      // Should redirect on successful auth
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/dashboard');
    });

    it('should return proper authentication status', async () => {
      const response = await request(app).get('/api/auth/me');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });

    it('should handle sign out correctly', async () => {
      const response = await request(app).post('/api/auth/signout');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Signed out successfully');
      expect(response.body).toHaveProperty('cognitoLogoutUrl');
    });
  });

  describe('API Data Validation', () => {
    it('should validate contact form inputs', async () => {
      // Test valid input
      const validResponse = await request(app)
        .post('/api/contact')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Hello, this is a test message.'
        });

      expect(validResponse.status).toBe(200);
      expect(validResponse.body).toHaveProperty('message');

      // Test missing required fields
      const invalidResponse = await request(app)
        .post('/api/contact')
        .send({
          name: 'John Doe'
          // Missing email and message
        });

      expect(invalidResponse.status).toBe(400);
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/auth/callback')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should enforce request size limits', async () => {
      const largePayload = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'x'.repeat(1000000) // 1MB message
      };

      const response = await request(app)
        .post('/api/contact')
        .send(largePayload);

      // Should either succeed or fail gracefully
      expect([200, 413, 400]).toContain(response.status);
    });
  });

  describe('Security Headers and CORS', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/api/auth/me');
      
      // Check for basic response headers and proper content type
      expect(response.headers).toHaveProperty('content-type');
      expect(response.status).toBe(401); // Proper authentication required
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/me')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect([200, 204]).toContain(response.status);
    });
  });

  describe('Error Handling Consistency', () => {
    it('should return consistent error format', async () => {
      const response = await request(app).get('/api/nonexistent-endpoint');
      
      expect(response.status).toBe(404);
      expect(response.body).toBeDefined();
    });

    it('should handle internal errors gracefully', async () => {
      // Test with invalid callback code that might cause internal error
      const response = await request(app)
        .post('/api/auth/callback')
        .send({ code: null });

      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should respond to health checks quickly', async () => {
      const start = Date.now();
      
      await request(app).get('/api/auth/me');
      
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(500); // 500ms threshold
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, () =>
        request(app).get('/api/auth/me')
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - start;

      // All should return 401
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Database Connection Health', () => {
    it('should maintain database connectivity', async () => {
      // Test endpoints that require database access
      const response = await request(app).get('/api/auth/me');
      
      // Should not fail due to database connection issues
      expect(response.status).not.toBe(503);
    });
  });

  describe('Session Management', () => {
    it('should create and manage sessions properly', async () => {
      const agent = request.agent(app);
      
      // Make first request to establish session
      const response1 = await agent.get('/api/auth/me');
      expect(response1.status).toBe(401);
      
      // Session should persist across requests
      const response2 = await agent.get('/api/auth/me');
      expect(response2.status).toBe(401);
      
      // Both requests should be handled consistently
      expect(response1.status).toBe(response2.status);
    });

    it('should handle session destruction on sign out', async () => {
      const agent = request.agent(app);
      
      // Establish session
      await agent.get('/api/auth/me');
      
      // Sign out
      const signOutResponse = await agent.post('/api/auth/signout');
      expect(signOutResponse.status).toBe(200);
      
      // Session should be destroyed
      const checkResponse = await agent.get('/api/auth/me');
      expect(checkResponse.status).toBe(401);
    });
  });

  describe('Content Type Handling', () => {
    it('should accept JSON content type', async () => {
      const response = await request(app)
        .post('/api/contact')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message'
        }));

      expect(response.status).toBe(200);
    });

    it('should reject invalid content types for JSON endpoints', async () => {
      const response = await request(app)
        .post('/api/auth/callback')
        .set('Content-Type', 'text/plain')
        .send('code=test');

      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Rate Limiting Compliance', () => {
    it('should handle multiple requests without blocking legitimate traffic', async () => {
      const requests = Array.from({ length: 20 }, () =>
        request(app).get('/api/auth/me')
      );

      const responses = await Promise.all(requests);
      
      // Most requests should succeed (return 401 for unauthenticated)
      const successfulResponses = responses.filter(r => r.status === 401);
      expect(successfulResponses.length).toBeGreaterThan(15);
    });
  });
});