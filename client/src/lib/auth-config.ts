/**
 * Centralized authentication configuration for frontend
 */

export interface ClientAuthConfig {
  cognito: {
    clientId: string;
    region: string;
    userPoolId: string;
    hostedUIDomain: string;
  };
  urls: {
    baseUrl: string;
    callbackUrl: string;
    logoutUrl: string;
  };
}

/**
 * Get the current base URL dynamically
 */
function getBaseUrl(): string {
  return window.location.origin;
}

/**
 * Get centralized client authentication configuration
 */
export function getClientAuthConfig(): ClientAuthConfig {
  const baseUrl = getBaseUrl();
  
  // Clean the hosted UI domain to remove any protocol prefix
  const rawDomain = import.meta.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN;
  const hostedUIDomain = rawDomain?.replace(/^https?:\/\//, '') || '';
  
  return {
    cognito: {
      clientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID,
      region: import.meta.env.VITE_AWS_COGNITO_REGION,
      userPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID,
      hostedUIDomain,
    },
    urls: {
      baseUrl,
      callbackUrl: `${baseUrl}/auth/callback`,
      logoutUrl: baseUrl,
    },
  };
}

/**
 * Validate client authentication configuration
 */
export function validateClientAuthConfig(): void {
  const config = getClientAuthConfig();
  
  const required = [
    'VITE_AWS_COGNITO_CLIENT_ID',
    'VITE_AWS_COGNITO_REGION',
    'VITE_AWS_COGNITO_USER_POOL_ID',
    'VITE_AWS_COGNITO_HOSTED_UI_DOMAIN'
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error(`Authentication configuration incomplete`);
  }
  
  console.log('Client authentication configuration validated');
  console.log(`Callback URL: ${config.urls.callbackUrl}`);
}