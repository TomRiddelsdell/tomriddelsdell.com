/**
 * Metrics Service - Performance metrics collection and analysis
 */

import { PerformanceMetric, ActivityLog, DashboardStats } from './types';

export class MetricsService {
  private performanceMetrics: PerformanceMetric[] = [];
  private activityLogs: ActivityLog[] = [];
  
  /**
   * Record a performance metric
   */
  recordPerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const performanceMetric: PerformanceMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: new Date()
    };
    
    this.performanceMetrics.push(performanceMetric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  /**
   * Record an activity log entry
   */
  recordActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const activityLog: ActivityLog = {
      ...activity,
      id: this.generateId(),
      timestamp: new Date()
    };
    
    this.activityLogs.push(activityLog);
    
    // Keep only last 1000 activity logs
    if (this.activityLogs.length > 1000) {
      this.activityLogs = this.activityLogs.slice(-1000);
    }
  }

  /**
   * Get performance metrics for a time range
   */
  getPerformanceMetrics(startTime?: Date, endTime?: Date): PerformanceMetric[] {
    let metrics = this.performanceMetrics;
    
    if (startTime) {
      metrics = metrics.filter(m => m.timestamp >= startTime);
    }
    
    if (endTime) {
      metrics = metrics.filter(m => m.timestamp <= endTime);
    }
    
    return metrics;
  }

  /**
   * Get activity logs for a time range
   */
  getActivityLogs(startTime?: Date, endTime?: Date): ActivityLog[] {
    let logs = this.activityLogs;
    
    if (startTime) {
      logs = logs.filter(l => l.timestamp >= startTime);
    }
    
    if (endTime) {
      logs = logs.filter(l => l.timestamp <= endTime);
    }
    
    return logs;
  }

  /**
   * Calculate dashboard statistics
   */
  getDashboardStats(): DashboardStats {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentMetrics = this.getPerformanceMetrics(oneHourAgo);
    const dailyLogs = this.getActivityLogs(oneDayAgo);
    
    // Calculate unique users
    const uniqueUserIds = new Set(
      dailyLogs
        .filter(log => log.userId)
        .map(log => log.userId)
    );
    
    // Calculate requests per minute
    const recentRequests = recentMetrics.length;
    const requestsPerMinute = recentRequests / 60;
    
    // Calculate average response time
    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
      : 0;
    
    // Calculate error rate
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = recentMetrics.length > 0 
      ? (errorRequests / recentMetrics.length) * 100 
      : 0;
    
    return {
      totalUsers: uniqueUserIds.size,
      activeUsers: this.getActiveUsers(oneHourAgo).length,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      uptime: 99.9 // Will be calculated from actual uptime monitoring
    };
  }

  /**
   * Get active users in a time range
   */
  private getActiveUsers(since: Date): number[] {
    return Array.from(new Set(
      this.activityLogs
        .filter(log => log.timestamp >= since && log.userId)
        .map(log => log.userId!)
    ));
  }

  /**
   * Get endpoint performance summary
   */
  getEndpointPerformance(): Array<{
    endpoint: string;
    count: number;
    avgResponseTime: number;
    errorRate: number;
  }> {
    const endpointGroups = new Map<string, PerformanceMetric[]>();
    
    // Group metrics by endpoint
    this.performanceMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      endpointGroups.get(key)!.push(metric);
    });
    
    // Calculate stats for each endpoint
    return Array.from(endpointGroups.entries()).map(([endpoint, metrics]) => {
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
      const errors = metrics.filter(m => m.statusCode >= 400).length;
      const errorRate = (errors / metrics.length) * 100;
      
      return {
        endpoint,
        count: metrics.length,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100
      };
    }).sort((a, b) => b.count - a.count);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}