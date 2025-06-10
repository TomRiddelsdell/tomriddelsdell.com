import { ApiEndpoint } from '../value-objects/ApiEndpoint';
import { AuthCredentials } from '../value-objects/AuthCredentials';

export type ConnectionStatus = 'connected' | 'disconnected' | 'testing' | 'error';

export interface ConnectionTest {
  timestamp: Date;
  success: boolean;
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
}

export interface RateLimitInfo {
  remainingRequests: number;
  resetTime: Date;
  windowStart: Date;
  windowEnd: Date;
}

export class ApiConnection {
  private constructor(
    private readonly id: string,
    private readonly integrationId: string,
    private readonly endpoint: ApiEndpoint,
    private auth: AuthCredentials,
    private status: ConnectionStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private lastTestedAt?: Date,
    private lastSuccessAt?: Date,
    private lastErrorAt?: Date,
    private connectionTests: ConnectionTest[] = [],
    private rateLimitInfo?: RateLimitInfo,
    private customHeaders: Record<string, string> = {},
    private isActive: boolean = true
  ) {}

  static create(
    id: string,
    integrationId: string,
    endpoint: ApiEndpoint,
    auth: AuthCredentials
  ): ApiConnection {
    const now = new Date();
    return new ApiConnection(
      id,
      integrationId,
      endpoint,
      auth,
      'disconnected',
      now,
      now
    );
  }

  static restore(
    id: string,
    integrationId: string,
    endpoint: ApiEndpoint,
    auth: AuthCredentials,
    status: ConnectionStatus,
    createdAt: Date,
    updatedAt: Date,
    lastTestedAt?: Date,
    lastSuccessAt?: Date,
    lastErrorAt?: Date,
    connectionTests: ConnectionTest[] = [],
    rateLimitInfo?: RateLimitInfo,
    customHeaders: Record<string, string> = {},
    isActive: boolean = true
  ): ApiConnection {
    return new ApiConnection(
      id,
      integrationId,
      endpoint,
      auth,
      status,
      createdAt,
      updatedAt,
      lastTestedAt,
      lastSuccessAt,
      lastErrorAt,
      connectionTests,
      rateLimitInfo,
      customHeaders,
      isActive
    );
  }

  getId(): string {
    return this.id;
  }

  getIntegrationId(): string {
    return this.integrationId;
  }

  getEndpoint(): ApiEndpoint {
    return this.endpoint;
  }

  getAuth(): AuthCredentials {
    return this.auth;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getLastTestedAt(): Date | undefined {
    return this.lastTestedAt;
  }

  getLastSuccessAt(): Date | undefined {
    return this.lastSuccessAt;
  }

  getLastErrorAt(): Date | undefined {
    return this.lastErrorAt;
  }

  getConnectionTests(): ConnectionTest[] {
    return [...this.connectionTests];
  }

  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.rateLimitInfo ? { ...this.rateLimitInfo } : undefined;
  }

  getCustomHeaders(): Record<string, string> {
    return { ...this.customHeaders };
  }

  isConnectionActive(): boolean {
    return this.isActive && this.status === 'connected';
  }

  canMakeRequest(): boolean {
    if (!this.isConnectionActive()) {
      return false;
    }

    if (this.auth.isExpired()) {
      return false;
    }

    // Check rate limits
    if (this.rateLimitInfo) {
      const now = new Date();
      if (now < this.rateLimitInfo.resetTime && this.rateLimitInfo.remainingRequests <= 0) {
        return false;
      }
    }

    return true;
  }

  async testConnection(): Promise<ConnectionTest> {
    this.status = 'testing';
    this.lastTestedAt = new Date();
    this.updatedAt = new Date();

    const test: ConnectionTest = {
      timestamp: new Date(),
      success: false
    };

    try {
      // In a real implementation, this would make an actual HTTP request
      const startTime = Date.now();
      
      // Simulate connection test
      const headers = {
        ...this.endpoint.getHeaders(),
        ...this.auth.toAuthHeader(),
        ...this.customHeaders
      };

      // Mock successful test for now
      const responseTime = Date.now() - startTime;
      
      test.success = true;
      test.responseTime = responseTime;
      test.statusCode = 200;

      this.status = 'connected';
      this.lastSuccessAt = new Date();

    } catch (error) {
      test.success = false;
      test.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.status = 'error';
      this.lastErrorAt = new Date();
    }

    this.connectionTests.push(test);
    
    // Keep only last 10 tests
    if (this.connectionTests.length > 10) {
      this.connectionTests = this.connectionTests.slice(-10);
    }

    this.updatedAt = new Date();
    return test;
  }

