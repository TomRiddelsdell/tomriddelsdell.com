import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../src/routes';
import { storage } from '../../src/storage';

// Mock the configuration loader
vi.mock('../../../../infrastructure/configuration/config-loader', () => ({
  getConfig: vi.fn(() => ({
    environment: 'test',
    security: {
      cors: {
        allowedOrigins: ['http://localhost:3000'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
        allowCredentials: true,
      },
      session: {
        secret: 'test-session-secret-at-least-32-characters-long',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
      },
      csp: {
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': ["'self'"],
          'font-src': ["'self'"],
          'object-src': ["'none'"],
          'media-src': ["'self'"],
          'frame-src': ["'none'"],
        },
      },
    },
    cognito: {
      clientId: '483n96q9sudb248kp2sgto7i47',
      userPoolId: 'test-pool-id',
      region: 'eu-west-2',
      hostedUIDomain: 'test.auth.eu-west-2.amazoncognito.com',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
    },
    database: {
      url: process.env.DATABASE_URL || 'postgresql://test:test@localhost/test',
      pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
      ssl: {
        enabled: false,
        rejectUnauthorized: false,
      },
    },
    email: {
      provider: 'none',
      sendgrid: {
        fromEmail: 'test@example.com',
        fromName: 'Test',
      },
    },
    services: {
      apiGateway: {
        port: 5000,
        host: '0.0.0.0',
        timeout: 30000,
      },
      external: {
        baseUrl: 'http://localhost:5000',
        callbackUrl: 'http://localhost:5000/auth/callback',
        logoutUrl: 'http://localhost:5000',
      },
    },
    features: {
      emailEnabled: false,
      analyticsEnabled: true,
      debugMode: true,
      maintenanceMode: false,
      newUserRegistration: true,
    },
    logging: {
      level: 'debug',
      enableConsole: true,
      enableFile: false,
      enableDatabase: false,
      format: 'simple',
      maxFileSize: '10mb',
      maxFiles: 5,
    },
  })),
}));

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
        .expect(302); // Expect redirect on successful auth

      expect(response.headers.location).toBe('/dashboard');
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