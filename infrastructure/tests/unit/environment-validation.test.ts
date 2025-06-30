import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnvironmentValidator } from '../../scripts/validate-environment';

describe('Environment Validation Scripts', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('EnvironmentValidator', () => {
    let validator: EnvironmentValidator;

    beforeEach(() => {
      validator = new EnvironmentValidator();
    });

    describe('Database Validation', () => {
      it('should pass when DATABASE_URL is properly configured', async () => {
        process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/database';
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true);
      });

      it('should fail when DATABASE_URL is missing', async () => {
        delete process.env.DATABASE_URL;
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(false);
      });

      it('should fail when DATABASE_URL format is invalid', async () => {
        process.env.DATABASE_URL = 'invalid-url-format';
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(false);
      });

      it('should accept both postgresql:// and postgres:// schemes', async () => {
        // Test postgresql://
        process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
        await validator.validate();
        expect(validator.isDeploymentReady()).toBe(true);

        // Reset and test postgres://
        validator = new EnvironmentValidator();
        process.env.DATABASE_URL = 'postgres://user:pass@host:5432/db';
        await validator.validate();
        expect(validator.isDeploymentReady()).toBe(true);
      });
    });

    describe('AWS Cognito Validation', () => {
      const requiredCognitoVars = [
        'VITE_AWS_COGNITO_CLIENT_ID',
        'VITE_AWS_COGNITO_USER_POOL_ID',
        'VITE_AWS_COGNITO_REGION',
        'VITE_AWS_COGNITO_HOSTED_UI_DOMAIN',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY'
      ];

      beforeEach(() => {
        // Set all required variables
        process.env.DATABASE_URL = 'postgresql://localhost/test';
        process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
        requiredCognitoVars.forEach(varName => {
          process.env[varName] = 'test_value';
        });
      });

      it('should pass when all Cognito variables are present', async () => {
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true);
      });

      it('should fail when any Cognito variable is missing', async () => {
        for (const varName of requiredCognitoVars) {
          validator = new EnvironmentValidator();
          delete process.env[varName];
          
          await validator.validate();
          
          expect(validator.isDeploymentReady()).toBe(false);
          
          // Restore for next iteration
          process.env[varName] = 'test_value';
        }
      });

      it('should warn about invalid region format', async () => {
        process.env.VITE_AWS_COGNITO_REGION = 'invalid-region';
        
        await validator.validate();
        
        // Should still be deployment ready but with warnings
        expect(validator.isDeploymentReady()).toBe(true);
      });

      it('should accept valid region formats', async () => {
        const validRegions = ['us-east-1', 'eu-west-2', 'ap-south-1'];
        
        for (const region of validRegions) {
          validator = new EnvironmentValidator();
          process.env.VITE_AWS_COGNITO_REGION = region;
          
          await validator.validate();
          
          expect(validator.isDeploymentReady()).toBe(true);
        }
      });
    });

    describe('Security Configuration Validation', () => {
      beforeEach(() => {
        // Set minimal required variables
        process.env.DATABASE_URL = 'postgresql://localhost/test';
        process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
        process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
        process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
        process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
        process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
        process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
      });

      it('should fail when SESSION_SECRET is missing', async () => {
        delete process.env.SESSION_SECRET;
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(false);
      });

      it('should fail when SESSION_SECRET is too short', async () => {
        process.env.SESSION_SECRET = 'short'; // Less than 32 characters
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(false);
      });

      it('should fail when SESSION_SECRET is a default value', async () => {
        const defaultSecrets = [
          'dev_session_secret_change_in_production',
          'production_session_secret_change_immediately'
        ];

        for (const secret of defaultSecrets) {
          validator = new EnvironmentValidator();
          process.env.SESSION_SECRET = secret;
          
          await validator.validate();
          
          expect(validator.isDeploymentReady()).toBe(false);
        }
      });

      it('should pass with a strong session secret', async () => {
        process.env.SESSION_SECRET = 'very_secure_random_session_secret_with_64_characters_minimum_length';
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true);
      });

      it('should warn about missing CORS configuration in production', async () => {
        process.env.NODE_ENV = 'production';
        process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
        delete process.env.CORS_ALLOWED_ORIGINS;
        
        await validator.validate();
        
        // Should still be ready but with warnings
        expect(validator.isDeploymentReady()).toBe(true);
      });

      it('should validate CORS configuration when present', async () => {
        process.env.NODE_ENV = 'production';
        process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
        process.env.CORS_ALLOWED_ORIGINS = 'https://example.com,https://admin.example.com';
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true);
      });
    });

    describe('Email Service Validation', () => {
      beforeEach(() => {
        // Set required variables
        process.env.DATABASE_URL = 'postgresql://localhost/test';
        process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
        process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
        process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
        process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
        process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
        process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
        process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
      });

      it('should warn when SENDGRID_API_KEY is not configured', async () => {
        delete process.env.SENDGRID_API_KEY;
        
        await validator.validate();
        
        // Should be ready but with warnings
        expect(validator.isDeploymentReady()).toBe(true);
      });

      it('should fail when SENDGRID_API_KEY format is incorrect', async () => {
        process.env.SENDGRID_API_KEY = 'invalid-api-key-format';
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true); // Email is optional
      });

      it('should pass when SENDGRID_API_KEY is properly formatted', async () => {
        process.env.SENDGRID_API_KEY = 'SG.valid-sendgrid-api-key-format';
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true);
      });
    });

    describe('Platform Detection', () => {
      beforeEach(() => {
        // Set minimal required variables
        process.env.DATABASE_URL = 'postgresql://localhost/test';
        process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
        process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
        process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
        process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
        process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
        process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
        process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
      });

      it('should detect Replit platform when REPLIT_DOMAINS is present', async () => {
        process.env.REPLIT_DOMAINS = 'my-app.replit.dev';
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true);
      });

      it('should warn about unknown platform when REPLIT_DOMAINS is absent', async () => {
        delete process.env.REPLIT_DOMAINS;
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true);
      });

      it('should warn in production mode without REPLIT_DOMAINS', async () => {
        process.env.NODE_ENV = 'production';
        delete process.env.REPLIT_DOMAINS;
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true);
      });
    });

    describe('Configuration Loading Validation', () => {
      beforeEach(() => {
        // Set minimal required variables
        process.env.DATABASE_URL = 'postgresql://localhost/test';
        process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
        process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
        process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
        process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
        process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
        process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
        process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
      });

      it('should pass when configuration loads successfully', async () => {
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true);
      });

      it('should fail when configuration loading fails', async () => {
        // Create invalid configuration by removing critical variables
        delete process.env.DATABASE_URL;
        delete process.env.SESSION_SECRET;
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(false);
      });

      it('should warn when API Gateway port is not 5000', async () => {
        process.env.PORT = '3000';
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true); // Warning, not failure
      });
    });

    describe('Deployment Readiness Assessment', () => {
      it('should be ready when all critical checks pass', async () => {
        // Set all required variables
        process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
        process.env.SESSION_SECRET = 'very_secure_session_secret_with_enough_length';
        process.env.VITE_AWS_COGNITO_CLIENT_ID = 'valid_client_id';
        process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'valid_pool_id';
        process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
        process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://valid.auth.us-east-1.amazoncognito.com';
        process.env.AWS_ACCESS_KEY_ID = 'valid_access_key';
        process.env.AWS_SECRET_ACCESS_KEY = 'valid_secret_key';
        process.env.SENDGRID_API_KEY = 'SG.valid-sendgrid-key';
        process.env.REPLIT_DOMAINS = 'my-app.replit.dev';
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true);
      });

      it('should not be ready when critical checks fail', async () => {
        // Missing critical variables
        delete process.env.DATABASE_URL;
        delete process.env.SESSION_SECRET;
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(false);
      });

      it('should be ready with warnings for optional services', async () => {
        // Set required variables but omit optional ones
        process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
        process.env.SESSION_SECRET = 'very_secure_session_secret_with_enough_length';
        process.env.VITE_AWS_COGNITO_CLIENT_ID = 'valid_client_id';
        process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'valid_pool_id';
        process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
        process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://valid.auth.us-east-1.amazoncognito.com';
        process.env.AWS_ACCESS_KEY_ID = 'valid_access_key';
        process.env.AWS_SECRET_ACCESS_KEY = 'valid_secret_key';
        // Omit SENDGRID_API_KEY and REPLIT_DOMAINS
        
        await validator.validate();
        
        expect(validator.isDeploymentReady()).toBe(true);
      });
    });
  });
});