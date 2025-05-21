import { AuthOptions } from './types';
import { AuthServiceImpl } from './auth-service';

// Create and export the auth service singleton
const authService = new AuthServiceImpl({
  provider: 'cognito',
  region: process.env.AWS_REGION || 'us-east-1',
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID || '',
  clientId: process.env.AWS_COGNITO_CLIENT_ID || '',
  clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET
});

// Initialize auth service
(async () => {
  try {
    await authService.initialize();
  } catch (error) {
    console.error('Failed to initialize auth service:', error);
  }
})();

export default authService;
export * from './types';
export * from './auth-controller';
export * from './user-adapter';