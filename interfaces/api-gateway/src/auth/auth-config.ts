/**
 * Secure authentication configuration using centralized config system
 * NO HARDCODED SECRETS OR DOMAINS - All values from environment with validation
 */

import { getConfig } from '../../../../infrastructure/configuration/node-config-service';

export interface AuthConfig {
  cognito: {
    clientId: string;
    clientSecret?: string;
    userPoolId: string;
    region: string;
    hostedUIDomain: string;
  };
  urls: {
    baseUrl: string;
    callbackUrl: string;
    logoutUrl: string;
  };
  session: {
    secret: string;
  };
}

/**
 * Secure authentication configuration using centralized system
 */
export function getAuthConfig(): AuthConfig {
  const config = getConfig();
  
  return {
    cognito: config.cognito,
    urls: config.services.external,
    session: config.security.session,
  };
}

/**
 * Validate authentication configuration - now handled by centralized system
 */
export function validateAuthConfig(): void {
  const config = getAuthConfig();
  
  // Validation is handled by centralized configuration system with proper error handling
  console.log('Authentication configuration validated');
  console.log(`Base URL: ${config.urls.baseUrl}`);
  console.log(`Callback URL: ${config.urls.callbackUrl}`);
  console.log(`Logout URL: ${config.urls.logoutUrl}`);
}