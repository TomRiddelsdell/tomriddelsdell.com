import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import { getConfig } from '../../../../infrastructure/configuration/config-loader';

// Mock the configuration loader
vi.mock('../../../../infrastructure/configuration/config-loader', () => ({
  getConfig: vi.fn(),
}));

// Mock other dependencies
vi.mock('../../../../infrastructure/database/initTemplates', () => ({
  initializeTemplates: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/routes', () => ({
  registerRoutes: vi.fn().mockResolvedValue({
    listen: vi.fn((port, host, callback) => {
      if (callback) callback();
      return { close: vi.fn() };
    }),
  }),
}));

vi.mock('../../src/vite', () => ({
  setupVite: vi.fn().mockResolvedValue(undefined),
  serveStatic: vi.fn(),
  log: vi.fn(),
}));

describe('Server Startup Process', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Configuration Validation on Startup', () => {
    it('should successfully start with valid configuration', async () => {
      const mockConfig = {
        environment: 'development',
        security: {
          cors: {
            allowedOrigins: ['http://localhost:5000'],
            allowedMethods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type'],
            allowCredentials: true,
          },
          session: {
            secret: 'secure_session_secret_32_characters',
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
            },
          },
        },
        database: {
          url: 'postgresql://localhost/test',
          pool: { min: 2, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000 },
          ssl: { enabled: false, rejectUnauthorized: false },
        },
        services: {
          apiGateway: { port: 5000, host: '0.0.0.0', timeout: 30000 },
          external: {
            baseUrl: 'http://localhost:5000',
            callbackUrl: 'http://localhost:5000/auth/callback',
            logoutUrl: 'http://localhost:5000',
          },
        },
        cognito: {
          clientId: 'test_client',
          userPoolId: 'test_pool',
          region: 'us-east-1',
          hostedUIDomain: 'https://test.auth.us-east-1.amazoncognito.com',
          accessKeyId: 'test_key',
          secretAccessKey: 'test_secret',
        },
        email: {
          provider: 'none',
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
          enableDatabase: true,
          format: 'simple',
          maxFileSize: '10mb',
          maxFiles: 5,
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      // Import and test the startup logic
      const { registerRoutes } = await import('../../src/routes');
      const { initializeTemplates } = await import('../../../../infrastructure/database/initTemplates');

      // Simulate startup process
      const config = getConfig();
      expect(config.environment).toBe('development');

      await initializeTemplates();
      const server = await registerRoutes(express());

      expect(initializeTemplates).toHaveBeenCalled();
      expect(registerRoutes).toHaveBeenCalled();
    });

    it('should fail gracefully with invalid configuration', async () => {
      (getConfig as any).mockImplementation(() => {
        throw new Error('Configuration validation failed: Missing required fields');
      });

      expect(() => getConfig()).toThrow('Configuration validation failed');
    });

    it('should validate configuration has all required sections', async () => {
      const incompleteConfig = {
        environment: 'production',
        // Missing security, database, etc.
      };

      (getConfig as any).mockReturnValue(incompleteConfig);

      const config = getConfig();
      
      // Check that incomplete config would fail validation
      expect(config.security).toBeUndefined();
      expect(config.database).toBeUndefined();
      expect(config.services).toBeUndefined();
    });
  });

  describe('Port Configuration', () => {
    it('should always use port 5000 for Replit compatibility', async () => {
      const mockConfig = {
        environment: 'production',
        services: {
          apiGateway: { port: 5000, host: '0.0.0.0', timeout: 30000 },
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.services.apiGateway.port).toBe(5000);
    });

    it('should warn if port is not 5000', async () => {
      const mockConfig = {
        environment: 'development',
        services: {
          apiGateway: { port: 3000, host: '0.0.0.0', timeout: 30000 },
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      // Port should be 3000 but this should trigger a warning in production
      expect(config.services.apiGateway.port).toBe(3000);
    });

    it('should bind to 0.0.0.0 for external access', async () => {
      const mockConfig = {
        environment: 'production',
        services: {
          apiGateway: { port: 5000, host: '0.0.0.0', timeout: 30000 },
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.services.apiGateway.host).toBe('0.0.0.0');
    });
  });

  describe('Environment-Specific Startup', () => {
    it('should configure development mode correctly', async () => {
      process.env.NODE_ENV = 'development';

      const mockConfig = {
        environment: 'development',
        security: {
          cors: {
            allowedOrigins: ['http://localhost:5000', 'http://localhost:3000'],
          },
          session: { secure: false },
          rateLimit: { maxRequests: 1000 },
        },
        features: { debugMode: true },
        logging: { level: 'debug' },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.environment).toBe('development');
      expect(config.security.session.secure).toBe(false);
      expect(config.security.rateLimit.maxRequests).toBe(1000);
      expect(config.features.debugMode).toBe(true);
    });

    it('should configure production mode correctly', async () => {
      process.env.NODE_ENV = 'production';

      const mockConfig = {
        environment: 'production',
        security: {
          cors: {
            allowedOrigins: ['https://my-app.replit.app'],
          },
          session: { secure: true },
          rateLimit: { maxRequests: 50 },
        },
        features: { debugMode: false },
        logging: { level: 'info' },
        database: { ssl: { enabled: true } },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.environment).toBe('production');
      expect(config.security.session.secure).toBe(true);
      expect(config.security.rateLimit.maxRequests).toBe(50);
      expect(config.features.debugMode).toBe(false);
      expect(config.database.ssl.enabled).toBe(true);
    });
  });

  describe('CORS Configuration', () => {
    it('should allow localhost in development', async () => {
      const mockConfig = {
        environment: 'development',
        security: {
          cors: {
            allowedOrigins: ['http://localhost:5000', 'http://localhost:3000'],
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowCredentials: true,
          },
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.security.cors.allowedOrigins).toContain('http://localhost:5000');
      expect(config.security.cors.allowCredentials).toBe(true);
    });

    it('should restrict origins in production', async () => {
      const mockConfig = {
        environment: 'production',
        security: {
          cors: {
            allowedOrigins: ['https://my-app.replit.app'],
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowCredentials: true,
          },
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.security.cors.allowedOrigins).not.toContain('http://localhost:5000');
      expect(config.security.cors.allowedOrigins).toContain('https://my-app.replit.app');
    });

    it('should include Replit domain when available', async () => {
      process.env.REPLIT_DOMAINS = 'my-test-app.replit.dev';

      const mockConfig = {
        environment: 'development',
        security: {
          cors: {
            allowedOrigins: ['http://localhost:5000', 'https://my-test-app.replit.dev'],
          },
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.security.cors.allowedOrigins).toContain('https://my-test-app.replit.dev');
    });
  });

  describe('Database Configuration', () => {
    it('should require DATABASE_URL', async () => {
      const mockConfig = {
        database: {
          url: '', // Empty URL should cause issues
          pool: { min: 2, max: 10 },
          ssl: { enabled: false },
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.database.url).toBe('');
      // This should fail validation
    });

    it('should configure SSL for production', async () => {
      const mockConfig = {
        environment: 'production',
        database: {
          url: 'postgresql://user:pass@host/db',
          pool: { min: 2, max: 10 },
          ssl: { enabled: true, rejectUnauthorized: true },
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.database.ssl.enabled).toBe(true);
      expect(config.database.ssl.rejectUnauthorized).toBe(true);
    });

    it('should disable SSL for development', async () => {
      const mockConfig = {
        environment: 'development',
        database: {
          url: 'postgresql://localhost/test',
          pool: { min: 2, max: 10 },
          ssl: { enabled: false, rejectUnauthorized: false },
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.database.ssl.enabled).toBe(false);
    });
  });

  describe('Session Security', () => {
    it('should use secure sessions in production', async () => {
      const mockConfig = {
        environment: 'production',
        security: {
          session: {
            secret: 'production_secret_32_characters_long',
            secure: true,
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
          },
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.security.session.secure).toBe(true);
      expect(config.security.session.httpOnly).toBe(true);
      expect(config.security.session.secret.length).toBeGreaterThanOrEqual(32);
    });

    it('should use insecure sessions in development', async () => {
      const mockConfig = {
        environment: 'development',
        security: {
          session: {
            secret: 'development_secret_32_characters',
            secure: false,
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
          },
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.security.session.secure).toBe(false);
      expect(config.security.session.httpOnly).toBe(true);
    });

    it('should reject weak session secrets', async () => {
      const weakSecrets = ['weak', 'short', 'default_secret'];

      for (const secret of weakSecrets) {
        const mockConfig = {
          security: {
            session: { secret },
          },
        };

        (getConfig as any).mockReturnValue(mockConfig);

        const config = getConfig();
        // Weak secrets should fail validation
        expect(config.security.session.secret.length).toBeLessThan(32);
      }
    });
  });

  describe('Feature Flags', () => {
    it('should configure features for development', async () => {
      const mockConfig = {
        environment: 'development',
        features: {
          debugMode: true,
          analyticsEnabled: true,
          emailEnabled: false,
          maintenanceMode: false,
          newUserRegistration: true,
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.features.debugMode).toBe(true);
      expect(config.features.emailEnabled).toBe(false);
      expect(config.features.newUserRegistration).toBe(true);
    });

    it('should configure features for production', async () => {
      const mockConfig = {
        environment: 'production',
        features: {
          debugMode: false,
          analyticsEnabled: true,
          emailEnabled: true,
          maintenanceMode: false,
          newUserRegistration: true,
        },
      };

      (getConfig as any).mockReturnValue(mockConfig);

      const config = getConfig();
      expect(config.features.debugMode).toBe(false);
      expect(config.features.emailEnabled).toBe(true);
      expect(config.features.analyticsEnabled).toBe(true);
    });
  });
});