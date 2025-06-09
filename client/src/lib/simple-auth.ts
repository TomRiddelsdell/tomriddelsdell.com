import { getClientAuthConfig, validateClientAuthConfig } from './auth-config';

// Minimal AWS Cognito authentication
export function redirectToCognito() {
  validateClientAuthConfig();
  const config = getClientAuthConfig();
  
  console.log('=== SIGN IN DEBUG ===');
  console.log('Current window location:', window.location.href);
  console.log('Using redirect URI:', config.urls.callbackUrl);
  console.log('Cognito Client ID:', config.cognito.clientId);
  console.log('Cognito Domain:', config.cognito.hostedUIDomain);
  
  const params = new URLSearchParams({
    'response_type': 'code',
    'client_id': config.cognito.clientId,
    'redirect_uri': config.urls.callbackUrl,
    'scope': 'openid email profile',
    'state': encodeURIComponent(window.location.origin) // Pass current origin in state parameter
  });
  
  const url = `${config.cognito.hostedUIDomain}/login?${params.toString()}`;
  
  console.log('Final Cognito URL:', url);
  console.log('Redirecting to Cognito...');
  
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
  console.log('=== FRONTEND CALLBACK DEBUG ===');
  console.log('Authorization code received:', code.substring(0, 20) + '...');
  console.log('Making callback request to /api/auth/callback');
  
  const response = await fetch('/api/auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    credentials: 'include'
  });
  
  console.log('Callback response status:', response.status);
  console.log('Callback response ok:', response.ok);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Callback error response:', errorText);
    throw new Error('Authentication failed');
  }
  
  const result = await response.json();
  console.log('Callback successful, user data:', result);
  return result;
}