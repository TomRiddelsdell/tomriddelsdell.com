/**
 * Auth module export file
 */
export * from './types';
export * from './auth-service';
export * from './aws-cognito-provider';

// Default export for easy importing
import { AuthService } from './auth-service';
export default AuthService.getInstance();