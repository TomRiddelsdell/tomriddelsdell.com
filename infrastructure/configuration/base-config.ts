import { z } from 'zod';

/**
 * Base configuration schema with validation
 * All configuration must be explicitly defined and validated
 */

// Security configuration schema
export const securityConfigSchema = z.object({
  cors: z.object({
    allowedOrigins: z.array(z.string()).min(1),
    allowedMethods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
    allowedHeaders: z.array(z.string()).default(['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']),
    allowCredentials: z.boolean().default(true),
  }),
  session: z.object({
    secret: z.string().min(32, 'Session secret must be at least 32 characters'),
    maxAge: z.number().positive().default(7 * 24 * 60 * 60 * 1000), // 7 days
    secure: z.boolean().default(true),
    httpOnly: z.boolean().default(true),
    sameSite: z.enum(['strict', 'lax', 'none']).default('lax'),
  }),
  rateLimit: z.object({
    windowMs: z.number().positive().default(15 * 60 * 1000), // 15 minutes
    maxRequests: z.number().positive().default(100),
    skipSuccessfulRequests: z.boolean().default(false),
    skipFailedRequests: z.boolean().default(false),
  }),
  csp: z.object({
    directives: z.record(z.string(), z.array(z.string())).default({
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", 'https://replit.com'],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'"],
      'font-src': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'frame-src': ["'none'"],
    }),
  }),
});

// AWS Cognito configuration schema
export const cognitoConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  userPoolId: z.string().optional(),
  region: z.string().optional(),
  hostedUIDomain: z.string().optional(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
});

// Database configuration schema
export const databaseConfigSchema = z.object({
  url: z.string().min(1, 'Database URL is required'),
  pool: z.object({
    min: z.number().min(0).default(2),
    max: z.number().min(1).default(10),
    idleTimeoutMillis: z.number().positive().default(30000),
    connectionTimeoutMillis: z.number().positive().default(2000),
  }),
  ssl: z.object({
    enabled: z.boolean().default(true),
    rejectUnauthorized: z.boolean().default(true),
  }),
});

// Email service configuration schema  
export const emailConfigSchema = z.object({
  provider: z.enum(['sendgrid', 'none']).default('none'),
  sendgrid: z.object({
    apiKey: z.string().optional(),
    fromEmail: z.string().email().default('noreply@tomriddelsdell.com.app'),
    fromName: z.string().default('tomriddelsdell.com'),
  }).optional(),
}).refine((data) => {
  // Only validate SendGrid API key format when provider is 'sendgrid' and key is provided
  if (data.provider === 'sendgrid' && data.sendgrid?.apiKey) {
    return data.sendgrid.apiKey.startsWith('SG.');
  }
  return true;
}, {
  message: 'SendGrid API key must start with SG. when using sendgrid provider',
  path: ['sendgrid', 'apiKey'],
});

// Service endpoints configuration schema
export const servicesConfigSchema = z.object({
  apiGateway: z.object({
    port: z.number().min(1000).max(65535).default(5000),
    host: z.string().default('0.0.0.0'),
    timeout: z.number().positive().default(30000),
  }),
  external: z.object({
    baseUrl: z.string().min(1, 'Base URL is required'),
    callbackUrl: z.string().min(1, 'Callback URL is required'),
    logoutUrl: z.string().min(1, 'Logout URL is required'),
  }),
});

// AWS configuration schema
export const awsConfigSchema = z.object({
  region: z.string().default('eu-west-2'),
  lambdaFunctionName: z.string().optional(),
  accountId: z.string().optional(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
});

// Neptune configuration schema
export const neptuneConfigSchema = z.object({
  endpoint: z.string().optional(),
});

// Domain configuration schema  
export const domainConfigSchema = z.object({
  name: z.string().default('tomriddelsdell.com'),
});

// System configuration schema
export const systemConfigSchema = z.object({
  user: z.string().default('unknown'),
});

// Integration services configuration schema
export const integrationConfigSchema = z.object({
  github: z.object({
    token: z.string().min(1, 'GitHub token is required'),
    owner: z.string().min(1, 'GitHub owner is required'),
    repo: z.string().min(1, 'GitHub repository is required'),
    deployment: z.object({
      awsAccountId: z.string().optional(),
      stagingCertArn: z.string().optional(),
      productionCertArn: z.string().optional(),
      cognitoUserPoolId: z.string().optional(),
    }).optional(),
  }),
  mcp: z.object({
    awsEndpoint: z.string().default('http://aws-mcp:8001'),
    neptuneEndpoint: z.string().default('http://neptune-mcp:8002'),
    neonEndpoint: z.string().default('http://neon-mcp:https://mcp.neon.tech/mcp'),
  }),
});

// Feature flags configuration schema
export const featureFlagsSchema = z.object({
  emailEnabled: z.boolean().default(false),
  analyticsEnabled: z.boolean().default(true),
  debugMode: z.boolean().default(false),
  maintenanceMode: z.boolean().default(false),
  newUserRegistration: z.boolean().default(true),
});

// Logging configuration schema
export const loggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  enableConsole: z.boolean().default(true),
  enableFile: z.boolean().default(false),
  enableDatabase: z.boolean().default(true),
  format: z.enum(['json', 'simple']).default('json'),
  maxFileSize: z.string().default('10mb'),
  maxFiles: z.number().positive().default(5),
});

// Main configuration schema combining all sections
export const baseConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production', 'test']),
  security: securityConfigSchema,
  cognito: cognitoConfigSchema,
  database: databaseConfigSchema,
  email: emailConfigSchema,
  services: servicesConfigSchema,
  aws: awsConfigSchema,
  neptune: neptuneConfigSchema,
  domain: domainConfigSchema,
  system: systemConfigSchema,
  integration: integrationConfigSchema,
  features: featureFlagsSchema,
  logging: loggingConfigSchema,
});

export type BaseConfig = z.infer<typeof baseConfigSchema>;
export type SecurityConfig = z.infer<typeof securityConfigSchema>;
export type CognitoConfig = z.infer<typeof cognitoConfigSchema>;
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type EmailConfig = z.infer<typeof emailConfigSchema>;
export type ServicesConfig = z.infer<typeof servicesConfigSchema>;
export type AwsConfig = z.infer<typeof awsConfigSchema>;
export type NeptuneConfig = z.infer<typeof neptuneConfigSchema>;
export type DomainConfig = z.infer<typeof domainConfigSchema>;
export type SystemConfig = z.infer<typeof systemConfigSchema>;
export type IntegrationConfig = z.infer<typeof integrationConfigSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;
export type LoggingConfig = z.infer<typeof loggingConfigSchema>;