import { BaseConfig } from './base-config';

/**
 * Development environment configuration
 * Less restrictive settings for development and debugging
 */
export const developmentConfig: Partial<BaseConfig> = {
  environment: 'development',
  
  security: {
    cors: {
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
      ],
    },
    session: {
      secure: false, // Allow non-HTTPS in development
      sameSite: 'lax',
    },
    rateLimit: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 1000, // Very permissive for development
    },
  },
  
  database: {
    ssl: {
      enabled: false, // Disable SSL for local development
      rejectUnauthorized: false,
    },
  },
  
  features: {
    debugMode: true,
    analyticsEnabled: true,
  },
  
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFile: false,
    enableDatabase: true,
    format: 'simple',
  },
};