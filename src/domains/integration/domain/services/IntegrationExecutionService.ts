import { Integration, IntegrationConfig } from '../entities/Integration';
import { ApiConnection } from '../entities/ApiConnection';
import { DataMapping } from '../entities/DataMapping';
import { IntegrationId } from '../value-objects/IntegrationId';

export interface ExecutionContext {
  integrationId: IntegrationId;
  userId: number;
  requestData?: any;
  headers?: Record<string, string>;
  ipAddress?: string;
  triggeredBy: 'manual' | 'webhook' | 'schedule' | 'workflow';
}

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  requestsCount: number;
  responseData?: any;
  transformedData?: any;
  errors: ExecutionError[];
  metrics: ExecutionMetrics;
}

export interface ExecutionError {
  step: string;
  type: 'connection' | 'authentication' | 'rate_limit' | 'transformation' | 'validation' | 'timeout';
  message: string;
  details?: any;
  recoverable: boolean;
}

export interface ExecutionMetrics {
  networkTime: number;
  transformationTime: number;
  validationTime: number;
  totalResponseTime: number;
  bytesTransferred: number;
  recordsProcessed: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canExecute: boolean;
}

export class IntegrationExecutionService {
  async validateIntegration(integration: Integration): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate integration status
    if (!integration.isActive()) {
      errors.push('Integration is not active');
    }

    if (!integration.canExecute()) {
      errors.push('Integration cannot be executed (check credentials and status)');
    }

    // Validate configuration
    const config = integration.getConfig();
    
    if (!config.endpoints || config.endpoints.length === 0) {
      errors.push('Integration has no configured endpoints');
    }

    // Check authentication
    if (config.auth.isExpired()) {
      errors.push('Authentication credentials have expired');
    } else if (config.auth.needsRefresh()) {
      warnings.push('Authentication credentials need refresh soon');
    }

    // Validate rate limits
    if (config.rateLimits) {
      if (config.rateLimits.requestsPerMinute <= 0) {
        errors.push('Invalid rate limit configuration');
      }
    }

    // Check schema if present
    if (config.schema) {
      const schemaValidation = this.validateSchema(config.schema);
      if (!schemaValidation.isValid) {
        errors.push(...schemaValidation.errors.map(e => `Schema validation: ${e}`));
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canExecute: errors.length === 0 && integration.canExecute()
    };
  }

  async executeIntegration(
    integration: Integration,
    context: ExecutionContext,
    apiConnections: ApiConnection[],
    dataMapping?: DataMapping
  ): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();
    const startTime = new Date();
    const errors: ExecutionError[] = [];
    
    let responseData: any;
    let transformedData: any;
    let requestsCount = 0;
    let networkTime = 0;
    let transformationTime = 0;
    let validationTime = 0;
    let bytesTransferred = 0;
    let recordsProcessed = 0;

    try {
      // Pre-execution validation
      const validationStart = Date.now();
      const validation = await this.validateIntegration(integration);
      validationTime = Date.now() - validationStart;

      if (!validation.canExecute) {
        throw new Error(`Integration validation failed: ${validation.errors.join(', ')}`);
      }

      // Execute API calls
      const networkStart = Date.now();
      const apiResults = await this.executeApiCalls(
        integration.getConfig(),
        apiConnections,
        context.requestData,
        context.headers
      );
      networkTime = Date.now() - networkStart;

      responseData = apiResults.data;
      requestsCount = apiResults.requestsCount;
      bytesTransferred = apiResults.bytesTransferred;

      // Transform data if mapping is provided
      if (dataMapping && responseData) {
        const transformStart = Date.now();
        transformedData = await this.transformData(dataMapping, responseData);
        transformationTime = Date.now() - transformStart;
        recordsProcessed = Array.isArray(transformedData) ? transformedData.length : 1;
      }

      // Record successful execution
      const responseTime = apiResults.averageResponseTime || 0;
      integration.recordExecution(true, responseTime);

    } catch (error) {
      const executionError: ExecutionError = {
        step: 'execution',
        type: this.categorizeError(error),
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
        recoverable: this.isRecoverableError(error)
      };
      
      errors.push(executionError);
      integration.recordExecution(false, 0, executionError.message);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    return {
      success: errors.length === 0,
      executionId,
      startTime,
      endTime,
      duration,
      requestsCount,
      responseData,
      transformedData,
      errors,
      metrics: {
        networkTime,
        transformationTime,
        validationTime,
        totalResponseTime: networkTime,
        bytesTransferred,
        recordsProcessed
      }
    };
  }

