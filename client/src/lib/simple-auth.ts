import { getClientAuthConfig } from './auth-config';

/**
 * Redirect to AWS Cognito hosted UI for authentication
 */
export function redirectToCognito() {
  const config = getClientAuthConfig();
  
  const authUrl = `https://${config.cognito.hostedUIDomain}/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${config.cognito.clientId}&` +
    `redirect_uri=${encodeURIComponent(config.urls.callbackUrl)}&` +
    `scope=openid+email+profile`;
  
  window.location.href = authUrl;
}

/**
 * Sign out and redirect to logout URL
 */
export function signOutAndRedirect() {
  const config = getClientAuthConfig();
  
  const logoutUrl = `https://${config.cognito.hostedUIDomain}/logout?` +
    `client_id=${config.cognito.clientId}&` +
    `logout_uri=${encodeURIComponent(config.urls.logoutUrl)}`;
  
  window.location.href = logoutUrl;
}