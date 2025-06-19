/**
 * System Health Card - Displays service health status and metrics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Activity,
  Database,
  Shield,
  Server
} from 'lucide-react';

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  responseTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface SystemMetrics {
  timestamp: string;
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

export function SystemHealthCard() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/status');
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
        setMetrics(data.metrics || null);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'auth':
        return <Shield className="h-4 w-4" />;
      case 'api-gateway':
        return <Server className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Status */}
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.service} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getServiceIcon(service.service)}
                <div>
                  <div className="font-medium capitalize">{service.service}</div>
                  {service.responseTime && (
                    <div className="text-sm text-gray-500">
                      {service.responseTime}ms response time
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(service.status)}
                <Badge className={getStatusColor(service.status)}>
                  {service.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* System Metrics */}
        {metrics && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">System Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.cpu.usage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">CPU Usage</div>
                <div className="text-xs text-gray-500">{metrics.cpu.cores} cores</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.memory.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Memory Usage</div>
                <div className="text-xs text-gray-500">
                  {Math.round(metrics.memory.used / 1024 / 1024)}MB / {Math.round(metrics.memory.total / 1024 / 1024)}MB
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}