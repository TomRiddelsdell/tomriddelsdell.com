import { AuthOptions } from './types';
import { AuthServiceImpl } from './auth-service';

// Create and export the auth service singleton
const authService = new AuthServiceImpl({
  provider: 'simple', // Using our simple auth provider instead of Cognito
  region: '',
  userPoolId: '',
  clientId: '',
  clientSecret: ''
});

// Initialize auth service
(async () => {
  try {
    console.log('Initializing Simple authentication provider');
    await authService.initialize();
    console.log('Authentication initialized successfully');
  } catch (error) {
    console.error('Failed to initialize auth service:', error);
  }
})();

export default authService;
export * from './types';
export * from './auth-controller';
export * from './user-adapter';