  connect(): void {
    if (this.status === 'connected') {
      return;
    }

    if (this.auth.isExpired()) {
      throw new Error('Cannot connect with expired credentials');
    }

    this.status = 'connected';
    this.lastSuccessAt = new Date();
    this.updatedAt = new Date();
  }

  disconnect(): void {
    this.status = 'disconnected';
    this.updatedAt = new Date();
  }

  updateAuth(auth: AuthCredentials): void {
    this.auth = auth;
    this.updatedAt = new Date();
    
    // If credentials changed, retest connection
    if (this.status === 'connected') {
      this.status = 'disconnected';
    }
  }

  refreshCredentials(): void {
    if (!this.auth.isRefreshable()) {
      throw new Error('Credentials are not refreshable');
    }

    // In a real implementation, this would make an API call to refresh the token
    // For now, we'll simulate a successful refresh
    const refreshedAuth = this.auth.refreshWith(
      'new_access_token_' + Date.now(),
      new Date(Date.now() + 3600000) // 1 hour from now
    );

    this.updateAuth(refreshedAuth);
  }

  updateRateLimitInfo(rateLimitInfo: RateLimitInfo): void {
    this.rateLimitInfo = { ...rateLimitInfo };
    this.updatedAt = new Date();
  }

  recordRateLimitFromResponse(headers: Record<string, string>): void {
    // Parse common rate limit headers
    const remaining = headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining'];
    const resetTime = headers['x-ratelimit-reset'] || headers['x-rate-limit-reset'];
    const windowStart = headers['x-ratelimit-window-start'];
    const windowEnd = headers['x-ratelimit-window-end'];

    if (remaining && resetTime) {
      const resetDate = new Date(parseInt(resetTime) * 1000);
      const now = new Date();
      
      this.rateLimitInfo = {
        remainingRequests: parseInt(remaining),
        resetTime: resetDate,
        windowStart: windowStart ? new Date(parseInt(windowStart) * 1000) : now,
        windowEnd: windowEnd ? new Date(parseInt(windowEnd) * 1000) : resetDate
      };
      
      this.updatedAt = new Date();
    }
  }

  addCustomHeader(key: string, value: string): void {
    this.customHeaders[key] = value;
    this.updatedAt = new Date();
  }

  removeCustomHeader(key: string): void {
    delete this.customHeaders[key];
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.status = 'disconnected';
    this.updatedAt = new Date();
  }

  getHealthMetrics(): {
    successRate: number;
    averageResponseTime: number;
    recentTestCount: number;
    lastFailureReason?: string;
  } {
    const recentTests = this.connectionTests.slice(-5); // Last 5 tests
    
    if (recentTests.length === 0) {
      return {
        successRate: 0,
        averageResponseTime: 0,
        recentTestCount: 0
      };
    }

    const successfulTests = recentTests.filter(t => t.success);
    const successRate = (successfulTests.length / recentTests.length) * 100;
    
    const responseTimes = recentTests
      .filter(t => t.responseTime !== undefined)
      .map(t => t.responseTime!);
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const lastFailure = recentTests
      .slice()
      .reverse()
      .find(t => !t.success);

    return {
      successRate,
      averageResponseTime,
      recentTestCount: recentTests.length,
      lastFailureReason: lastFailure?.errorMessage
    };
  }

  needsAttention(): boolean {
    if (!this.isActive) {
      return false;
    }

    // Check if credentials are expired or expiring soon
    if (this.auth.isExpired() || this.auth.needsRefresh()) {
      return true;
    }

    // Check if connection has been failing
    const metrics = this.getHealthMetrics();
    if (metrics.recentTestCount > 0 && metrics.successRate < 50) {
      return true;
    }

    // Check if connection hasn't been tested recently
    if (this.lastTestedAt) {
      const hoursSinceLastTest = (Date.now() - this.lastTestedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastTest > 24) {
        return true;
      }
    }

    return false;
  }

  getHeaders(): Record<string, string> {
    return {
      ...this.endpoint.getHeaders(),
      ...this.auth.toAuthHeader(),
      ...this.customHeaders
    };
  }
}