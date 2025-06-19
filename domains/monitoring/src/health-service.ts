/**
 * Health Service - System health monitoring and status checks
 */

import { ServiceHealth, SystemMetrics } from './types';

export class HealthService {
  private healthChecks: Map<string, () => Promise<ServiceHealth>> = new Map();

  /**
   * Register a health check for a service
   */
  registerHealthCheck(serviceName: string, healthCheck: () => Promise<ServiceHealth>) {
    this.healthChecks.set(serviceName, healthCheck);
  }

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const healthCheck = this.healthChecks.get(serviceName);
    if (!healthCheck) {
      return {
        service: serviceName,
        status: 'unhealthy',
        timestamp: new Date(),
        error: 'No health check registered'
      };
    }

    try {
      const startTime = Date.now();
      const result = await healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        ...result,
        responseTime,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        service: serviceName,
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check health of all registered services
   */
  async checkAllServices(): Promise<ServiceHealth[]> {
    const results: ServiceHealth[] = [];
    
    const serviceNames = Array.from(this.healthChecks.keys());
    for (const serviceName of serviceNames) {
      const health = await this.checkServiceHealth(serviceName);
      results.push(health);
    }
    
    return results;
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Use dynamic import for os module
    const os = await import('os');
    
    return {
      timestamp: new Date(),
      cpu: {
        usage: this.calculateCpuUsage(cpuUsage),
        cores: os.cpus().length
      },
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      database: {
        connections: 0, // Will be populated by database health check
        maxConnections: 100, // Default value
        queryTime: 0 // Will be populated by database health check
      }
    };
  }

  private calculateCpuUsage(cpuUsage: NodeJS.CpuUsage): number {
    // Simple CPU usage calculation - in production, use more sophisticated monitoring
    const totalUsage = cpuUsage.user + cpuUsage.system;
    return Math.min(100, (totalUsage / 1000000) * 100); // Convert to percentage
  }
}