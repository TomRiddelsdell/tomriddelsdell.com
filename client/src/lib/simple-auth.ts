// Minimal AWS Cognito authentication
export function redirectToCognito() {
  const clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
  const hostedDomain = import.meta.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN;
  
  // Use the configured redirect URI that matches Cognito app client settings
  // Force use of Replit domain since custom domain might be causing redirects
  const currentOrigin = window.location.origin;
  const replitDomain = 'https://workspace--triddelsdell.repl.co';
  const redirectUri = `${replitDomain}/auth/callback`;
  
  console.log('Current origin:', currentOrigin);
  console.log('Using Replit domain for callback:', replitDomain);
  console.log('Expected origins from Cognito config:', [
    'https://workspace--triddelsdell.repl.co',
    'https://tomriddelsdell.com', 
    'https://tomriddelsdell.replit.app'
  ]);
  
  console.log('Cognito redirect attempt:', {
    clientId,
    hostedDomain, 
    redirectUri,
    origin: window.location.origin
  });
  
  // Try different parameter orders and formats that Cognito might expect
  const params = new URLSearchParams({
    'response_type': 'code',
    'client_id': clientId,
    'redirect_uri': redirectUri,
    'scope': 'openid email profile'
  });
  
  const url = `${hostedDomain}/login?${params.toString()}`;
  
  console.log('Final Cognito URL:', url);
  console.log('URL parameters:', params.toString());
  
  // Log each parameter separately for debugging
  console.log('Individual parameters:', {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid email profile'
  });
  
  window.location.href = url;
}

export function redirectToSignOut() {
  const clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
  const hostedDomain = import.meta.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN;
  const logoutUri = encodeURIComponent(window.location.origin);
  
  const url = `${hostedDomain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
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