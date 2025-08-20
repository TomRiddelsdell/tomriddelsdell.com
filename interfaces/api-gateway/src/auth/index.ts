import { AuthOptions } from './types';
import { AuthServiceImpl } from './auth-service';

// Create and export the auth service singleton
// Use AWS Cognito as the primary authentication provider
const authService = new AuthServiceImpl({
  provider: 'cognito',
  region: process.env.VITE_AWS_COGNITO_REGION || 'eu-west-2',
  userPoolId: process.env.VITE_AWS_COGNITO_USER_POOL_ID || 'eu-west-2_g2Bs4XiwN',
  clientId: process.env.VITE_AWS_COGNITO_CLIENT_ID || '483n96q9sudb248kp2sgto7i47',
  clientSecret: undefined // Public client - no secret needed
});

// Initialize auth service
(async () => {
  try {
    console.log('Initializing AWS Cognito authentication with:', {
      region: process.env.VITE_AWS_COGNITO_REGION || 'eu-west-2',
      userPoolId: process.env.VITE_AWS_COGNITO_USER_POOL_ID || 'eu-west-2_g2Bs4XiwN',
      clientId: process.env.VITE_AWS_COGNITO_CLIENT_ID || '483n96q9sudb248kp2sgto7i47',
      hasClientSecret: false
    });
    await authService.initialize();
    console.log('AWS Cognito authentication initialized successfully');
  } catch (error) {
    console.error('Failed to initialize auth service:', error);
  }
})();

export default authService;
export * from './types';
export * from './user-adapter';