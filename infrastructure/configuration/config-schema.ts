import { z } from "zod";

/**
 * Configuration field definitions with environment variable mappings
 * This drives the automatic transformation from environment variables to config structure
 */
export interface ConfigFieldDefinition {
  envVar: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  defaultValue?: any;
  environmentSpecific?: {
    development?: any;
    production?: any;
  };
  transform?: (value: string, environment: string, env?: NodeJS.ProcessEnv) => any;
}

/**
 * Configuration schema definition - maps config paths to environment variables
 */
export const configFields: Record<string, ConfigFieldDefinition> = {
  // Core
  'environment': {
    envVar: 'NODE_ENV',
    type: 'string',
    defaultValue: 'development'
  },

  // Security - Session
  'security.session.secret': {
    envVar: 'SESSION_SECRET',
    type: 'string',
    required: true
  },
  'security.session.maxAge': {
    envVar: 'SESSION_MAX_AGE',
    type: 'number',
    defaultValue: 604800000
  },
  'security.session.secure': {
    envVar: 'SESSION_SECURE',
    type: 'boolean',
    environmentSpecific: {
      development: false,
      production: true
    }
  },
  'security.session.httpOnly': {
    envVar: 'SESSION_HTTP_ONLY',
    type: 'boolean',
    defaultValue: true
  },
  'security.session.sameSite': {
    envVar: 'SESSION_SAME_SITE',
    type: 'string',
    environmentSpecific: {
      development: 'lax',
      production: 'strict'
    }
  },

  // Security - CORS
  'security.cors.allowedOrigins': {
    envVar: 'CORS_ALLOWED_ORIGINS',
    type: 'array',
    transform: (value: string, environment: string, env?: NodeJS.ProcessEnv) => {
      if (value && value.trim()) {
        return value.split(',').map(origin => origin.trim());
      }
      // Environment-specific defaults
      if (environment === 'production') {
        const replitDomain = env?.REPLIT_DOMAINS;
        return replitDomain ? [`https://${replitDomain}`] : ['https://my-app.replit.app'];
      } else {
        const defaults = [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5000'
        ];
        if (env?.REPLIT_DOMAINS) {
          defaults.push(`https://${env.REPLIT_DOMAINS}`);
        }
        return defaults;
      }
    }
  },
  'security.cors.allowedMethods': {
    envVar: 'CORS_ALLOWED_METHODS',
    type: 'array',
    defaultValue: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  },
  'security.cors.allowedHeaders': {
    envVar: 'CORS_ALLOWED_HEADERS',
    type: 'array',
    defaultValue: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  },
  'security.cors.allowCredentials': {
    envVar: 'CORS_ALLOW_CREDENTIALS',
    type: 'boolean',
    defaultValue: true
  },

  // Security - Rate Limiting
  'security.rateLimit.windowMs': {
    envVar: 'RATE_LIMIT_WINDOW_MS',
    type: 'number',
    environmentSpecific: {
      development: 60000,
      production: 900000
    }
  },
  'security.rateLimit.maxRequests': {
    envVar: 'RATE_LIMIT_MAX_REQUESTS',
    type: 'number',
    environmentSpecific: {
      development: 1000,
      production: 100
    }
  },
  'security.rateLimit.skipSuccessfulRequests': {
    envVar: 'RATE_LIMIT_SKIP_SUCCESSFUL',
    type: 'boolean',
    defaultValue: false
  },
  'security.rateLimit.skipFailedRequests': {
    envVar: 'RATE_LIMIT_SKIP_FAILED',
    type: 'boolean',
    defaultValue: false
  },

  // Database
  'database.url': {
    envVar: 'DATABASE_URL',
    type: 'string',
    required: true
  },
  'database.pool.min': {
    envVar: 'DB_POOL_MIN',
    type: 'number',
    environmentSpecific: {
      development: 1,
      production: 2
    }
  },
  'database.pool.max': {
    envVar: 'DB_POOL_MAX',
    type: 'number',
    environmentSpecific: {
      development: 5,
      production: 10
    }
  },
  'database.pool.idleTimeoutMillis': {
    envVar: 'DB_IDLE_TIMEOUT',
    type: 'number',
    environmentSpecific: {
      development: 10000,
      production: 30000
    }
  },
  'database.pool.connectionTimeoutMillis': {
    envVar: 'DB_CONNECTION_TIMEOUT',
    type: 'number',
    defaultValue: 2000
  },
  'database.ssl.enabled': {
    envVar: 'DB_SSL_ENABLED',
    type: 'boolean',
    environmentSpecific: {
      development: false,
      production: true
    }
  },
  'database.ssl.rejectUnauthorized': {
    envVar: 'DB_SSL_REJECT_UNAUTHORIZED',
    type: 'boolean',
    environmentSpecific: {
      development: false,
      production: true
    }
  },

  // AWS Cognito
  'cognito.clientId': {
    envVar: 'VITE_AWS_COGNITO_CLIENT_ID',
    type: 'string',
    required: true
  },
  'cognito.clientSecret': {
    envVar: 'AWS_COGNITO_CLIENT_SECRET',
    type: 'string'
  },
  'cognito.userPoolId': {
    envVar: 'VITE_AWS_COGNITO_USER_POOL_ID',
    type: 'string',
    required: true
  },
  'cognito.region': {
    envVar: 'VITE_AWS_COGNITO_REGION',
    type: 'string',
    required: true
  },
  'cognito.hostedUIDomain': {
    envVar: 'VITE_AWS_COGNITO_HOSTED_UI_DOMAIN',
    type: 'string',
    required: true
  },
  'cognito.accessKeyId': {
    envVar: 'AWS_ACCESS_KEY_ID',
    type: 'string',
    required: true
  },
  'cognito.secretAccessKey': {
    envVar: 'AWS_SECRET_ACCESS_KEY',
    type: 'string',
    required: true
  },

  // Email
  'email.provider': {
    envVar: 'EMAIL_PROVIDER',
    type: 'string',
    defaultValue: 'none'
  },
  'email.sendgrid.apiKey': {
    envVar: 'SENDGRID_API_KEY',
    type: 'string',
    // Only include if SENDGRID_API_KEY is actually set AND email provider is sendgrid
    transform: (value: string, environment: string, env?: NodeJS.ProcessEnv) => {
      return env?.EMAIL_PROVIDER === 'sendgrid' && value && value.trim() ? value : undefined;
    }
  },
  'email.sendgrid.fromEmail': {
    envVar: 'SENDGRID_FROM_EMAIL',
    type: 'string',
    // Only include if EMAIL_PROVIDER is sendgrid AND SENDGRID_API_KEY is set
    transform: (value: string, environment: string, env?: NodeJS.ProcessEnv) => {
      return env?.EMAIL_PROVIDER === 'sendgrid' && env?.SENDGRID_API_KEY && env.SENDGRID_API_KEY.trim() ? value : undefined;
    }
  },
  'email.sendgrid.fromName': {
    envVar: 'SENDGRID_FROM_NAME',
    type: 'string',
    // Only include if EMAIL_PROVIDER is sendgrid AND SENDGRID_API_KEY is set
    transform: (value: string, environment: string, env?: NodeJS.ProcessEnv) => {
      return env?.EMAIL_PROVIDER === 'sendgrid' && env?.SENDGRID_API_KEY && env.SENDGRID_API_KEY.trim() ? value : undefined;
    }
  },

  // Services
  'services.apiGateway.port': {
    envVar: 'API_GATEWAY_PORT',
    type: 'number',
    defaultValue: 5000
  },
  'services.apiGateway.host': {
    envVar: 'API_GATEWAY_HOST',
    type: 'string',
    defaultValue: '0.0.0.0'
  },
  'services.apiGateway.timeout': {
    envVar: 'API_GATEWAY_TIMEOUT',
    type: 'number',
    defaultValue: 30000
  },
  'services.external.baseUrl': {
    envVar: 'BASE_URL',
    type: 'string',
    transform: (value: string, environment: string, env?: NodeJS.ProcessEnv) => {
      if (value && value.trim()) return value;
      
      const replitDomain = env?.REPLIT_DOMAINS;
      if (environment === 'production') {
        return replitDomain ? `https://${replitDomain}` : 'https://my-app.replit.app';
      } else {
        return replitDomain ? `https://${replitDomain}` : 'http://localhost:5000';
      }
    }
  },
  'services.external.callbackUrl': {
    envVar: 'CALLBACK_URL',
    type: 'string'
  },
  'services.external.logoutUrl': {
    envVar: 'LOGOUT_URL',
    type: 'string'
  },

  // Integration
  'integration.github.token': {
    envVar: 'GITHUB_TOKEN',
    type: 'string',
    required: false,
    defaultValue: ''
  },
  'integration.github.owner': {
    envVar: 'GITHUB_OWNER',
    type: 'string',
    required: false,
    defaultValue: 'TomRiddelsdell'
  },
  'integration.github.repo': {
    envVar: 'GITHUB_REPO',
    type: 'string',
    required: false,
    defaultValue: 'tomriddelsdell.com'
  },
  'integration.github.deployment.awsAccountId': {
    envVar: 'AWS_ACCOUNT_ID',
    type: 'string',
    required: false
  },
  'integration.github.deployment.stagingCertArn': {
    envVar: 'STAGING_CERTIFICATE_ARN',
    type: 'string',
    required: false
  },
  'integration.github.deployment.productionCertArn': {
    envVar: 'PRODUCTION_CERTIFICATE_ARN',
    type: 'string',
    required: false
  },
  'integration.github.deployment.cognitoUserPoolId': {
    envVar: 'COGNITO_USER_POOL_ID',
    type: 'string',
    required: false
  },
  'integration.mcp.awsEndpoint': {
    envVar: 'AWS_MCP_ENDPOINT',
    type: 'string',
    defaultValue: 'http://aws-mcp:8001'
  },
  'integration.mcp.neptuneEndpoint': {
    envVar: 'NEPTUNE_MCP_ENDPOINT',
    type: 'string',
    defaultValue: 'http://neptune-mcp:8002'
  },

  // Features
  'features.emailEnabled': {
    envVar: 'FEATURE_EMAIL_ENABLED',
    type: 'boolean',
    environmentSpecific: {
      development: false,
      production: true
    }
  },
  'features.analyticsEnabled': {
    envVar: 'FEATURE_ANALYTICS_ENABLED',
    type: 'boolean',
    defaultValue: true
  },
  'features.debugMode': {
    envVar: 'DEBUG_MODE',
    type: 'boolean',
    environmentSpecific: {
      development: true,
      production: false
    }
  },
  'features.maintenanceMode': {
    envVar: 'MAINTENANCE_MODE',
    type: 'boolean',
    defaultValue: false
  },
  'features.newUserRegistration': {
    envVar: 'FEATURE_NEW_USER_REGISTRATION',
    type: 'boolean',
    defaultValue: true
  },

  // Logging
  'logging.level': {
    envVar: 'LOG_LEVEL',
    type: 'string',
    environmentSpecific: {
      development: 'debug',
      production: 'info'
    }
  },
  'logging.enableConsole': {
    envVar: 'LOG_ENABLE_CONSOLE',
    type: 'boolean',
    defaultValue: true
  },
  'logging.enableFile': {
    envVar: 'LOG_ENABLE_FILE',
    type: 'boolean',
    environmentSpecific: {
      development: false,
      production: true
    }
  },
  'logging.enableDatabase': {
    envVar: 'LOG_ENABLE_DATABASE',
    type: 'boolean',
    environmentSpecific: {
      development: false,
      production: true
    }
  },
  'logging.format': {
    envVar: 'LOG_FORMAT',
    type: 'string',
    environmentSpecific: {
      development: 'simple',
      production: 'json'
    }
  },
  'logging.maxFileSize': {
    envVar: 'LOG_MAX_FILE_SIZE',
    type: 'string',
    environmentSpecific: {
      development: '10mb',
      production: '50mb'
    }
  },
  'logging.maxFiles': {
    envVar: 'LOG_MAX_FILES',
    type: 'number',
    environmentSpecific: {
      development: 3,
      production: 10
    }
  }
};

/**
 * CSP directives - these are environment-specific but not configurable via env vars
 */
export const getCSPDirectives = (environment: string) => ({
  'default-src': ["'self'"],
  'script-src': environment === 'development' 
    ? ["'self'", "'unsafe-eval'", "'unsafe-inline'"]
    : ["'self'", "https://replit.com"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': environment === 'development'
    ? ["'self'", "ws://localhost:*", "wss://localhost:*"]
    : ["'self'"],
  'font-src': ["'self'"],
  'object-src': ["'none'"],
  'media-src': ["'self'"],
  'frame-src': ["'none'"],
});
