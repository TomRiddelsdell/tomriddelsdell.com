/**
 * Centralized authentication configuration for frontend
 * Uses backend API to get configuration instead of environment variables
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

let cachedConfig: ClientAuthConfig | null = null;

/**
 * Get the current base URL dynamically
 */
function getBaseUrl(): string {
  return window.location.origin;
}

/**
 * Fetch configuration from backend API
 */
async function fetchConfigFromBackend(): Promise<ClientAuthConfig> {
  try {
    const response = await fetch('/api/config/auth', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch auth config: ${response.status}`);
    }
    
    const config = await response.json();
    return config;
  } catch (error) {
    console.error('Failed to fetch auth config from backend:', error);
    // Fallback to environment variables if backend fails
    return getFallbackConfig();
  }
}

/**
 * Fallback configuration using environment variables
 */
function getFallbackConfig(): ClientAuthConfig {
  const baseUrl = getBaseUrl();
  
  // Clean the hosted UI domain to remove any protocol prefix
  const rawDomain = import.meta.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN;
  const hostedUIDomain = rawDomain?.replace(/^https?:\/\//, '') || '';
  
  return {
    cognito: {
      clientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID || '',
      region: import.meta.env.VITE_AWS_COGNITO_REGION || '',
      userPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID || '',
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
 * Get centralized client authentication configuration
 */
export async function getClientAuthConfig(): Promise<ClientAuthConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }
  
  try {
    cachedConfig = await fetchConfigFromBackend();
    return cachedConfig;
  } catch (error) {
    console.error('Failed to get auth config, using fallback:', error);
    return getFallbackConfig();
  }
}

/**
 * Get synchronous client authentication configuration (uses cached or fallback)
 */
export function getClientAuthConfigSync(): ClientAuthConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  
  // If no cached config, use fallback
  console.warn('Using fallback auth config - consider calling getClientAuthConfig() first');
  return getFallbackConfig();
}

/**
 * Clear cached configuration (useful for testing or config refresh)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}

/**
 * Validate client authentication configuration
 */
export function validateClientAuthConfig(config: ClientAuthConfig): void {
  const required = ['clientId', 'region', 'userPoolId', 'hostedUIDomain'];
  const missing = required.filter(key => !config.cognito[key as keyof typeof config.cognito]);
  
  if (missing.length > 0) {
    console.error(`Missing required configuration: ${missing.join(', ')}`);
    throw new Error(`Authentication configuration incomplete: ${missing.join(', ')}`);
  }
  
  console.log('Client authentication configuration validated');
  console.log(`Callback URL: ${config.urls.callbackUrl}`);
}