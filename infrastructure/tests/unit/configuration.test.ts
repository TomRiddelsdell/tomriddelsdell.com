import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConfiguration, getConfig, reloadConfiguration, ConfigurationError, validateRequiredEnvironment } from '../../configuration/config-loader';
import { baseConfigSchema } from '../../configuration/base-config';

describe('Configuration System', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      // Clear any email-related environment variables first
      delete process.env.SENDGRID_API_KEY;
      delete process.env.EMAIL_PROVIDER;
      delete process.env.SENDGRID_FROM_EMAIL;
      delete process.env.SENDGRID_FROM_NAME;
      
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost/test_db';
      process.env.SESSION_SECRET = 'test_session_secret_32_chars_long';
      process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
      process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
      process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
      process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
      process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
    });

    it('should load development configuration successfully', () => {
      const config = loadConfiguration();
      
      expect(config.environment).toBe('development');
      expect(config.security.session.secure).toBe(false);
      expect(config.security.cors.allowedOrigins).toContain('http://localhost:5000');
      expect(config.features.debugMode).toBe(true);
    });

    it('should provide development-specific defaults', () => {
      const config = loadConfiguration();
      
      expect(config.security.rateLimit.maxRequests).toBe(1000); // High for dev
      expect(config.logging.level).toBe('debug');
      expect(config.database.ssl.enabled).toBe(false);
    });

    it('should include Replit domain in CORS when available', () => {
      process.env.REPLIT_DOMAINS = 'test-app.replit.dev';
      
      const config = reloadConfiguration();
      
      expect(config.security.cors.allowedOrigins).toContain('https://test-app.replit.dev');
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://prod-user:password@prod-host/prod_db';
      process.env.SESSION_SECRET = 'production_session_secret_very_long_and_secure_32_plus_characters';
      process.env.VITE_AWS_COGNITO_CLIENT_ID = 'prod_client_id';
      process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'prod_pool_id';
      process.env.VITE_AWS_COGNITO_REGION = 'eu-west-1';
      process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://prod.auth.eu-west-1.amazoncognito.com';
      process.env.AWS_ACCESS_KEY_ID = 'prod_access_key';
      process.env.AWS_SECRET_ACCESS_KEY = 'prod_secret_key';
      process.env.REPLIT_DOMAINS = 'my-app.replit.app';
      // Set email provider to none to avoid SendGrid validation
      process.env.EMAIL_PROVIDER = 'none';
    });

    it('should load production configuration successfully', () => {
      const config = loadConfiguration();
      
      expect(config.environment).toBe('production');
      expect(config.security.session.secure).toBe(true);
      expect(config.security.rateLimit.maxRequests).toBe(50); // Stricter for prod
      expect(config.features.debugMode).toBe(false);
    });

    it('should enforce production security settings', () => {
      const config = loadConfiguration();
      
      expect(config.database.ssl.enabled).toBe(true);
      expect(config.database.ssl.rejectUnauthorized).toBe(true);
      expect(config.logging.level).toBe('info');
      expect(config.security.session.maxAge).toBe(24 * 60 * 60 * 1000); // 24 hours
    });

    it('should use Replit domain for base URLs', () => {
      const config = loadConfiguration();
      
      expect(config.services.external.baseUrl).toBe('https://my-app.replit.app');
      expect(config.services.external.callbackUrl).toBe('https://my-app.replit.app/auth/callback');
    });

    it('should configure CORS for production domain', () => {
      const config = loadConfiguration();
      
      expect(config.security.cors.allowedOrigins).toContain('https://my-app.replit.app');
    });
  });

  describe('Environment Variable Overrides', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost/test_db';
      process.env.SESSION_SECRET = 'test_session_secret_32_chars_long';
    });

    it('should override CORS configuration from environment', () => {
      process.env.CORS_ALLOWED_ORIGINS = 'https://custom-domain.com,https://admin.custom-domain.com';
      
      const config = reloadConfiguration();
      
      expect(config.security.cors.allowedOrigins).toEqual([
        'https://custom-domain.com',
        'https://admin.custom-domain.com'
      ]);
    });

    it('should override rate limiting from environment', () => {
      process.env.RATE_LIMIT_WINDOW_MS = '600000'; // 10 minutes
      process.env.RATE_LIMIT_MAX_REQUESTS = '25';
      
      const config = reloadConfiguration();
      
      expect(config.security.rateLimit.windowMs).toBe(600000);
      expect(config.security.rateLimit.maxRequests).toBe(25);
    });

    it('should configure SendGrid when API key is provided', () => {
      // Set all required configuration for valid test
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'test_session_secret_32_chars_long';
      process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
      process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
      process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
      process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
      process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
      
      process.env.SENDGRID_API_KEY = 'SG.test-api-key';
      process.env.SENDGRID_FROM_EMAIL = 'noreply@myapp.com';
      process.env.SENDGRID_FROM_NAME = 'My App';
      
      const config = reloadConfiguration();
      
      expect(config.email.provider).toBe('sendgrid');
      expect(config.email.sendgrid?.apiKey).toBe('SG.test-api-key');
      expect(config.email.sendgrid?.fromEmail).toBe('noreply@myapp.com');
      expect(config.email.sendgrid?.fromName).toBe('My App');
    });

    it('should override feature flags from environment', () => {
      process.env.FEATURE_EMAIL_ENABLED = 'false';
      process.env.DEBUG_MODE = 'true';
      process.env.MAINTENANCE_MODE = 'true';
      
      const config = reloadConfiguration();
      
      expect(config.features.emailEnabled).toBe(false);
      expect(config.features.debugMode).toBe(true);
      expect(config.features.maintenanceMode).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should reject configuration with missing required fields', () => {
      process.env.NODE_ENV = 'production';
      // Intentionally missing required fields
      delete process.env.DATABASE_URL;
      delete process.env.SESSION_SECRET;
      
      expect(() => loadConfiguration()).toThrow(ConfigurationError);
    });

    it('should reject weak session secrets', () => {
      process.env.NODE_ENV = 'production';
      process.env.SESSION_SECRET = 'weak'; // Too short
      
      expect(() => loadConfiguration()).toThrow();
    });

    it('should validate CORS origins format', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'secure_session_secret_32_characters';
      process.env.CORS_ALLOWED_ORIGINS = ''; // Empty
      
      expect(() => loadConfiguration()).toThrow();
    });

    it('should accept valid configuration', () => {
      // Clear all SendGrid environment variables first
      delete process.env.SENDGRID_API_KEY;
      delete process.env.EMAIL_PROVIDER;
      delete process.env.SENDGRID_FROM_EMAIL;
      delete process.env.SENDGRID_FROM_NAME;
      
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.SESSION_SECRET = 'very_secure_session_secret_32_plus_chars';
      process.env.VITE_AWS_COGNITO_CLIENT_ID = 'valid_client_id';
      process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'valid_pool_id';
      process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
      process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://valid.auth.us-east-1.amazoncognito.com';
      process.env.AWS_ACCESS_KEY_ID = 'valid_access_key';
      process.env.AWS_SECRET_ACCESS_KEY = 'valid_secret_key';
      process.env.CORS_ALLOWED_ORIGINS = 'https://valid-domain.com';
      
      expect(() => loadConfiguration()).not.toThrow();
    });
  });

  describe('Required Environment Validation', () => {
    it('should pass validation when all required variables are present', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'secure_session_secret_32_characters';
      process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
      process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
      process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
      process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
      process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
      
      expect(() => validateRequiredEnvironment()).not.toThrow();
    });

    it('should fail validation when required variables are missing', () => {
      delete process.env.DATABASE_URL;
      delete process.env.SESSION_SECRET;
      
      expect(() => validateRequiredEnvironment()).toThrow(ConfigurationError);
      expect(() => validateRequiredEnvironment()).toThrow(/Missing required environment variables/);
    });

    it('should identify specific missing variables', () => {
      delete process.env.VITE_AWS_COGNITO_CLIENT_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      
      try {
        validateRequiredEnvironment();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        if (error instanceof ConfigurationError) {
          expect(error.message).toContain('VITE_AWS_COGNITO_CLIENT_ID');
          expect(error.message).toContain('AWS_SECRET_ACCESS_KEY');
        }
      }
    });
  });

  describe('Configuration Schema Compliance', () => {
    it('should generate configuration that passes schema validation', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
      process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
      process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
      process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
      process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
      process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.EMAIL_PROVIDER = 'none';
      
      const config = loadConfiguration();
      
      // Should not throw validation error
      expect(() => baseConfigSchema.parse(config)).not.toThrow();
    });

    it('should ensure all required configuration sections are present', () => {
      const config = loadConfiguration();
      
      expect(config).toHaveProperty('environment');
      expect(config).toHaveProperty('security');
      expect(config).toHaveProperty('cognito');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('email');
      expect(config).toHaveProperty('services');
      expect(config).toHaveProperty('features');
      expect(config).toHaveProperty('logging');
    });

    it('should ensure security configuration has all required fields', () => {
      const config = loadConfiguration();
      
      expect(config.security).toHaveProperty('cors');
      expect(config.security).toHaveProperty('session');
      expect(config.security).toHaveProperty('rateLimit');
      expect(config.security).toHaveProperty('csp');
      
      expect(config.security.cors).toHaveProperty('allowedOrigins');
      expect(config.security.session).toHaveProperty('secret');
      expect(config.security.rateLimit).toHaveProperty('windowMs');
      expect(config.security.csp).toHaveProperty('directives');
    });
  });

  describe('Configuration Singleton', () => {
    it('should return the same instance on multiple calls', () => {
      const config1 = getConfig();
      const config2 = getConfig();
      
      expect(config1).toBe(config2);
    });

    it('should reload configuration when requested', () => {
      // Ensure basic environment is set up
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'initial_session_secret_32_characters_long';
      process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
      process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
      process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
      process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
      process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.EMAIL_PROVIDER = 'none';
      
      const config1 = getConfig();
      
      // Change environment variable
      process.env.SESSION_SECRET = 'new_session_secret_32_characters_long';
      
      const config2 = reloadConfiguration();
      
      expect(config1).not.toBe(config2);
      expect(config2.security.session.secret).toBe('new_session_secret_32_characters_long');
    });
  });
});