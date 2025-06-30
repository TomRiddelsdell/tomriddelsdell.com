import { z } from "zod";
import { baseConfigSchema, BaseConfig } from "./base-config";

/**
 * Configuration loader with environment-specific overrides
 * Validates configuration at startup and provides type-safe access
 */

export class ConfigurationError extends Error {
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * Get environment-specific configuration defaults
 */
function getEnvironmentDefaults(): Partial<BaseConfig> {
  const env = process.env.NODE_ENV || "development";

  switch (env) {
    case "production":
      return {
        environment: "production",
        security: {
          cors: {
            allowedOrigins: [
              process.env.REPLIT_DOMAINS
                ? `https://${process.env.REPLIT_DOMAINS}`
                : "https://my-app.replit.app",
            ],
            allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: [
              "Origin",
              "X-Requested-With",
              "Content-Type",
              "Accept",
              "Authorization",
            ],
            allowCredentials: true,
          },
          session: {
            secret: process.env.SESSION_SECRET || "CHANGE_THIS_IN_PRODUCTION",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: true,
            httpOnly: true,
            sameSite: "strict",
          },
          rateLimit: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 100,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
          },
          csp: {
            directives: {
              "default-src": ["'self'"],
              "script-src": ["'self'", "https://replit.com"],
              "style-src": ["'self'", "'unsafe-inline'"],
              "img-src": ["'self'", "data:", "https:"],
              "connect-src": ["'self'"],
              "font-src": ["'self'"],
              "object-src": ["'none'"],
              "media-src": ["'self'"],
              "frame-src": ["'none'"],
            },
          },
        },
        database: {
          url:
            process.env.DATABASE_URL ||
            "postgresql://localhost/flowcreate_prod",
          pool: {
            min: 2,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
          ssl: {
            enabled: true,
            rejectUnauthorized: true,
          },
        },
        services: {
          apiGateway: {
            port: 5000,
            host: "0.0.0.0",
            timeout: 30000,
          },
          external: {
            baseUrl: process.env.REPLIT_DOMAINS
              ? `https://${process.env.REPLIT_DOMAINS}`
              : "https://my-app.replit.app",
            callbackUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : "https://my-app.replit.app"}/auth/callback`,
            logoutUrl: process.env.REPLIT_DOMAINS
              ? `https://${process.env.REPLIT_DOMAINS}`
              : "https://my-app.replit.app",
          },
        },
        cognito: {
          clientId: process.env.VITE_AWS_COGNITO_CLIENT_ID || "",
          clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
          userPoolId: process.env.VITE_AWS_COGNITO_USER_POOL_ID || "",
          region: process.env.VITE_AWS_COGNITO_REGION || "",
          hostedUIDomain: process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN || "",
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
        email: {
          provider: "none",
        },
        features: {
          debugMode: false,
          analyticsEnabled: true,
          emailEnabled: true,
          maintenanceMode: false,
          newUserRegistration: true,
        },
        logging: {
          level: "info",
          enableConsole: true,
          enableFile: true,
          enableDatabase: true,
          format: "json",
          maxFileSize: "50mb",
          maxFiles: 10,
        },
      };
    case "staging":
      return {
        environment: "staging",
        features: {
          debugMode: true,
          analyticsEnabled: true,
          emailEnabled: false,
          maintenanceMode: false,
          newUserRegistration: true,
        },
        logging: {
          level: "debug",
          enableConsole: true,
          enableFile: true,
          enableDatabase: true,
          format: "json",
          maxFileSize: "25mb",
          maxFiles: 7,
        },
      };
    case "test":
      return {
        environment: "test",
        features: {
          debugMode: true,
          analyticsEnabled: false,
          emailEnabled: false,
          maintenanceMode: false,
          newUserRegistration: false,
        },
        logging: {
          level: "warn",
          enableConsole: false,
          enableFile: false,
          enableDatabase: false,
          format: "json",
          maxFileSize: "10mb",
          maxFiles: 3,
        },
      };
    case "development":
    default:
      return {
        environment: "development",
        security: {
          cors: {
            allowedOrigins: [
              "http://localhost:3000",
              "http://localhost:5000",
              "http://127.0.0.1:3000",
              "http://127.0.0.1:5000",
              process.env.REPLIT_DOMAINS
                ? `https://${process.env.REPLIT_DOMAINS}`
                : "http://localhost:5000",
            ],
            allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: [
              "Origin",
              "X-Requested-With",
              "Content-Type",
              "Accept",
              "Authorization",
            ],
            allowCredentials: true,
          },
          session: {
            secret:
              process.env.SESSION_SECRET ||
              "dev_session_secret_change_in_production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: false,
            httpOnly: true,
            sameSite: "lax",
          },
          rateLimit: {
            windowMs: 1 * 60 * 1000,
            maxRequests: 1000,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
          },
          csp: {
            directives: {
              "default-src": ["'self'"],
              "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
              "style-src": ["'self'", "'unsafe-inline'"],
              "img-src": ["'self'", "data:", "https:"],
              "connect-src": [
                "'self'",
                "ws://localhost:*",
                "wss://localhost:*",
              ],
              "font-src": ["'self'"],
              "object-src": ["'none'"],
              "media-src": ["'self'"],
              "frame-src": ["'none'"],
            },
          },
        },
        database: {
          url:
            process.env.DATABASE_URL || "postgresql://localhost/flowcreate_dev",
          pool: {
            min: 1,
            max: 5,
            idleTimeoutMillis: 10000,
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
            host: "0.0.0.0",
            timeout: 30000,
          },
          external: {
            baseUrl: process.env.REPLIT_DOMAINS
              ? `https://${process.env.REPLIT_DOMAINS}`
              : "http://localhost:5000",
            callbackUrl: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : "http://localhost:5000"}/auth/callback`,
            logoutUrl: process.env.REPLIT_DOMAINS
              ? `https://${process.env.REPLIT_DOMAINS}`
              : "http://localhost:5000",
          },
        },
        cognito: {
          clientId: process.env.VITE_AWS_COGNITO_CLIENT_ID || "dev_client_id",
          clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
          userPoolId:
            process.env.VITE_AWS_COGNITO_USER_POOL_ID || "dev_pool_id",
          region: process.env.VITE_AWS_COGNITO_REGION || "us-east-1",
          hostedUIDomain:
            process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN ||
            "dev-hosted-ui-domain",
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dev_access_key_id",
          secretAccessKey:
            process.env.AWS_SECRET_ACCESS_KEY || "dev_secret_access_key",
        },
        email: {
          provider: "none",
        },
        features: {
          debugMode: true,
          analyticsEnabled: true,
          emailEnabled: false,
          maintenanceMode: false,
          newUserRegistration: true,
        },
        logging: {
          level: "debug",
          enableConsole: true,
          enableFile: false,
          enableDatabase: false,
          format: "simple",
          maxFileSize: "10mb",
          maxFiles: 3,
        },
      };
  }
}

