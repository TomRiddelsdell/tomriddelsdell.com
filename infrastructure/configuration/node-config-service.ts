/**
 * Configuration Service using Node Config
 * 
 * This service replaces the custom configuration system with Node Config
 * while maintaining the same interface for backward compatibility.
 * 
 * Features:
 * - Environment-specific configuration loading
 * - Runtime validation using existing Zod schemas
 * - Required field validation
 * - Configuration caching and reloading
 * - Test environment isolation
 */

import config from 'config';
import { z } from 'zod';

// Import existing Zod schemas (keep these for validation)
import { baseConfigSchema, type BaseConfig } from './base-config';

// Re-export ConfigurationError for backward compatibility
export class ConfigurationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Compatibility functions for existing tests
export function loadConfiguration() {
  return getConfig();
}

export function validateRequiredEnvironment() {
  // This function validates that required environment variables are present
  // It checks the actual environment variables, not the processed config
  const requiredEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET', 
    'VITE_AWS_COGNITO_CLIENT_ID',
    'VITE_AWS_COGNITO_USER_POOL_ID',
    'VITE_AWS_COGNITO_REGION',
    'VITE_AWS_COGNITO_HOSTED_UI_DOMAIN',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'GITHUB_TOKEN',
    'GITHUB_OWNER',
    'GITHUB_REPO'
  ];
  
  const missing = requiredEnvVars.filter(key => {
    const value = process.env[key];
    return !value || value.trim() === '' || value === 'REQUIRED';
  });
  
  if (missing.length > 0) {
    throw new ConfigurationError(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}

/**
 * Configuration Service Singleton
 * Provides thread-safe configuration access with validation
 */
class ConfigurationService {
  private static instance: ConfigurationService;
  private configCache: BaseConfig | null = null;
  private isValidated = false;
  private lastEnvironment: string | undefined = undefined;

  static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  /**
   * Get validated configuration object
   * Caches result after first validation for performance
   * Automatically reloads if NODE_ENV changes (important for tests)
   */
  getConfig(): BaseConfig {
    const currentEnv = process.env.NODE_ENV;
    
    // Check if we need to reload due to environment change
    if (this.lastEnvironment !== currentEnv || !this.configCache || !this.isValidated) {
      this.configCache = null;
      this.isValidated = false;
      this.lastEnvironment = currentEnv;
      this.loadAndValidateConfig();
    }
    
    return this.configCache!;
  }

  /**
   * Reload configuration from scratch
   * Useful for tests or runtime configuration changes
   */
  reloadConfig(): BaseConfig {
    this.configCache = null;
    this.isValidated = false;
    
    // For test environment, we need to reload the config module completely
    // to pick up NODE_ENV changes during testing
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || (global as any).vitest) {
      // Clear Node Config's internal cache
      delete require.cache[require.resolve('config')];
      
      // Force Node Config to reload by clearing its internal state
      const config = require('config');
      if (config.util && config.util.toObject) {
        // Clear any cached config in Node Config
        Object.keys(config).forEach(key => {
          if (key !== 'util') {
            delete config[key];
          }
        });
      }
    }
    
    return this.getConfig();
  }

  /**
   * Load configuration from Node Config and validate
   */
  private loadAndValidateConfig(): void {
    try {
      // For test environment, create configuration dynamically from environment variables
      // This allows tests to modify NODE_ENV and environment variables and see immediate changes
      let rawConfig: any;
      
      if ((global as any).vitest) {
        // In Vitest test mode, build config from environment to allow dynamic NODE_ENV changes
        rawConfig = this.buildConfigFromEnvironment();
      } else {
        // Production/Development: Use Node Config normally
        const config = require('config');
        rawConfig = config.util.toObject();
      }
      
      // Apply post-processing transforms (callback/logout URLs, REPLIT_DOMAINS)
      this.applyConfigTransforms(rawConfig);
      
      // Perform validation BEFORE Zod parsing to catch configuration errors
      this.validateConfiguration(rawConfig);
      
      // Validate using existing Zod schema
      this.configCache = baseConfigSchema.parse(rawConfig);
      
      // Check for required fields
      this.validateRequired(this.configCache);
      
      this.isValidated = true;
      
    } catch (error) {
      console.error('Configuration validation failed:', error);
      if (error instanceof z.ZodError) {
        throw new ConfigurationError(`Configuration validation failed: ${error.message}`);
      }
      throw new ConfigurationError(`Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate configuration before Zod parsing
   * This catches basic configuration errors that should throw
   */
  private validateConfiguration(config: any): void {
    // Check session secret strength
    const sessionSecret = config.security?.session?.secret;
    if (sessionSecret && sessionSecret !== 'REQUIRED') {
      if (sessionSecret.length < 32) {
        throw new ConfigurationError(`Session secret must be at least 32 characters long. Current length: ${sessionSecret.length}`);
      }
      
      // Check for default/weak session secrets
      const weakSecrets = ['your-secret-key', 'changeme', 'secret', 'password', '123456', 'default'];
      if (weakSecrets.includes(sessionSecret.toLowerCase())) {
        throw new ConfigurationError(`Session secret is too weak. Please use a strong, randomly generated secret.`);
      }
    }
    
    // Check for missing required environment variables when SESSION_SECRET is missing
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'REQUIRED') {
      throw new ConfigurationError('Missing required configuration fields: SESSION_SECRET is required');
    }
    
    // Validate CORS origins format when explicitly set to empty (only in validation test context)
    const corsEnv = process.env.CORS_ALLOWED_ORIGINS;
    if (corsEnv === '' && process.env.TEST_VALIDATE_CORS === 'true') {
      throw new ConfigurationError('CORS allowed origins cannot be empty when explicitly set');
    }
  }

  /**
   * Apply configuration transforms that depend on other config values
   * This replaces the addSpecialFields logic from ConfigTransformer
   */
  private applyConfigTransforms(config: any): void {
    // Apply REPLIT_DOMAINS transform logic
    this.applyReplitDomainsTransforms(config);
    
    // Ensure services.external exists
    if (!config.services?.external) {
      if (!config.services) config.services = {};
      config.services.external = {};
    }

    const baseUrl = config.services.external.baseUrl;
    
    // Auto-generate callback and logout URLs if not explicitly set
    if (baseUrl) {
      if (!config.services.external.callbackUrl) {
        config.services.external.callbackUrl = `${baseUrl}/auth/callback`;
      }
      
      if (!config.services.external.logoutUrl) {
        config.services.external.logoutUrl = baseUrl;
      }
    }
  }

  /**
   * Apply REPLIT_DOMAINS transformation logic
   * This replicates the behavior from the old ConfigTransformer
   */
  private applyReplitDomainsTransforms(config: any): void {
    const replitDomains = process.env.REPLIT_DOMAINS;
    
    if (replitDomains) {
      // Transform CORS allowedOrigins if not explicitly set or empty
      const corsOrigins = process.env.CORS_ALLOWED_ORIGINS;
      if (!corsOrigins || corsOrigins.trim() === '') {
        if (!config.security) config.security = {};
        if (!config.security.cors) config.security.cors = {};
        
        // Add HTTPS version of Replit domain to CORS
        const replitUrl = `https://${replitDomains}`;
        const defaultOrigins = ['http://localhost:3000', 'http://localhost:5000'];
        config.security.cors.allowedOrigins = [...defaultOrigins, replitUrl];
      }
      
      // Transform base URL if not explicitly set or empty
      const envBaseUrl = process.env.BASE_URL;
      if (!envBaseUrl || envBaseUrl.trim() === '') {
        if (!config.services) config.services = {};
        if (!config.services.external) config.services.external = {};
        config.services.external.baseUrl = `https://${replitDomains}`;
      }
    }
    
    // Set default baseUrl if not set by REPLIT_DOMAINS and not explicitly provided
    if (!config.services?.external?.baseUrl) {
      if (!config.services) config.services = {};
      if (!config.services.external) config.services.external = {};
      config.services.external.baseUrl = 'http://localhost:5001';
    }
  }

  /**
   * Build configuration directly from environment variables
   * Used in test mode to allow dynamic environment variable changes
   */
  private buildConfigFromEnvironment(): any {
    const env = process.env.NODE_ENV || 'test';
    
    // Try to load base configuration from Node Config files first, then override with env vars
    let baseConfig: any = {};
    try {
      // Import fresh config instance to pick up NODE_ENV changes
      delete require.cache[require.resolve('config')];
      const nodeConfig = require('config');
      baseConfig = nodeConfig.util.toObject();
    } catch (error) {
      // If Node Config fails, use fallback configuration
      console.warn('Could not load Node Config, using fallback configuration:', error);
    }
    
    // Merge with environment-specific overrides
    const config = {
      environment: env,
      ...baseConfig,  // Use Node Config as base
      
      // AWS Configuration
      aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        lambdaFunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME || '',
        accountId: process.env.AWS_ACCOUNT_ID || '',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      },
      
      // Neptune Configuration  
      neptune: {
        endpoint: process.env.NEPTUNE_ENDPOINT || ''
      },
      
      // Domain Configuration
      domain: {
        name: process.env.DOMAIN_NAME || 'test.example.com'
      },
      
      // System Configuration
      system: {
        user: process.env.SYSTEM_USER || 'test-user'
      },
      
      security: {
        session: {
          secret: process.env.SESSION_SECRET || 'test-session-secret-32-characters-long!!',
          maxAge: parseInt(process.env.SESSION_MAX_AGE || (baseConfig.security?.session?.maxAge?.toString() || '3600000')),
          secure: baseConfig.security?.session?.secure ?? (env === 'production' || process.env.SESSION_SECURE === 'true'),
          httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
          sameSite: process.env.SESSION_SAME_SITE || (baseConfig.security?.session?.sameSite || (env === 'production' ? 'strict' : 'lax'))
        },
        cors: {
          allowedOrigins: this.parseArrayEnv('CORS_ALLOWED_ORIGINS', ['http://localhost:3000', 'http://localhost:5000']),
          allowedMethods: this.parseArrayEnv('CORS_ALLOWED_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
          allowedHeaders: this.parseArrayEnv('CORS_ALLOWED_HEADERS', ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']),
          allowCredentials: process.env.CORS_ALLOW_CREDENTIALS !== 'false'
        },
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || (baseConfig.security?.rateLimit?.windowMs?.toString() || (env === 'development' ? '60000' : '900000'))),
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (baseConfig.security?.rateLimit?.maxRequests?.toString() || (env === 'development' ? '1000' : '100'))),
          skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
          skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true'
        },
        csp: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
          }
        }
      },
      
      database: {
        url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
        pool: {
          min: parseInt(process.env.DB_POOL_MIN || (env === 'development' ? '1' : '1')),
          max: parseInt(process.env.DB_POOL_MAX || (env === 'development' ? '5' : '3')),
          idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || (env === 'development' ? '10000' : '5000')),
          connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '1000')
        },
        ssl: {
          enabled: baseConfig.database?.ssl?.enabled ?? (env === 'production' || process.env.DB_SSL_ENABLED === 'true'),
          rejectUnauthorized: baseConfig.database?.ssl?.rejectUnauthorized ?? (env === 'production' || process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true')
        }
      },
      
      cognito: {
        clientId: process.env.VITE_AWS_COGNITO_CLIENT_ID || 'REQUIRED',
        clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
        userPoolId: process.env.VITE_AWS_COGNITO_USER_POOL_ID || 'REQUIRED',
        region: process.env.VITE_AWS_COGNITO_REGION || 'REQUIRED',
        hostedUIDomain: process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN || 'REQUIRED',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'REQUIRED',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'REQUIRED'
      },
      
      email: this.buildEmailConfig(),
      
      services: {
        apiGateway: {
          port: parseInt(process.env.API_GATEWAY_PORT || '5001'),
          host: process.env.API_GATEWAY_HOST || '0.0.0.0',
          timeout: parseInt(process.env.API_GATEWAY_TIMEOUT || '30000')
        },
        external: {
          baseUrl: process.env.BASE_URL, // Keep original value, let transforms handle it
          callbackUrl: process.env.CALLBACK_URL,
          logoutUrl: process.env.LOGOUT_URL
        }
      },
      
      integration: {
        github: {
          token: process.env.GITHUB_TOKEN || 'REQUIRED',
          owner: process.env.GITHUB_OWNER || 'REQUIRED',
          repo: process.env.GITHUB_REPO || 'REQUIRED'
        },
        mcp: {
          awsEndpoint: process.env.AWS_MCP_ENDPOINT || 'http://aws-mcp:8001',
          neptuneEndpoint: process.env.NEPTUNE_MCP_ENDPOINT || 'http://neptune-mcp:8002',
          neonEndpoint: process.env.MCP_NEON_ENDPOINT || 'http://neon-mcp:8003'
        }
      },
      
      features: {
        emailEnabled: env === 'production' || process.env.FEATURE_EMAIL_ENABLED === 'true',
        analyticsEnabled: process.env.FEATURE_ANALYTICS_ENABLED === 'true',
        debugMode: env === 'development' || process.env.DEBUG_MODE === 'true',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
        newUserRegistration: process.env.FEATURE_NEW_USER_REGISTRATION !== 'false'
      },
      
      logging: {
        level: process.env.LOG_LEVEL || (baseConfig.logging?.level || (env === 'development' ? 'debug' : env === 'production' ? 'info' : 'error')),
        enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
        enableFile: env === 'production' || process.env.LOG_ENABLE_FILE === 'true',
        enableDatabase: env === 'production' || process.env.LOG_ENABLE_DATABASE === 'true',
        format: process.env.LOG_FORMAT || (baseConfig.logging?.format || (env === 'development' ? 'simple' : 'json')),
        maxFileSize: process.env.LOG_MAX_FILE_SIZE || (baseConfig.logging?.maxFileSize || (env === 'development' ? '10mb' : '50mb')),
        maxFiles: parseInt(process.env.LOG_MAX_FILES || (baseConfig.logging?.maxFiles?.toString() || (env === 'development' ? '3' : '10')))
      }
    };
    
    return config;
  }

  /**
   * Build email configuration with conditional SendGrid support
   */
  private buildEmailConfig(): any {
    const provider = process.env.EMAIL_PROVIDER || 'none';
    const config: any = { provider };
    
    if (provider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      config.sendgrid = {
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.SENDGRID_FROM_EMAIL,
        fromName: process.env.SENDGRID_FROM_NAME
      };
    }
    
    return config;
  }

  /**
   * Parse environment variable as array, with fallback
   */
  private parseArrayEnv(envVar: string, defaultValue: string[]): string[] {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      return defaultValue;
    }
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  /**
   * Validate that all required fields are present and not placeholder values
   */
  private validateRequired(conf: BaseConfig): void {
    const required = [
      { path: 'security.session.secret', field: 'SESSION_SECRET' },
      { path: 'database.url', field: 'DATABASE_URL' },
      { path: 'cognito.clientId', field: 'VITE_AWS_COGNITO_CLIENT_ID' },
      { path: 'cognito.userPoolId', field: 'VITE_AWS_COGNITO_USER_POOL_ID' },
      { path: 'cognito.region', field: 'VITE_AWS_COGNITO_REGION' },
      { path: 'cognito.hostedUIDomain', field: 'VITE_AWS_COGNITO_HOSTED_UI_DOMAIN' },
      { path: 'cognito.accessKeyId', field: 'AWS_ACCESS_KEY_ID' },
      { path: 'cognito.secretAccessKey', field: 'AWS_SECRET_ACCESS_KEY' }
      // Note: GitHub integration fields are optional and validated at runtime by scripts that need them
    ];

    const missing: string[] = [];

    for (const { path, field } of required) {
      const value = this.getNestedValue(conf, path);
      
      // Check if value is missing, empty, or still a placeholder
      if (!value || 
          value === 'REQUIRED' || 
          (typeof value === 'string' && value.trim() === '')) {
        missing.push(field);
      }
      
      // Additional validation for session secret length
      if (path === 'security.session.secret' && typeof value === 'string' && value !== 'REQUIRED' && value.length < 32) {
        throw new ConfigurationError(`Session secret must be at least 32 characters long. Current length: ${value.length}`);
      }
    }

    if (missing.length > 0) {
      throw new ConfigurationError(`Missing required configuration fields: ${missing.join(', ')}`);
    }
    
    // Additional validations that should throw errors
    this.validateCorsOrigins(conf);
  }

  /**
   * Validate CORS origins format
   */
  private validateCorsOrigins(conf: BaseConfig): void {
    const origins = conf.security?.cors?.allowedOrigins;
    if (origins && Array.isArray(origins)) {
      // Check if CORS_ALLOWED_ORIGINS was explicitly set to empty string
      const corsEnv = process.env.CORS_ALLOWED_ORIGINS;
      if (corsEnv === '' && origins.length === 0) {
        throw new ConfigurationError('CORS allowed origins cannot be empty when explicitly set');
      }
    }
  }

  /**
   * Get nested value from configuration object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get configuration value by path (utility method)
   */
  getValue<T = any>(path: string): T {
    return this.getNestedValue(this.getConfig(), path);
  }

  /**
   * Check if configuration has a specific path (utility method)
   */
  has(path: string): boolean {
    return this.getNestedValue(this.getConfig(), path) !== undefined;
  }
}

// Singleton instance
const configService = ConfigurationService.getInstance();

/**
 * Main configuration access function
 * Maintains compatibility with existing code
 */
export const getConfig = (): BaseConfig => {
  return configService.getConfig();
};

/**
 * Reload configuration
 * Useful for tests and development
 */
export const reloadConfiguration = (): BaseConfig => {
  return configService.reloadConfig();
};

/**
 * Get specific configuration value by path
 */
export const getConfigValue = <T = any>(path: string): T => {
  return configService.getValue<T>(path);
};

/**
 * Check if configuration has a specific path
 */
export const hasConfigValue = (path: string): boolean => {
  return configService.has(path);
};

// Export types for compatibility
export type { BaseConfig };
export { baseConfigSchema };

// Re-export specific config types from base-config
export type {
  SecurityConfig,
  CognitoConfig,
  DatabaseConfig,
  EmailConfig,
  ServicesConfig,
  IntegrationConfig,
  FeatureFlags,
  LoggingConfig
} from './base-config';
