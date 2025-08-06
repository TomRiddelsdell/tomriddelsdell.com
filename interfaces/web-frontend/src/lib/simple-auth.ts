import { getClientAuthConfig, getClientAuthConfigSync } from './auth-config';

/**
 * Redirect to AWS Cognito hosted UI for authentication
 */
export async function redirectToCognito() {
  try {
    const config = await getClientAuthConfig();
    
    // Check if hosted UI domain is properly configured
    if (!config.cognito.hostedUIDomain || config.cognito.hostedUIDomain.includes('undefined')) {
      throw new Error('Cognito hosted UI domain not configured');
    }
    
    const authUrl = `https://${config.cognito.hostedUIDomain}/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${config.cognito.clientId}&` +
      `redirect_uri=${encodeURIComponent(config.urls.callbackUrl)}&` +
      `scope=openid+email+profile`;
    
    console.log('Redirecting to Cognito:', authUrl);
    window.location.href = authUrl;
    
  } catch (error) {
    console.error('Failed to get auth config, using sync fallback:', error);
    // Fallback to sync version if async fails
    const config = getClientAuthConfigSync();
    
    if (!config.cognito.hostedUIDomain) {
      alert('Cognito hosted UI not configured. Please check your AWS Cognito settings.');
      return;
    }
    
    const authUrl = `https://${config.cognito.hostedUIDomain}/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${config.cognito.clientId}&` +
      `redirect_uri=${encodeURIComponent(config.urls.callbackUrl)}&` +
      `scope=openid+email+profile`;
    
    window.location.href = authUrl;
  }
}

/**
 * Sign out and redirect to logout URL
 */
export async function signOutAndRedirect() {
  try {
    const config = await getClientAuthConfig();
    
    if (!config.cognito.hostedUIDomain) {
      // Fallback to local signout
      window.location.href = config.urls.logoutUrl;
      return;
    }
    
    const logoutUrl = `https://${config.cognito.hostedUIDomain}/logout?` +
      `client_id=${config.cognito.clientId}&` +
      `logout_uri=${encodeURIComponent(config.urls.logoutUrl)}`;
    
    window.location.href = logoutUrl;
  } catch (error) {
    console.error('Failed to get auth config, using sync fallback:', error);
    // Fallback to sync version if async fails
    const config = getClientAuthConfigSync();
    
    const logoutUrl = `https://${config.cognito.hostedUIDomain}/logout?` +
      `client_id=${config.cognito.clientId}&` +
      `logout_uri=${encodeURIComponent(config.urls.logoutUrl)}`;
    
    window.location.href = logoutUrl;
  }
}