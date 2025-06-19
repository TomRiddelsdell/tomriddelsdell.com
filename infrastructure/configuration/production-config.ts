import { BaseConfig } from './base-config';

/**
 * Production environment configuration
 * Secure defaults with strict security policies
 */
export const productionConfig: Partial<BaseConfig> = {
  environment: 'production',
  
  security: {
    cors: {
      allowedOrigins: [], // Must be explicitly configured via environment variables
    },
    session: {
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
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
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  },
  
  features: {
    debugMode: false,
    analyticsEnabled: true,
    emailEnabled: true,
  },
  
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: true,
    enableDatabase: true,
    format: 'json',
  },
};