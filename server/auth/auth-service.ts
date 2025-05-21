import { AuthServiceInterface, AuthProviderInterface } from './types';
import { AwsCognitoProvider } from './aws-cognito-provider';

/**
 * Auth provider types supported by the service
 */
export type AuthProviderType = 'cognito' | 'memory';

/**
 * Authentication service that manages provider selection
 */
export class AuthService implements AuthServiceInterface {
  private provider: AuthProviderInterface;
  private providerType: AuthProviderType;
  private static instance: AuthService;

  private constructor(providerType: AuthProviderType = 'cognito') {
    this.providerType = providerType;
    
    // Initialize the appropriate provider based on type
    switch (providerType) {
      case 'cognito':
        this.provider = new AwsCognitoProvider();
        break;
      case 'memory':
        // Memory provider would be implemented for development
        // For now, fall back to Cognito
        this.provider = new AwsCognitoProvider();
        break;
      default:
        this.provider = new AwsCognitoProvider();
    }
  }

  /**
   * Get singleton instance of auth service
   */
  public static getInstance(providerType?: AuthProviderType): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService(providerType);
    }
    return AuthService.instance;
  }

  /**
   * Initialize the auth service
   */
  async initialize(): Promise<void> {
    console.log(`Initializing auth service with provider: ${this.providerType}`);
    // Any provider-specific initialization can happen here
  }

  /**
   * Get the current auth provider
   */
  getProvider(): AuthProviderInterface {
    return this.provider;
  }

  /**
   * Switch to a different auth provider
   * This allows changing providers at runtime if needed
   */
  switchProvider(providerType: AuthProviderType): void {
    this.providerType = providerType;
    
    switch (providerType) {
      case 'cognito':
        this.provider = new AwsCognitoProvider();
        break;
      case 'memory':
        // Would switch to memory provider
        this.provider = new AwsCognitoProvider(); // Placeholder
        break;
    }
    
    console.log(`Switched to auth provider: ${providerType}`);
  }
}