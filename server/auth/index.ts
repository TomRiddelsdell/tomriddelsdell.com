import { AuthOptions } from './types';
import { AuthServiceImpl } from './auth-service';

// Create and export the auth service singleton
const authService = new AuthServiceImpl({
  provider: 'cognito',
  region: process.env.AWS_REGION || 'eu-west-2',
  userPoolId: process.env.AWS_USER_POOL_ID || 'eu-west-2_g2Bs4XiwN',
  clientId: process.env.AWS_CLIENT_ID || '5ul4gn8k517s87iv49t6qd9l1m',
  clientSecret: process.env.AWS_CLIENT_SECRET || ''
});

// Initialize auth service
(async () => {
  try {
    console.log('Initializing AWS Cognito authentication with:', {
      region: process.env.AWS_REGION || 'eu-west-2',
      userPoolId: process.env.AWS_USER_POOL_ID || 'eu-west-2_g2Bs4XiwN',
      clientId: process.env.AWS_CLIENT_ID || '5ul4gn8k517s87iv49t6qd9l1m',
      hasClientSecret: !!process.env.AWS_CLIENT_SECRET
    });
    await authService.initialize();
    console.log('AWS Cognito authentication initialized successfully');
  } catch (error) {
    console.error('Failed to initialize auth service:', error);
  }
})();

export default authService;
export * from './types';
export * from './auth-controller';
export * from './user-adapter';