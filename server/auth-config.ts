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
  // Priority: Replit domain > custom domain > localhost
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS}`;
  }
  
  if (process.env.CUSTOM_DOMAIN) {
    return `https://${process.env.CUSTOM_DOMAIN}`;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return process.env.APP_DOMAIN || 'https://tomriddelsdell.replit.app';
  }
  
  return 'http://localhost:5000';
}

/**
 * Centralized authentication configuration
 */
export function getAuthConfig(): AuthConfig {
  const baseUrl = getBaseUrl();
  
  return {
    cognito: {
      clientId: process.env.VITE_AWS_COGNITO_CLIENT_ID!,
      clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
      userPoolId: process.env.VITE_AWS_COGNITO_USER_POOL_ID!,
      region: process.env.VITE_AWS_COGNITO_REGION!,
      hostedUIDomain: process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN!,
    },
    urls: {
      baseUrl,
      callbackUrl: `${baseUrl}/auth/callback`,
      logoutUrl: baseUrl,
    },
    session: {
      secret: process.env.SESSION_SECRET || 'flowcreate_default_secret_please_change_in_production',
    },
  };
}

/**
 * Validate that all required environment variables are present
 */
export function validateAuthConfig(): void {
  const config = getAuthConfig();
  
  const required = [
    'VITE_AWS_COGNITO_CLIENT_ID',
    'VITE_AWS_COGNITO_USER_POOL_ID', 
    'VITE_AWS_COGNITO_REGION',
    'VITE_AWS_COGNITO_HOSTED_UI_DOMAIN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('Authentication configuration validated');
  console.log(`Base URL: ${config.urls.baseUrl}`);
  console.log(`Callback URL: ${config.urls.callbackUrl}`);
  console.log(`Logout URL: ${config.urls.logoutUrl}`);
}