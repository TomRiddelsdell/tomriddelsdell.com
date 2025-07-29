import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Security Middleware Tests - Infrastructure Layer
 * 
 * Following DDD principles:
 * - Infrastructure layer handles cross-cutting security concerns
 * - Security headers are infrastructure responsibilities
 * - Authentication/authorization are application services
 */

describe('Security Middleware - Infrastructure Layer', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Security Headers Middleware', () => {
    it('should add required security headers to responses', async () => {
      // Mock security middleware following DDD Infrastructure patterns
      app.use((req, res, next) => {
        // Security headers are infrastructure concerns
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        next();
      });

      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('content-security-policy');
    });

    it('should enforce HTTPS in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      app.use((req, res, next) => {
        if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
          return res.status(302).redirect(`https://${req.headers.host}${req.url}`);
        }
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        next();
      });

      app.get('/test', (req, res) => {
        res.json({ message: 'secure' });
      });

      await request(app)
        .get('/test')
        .set('X-Forwarded-Proto', 'http')
        .expect(302);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('CORS Security Middleware', () => {
    it('should enforce CORS policy for allowed origins', async () => {
      const allowedOrigins = ['https://example.com', 'https://app.example.com'];

      app.use((req, res, next) => {
        const origin = req.headers.origin as string;
        if (allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
      });

      app.get('/test', (req, res) => {
        res.json({ message: 'cors test' });
      });

      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://example.com')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin', 'https://example.com');
      expect(response.headers).toHaveProperty('access-control-allow-credentials', 'true');
    });

    it('should reject requests from unauthorized origins', async () => {
      const allowedOrigins = ['https://example.com'];

      app.use((req, res, next) => {
        const origin = req.headers.origin as string;
        if (origin && !allowedOrigins.includes(origin)) {
          return res.status(403).json({ error: 'Forbidden origin' });
        }
        next();
      });

      app.get('/test', (req, res) => {
        res.json({ message: 'cors test' });
      });

      await request(app)
        .get('/test')
        .set('Origin', 'https://malicious.com')
        .expect(403);
    });
  });

  describe('Rate Limiting Middleware', () => {
    it('should enforce rate limits per IP address', async () => {
      const requestCounts = new Map<string, number>();
      const RATE_LIMIT = 5;
      const WINDOW_MS = 60000; // 1 minute

      app.use((req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const currentCount = requestCounts.get(ip) || 0;

        if (currentCount >= RATE_LIMIT) {
          return res.status(429).json({ 
            error: 'Too many requests',
            retryAfter: WINDOW_MS / 1000
          });
        }

        requestCounts.set(ip, currentCount + 1);
        
        // Reset counter after window (simplified for testing)
        setTimeout(() => {
          requestCounts.delete(ip);
        }, WINDOW_MS);

        next();
      });

      app.get('/test', (req, res) => {
        res.json({ message: 'rate limit test' });
      });

      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        await request(app).get('/test').expect(200);
      }

      // 6th request should be rate limited
      await request(app).get('/test').expect(429);
    });
  });

  describe('Content Security Policy', () => {
    it('should set appropriate CSP headers for web applications', async () => {
      app.use((req, res, next) => {
        const csp = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "connect-src 'self' https://api.example.com",
          "frame-ancestors 'none'"
        ].join('; ');

        res.setHeader('Content-Security-Policy', csp);
        next();
      });

      app.get('/test', (req, res) => {
        res.json({ message: 'csp test' });
      });

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers).toHaveProperty('content-security-policy');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
      expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    });
  });

  describe('Authentication Security', () => {
    it('should validate session integrity', async () => {
      app.use((req, res, next) => {
        // Mock session validation
        const sessionId = req.headers['x-session-id'] as string;
        
        if (sessionId === 'invalid-session') {
          return res.status(401).json({ error: 'Invalid session' });
        }
        
        if (sessionId === 'expired-session') {
          return res.status(401).json({ error: 'Session expired' });
        }

        if (sessionId === 'valid-session') {
          (req as any).user = { id: 1, email: 'test@example.com' };
        }

        next();
      });

      app.get('/protected', (req, res) => {
        if (!(req as any).user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        res.json({ message: 'protected resource', user: (req as any).user });
      });

      // Test invalid session
      await request(app)
        .get('/protected')
        .set('X-Session-ID', 'invalid-session')
        .expect(401);

      // Test expired session
      await request(app)
        .get('/protected')
        .set('X-Session-ID', 'expired-session')
        .expect(401);

      // Test valid session
      await request(app)
        .get('/protected')
        .set('X-Session-ID', 'valid-session')
        .expect(200);
    });
  });
});
