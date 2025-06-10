/**
 * Centralized authentication configuration
 * All URLs and secrets are managed here to prevent conflicts
 */

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
 * Get the current base URL dynamically
 */
function getBaseUrl(): string {
  // In production, use REPLIT_DOMAINS or custom domain
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS}`;
  }
  
  // Fallback for local development
  return process.env.BASE_URL || 'http://localhost:5000';
}

/**
 * Centralized authentication configuration
 */
export function getAuthConfig(): AuthConfig {
  const baseUrl = getBaseUrl();
  
  return {
    cognito: {
      clientId: process.env.AWS_COGNITO_CLIENT_ID || '',
      clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
      userPoolId: process.env.AWS_COGNITO_USER_POOL_ID || '',
      region: process.env.AWS_COGNITO_REGION || 'eu-west-2',
      hostedUIDomain: process.env.AWS_COGNITO_HOSTED_UI_DOMAIN || '',
    },
    urls: {
      baseUrl,
      callbackUrl: `${baseUrl}/auth/callback`,
      logoutUrl: baseUrl,
    },
    session: {
      secret: process.env.SESSION_SECRET || 'your-session-secret-here',
    },
  };
}

/**
 * Validate that all required environment variables are present
 */
export function validateAuthConfig(): void {
  const config = getAuthConfig();
  
  const required = [
    { key: 'AWS_COGNITO_CLIENT_ID', value: config.cognito.clientId },
    { key: 'AWS_COGNITO_USER_POOL_ID', value: config.cognito.userPoolId },
    { key: 'AWS_COGNITO_REGION', value: config.cognito.region },
  ];
  
  const missing = required.filter(({ value }) => !value);
  
  if (missing.length > 0) {
    const missingKeys = missing.map(({ key }) => key).join(', ');
    throw new Error(`Missing required environment variables: ${missingKeys}`);
  }
  
  console.log('Authentication configuration validated');
  console.log(`Base URL: ${config.urls.baseUrl}`);
  console.log(`Callback URL: ${config.urls.callbackUrl}`);
  console.log(`Logout URL: ${config.urls.logoutUrl}`);
}