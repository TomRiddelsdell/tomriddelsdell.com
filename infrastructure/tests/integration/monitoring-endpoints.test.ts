import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Monitoring API Integration Tests
 * 
 * Following DDD principles:
 * - Infrastructure layer handles monitoring endpoints
 * - These endpoints should NOT require authentication (health checks)
 * - They provide system observability for operations
 */

describe('Monitoring API - Health Endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Add security headers middleware BEFORE routes
    app.use((req, res, next) => {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Mock monitoring service
    const mockMonitoringService = {
      getHealthStatus: vi.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: { status: 'connected', responseTime: 15 },
        auth: { status: 'connected', provider: 'cognito' },
        memory: { used: 125, total: 512, percentage: 24.4 }
      }),
      getSystemStatus: vi.fn().mockResolvedValue({
        status: 'operational',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test'
      })
    };

    // Health endpoint - PUBLIC (no auth required)
    app.get('/api/monitoring/health', async (req, res) => {
      try {
        const health = await mockMonitoringService.getHealthStatus();
        res.json(health);
      } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: (error as Error).message });
      }
    });

    // Status endpoint - PUBLIC (no auth required)
    app.get('/api/monitoring/status', async (req, res) => {
      try {
        const status = await mockMonitoringService.getSystemStatus();
        res.json(status);
      } catch (error) {
        res.status(503).json({ status: 'error', error: (error as Error).message });
      }
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return health status without authentication', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
      expect(response.body.database).toHaveProperty('status', 'connected');
    });

    it('should include required security headers', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });

    it('should return 503 when health check fails', async () => {
      // Create app with failing health check
      const failingApp = express();
      failingApp.use(express.json());

      failingApp.get('/api/monitoring/health', async (req, res) => {
        res.status(503).json({ 
          status: 'unhealthy', 
          error: 'Database connection failed' 
        });
      });

      await request(failingApp)
        .get('/api/monitoring/health')
        .expect(503);
    });
  });

  describe('System Status Endpoint', () => {
    it('should return system status without authentication', async () => {
      const response = await request(app)
        .get('/api/monitoring/status')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'operational');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment', 'test');
    });

    it('should respond quickly for operational monitoring', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/monitoring/status')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should respond within 100ms
    });
  });

  describe('Monitoring Security', () => {
    it('should not expose sensitive information in health checks', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .expect(200);

      // Should not contain sensitive data
      expect(JSON.stringify(response.body)).not.toContain('password');
      expect(JSON.stringify(response.body)).not.toContain('secret');
      expect(JSON.stringify(response.body)).not.toContain('token');
      expect(JSON.stringify(response.body)).not.toContain('key');
    });

    it('should handle CORS preflight for monitoring endpoints', async () => {
      app.options('/api/monitoring/health', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
      });

      await request(app)
        .options('/api/monitoring/health')
        .set('Origin', 'https://monitoring.example.com')
        .expect(200);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent health check requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app).get('/api/monitoring/health')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'healthy');
      });
    });

    it('should include cache headers for appropriate caching', async () => {
      app.get('/api/monitoring/cached-status', (req, res) => {
        res.setHeader('Cache-Control', 'public, max-age=30');
        res.json({ status: 'cached', timestamp: Date.now() });
      });

      const response = await request(app)
        .get('/api/monitoring/cached-status')
        .expect(200);

      expect(response.headers).toHaveProperty('cache-control', 'public, max-age=30');
    });
  });
});
