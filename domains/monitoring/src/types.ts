/**
 * Monitoring Domain Types
 * Core types for system monitoring, metrics, and health tracking
 */

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
  };
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  userId?: number;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
}

export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: number;
}

export interface ConfigurationStatus {
  component: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  lastChecked: Date;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: number;
  correlationId?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  notificationChannels: string[];
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}