import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { registerRoutes } from '../../../interfaces/api-gateway/src/routes';
import express from 'express';

describe('Performance Regression Tests', () => {
  let app: Express;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('API Response Times', () => {
    it('should respond to /api/auth/me within 200ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/auth/me')
        .expect(401); // Expected since not authenticated
      
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(200);
    });

    it('should handle auth callback within 2 seconds', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/auth/callback')
        .send({ code: 'test-code' })
        .expect(500); // Expected since invalid code
      
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(2000);
    });

    it('should respond to contact form within 1 second', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message'
        })
        .expect(200);
      
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle sign out within 100ms', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/auth/signout')
        .expect(200);
      
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(100);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple auth checks concurrently', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/api/auth/me')
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - start;

      // All should return 401 (unauthenticated)
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });

      // Should complete all requests within 1 second
      expect(totalTime).toBeLessThan(1000);
    });

    it('should handle multiple contact form submissions', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/contact')
          .send({
            name: `Test User ${i}`,
            email: `test${i}@example.com`,
            message: `Test message ${i}`
          })
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - start;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete all requests within 3 seconds
      expect(totalTime).toBeLessThan(3000);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/auth/me');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle invalid JSON gracefully and quickly', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/auth/callback')
        .send('invalid json')
        .expect(400);
      
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(100);
    });

    it('should handle large payloads efficiently', async () => {
      const largeMessage = 'x'.repeat(10000); // 10KB message
      
      const start = Date.now();
      
      await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: largeMessage
        })
        .expect(200);
      
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(2000);
    });
  });
});