  private async executeApiCalls(
    config: IntegrationConfig,
    connections: ApiConnection[],
    requestData?: any,
    headers?: Record<string, string>
  ): Promise<{
    data: any;
    requestsCount: number;
    bytesTransferred: number;
    averageResponseTime: number;
  }> {
    let totalResponseTime = 0;
    let totalBytes = 0;
    let requestsCount = 0;
    const results: any[] = [];

    for (const connection of connections) {
      if (!connection.canMakeRequest()) {
        throw new Error(`Cannot make request through connection ${connection.getId()}`);
      }

      const startTime = Date.now();
      
      try {
        // Simulate API call - in production, use actual HTTP client
        const result = await this.makeHttpRequest(
          connection,
          requestData,
          headers
        );
        
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;
        totalBytes += result.size || 0;
        requestsCount++;
        results.push(result.data);

        // Update rate limit info if available
        if (result.headers) {
          connection.recordRateLimitFromResponse(result.headers);
        }

      } catch (error) {
        throw new Error(`API call failed for connection ${connection.getId()}: ${error}`);
      }
    }

    return {
      data: results.length === 1 ? results[0] : results,
      requestsCount,
      bytesTransferred: totalBytes,
      averageResponseTime: requestsCount > 0 ? totalResponseTime / requestsCount : 0
    };
  }

  private async makeHttpRequest(
    connection: ApiConnection,
    data?: any,
    additionalHeaders?: Record<string, string>
  ): Promise<{ data: any; size: number; headers: Record<string, string> }> {
    const endpoint = connection.getEndpoint();
    const headers = {
      ...connection.getHeaders(),
      ...additionalHeaders
    };

    // Simulate HTTP request - in production, use actual HTTP client like axios
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50)); // Simulate network delay

    // Mock successful response
    const mockResponse = {
      status: 200,
      data: data || { message: 'Success', timestamp: new Date().toISOString() },
      headers: {
        'content-type': 'application/json',
        'x-ratelimit-remaining': '100',
        'x-ratelimit-reset': Math.floor((Date.now() + 3600000) / 1000).toString()
      }
    };

    return {
      data: mockResponse.data,
      size: JSON.stringify(mockResponse.data).length,
      headers: mockResponse.headers
    };
  }

  private async transformData(mapping: DataMapping, sourceData: any): Promise<any> {
    if (!mapping.isActiveMappingActive()) {
      throw new Error('Data mapping is not active');
    }

    const validationResult = mapping.validateMapping();
    if (!validationResult.isValid) {
      throw new Error(`Data mapping validation failed: ${validationResult.errors.join(', ')}`);
    }

    try {
      return mapping.transformData(sourceData);
    } catch (error) {
      throw new Error(`Data transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateSchema(schema: any): { isValid: boolean; errors: string[] } {
    // Basic schema validation - in production, use proper schema validation
    const errors: string[] = [];

    if (!schema) {
      errors.push('Schema is required');
      return { isValid: false, errors };
    }

    if (typeof schema !== 'object') {
      errors.push('Schema must be an object');
    }

    return { isValid: errors.length === 0, errors };
  }

  private categorizeError(error: any): ExecutionError['type'] {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'authentication';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'rate_limit';
    }
    if (message.includes('connection') || message.includes('network') || message.includes('unreachable')) {
      return 'connection';
    }
    if (message.includes('transform') || message.includes('mapping') || message.includes('schema')) {
      return 'transformation';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }

    return 'connection'; // Default fallback
  }

  private isRecoverableError(error: any): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    // Non-recoverable errors
    if (message.includes('unauthorized') || 
        message.includes('forbidden') ||
        message.includes('not found') ||
        message.includes('invalid schema')) {
      return false;
    }

    // Recoverable errors (network issues, rate limits, timeouts)
    return true;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async testIntegrationConnection(integration: Integration): Promise<{
    success: boolean;
    responseTime: number;
    statusCode?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const validation = await this.validateIntegration(integration);
      if (!validation.canExecute) {
        throw new Error(validation.errors.join(', '));
      }

      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

      const responseTime = Date.now() - startTime;
      
      // Record successful test
      integration.recordExecution(true, responseTime);

      return {
        success: true,
        responseTime,
        statusCode: 200
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      
      // Record failed test
      integration.recordExecution(false, responseTime, errorMessage);

      return {
        success: false,
        responseTime,
        error: errorMessage
      };
    }
  }

  getIntegrationHealth(integration: Integration): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const health = integration.getHealthStatus();
    const metrics = integration.getMetrics();
    
    let score = 100;
    const issues: string[] = [...health.issues];
    const recommendations: string[] = [];

    // Calculate health score based on various factors
    if (metrics.totalRequests > 0) {
      const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
      if (successRate < 50) {
        score -= 40;
        issues.push(`Low success rate: ${successRate.toFixed(1)}%`);
        recommendations.push('Review integration configuration and error logs');
      } else if (successRate < 80) {
        score -= 20;
        recommendations.push('Monitor integration performance closely');
      }

      // Check response time
      if (metrics.averageResponseTime > 10000) { // 10 seconds
        score -= 20;
        issues.push('High average response time');
        recommendations.push('Optimize API calls or increase timeout values');
      }
    }

    // Check credential status
    const config = integration.getConfig();
    if (config.auth.isExpired()) {
      score -= 50;
      recommendations.push('Refresh authentication credentials immediately');
    } else if (config.auth.needsRefresh()) {
      score -= 10;
      recommendations.push('Schedule credential refresh soon');
    }

    // Check last execution time
    if (metrics.lastExecutedAt) {
      const daysSinceLastExecution = (Date.now() - metrics.lastExecutedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastExecution > 7) {
        score -= 15;
        recommendations.push('Integration hasn\'t been used recently - verify it\'s still needed');
      }
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 50) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
}