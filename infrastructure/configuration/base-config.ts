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
  clientId: z.string().min(1, 'Cognito client ID is required'),
  clientSecret: z.string().optional(),
  userPoolId: z.string().min(1, 'Cognito user pool ID is required'),
  region: z.string().min(1, 'AWS region is required'),
  hostedUIDomain: z.string().min(1, 'Cognito hosted UI domain is required'),
  accessKeyId: z.string().min(1, 'AWS access key ID is required'),
  secretAccessKey: z.string().min(1, 'AWS secret access key is required'),
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
    apiKey: z.string().startsWith('SG.', 'SendGrid API key must start with SG.').optional(),
    fromEmail: z.string().email().default('noreply@flowcreate.app'),
    fromName: z.string().default('FlowCreate'),
  }).optional(),
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
  features: featureFlagsSchema,
  logging: loggingConfigSchema,
});

export type BaseConfig = z.infer<typeof baseConfigSchema>;
export type SecurityConfig = z.infer<typeof securityConfigSchema>;
export type CognitoConfig = z.infer<typeof cognitoConfigSchema>;
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type EmailConfig = z.infer<typeof emailConfigSchema>;
export type ServicesConfig = z.infer<typeof servicesConfigSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;
export type LoggingConfig = z.infer<typeof loggingConfigSchema>;