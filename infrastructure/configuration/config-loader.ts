import { BaseConfig, baseConfigSchema } from './base-config';

/**
 * Configuration loader with environment-specific overrides
 * Validates configuration at startup and provides type-safe access
 */

export class ConfigurationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Get environment-specific configuration defaults
 */
function getEnvironmentDefaults(): Partial<BaseConfig> {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        environment: 'production',
        features: {
          debugMode: false,
          analyticsEnabled: true,
          emailEnabled: true,
          maintenanceMode: false,
          newUserRegistration: true,
        },
        logging: {
          level: 'info',
          enableConsole: true,
          enableFile: true,
          enableDatabase: true,
          format: 'json',
          maxFileSize: '50mb',
          maxFiles: 10,
        },
      };
    case 'staging':
      return {
        environment: 'staging',
        features: {
          debugMode: true,
          analyticsEnabled: true,
          emailEnabled: false,
          maintenanceMode: false,
          newUserRegistration: true,
        },
        logging: {
          level: 'debug',
          enableConsole: true,
          enableFile: true,
          enableDatabase: true,
          format: 'json',
          maxFileSize: '25mb',
          maxFiles: 7,
        },
      };
    case 'test':
      return {
        environment: 'test',
        features: {
          debugMode: true,
          analyticsEnabled: false,
          emailEnabled: false,
          maintenanceMode: false,
          newUserRegistration: true,
        },
        logging: {
          level: 'error',
          enableConsole: false,
          enableFile: false,
          enableDatabase: false,
          format: 'simple',
          maxFileSize: '5mb',
          maxFiles: 2,
        },
      };
    case 'development':
    default:
      return {
        environment: 'development',
        security: {
          cors: {
            allowedOrigins: [
              'http://localhost:3000',
              'http://localhost:5000',
              'http://127.0.0.1:3000',
              'http://127.0.0.1:5000',
            ],
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
            allowCredentials: true,
          },
          session: {
            secret: process.env.SESSION_SECRET || 'dev_session_secret_change_in_production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: false,
            httpOnly: true,
            sameSite: 'lax',
          },
          rateLimit: {
            windowMs: 1 * 60 * 1000,
            maxRequests: 1000,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
          },
          csp: {
            directives: {
              'default-src': ["'self'"],
              'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://replit.com'],
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
        database: {
          url: process.env.DATABASE_URL || 'postgresql://localhost/flowcreate_dev',
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
        services: {
          apiGateway: {
            port: 5000,
            host: '0.0.0.0',
            timeout: 30000,
          },
          external: {
            baseUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000',
            callbackUrl: (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000') + '/auth/callback',
            logoutUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000',
          },
        },
        cognito: {
          clientId: process.env.VITE_AWS_COGNITO_CLIENT_ID || '',
          clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
          userPoolId: process.env.VITE_AWS_COGNITO_USER_POOL_ID || '',
          region: process.env.VITE_AWS_COGNITO_REGION || '',
          hostedUIDomain: process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN || '',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
        email: {
          provider: 'none',
          sendgrid: {
            fromEmail: 'noreply@flowcreate.app',
            fromName: 'FlowCreate',
          },
        },
        features: {
          debugMode: true,
          analyticsEnabled: true,
          emailEnabled: false,
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
  }
}

/**
 * Load configuration from environment variables
 */
function loadFromEnvironment(): Partial<BaseConfig> {
  const env = process.env;
  
  // Build base configuration object
  const envConfig: any = {
    environment: env.NODE_ENV || 'development',
  };

  // Security configuration
  if (env.CORS_ALLOWED_ORIGINS || env.SESSION_SECRET || env.RATE_LIMIT_WINDOW_MS || env.RATE_LIMIT_MAX_REQUESTS) {
    envConfig.security = {};
    
    if (env.CORS_ALLOWED_ORIGINS) {
      envConfig.security.cors = {
        allowedOrigins: env.CORS_ALLOWED_ORIGINS.split(','),
      };
    }
    
    if (env.SESSION_SECRET) {
      envConfig.security.session = {
        secret: env.SESSION_SECRET,
        secure: env.SESSION_SECURE === 'true',
        maxAge: env.SESSION_MAX_AGE ? parseInt(env.SESSION_MAX_AGE) : undefined,
      };
    }
    
    if (env.RATE_LIMIT_WINDOW_MS || env.RATE_LIMIT_MAX_REQUESTS) {
      envConfig.security.rateLimit = {};
      if (env.RATE_LIMIT_WINDOW_MS) envConfig.security.rateLimit.windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS);
      if (env.RATE_LIMIT_MAX_REQUESTS) envConfig.security.rateLimit.maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS);
    }
  }
  
  // Cognito configuration
  if (env.VITE_AWS_COGNITO_CLIENT_ID || env.AWS_ACCESS_KEY_ID) {
    envConfig.cognito = {};
    if (env.VITE_AWS_COGNITO_CLIENT_ID) envConfig.cognito.clientId = env.VITE_AWS_COGNITO_CLIENT_ID;
    if (env.AWS_COGNITO_CLIENT_SECRET) envConfig.cognito.clientSecret = env.AWS_COGNITO_CLIENT_SECRET;
    if (env.VITE_AWS_COGNITO_USER_POOL_ID) envConfig.cognito.userPoolId = env.VITE_AWS_COGNITO_USER_POOL_ID;
    if (env.VITE_AWS_COGNITO_REGION) envConfig.cognito.region = env.VITE_AWS_COGNITO_REGION;
    if (env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN) envConfig.cognito.hostedUIDomain = env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN;
    if (env.AWS_ACCESS_KEY_ID) envConfig.cognito.accessKeyId = env.AWS_ACCESS_KEY_ID;
    if (env.AWS_SECRET_ACCESS_KEY) envConfig.cognito.secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
  }
  
  // Database configuration
  if (env.DATABASE_URL) {
    envConfig.database = {
      url: env.DATABASE_URL,
    };
    
    if (env.DB_POOL_MIN || env.DB_POOL_MAX) {
      envConfig.database.pool = {};
      if (env.DB_POOL_MIN) envConfig.database.pool.min = parseInt(env.DB_POOL_MIN);
      if (env.DB_POOL_MAX) envConfig.database.pool.max = parseInt(env.DB_POOL_MAX);
    }
    
    if (env.DB_SSL_ENABLED !== undefined || env.DB_SSL_REJECT_UNAUTHORIZED !== undefined) {
      envConfig.database.ssl = {};
      if (env.DB_SSL_ENABLED !== undefined) envConfig.database.ssl.enabled = env.DB_SSL_ENABLED === 'true';
      if (env.DB_SSL_REJECT_UNAUTHORIZED !== undefined) envConfig.database.ssl.rejectUnauthorized = env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
    }
  }
  
  // Email configuration
  if (env.EMAIL_PROVIDER || env.SENDGRID_API_KEY) {
    envConfig.email = {};
    if (env.EMAIL_PROVIDER) envConfig.email.provider = env.EMAIL_PROVIDER;
    
    if (env.SENDGRID_API_KEY) {
      envConfig.email.sendgrid = {
        apiKey: env.SENDGRID_API_KEY,
        fromEmail: env.SENDGRID_FROM_EMAIL || 'noreply@flowcreate.app',
        fromName: env.SENDGRID_FROM_NAME || 'FlowCreate',
      };
    }
  }
  
  // Services configuration
  if (env.PORT || env.HOST || env.BASE_URL || env.CALLBACK_URL || env.LOGOUT_URL) {
    envConfig.services = {};
    
    if (env.PORT || env.HOST || env.API_TIMEOUT) {
      envConfig.services.apiGateway = {};
      if (env.PORT) envConfig.services.apiGateway.port = parseInt(env.PORT);
      if (env.HOST) envConfig.services.apiGateway.host = env.HOST;
      if (env.API_TIMEOUT) envConfig.services.apiGateway.timeout = parseInt(env.API_TIMEOUT);
    }
    
    if (env.BASE_URL || env.CALLBACK_URL || env.LOGOUT_URL) {
      const baseUrl = env.BASE_URL || getBaseUrl();
      envConfig.services.external = {
        baseUrl,
        callbackUrl: env.CALLBACK_URL || `${baseUrl}/auth/callback`,
        logoutUrl: env.LOGOUT_URL || baseUrl,
      };
    }
  }
  
  // Feature flags
  if (env.FEATURE_EMAIL_ENABLED !== undefined || env.FEATURE_ANALYTICS_ENABLED !== undefined || 
      env.DEBUG_MODE !== undefined || env.MAINTENANCE_MODE !== undefined || 
      env.FEATURE_NEW_USER_REGISTRATION !== undefined) {
    envConfig.features = {};
    if (env.FEATURE_EMAIL_ENABLED !== undefined) envConfig.features.emailEnabled = env.FEATURE_EMAIL_ENABLED === 'true';
    if (env.FEATURE_ANALYTICS_ENABLED !== undefined) envConfig.features.analyticsEnabled = env.FEATURE_ANALYTICS_ENABLED !== 'false';
    if (env.DEBUG_MODE !== undefined) envConfig.features.debugMode = env.DEBUG_MODE === 'true';
    if (env.MAINTENANCE_MODE !== undefined) envConfig.features.maintenanceMode = env.MAINTENANCE_MODE === 'true';
    if (env.FEATURE_NEW_USER_REGISTRATION !== undefined) envConfig.features.newUserRegistration = env.FEATURE_NEW_USER_REGISTRATION !== 'false';
  }
  
  // Logging configuration
  if (env.LOG_LEVEL || env.LOG_ENABLE_CONSOLE !== undefined || env.LOG_ENABLE_FILE !== undefined || 
      env.LOG_ENABLE_DATABASE !== undefined || env.LOG_FORMAT) {
    envConfig.logging = {};
    if (env.LOG_LEVEL) envConfig.logging.level = env.LOG_LEVEL;
    if (env.LOG_ENABLE_CONSOLE !== undefined) envConfig.logging.enableConsole = env.LOG_ENABLE_CONSOLE !== 'false';
    if (env.LOG_ENABLE_FILE !== undefined) envConfig.logging.enableFile = env.LOG_ENABLE_FILE === 'true';
    if (env.LOG_ENABLE_DATABASE !== undefined) envConfig.logging.enableDatabase = env.LOG_ENABLE_DATABASE !== 'false';
    if (env.LOG_FORMAT) envConfig.logging.format = env.LOG_FORMAT;
  }
  
  return removeUndefined(envConfig);
}

/**
 * Get base URL for the application
 */
function getBaseUrl(): string {
  const env = process.env;
  
  // Production domain
  if (env.NODE_ENV === 'production' && env.PRODUCTION_DOMAIN) {
    return env.PRODUCTION_DOMAIN;
  }
  
  // Replit domain
  if (env.REPLIT_DOMAINS) {
    return `https://${env.REPLIT_DOMAINS}`;
  }
  
  // Development fallback
  const port = env.PORT || 5000;
  return `http://localhost:${port}`;
}

/**
 * Remove undefined values from object recursively
 */
function removeUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = removeUndefined(value);
    }
  }
  
  return result;
}

