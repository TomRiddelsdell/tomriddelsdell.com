export class ApiEndpoint {
  private constructor(
    private readonly url: string,
    private readonly method: string,
    private readonly headers: Record<string, string> = {},
    private readonly timeout: number = 30000
  ) {
    this.validateUrl(url);
    this.validateMethod(method);
    this.validateTimeout(timeout);
  }

  static create(
    url: string,
    method: string = 'GET',
    headers: Record<string, string> = {},
    timeout: number = 30000
  ): ApiEndpoint {
    return new ApiEndpoint(url, method, headers, timeout);
  }

  private validateUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }
    
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  private validateMethod(method: string): void {
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    if (!validMethods.includes(method.toUpperCase())) {
      throw new Error(`Invalid HTTP method. Must be one of: ${validMethods.join(', ')}`);
    }
  }

  private validateTimeout(timeout: number): void {
    if (timeout <= 0 || timeout > 300000) { // Max 5 minutes
      throw new Error('Timeout must be between 1 and 300000 milliseconds');
    }
  }

  getUrl(): string {
    return this.url;
  }

  getMethod(): string {
    return this.method.toUpperCase();
  }

  getHeaders(): Record<string, string> {
    return { ...this.headers };
  }

  getTimeout(): number {
    return this.timeout;
  }

  withHeader(key: string, value: string): ApiEndpoint {
    return new ApiEndpoint(
      this.url,
      this.method,
      { ...this.headers, [key]: value },
      this.timeout
    );
  }

  withTimeout(timeout: number): ApiEndpoint {
    return new ApiEndpoint(this.url, this.method, this.headers, timeout);
  }

  equals(other: ApiEndpoint): boolean {
    return this.url === other.url &&
           this.method === other.method &&
           JSON.stringify(this.headers) === JSON.stringify(other.headers) &&
           this.timeout === other.timeout;
  }
}