/**
 * Load configuration from environment variables
 */
function loadFromEnvironment(): Partial<BaseConfig> {
  const env = process.env;
  const envConfig: Partial<BaseConfig> = {};

  // Core configuration
  if (env.NODE_ENV) envConfig.environment = env.NODE_ENV as any;

  // Database configuration
  if (env.DATABASE_URL) {
    envConfig.database = { url: env.DATABASE_URL };

    if (env.DB_POOL_MIN)
      envConfig.database.pool = { min: parseInt(env.DB_POOL_MIN) };
    if (env.DB_POOL_MAX) {
      if (!envConfig.database.pool) envConfig.database.pool = {};
      envConfig.database.pool.max = parseInt(env.DB_POOL_MAX);
    }
    if (env.DB_SSL_ENABLED) {
      envConfig.database.ssl = { enabled: env.DB_SSL_ENABLED !== "false" };
      if (env.DB_SSL_REJECT_UNAUTHORIZED !== undefined)
        envConfig.database.ssl.rejectUnauthorized =
          env.DB_SSL_REJECT_UNAUTHORIZED !== "false";
    }
  }

  // Email configuration
  if (env.EMAIL_PROVIDER || env.SENDGRID_API_KEY) {
    envConfig.email = {};
    if (env.EMAIL_PROVIDER) {
      envConfig.email.provider = env.EMAIL_PROVIDER as any;
    } else if (env.SENDGRID_API_KEY) {
      envConfig.email.provider = "sendgrid";
    }

    if (env.SENDGRID_API_KEY) {
      envConfig.email.sendgrid = {
        apiKey: env.SENDGRID_API_KEY,
        fromEmail: env.SENDGRID_FROM_EMAIL || "noreply@flowcreate.app",
        fromName: env.SENDGRID_FROM_NAME || "FlowCreate",
      };
    }
  }

  // Security configuration
  if (env.SESSION_SECRET || env.CORS_ALLOWED_ORIGINS) {
    envConfig.security = {};

    if (env.SESSION_SECRET) {
      envConfig.security.session = { secret: env.SESSION_SECRET };
      if (env.SESSION_SECURE)
        envConfig.security.session.secure = env.SESSION_SECURE === "true";
    }

    if (env.CORS_ALLOWED_ORIGINS) {
      envConfig.security.cors = {
        allowedOrigins: env.CORS_ALLOWED_ORIGINS.split(",").map((origin) =>
          origin.trim(),
        ),
      };
    }

    if (env.RATE_LIMIT_WINDOW_MS || env.RATE_LIMIT_MAX_REQUESTS) {
      envConfig.security.rateLimit = {};
      if (env.RATE_LIMIT_WINDOW_MS)
        envConfig.security.rateLimit.windowMs = parseInt(
          env.RATE_LIMIT_WINDOW_MS,
        );
      if (env.RATE_LIMIT_MAX_REQUESTS)
        envConfig.security.rateLimit.maxRequests = parseInt(
          env.RATE_LIMIT_MAX_REQUESTS,
        );
    }
  }

  // Feature flags
  const featureFlags: Partial<BaseConfig["features"]> = {};
  if (env.DEBUG_MODE !== undefined)
    featureFlags.debugMode = env.DEBUG_MODE === "true";
  if (env.FEATURE_ANALYTICS_ENABLED !== undefined)
    featureFlags.analyticsEnabled = env.FEATURE_ANALYTICS_ENABLED === "true";
  if (env.FEATURE_EMAIL_ENABLED !== undefined)
    featureFlags.emailEnabled = env.FEATURE_EMAIL_ENABLED === "true";
  if (env.MAINTENANCE_MODE !== undefined)
    featureFlags.maintenanceMode = env.MAINTENANCE_MODE === "true";
  if (env.FEATURE_NEW_USER_REGISTRATION !== undefined)
    featureFlags.newUserRegistration =
      env.FEATURE_NEW_USER_REGISTRATION === "true";

  if (Object.keys(featureFlags).length > 0) {
    envConfig.features = featureFlags;
  }

  return envConfig;
}