/**
 * Deep merge configuration objects
 */
function mergeConfig(base: Partial<BaseConfig>, override: Partial<BaseConfig>): Partial<BaseConfig> {
  const result: any = { ...base };
  
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = mergeConfig(result[key] || {}, value as Partial<BaseConfig>);
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Load and validate complete configuration
 */
export function loadConfiguration(): BaseConfig {
  try {
    // Load configuration layers
    const envDefaults = getEnvironmentDefaults();
    const envVarConfig = loadFromEnvironment();
    
    // Merge configurations (environment variables override defaults)
    const mergedConfig = mergeConfig(envDefaults, envVarConfig);
    
    // Validate final configuration
    const validatedConfig = baseConfigSchema.parse(mergedConfig);
    
    // Log configuration loading (without sensitive data)
    console.log(`Configuration loaded for environment: ${validatedConfig.environment}`);
    console.log(`Features enabled: ${Object.entries(validatedConfig.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature)
      .join(', ')}`);
    
    return validatedConfig;
  } catch (error) {
    if (error instanceof Error) {
      throw new ConfigurationError(
        `Failed to load configuration: ${error.message}`,
        error
      );
    }
    throw new ConfigurationError('Failed to load configuration: Unknown error');
  }
}

/**
 * Singleton configuration instance
 */
let configInstance: BaseConfig | null = null;

/**
 * Get the current configuration instance
 */
export function getConfig(): BaseConfig {
  if (!configInstance) {
    configInstance = loadConfiguration();
  }
  return configInstance;
}

/**
 * Reload configuration (useful for testing)
 */
export function reloadConfiguration(): BaseConfig {
  configInstance = null;
  return getConfig();
}

/**
 * Validate required environment variables are present
 */
export function validateRequiredEnvironment(): void {
  const required = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'VITE_AWS_COGNITO_CLIENT_ID',
    'VITE_AWS_COGNITO_REGION',
    'VITE_AWS_COGNITO_USER_POOL_ID',
    'VITE_AWS_COGNITO_HOSTED_UI_DOMAIN',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Get current environment type
 */
export function getEnvironment(): string {
  return process.env.NODE_ENV || 'development';
}