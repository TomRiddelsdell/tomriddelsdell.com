import { BaseConfig } from './base-config';

/**
 * Staging environment configuration
 * Production-like settings with some debugging capabilities
 */
export const stagingConfig: Partial<BaseConfig> = {
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