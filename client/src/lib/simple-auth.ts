import { getClientAuthConfig, validateClientAuthConfig } from './auth-config';

// Minimal AWS Cognito authentication
export function redirectToCognito() {
  validateClientAuthConfig();
  const config = getClientAuthConfig();
  
  console.log('Using redirect URI:', config.urls.callbackUrl);
  
  const params = new URLSearchParams({
    'response_type': 'code',
    'client_id': config.cognito.clientId,
    'redirect_uri': config.urls.callbackUrl,
    'scope': 'openid email profile'
  });
  
  const url = `${config.cognito.hostedUIDomain}/login?${params.toString()}`;
  
  console.log('Final Cognito URL:', url);
  
  window.location.href = url;
}

export function redirectToSignOut() {
  const config = getClientAuthConfig();
  const logoutUri = encodeURIComponent(config.urls.logoutUrl);
  
  const url = `${config.cognito.hostedUIDomain}/logout?client_id=${config.cognito.clientId}&logout_uri=${logoutUri}`;
  window.location.href = url;
}

export async function getCurrentUser() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function handleAuthCallback(code: string) {
  const response = await fetch('/api/auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  return await response.json();
}