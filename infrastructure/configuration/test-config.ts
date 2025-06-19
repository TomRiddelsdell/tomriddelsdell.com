import { BaseConfig } from './base-config';

/**
 * Test environment configuration
 * Minimal configuration for testing with in-memory overrides
 */
export const testConfig: Partial<BaseConfig> = {
  environment: 'test',
  
  security: {
    cors: {
      allowedOrigins: ['http://localhost:3000'],
    },
    session: {
      secure: false,
      maxAge: 60000, // 1 minute for tests
    },
    rateLimit: {
      windowMs: 1000, // 1 second
      maxRequests: 1000, // Very permissive for tests
    },
  },
  
  database: {
    ssl: {
      enabled: false,
      rejectUnauthorized: false,
    },
    pool: {
      min: 1,
      max: 2,
    },
  },
  
  features: {
    debugMode: true,
    analyticsEnabled: false,
    emailEnabled: false,
  },
  
  logging: {
    level: 'error', // Minimal logging during tests
    enableConsole: false,
    enableFile: false,
    enableDatabase: false,
    format: 'simple',
  },
};