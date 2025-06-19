import { BaseConfig, baseConfigSchema } from './base-config';
import { developmentConfig } from './development-config';
import { productionConfig } from './production-config';
import { stagingConfig } from './staging-config';
import { testConfig } from './test-config';

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
 * Get environment-specific configuration
 */
function getEnvironmentConfig(): Partial<BaseConfig> {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

/**
 * Load configuration from environment variables
 */
function loadFromEnvironment(): Partial<BaseConfig> {
  const env = process.env;
  
  // Extract configuration from environment variables
  const envConfig: Partial<BaseConfig> = {
    environment: (env.NODE_ENV as any) || 'development',
    
    security: {
      cors: {
        allowedOrigins: env.CORS_ALLOWED_ORIGINS?.split(',') || [],
      },
      session: {
        secret: env.SESSION_SECRET!,
        secure: env.NODE_ENV === 'production',
        maxAge: env.SESSION_MAX_AGE ? parseInt(env.SESSION_MAX_AGE) : undefined,
      },
      rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS ? parseInt(env.RATE_LIMIT_WINDOW_MS) : undefined,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS ? parseInt(env.RATE_LIMIT_MAX_REQUESTS) : undefined,
      },
    },
    
    cognito: {
      clientId: env.VITE_AWS_COGNITO_CLIENT_ID!,
      clientSecret: env.AWS_COGNITO_CLIENT_SECRET,
      userPoolId: env.VITE_AWS_COGNITO_USER_POOL_ID!,
      region: env.VITE_AWS_COGNITO_REGION!,
      hostedUIDomain: env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN!,
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
    },
    
    database: {
      url: env.DATABASE_URL!,
      pool: {
        min: env.DB_POOL_MIN ? parseInt(env.DB_POOL_MIN) : undefined,
        max: env.DB_POOL_MAX ? parseInt(env.DB_POOL_MAX) : undefined,
      },
      ssl: {
        enabled: env.DB_SSL_ENABLED === 'true',
        rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      },
    },
    
    email: {
      provider: (env.EMAIL_PROVIDER as any) || 'none',
      sendgrid: env.SENDGRID_API_KEY ? {
        apiKey: env.SENDGRID_API_KEY,
        fromEmail: env.SENDGRID_FROM_EMAIL,
        fromName: env.SENDGRID_FROM_NAME,
      } : undefined,
    },
    
    services: {
      apiGateway: {
        port: env.PORT ? parseInt(env.PORT) : undefined,
        host: env.HOST,
        timeout: env.API_TIMEOUT ? parseInt(env.API_TIMEOUT) : undefined,
      },
      external: {
        baseUrl: env.BASE_URL || getBaseUrl(),
        callbackUrl: env.CALLBACK_URL || `${getBaseUrl()}/auth/callback`,
        logoutUrl: env.LOGOUT_URL || getBaseUrl(),
      },
    },
    
    features: {
      emailEnabled: env.FEATURE_EMAIL_ENABLED === 'true',
      analyticsEnabled: env.FEATURE_ANALYTICS_ENABLED !== 'false',
      debugMode: env.DEBUG_MODE === 'true',
      maintenanceMode: env.MAINTENANCE_MODE === 'true',
      newUserRegistration: env.FEATURE_NEW_USER_REGISTRATION !== 'false',
    },
    
    logging: {
      level: (env.LOG_LEVEL as any) || 'info',
      enableConsole: env.LOG_ENABLE_CONSOLE !== 'false',
      enableFile: env.LOG_ENABLE_FILE === 'true',
      enableDatabase: env.LOG_ENABLE_DATABASE !== 'false',
      format: (env.LOG_FORMAT as any) || 'json',
    },
  };
  
  // Remove undefined values to allow defaults to apply
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
  const result = { ...base };
  
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key as keyof BaseConfig] = mergeConfig(
          (result[key as keyof BaseConfig] as any) || {},
          value
        ) as any;
      } else {
        result[key as keyof BaseConfig] = value as any;
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
    const envSpecificConfig = getEnvironmentConfig();
    const envVarConfig = loadFromEnvironment();
    
    // Merge configurations (environment variables override environment-specific config)
    const mergedConfig = mergeConfig(envSpecificConfig, envVarConfig);
    
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