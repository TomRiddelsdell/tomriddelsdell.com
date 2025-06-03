// Minimal AWS Cognito authentication
export function redirectToCognito() {
  const clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
  const hostedDomain = import.meta.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN;
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
  
  const url = `${hostedDomain}/login?client_id=${clientId}&response_type=code&scope=openid+email+profile&redirect_uri=${redirectUri}`;
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