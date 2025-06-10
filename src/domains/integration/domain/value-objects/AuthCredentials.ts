export type AuthType = 'api_key' | 'oauth2' | 'basic' | 'bearer' | 'custom';

export interface AuthConfig {
  type: AuthType;
  credentials: Record<string, string>;
  refreshable?: boolean;
  expiresAt?: Date;
}

export class AuthCredentials {
  private constructor(
    private readonly type: AuthType,
    private readonly credentials: Record<string, string>,
    private readonly refreshable: boolean = false,
    private readonly expiresAt?: Date
  ) {
    this.validateCredentials();
  }

  static createApiKey(apiKey: string): AuthCredentials {
    return new AuthCredentials('api_key', { apiKey });
  }

  static createOAuth2(
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): AuthCredentials {
    const credentials: Record<string, string> = { accessToken };
    if (refreshToken) {
      credentials.refreshToken = refreshToken;
    }
    return new AuthCredentials('oauth2', credentials, !!refreshToken, expiresAt);
  }

  static createBasicAuth(username: string, password: string): AuthCredentials {
    return new AuthCredentials('basic', { username, password });
  }

  static createBearer(token: string): AuthCredentials {
    return new AuthCredentials('bearer', { token });
  }

  static createCustom(credentials: Record<string, string>): AuthCredentials {
    return new AuthCredentials('custom', credentials);
  }

  private validateCredentials(): void {
    if (!this.credentials || Object.keys(this.credentials).length === 0) {
      throw new Error('Credentials cannot be empty');
    }

    switch (this.type) {
      case 'api_key':
        if (!this.credentials.apiKey) {
          throw new Error('API key is required for api_key auth type');
        }
        break;
      case 'oauth2':
        if (!this.credentials.accessToken) {
          throw new Error('Access token is required for OAuth2 auth type');
        }
        break;
      case 'basic':
        if (!this.credentials.username || !this.credentials.password) {
          throw new Error('Username and password are required for basic auth type');
        }
        break;
      case 'bearer':
        if (!this.credentials.token) {
          throw new Error('Token is required for bearer auth type');
        }
        break;
    }
  }

  getType(): AuthType {
    return this.type;
  }

  getCredentials(): Record<string, string> {
    // Return a copy to prevent mutation
    return { ...this.credentials };
  }

  isRefreshable(): boolean {
    return this.refreshable;
  }

  getExpiresAt(): Date | undefined {
    return this.expiresAt;
  }

  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  needsRefresh(): boolean {
    if (!this.refreshable || !this.expiresAt) {
      return false;
    }
    // Refresh if expiring within 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return this.expiresAt <= fiveMinutesFromNow;
  }

  refreshWith(newAccessToken: string, newExpiresAt?: Date): AuthCredentials {
    if (!this.refreshable) {
      throw new Error('These credentials are not refreshable');
    }
    
    const newCredentials = { ...this.credentials, accessToken: newAccessToken };
    return new AuthCredentials(this.type, newCredentials, this.refreshable, newExpiresAt);
  }

  toAuthHeader(): Record<string, string> {
    switch (this.type) {
      case 'api_key':
        return { 'X-API-Key': this.credentials.apiKey };
      case 'oauth2':
      case 'bearer':
        const token = this.credentials.accessToken || this.credentials.token;
        return { 'Authorization': `Bearer ${token}` };
      case 'basic':
        const encoded = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64');
        return { 'Authorization': `Basic ${encoded}` };
      case 'custom':
        return this.credentials;
      default:
        throw new Error(`Unsupported auth type: ${this.type}`);
    }
  }
}