import { BaseConfig } from './base-config';

/**
 * Production environment configuration
 * Secure defaults with strict security policies
 */
export const productionConfig: Partial<BaseConfig> = {
  environment: 'production',
  
  features: {
    debugMode: false,
    analyticsEnabled: true,
    emailEnabled: true,
    maintenanceMode: false,
    newUserRegistration: true,
  },
  
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: true,
    enableDatabase: true,
    format: 'json',
    maxFileSize: '50mb',
    maxFiles: 10,
  },
};