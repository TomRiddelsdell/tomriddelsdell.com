import { AuthUser, AuthOptions, AuthProvider, AuthService } from './types';
import { AwsCognitoProvider } from './aws-cognito-provider';
import { DemoAuthProvider } from './demo-auth-provider';

/**
 * Main authentication service that manages auth providers
 */
export class AuthServiceImpl implements AuthService {
  private provider: AuthProvider;
  
  constructor(options: AuthOptions) {
    // Select the appropriate provider based on configuration
    switch (options.provider) {
      case 'cognito':
        this.provider = new AwsCognitoProvider(options);
        break;
      case 'simple':
        this.provider = new DemoAuthProvider(options);
        break;
      default:
        throw new Error(`Unsupported auth provider: ${options.provider}`);
    }
  }
  
  /**
   * Initialize the auth service
   */
  async initialize(): Promise<void> {
    // Any initialization logic if needed
    console.log(`Authentication service initialized with ${this.provider.constructor.name}`);
  }
  
  /**
   * Get the current auth provider
   */
  getProvider(): AuthProvider {
    return this.provider;
  }
}