// Minimal AWS Cognito authentication
export function redirectToCognito() {
  const clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
  const hostedDomain = import.meta.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN;
  
  // Use the configured redirect URI that matches Cognito app client settings
  // Detect which domain we're actually on and use the matching configured URI
  const currentOrigin = window.location.origin;
  
  let redirectUri;
  if (currentOrigin.includes('tomriddelsdell.com')) {
    redirectUri = 'https://tomriddelsdell.com/auth/callback';
  } else if (currentOrigin.includes('tomriddelsdell.replit.app')) {
    redirectUri = 'https://tomriddelsdell.replit.app/auth/callback';
  } else {
    redirectUri = 'https://workspace--triddelsdell.repl.co/auth/callback';
  }
  
  console.log('Current origin:', currentOrigin);
  console.log('Selected redirect URI:', redirectUri);
  console.log('Available Cognito redirect URIs:', [
    'https://workspace--triddelsdell.repl.co/auth/callback',
    'https://tomriddelsdell.com/auth/callback', 
    'https://tomriddelsdell.replit.app/auth/callback'
  ]);
  
  console.log('Cognito redirect attempt:', {
    clientId,
    hostedDomain, 
    redirectUri,
    origin: window.location.origin
  });
  
  // Force correct parameters to match Cognito configuration
  const params = new URLSearchParams({
    'response_type': 'code',
    'client_id': clientId,
    'redirect_uri': redirectUri,
    'scope': 'openid email profile'
  });
  
  // Double-check that we're using the correct redirect URI
  console.log('Forcing redirect URI to:', redirectUri);
  console.log('Current window origin:', window.location.origin);
  
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