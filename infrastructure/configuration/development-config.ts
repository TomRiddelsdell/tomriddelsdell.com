import { BaseConfig } from './base-config';

/**
 * Development environment configuration
 * Less restrictive settings for development and debugging
 */
export const developmentConfig: Partial<BaseConfig> = {
  environment: 'development',
  
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
    enableFile: false,
    enableDatabase: true,
    format: 'simple',
    maxFileSize: '10mb',
    maxFiles: 5,
  },
};