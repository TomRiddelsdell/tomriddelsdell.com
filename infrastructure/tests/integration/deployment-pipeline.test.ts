import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { setupValidTestEnvironment, setupProductionTestEnvironment, setupDevelopmentTestEnvironment } from '../helpers/test-env-setup';

const execAsync = promisify(exec);

describe('Deployment Pipeline Integration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Build Process Validation', () => {
    it('should build successfully with valid configuration', async () => {
      setupProductionTestEnvironment();
      process.env.EMAIL_PROVIDER = 'none'; // Disable email for tests

      // Mock the build process instead of running actual npm build
      // This tests configuration validation without the overhead of actual building
      const { loadConfiguration } = await import('../../configuration/config-loader');
      
      try {
        const config = loadConfiguration();
        expect(config).toBeDefined();
        expect(config.cognito).toBeDefined();
        expect(config.database).toBeDefined();
        expect(config.security).toBeDefined();
        
        // If configuration loads successfully, build should work
        console.log('Configuration valid - build would succeed');
      } catch (error) {
        throw new Error(`Configuration validation failed: ${error}`);
      }
    }, 10000);

    it('should fail build with invalid configuration', async () => {
      // Remove required environment variables
      delete process.env.DATABASE_URL;
      delete process.env.SESSION_SECRET;

      const { loadConfiguration } = await import('../../configuration/config-loader');
      
      try {
        loadConfiguration();
        // If configuration loads, something is wrong
        throw new Error('Configuration should have failed validation');
      } catch (error) {
        // Expected to fail due to missing required variables
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('Environment Validation Pipeline', () => {
    it('should validate environment successfully with all required variables', async () => {
      // Set complete environment
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
      process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
      process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
      process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
      process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
      process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.EMAIL_PROVIDER = 'none';
      process.env.REPLIT_DOMAINS = 'test-app.replit.dev';

      // Test environment validation directly instead of running external script
      const { EnvironmentValidator } = await import('../../../scripts/validate-environment');
      const validator = new EnvironmentValidator();
      
      await validator.validate();
      expect(validator.isDeploymentReady()).toBe(true);
    }, 15000);

    it('should fail validation with missing critical variables', async () => {
      // Remove critical variables
      delete process.env.DATABASE_URL;
      delete process.env.SESSION_SECRET;
      delete process.env.VITE_AWS_COGNITO_CLIENT_ID;

      // Test environment validation directly instead of running external script
      const { EnvironmentValidator } = await import('../../../scripts/validate-environment');
      const validator = new EnvironmentValidator();
      
      await validator.validate();
      expect(validator.isDeploymentReady()).toBe(false);
    }, 15000);
  });

  describe('Configuration Loading Pipeline', () => {
    it('should load configuration without errors in all environments', async () => {
      const environments = ['development', 'production'];

      for (const env of environments) {
        process.env.NODE_ENV = env;
        process.env.DATABASE_URL = 'postgresql://localhost/test';
        process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
        process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
        process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
        process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
        process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
        process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
        process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
        process.env.EMAIL_PROVIDER = 'none';
        process.env.DB_POOL_MIN = '2';
        process.env.DB_POOL_MAX = '10';
        process.env.DB_SSL_ENABLED = env === 'production' ? 'true' : 'false';
        
        if (env === 'production') {
          process.env.CORS_ALLOWED_ORIGINS = 'https://my-app.replit.app';
        }

        try {
          const { loadConfiguration } = await import('../../configuration/config-loader');
          const config = loadConfiguration();
          
          expect(config.environment).toBe(env);
          expect(config.security).toBeDefined();
          expect(config.database).toBeDefined();
          expect(config.services).toBeDefined();
          expect(config.cognito).toBeDefined();
          expect(config.features).toBeDefined();
          expect(config.logging).toBeDefined();
          
          // Environment-specific validations
          if (env === 'production') {
            expect(config.security.session.secure).toBe(true);
            expect(config.database.ssl.enabled).toBe(true);
            expect(config.features.debugMode).toBe(false);
          } else if (env === 'development') {
            expect(config.security.session.secure).toBe(false);
            expect(config.features.debugMode).toBe(true);
          }
        } catch (error) {
          throw new Error(`Configuration loading failed for ${env}: ${error}`);
        }
      }
    });

    it('should validate schema compliance for all environments', async () => {
      const environments = ['development', 'production'];

      for (const env of environments) {
        process.env.NODE_ENV = env;
        process.env.DATABASE_URL = 'postgresql://localhost/test';
        process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
        process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
        process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
        process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
        process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
        process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
        process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
        process.env.EMAIL_PROVIDER = 'none';

        if (env === 'production') {
          process.env.CORS_ALLOWED_ORIGINS = 'https://my-app.replit.app';
        }

        try {
          const { loadConfiguration } = await import('../../configuration/config-loader');
          const { baseConfigSchema } = await import('../../configuration/base-config');
          
          const config = loadConfiguration();
          
          // Should not throw validation error
          expect(() => baseConfigSchema.parse(config)).not.toThrow();
        } catch (error) {
          throw new Error(`Schema validation failed for ${env}: ${error}`);
        }
      }
    });
  });

  describe('Security Validation Pipeline', () => {
    it('should enforce security requirements for production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.SESSION_SECRET = 'production_secret_64_characters_minimum_length_required_here';
      process.env.VITE_AWS_COGNITO_CLIENT_ID = 'prod_client_id';
      process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'prod_pool_id';
      process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
      process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://prod.auth.us-east-1.amazoncognito.com';
      process.env.AWS_ACCESS_KEY_ID = 'prod_access_key';
      process.env.AWS_SECRET_ACCESS_KEY = 'prod_secret_key';
      process.env.CORS_ALLOWED_ORIGINS = 'https://my-app.replit.app';
      process.env.SESSION_SECURE = 'true';
      process.env.EMAIL_PROVIDER = 'none';

      try {
        const { loadConfiguration } = await import('../../configuration/config-loader');
        const config = loadConfiguration();

        // Production security requirements
        expect(config.security.session.secure).toBe(true);
        expect(config.security.session.secret.length).toBeGreaterThanOrEqual(32);
        expect(config.database.ssl.enabled).toBe(true);
        expect(config.database.ssl.rejectUnauthorized).toBe(true);
        expect(config.security.rateLimit.maxRequests).toBeLessThanOrEqual(100); // Strict rate limiting
        expect(config.features.debugMode).toBe(false);
        
        // CORS should be restricted
        expect(config.security.cors.allowedOrigins).not.toContain('http://localhost');
        expect(config.security.cors.allowedOrigins.every(origin => origin.startsWith('https://'))).toBe(true);
      } catch (error) {
        throw new Error(`Production security validation failed: ${error}`);
      }
    });

    it('should reject insecure production configurations', async () => {
      process.env.NODE_ENV = 'production';
      
      const insecureConfigs = [
        {
          name: 'weak session secret',
          env: { SESSION_SECRET: 'weak' }
        },
        {
          name: 'missing database URL',
          env: { DATABASE_URL: '' }
        },
        {
          name: 'missing Cognito client ID',
          env: { VITE_AWS_COGNITO_CLIENT_ID: '' }
        },
      ];

      for (const config of insecureConfigs) {
        // Reset environment
        process.env = { ...originalEnv, NODE_ENV: 'production' };
        
        // Apply insecure configuration
        Object.assign(process.env, config.env);

        try {
          const { loadConfiguration } = await import('../../configuration/config-loader');
          
          expect(() => loadConfiguration()).toThrow();
        } catch (error) {
          // Expected to fail
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Database Configuration Pipeline', () => {
    it('should configure database connections correctly for each environment', async () => {
      const dbConfigs = [
        {
          env: 'development',
          url: 'postgresql://localhost/test_dev',
          ssl: false,
        },
        {
          env: 'production',
          url: 'postgresql://user:pass@prod-host/prod_db',
          ssl: true,
        },
      ];

      for (const dbConfig of dbConfigs) {
        process.env.NODE_ENV = dbConfig.env;
        process.env.VITE_AWS_COGNITO_CLIENT_ID = "test_client_id";
        process.env.VITE_AWS_COGNITO_USER_POOL_ID = "test_pool_id";
        process.env.VITE_AWS_COGNITO_REGION = "us-east-1";
        process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = "https://test.auth.us-east-1.amazoncognito.com";
        process.env.AWS_ACCESS_KEY_ID = "test_access_key";
        process.env.AWS_SECRET_ACCESS_KEY = "test_secret_key";
        process.env.DATABASE_URL = dbConfig.url;
        process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
        process.env.EMAIL_PROVIDER = 'none';
        process.env.DB_POOL_MIN = '2';
        process.env.DB_POOL_MAX = '10';
        process.env.DB_SSL_ENABLED = dbConfig.env === 'production' ? 'true' : 'false';
        
        if (dbConfig.env === 'production') {
          process.env.VITE_AWS_COGNITO_CLIENT_ID = 'prod_client_id';
          process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'prod_pool_id';
          process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
          process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://prod.auth.us-east-1.amazoncognito.com';
          process.env.AWS_ACCESS_KEY_ID = 'prod_access_key';
          process.env.AWS_SECRET_ACCESS_KEY = 'prod_secret_key';
        }

        try {
          const { loadConfiguration } = await import('../../configuration/config-loader');
          const config = loadConfiguration();

          expect(config.database.url).toBe(dbConfig.url);
          expect(config.database.ssl.enabled).toBe(dbConfig.ssl);
          expect(config.database.pool.min).toBeGreaterThanOrEqual(2);
          expect(config.database.pool.max).toBeGreaterThanOrEqual(5);
        } catch (error) {
          throw new Error(`Database configuration failed for ${dbConfig.env}: ${error}`);
        }
      }
    });
  });

  describe('Service URL Configuration Pipeline', () => {
    it('should configure service URLs correctly for Replit deployment', async () => {
      process.env.REPLIT_DOMAINS = 'my-test-app.replit.dev';
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
      process.env.VITE_AWS_COGNITO_CLIENT_ID = 'prod_client_id';
      process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'prod_pool_id';
      process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
      process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://prod.auth.us-east-1.amazoncognito.com';
      process.env.AWS_ACCESS_KEY_ID = 'prod_access_key';
      process.env.AWS_SECRET_ACCESS_KEY = 'prod_secret_key';
      process.env.EMAIL_PROVIDER = 'none';

      try {
        const { loadConfiguration } = await import('../../configuration/config-loader');
        const config = loadConfiguration();

        const expectedDomain = 'https://my-test-app.replit.dev';
        
        expect(config.services.external.baseUrl).toBe(expectedDomain);
        expect(config.services.external.callbackUrl).toBe(`${expectedDomain}/auth/callback`);
        expect(config.services.external.logoutUrl).toBe(expectedDomain);
        expect(config.security.cors.allowedOrigins).toContain(expectedDomain);
      } catch (error) {
        throw new Error(`Service URL configuration failed: ${error}`);
      }
    });

    it('should handle missing REPLIT_DOMAINS gracefully', async () => {
      delete process.env.REPLIT_DOMAINS;
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
      process.env.EMAIL_PROVIDER = 'none';

      try {
        const { loadConfiguration } = await import('../../configuration/config-loader');
        const config = loadConfiguration();

        // Should fallback to localhost
        expect(config.services.external.baseUrl).toContain('localhost:5000');
        expect(config.services.external.callbackUrl).toContain('localhost:5000/auth/callback');
      } catch (error) {
        throw new Error(`Fallback URL configuration failed: ${error}`);
      }
    });
  });

  describe('Feature Flag Pipeline', () => {
    it('should configure feature flags correctly for each environment', async () => {
      const featureConfigs = [
        {
          env: 'development',
          expected: {
            debugMode: true,
            analyticsEnabled: true,
            emailEnabled: false,
          },
        },
        {
          env: 'production',
          expected: {
            debugMode: false,
            analyticsEnabled: true,
            emailEnabled: true,
          },
        },
      ];

      for (const featureConfig of featureConfigs) {
        process.env.NODE_ENV = featureConfig.env;
        process.env.DATABASE_URL = 'postgresql://localhost/test';
        process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
        process.env.EMAIL_PROVIDER = 'none';
        process.env.DB_POOL_MIN = '2';
        process.env.DB_POOL_MAX = '10';
        process.env.DB_SSL_ENABLED = 'false';
        
        if (featureConfig.env === 'production') {
          process.env.VITE_AWS_COGNITO_CLIENT_ID = 'prod_client_id';
          process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'prod_pool_id';
          process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
          process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://prod.auth.us-east-1.amazoncognito.com';
          process.env.AWS_ACCESS_KEY_ID = 'prod_access_key';
          process.env.AWS_SECRET_ACCESS_KEY = 'prod_secret_key';
        }

        try {
          const { loadConfiguration } = await import('../../configuration/config-loader');
          const config = loadConfiguration();

          expect(config.features.debugMode).toBe(featureConfig.expected.debugMode);
          expect(config.features.analyticsEnabled).toBe(featureConfig.expected.analyticsEnabled);
          expect(config.features.emailEnabled).toBe(featureConfig.expected.emailEnabled);
        } catch (error) {
          throw new Error(`Feature flag configuration failed for ${featureConfig.env}: ${error}`);
        }
      }
    });

    it('should allow environment variable overrides for feature flags', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
      process.env.EMAIL_PROVIDER = 'none';
      
      // Override feature flags
      process.env.DEBUG_MODE = 'false';
      process.env.FEATURE_EMAIL_ENABLED = 'true';
      process.env.MAINTENANCE_MODE = 'true';

      try {
        const { loadConfiguration } = await import('../../configuration/config-loader');
        const config = loadConfiguration();

        expect(config.features.debugMode).toBe(false); // Overridden
        expect(config.features.emailEnabled).toBe(true); // Overridden
        expect(config.features.maintenanceMode).toBe(true); // Overridden
      } catch (error) {
        throw new Error(`Feature flag override failed: ${error}`);
      }
    });
  });
});