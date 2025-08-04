/**
 * Node Config Service Tests
 * 
 * Validates that the new Node Config-based configuration service
 * works correctly and maintains compatibility with existing code.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  getConfig, 
  reloadConfiguration, 
  getConfigValue, 
  hasConfigValue 
} from './node-config-service';

describe('Node Config Service', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Start with clean environment for each test
    process.env = { ...originalEnv };
    
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Basic Configuration Loading', () => {
    it('should load test configuration', () => {
      const config = getConfig();
      
      expect(config.environment).toBe('test');
      expect(config.security.session.secret).toBe('test-session-secret-32-characters-long');
      expect(config.database.url).toBe('postgresql://test:test@localhost:5432/test_db');
    });

    it('should have correct test-specific settings', () => {
      const config = getConfig();
      
      // Test environment should have specific overrides
      expect(config.features.emailEnabled).toBe(false);
      expect(config.features.analyticsEnabled).toBe(false);
      expect(config.logging.level).toBe('error');
      expect(config.logging.enableConsole).toBe(false);
    });

    it('should auto-generate callback URLs', () => {
      const config = getConfig();
      
      expect(config.services.external.baseUrl).toBe('http://localhost:5001');
      expect(config.services.external.callbackUrl).toBe('http://localhost:5001/auth/callback');
      expect(config.services.external.logoutUrl).toBe('http://localhost:5001');
    });
  });

  describe('Configuration Validation', () => {
    it('should accept valid test configuration', () => {
      expect(() => getConfig()).not.toThrow();
    });

    it('should validate required fields in non-test environment', () => {
      // Override to development environment which has REQUIRED placeholders
      process.env.NODE_ENV = 'development';
      process.env.SESSION_SECRET = 'REQUIRED';
      
      expect(() => {
        reloadConfiguration();
      }).toThrow(/Missing required configuration fields/);
    });

    it('should validate session secret length in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.SESSION_SECRET = 'short'; // Less than 32 characters
      
      expect(() => {
        reloadConfiguration();
      }).toThrow();
    });
  });

  describe('Utility Functions', () => {
    it('should get nested configuration values', () => {
      const sessionSecret = getConfigValue<string>('security.session.secret');
      expect(sessionSecret).toBe('test-session-secret-32-characters-long');
      
      const dbPoolMax = getConfigValue<number>('database.pool.max');
      expect(dbPoolMax).toBe(3); // Test environment override
    });

    it('should check if configuration paths exist', () => {
      expect(hasConfigValue('security.session.secret')).toBe(true);
      expect(hasConfigValue('nonexistent.path')).toBe(false);
      expect(hasConfigValue('email.sendgrid.apiKey')).toBe(false); // Not set in test
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should load development configuration', () => {
      process.env.NODE_ENV = 'development';
      process.env.SESSION_SECRET = 'development-secret-32-characters-long';
      process.env.DATABASE_URL = 'postgresql://dev:dev@localhost:5432/dev_db';
      process.env.VITE_AWS_COGNITO_CLIENT_ID = 'dev-client-id';
      process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'eu-west-2_dev123';
      process.env.VITE_AWS_COGNITO_REGION = 'eu-west-2';
      process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'dev-domain';
      process.env.AWS_ACCESS_KEY_ID = 'AKIADEV123';
      process.env.AWS_SECRET_ACCESS_KEY = 'dev-secret';
      process.env.GITHUB_TOKEN = 'dev-github-token';
      
      const config = reloadConfiguration();
      
      expect(config.environment).toBe('development');
      expect(config.security.session.secure).toBe(false); // Development override
      expect(config.features.debugMode).toBe(true); // Development override
      expect(config.logging.level).toBe('debug'); // Development override
    });
  });

  describe('REPLIT_DOMAINS Support', () => {
    it('should handle REPLIT_DOMAINS for CORS origins', () => {
      process.env.REPLIT_DOMAINS = 'my-app.replit.app,other-app.replit.app';
      
      const config = reloadConfiguration();
      
      expect(config.security.cors.allowedOrigins).toEqual([
        'https://my-app.replit.app',
        'https://other-app.replit.app'
      ]);
    });

    it('should handle REPLIT_DOMAINS for base URL', () => {
      process.env.REPLIT_DOMAINS = 'my-app.replit.app';
      
      const config = reloadConfiguration();
      
      expect(config.services.external.baseUrl).toBe('https://my-app.replit.app');
    });
  });

  describe('SendGrid Conditional Configuration', () => {
    it('should not include SendGrid config when provider is none', () => {
      process.env.EMAIL_PROVIDER = 'none';
      
      const config = reloadConfiguration();
      
      expect(config.email.provider).toBe('none');
      expect(config.email.sendgrid).toBeUndefined();
    });

    it('should include SendGrid config when provider is sendgrid and API key exists', () => {
      process.env.EMAIL_PROVIDER = 'sendgrid';
      process.env.SENDGRID_API_KEY = 'SG.test-api-key';
      process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
      
      const config = reloadConfiguration();
      
      expect(config.email.provider).toBe('sendgrid');
      expect(config.email.sendgrid).toBeDefined();
      expect(config.email.sendgrid?.apiKey).toBe('SG.test-api-key');
    });
  });

  describe('Configuration Caching', () => {
    it('should cache configuration after first load', () => {
      const config1 = getConfig();
      const config2 = getConfig();
      
      // Should return the same object (cached)
      expect(config1).toBe(config2);
    });

    it('should reload configuration when explicitly requested', () => {
      const config1 = getConfig();
      
      // Change an environment variable
      process.env.DEBUG_MODE = 'true';
      
      // Should still return cached version
      const config2 = getConfig();
      expect(config1).toBe(config2);
      
      // Should return new configuration after reload
      const config3 = reloadConfiguration();
      expect(config3).not.toBe(config1);
    });
  });
});
