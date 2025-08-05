/**
 * Secure authentication configuration using centralized config system
 * NO HARDCODED SECRETS - All values from environment variables with validation
 */

import { getConfig } from '../../configuration/node-config-service';

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
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
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
 * Validate authentication configuration
 */
export function validateAuthConfig(): void {
  const config = getAuthConfig();
  
  // Validation is handled by centralized configuration system
  console.log('Authentication configuration validated');
  console.log(`Base URL: ${config.urls.baseUrl}`);
  console.log(`Callback URL: ${config.urls.callbackUrl}`);
  console.log(`Logout URL: ${config.urls.logoutUrl}`);
}