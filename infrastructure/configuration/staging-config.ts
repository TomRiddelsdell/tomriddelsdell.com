import { BaseConfig } from './base-config';

/**
 * Staging environment configuration
 * Production-like settings with some debugging capabilities
 */
export const stagingConfig: Partial<BaseConfig> = {
  environment: 'staging',
  
  security: {
    cors: {
      allowedOrigins: [], // Must be explicitly configured via environment variables
    },
    session: {
      secure: true,
      sameSite: 'lax',
      maxAge: 4 * 60 * 60 * 1000, // 4 hours
    },
    rateLimit: {
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: 200,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
  },
  
  database: {
    ssl: {
      enabled: true,
      rejectUnauthorized: true,
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  
  features: {
    debugMode: true,
    analyticsEnabled: true,
    emailEnabled: false,
  },
  
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFile: true,
    enableDatabase: true,
    format: 'json',
  },
};