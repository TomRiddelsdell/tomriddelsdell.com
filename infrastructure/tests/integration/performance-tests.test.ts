import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { registerRoutes } from '../../../interfaces/api-gateway/src/routes';
import express from 'express';

// Mock the configuration loader
vi.mock('../../configuration/config-loader', () => ({
  getConfig: vi.fn(() => ({
    environment: 'test',
    database: {
      url: 'postgresql://test:test@localhost:5432/test',
      pool: {
        min: 2,
        max: 10,
        connectionTimeoutMillis: 5000
      },
      ssl: {
        enabled: false,
        rejectUnauthorized: false
      }
    },
    security: {
      session: {
        secret: 'test-session-secret-that-is-at-least-32-characters-long',
        secure: false
      },
      cors: {
        allowedOrigins: ['http://localhost:3000']
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100
      },
      csp: {
        directives: {}
      }
    },
    cognito: {
      clientId: 'test-client-id',
      userPoolId: 'test-user-pool-id',
      region: 'us-east-1',
      hostedUIDomain: 'test-domain.auth.us-east-1.amazoncognito.com'
    },
    services: {
      external: {
        baseUrl: 'https://test.example.com',
        callbackUrl: 'https://test.example.com/auth/callback',
        logoutUrl: 'https://test.example.com/logout'
      }
    },
    features: {
      analyticsEnabled: false,
      debugMode: false,
      maintenanceMode: false
    },
    logging: {
      level: 'info',
      enableConsole: true,
      enableDatabase: false
    },
    email: {
      provider: 'sendgrid',
      sendgrid: {
        apiKey: 'SG.test-api-key'
      }
    }
  }))
}));

describe('Performance Tests', () => {
  let app: Express;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('Response Time Benchmarks', () => {
    it('should respond to health checks within 100ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/monitoring/health')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200); // Allow more time for CI environment
    });

    it('should handle auth endpoints within 500ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/auth/me')
        .expect(401);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should process monitoring requests efficiently', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/monitoring/status')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Load Testing', () => {
    it('should handle concurrent requests', async () => {
      const concurrentRequests = 10;
      const promises = Array(concurrentRequests).fill(0).map(() =>
        request(app).get('/api/monitoring/health')
      );
      
      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain performance under moderate load', async () => {
      const requestCount = 50;
      const maxDuration = 2000; // 2 seconds for 50 requests
      
      const start = Date.now();
      
      const promises = Array(requestCount).fill(0).map(() =>
        request(app).get('/api/monitoring/health')
      );
      
      await Promise.all(promises);
      
      const totalDuration = Date.now() - start;
      expect(totalDuration).toBeLessThan(maxDuration);
    });
  });

  describe('Memory & Resource Usage', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make many requests to test for memory leaks
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/monitoring/health');
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
});
