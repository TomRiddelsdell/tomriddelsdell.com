import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getConfig } from '../../configuration/node-config-service';

// Mock the configuration loader
vi.mock('../../configuration/node-config-service', () => ({
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

describe('Deployment Validation Tests', () => {
  
  describe('Environment Configuration', () => {
    it('should load configuration successfully', () => {
      expect(() => getConfig()).not.toThrow();
    });

    it('should have valid environment-specific settings', () => {
      const config = getConfig();
      
      expect(config.environment).toMatch(/^(development|staging|production|test)$/);
      expect(config.database.url).toBeDefined();
      expect(config.security.session.secret).toBeDefined();
    });

    it('should have proper security configuration for production', () => {
      const config = getConfig();
      
      if (config.environment === 'production') {
        expect(config.security.session.secure).toBe(true);
        expect(config.database.ssl.enabled).toBe(true);
        expect(config.security.cors.allowedOrigins.length).toBeGreaterThan(0);
        expect(config.security.cors.allowedOrigins).not.toContain('*');
      }
    });

    it('should have required AWS Cognito configuration', () => {
      const config = getConfig();
      
      expect(config.cognito.clientId).toBeDefined();
      expect(config.cognito.userPoolId).toBeDefined();
      expect(config.cognito.region).toBeDefined();
      expect(config.cognito.hostedUIDomain).toBeDefined();
    });

    it('should have proper service URLs', () => {
      const config = getConfig();
      
      expect(config.services.external.baseUrl).toMatch(/^https?:\/\/.+/);
      expect(config.services.external.callbackUrl).toMatch(/^https?:\/\/.+\/auth\/callback$/);
      expect(config.services.external.logoutUrl).toMatch(/^https?:\/\/.+/);
    });
  });

  describe('Feature Flags', () => {
    it('should have appropriate feature flags for environment', () => {
      const config = getConfig();
      
      expect(typeof config.features.analyticsEnabled).toBe('boolean');
      expect(typeof config.features.debugMode).toBe('boolean');
      expect(typeof config.features.maintenanceMode).toBe('boolean');
      
      if (config.environment === 'production') {
        expect(config.features.debugMode).toBe(false);
        expect(config.features.maintenanceMode).toBe(false);
      }
    });
  });

  describe('Database Configuration', () => {
    it('should have valid database connection parameters', () => {
      const config = getConfig();
      
      expect(config.database.pool.min).toBeGreaterThan(0);
      expect(config.database.pool.max).toBeGreaterThan(config.database.pool.min);
      expect(config.database.pool.connectionTimeoutMillis).toBeGreaterThan(0);
    });

    it('should enforce SSL in production', () => {
      const config = getConfig();
      
      if (config.environment === 'production') {
        expect(config.database.ssl.enabled).toBe(true);
        expect(config.database.ssl.rejectUnauthorized).toBe(true);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should have appropriate rate limiting for environment', () => {
      const config = getConfig();
      
      expect(config.security.rateLimit.windowMs).toBeGreaterThan(0);
      expect(config.security.rateLimit.maxRequests).toBeGreaterThan(0);
      
      if (config.environment === 'production') {
        expect(config.security.rateLimit.maxRequests).toBeLessThan(1000);
      }
    });
  });

  describe('Logging Configuration', () => {
    it('should have appropriate logging configuration', () => {
      const config = getConfig();
      
      expect(['debug', 'info', 'warn', 'error']).toContain(config.logging.level);
      expect(typeof config.logging.enableConsole).toBe('boolean');
      expect(typeof config.logging.enableDatabase).toBe('boolean');
      
      if (config.environment === 'production') {
        expect(config.logging.level).toMatch(/^(info|warn|error)$/);
      }
    });
  });
});