/**
 * Get base URL for the application
 */
function getBaseUrl(): string {
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS}`;
  }

  const env = process.env.NODE_ENV || "development";
  return env === "production"
    ? "https://my-app.replit.app"
    : "http://localhost:5000";
}

/**
 * Remove undefined values from object recursively
 */
function removeUndefined(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;

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
function mergeConfig(
  base: Partial<BaseConfig>,
  override: Partial<BaseConfig>,
): Partial<BaseConfig> {
  const result = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        result[key as keyof BaseConfig] = mergeConfig(
          (result[key as keyof BaseConfig] as any) || {},
          value,
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
    // Get environment defaults
    const defaults = getEnvironmentDefaults();

    // Load environment variable overrides
    const envOverrides = loadFromEnvironment();

    // Merge configurations
    const merged = mergeConfig(defaults, envOverrides);

    // Remove undefined values
    const clean = removeUndefined(merged);

    // Validate against schema
    const config = baseConfigSchema.parse(clean);

    console.log(`Configuration loaded for environment: ${config.environment}`);
    const enabledFeatures = Object.entries(config.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);
    console.log(`Features enabled: ${enabledFeatures.join(", ")}`);

    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw new ConfigurationError(
        `Failed to load configuration: ${error.message}`,
        error,
      );
    }
    throw error;
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
  configInstance = loadConfiguration();
  return configInstance;
}

/**
 * Validate required environment variables are present
 */
export function validateRequiredEnvironment(): void {
  const required = [
    "DATABASE_URL",
    "SESSION_SECRET",
    "VITE_AWS_COGNITO_CLIENT_ID",
    "VITE_AWS_COGNITO_USER_POOL_ID",
    "VITE_AWS_COGNITO_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

/**
 * Get current environment type
 */
export function getEnvironment(): string {
  return process.env.NODE_ENV || "development";
}
