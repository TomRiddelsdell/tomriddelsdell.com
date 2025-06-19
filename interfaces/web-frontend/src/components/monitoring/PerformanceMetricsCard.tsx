/**
 * Performance Metrics Card - Displays API performance and request statistics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  BarChart3,
  Clock,
  TrendingUp,
  AlertCircle,
  Activity
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

interface EndpointStats {
  endpoint: string;
  count: number;
  avgResponseTime: number;
  errorRate: number;
}

export function PerformanceMetricsCard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const [statsResponse, performanceResponse] = await Promise.all([
        fetch('/api/monitoring/dashboard-stats'),
        fetch('/api/monitoring/performance')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (performanceResponse.ok) {
        const perfData = await performanceResponse.json();
        setEndpoints(perfData.endpointStats?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 100) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getErrorRateColor = (rate: number) => {
    if (rate < 1) return 'bg-green-100 text-green-800';
    if (rate < 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Performance Indicators */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.requestsPerMinute.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Requests/min</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className={`text-2xl font-bold ${getResponseTimeColor(stats.averageResponseTime)}`}>
                {stats.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.activeUsers}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {stats.uptime.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        )}

        {/* Error Rate Alert */}
        {stats && stats.errorRate > 5 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="text-red-700">
              High error rate detected: {stats.errorRate.toFixed(1)}%
            </div>
          </div>
        )}

        {/* Top Endpoints */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Top Endpoints
          </h4>
          <div className="space-y-2">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-mono text-sm font-medium truncate">
                    {endpoint.endpoint}
                  </div>
                  <div className="text-xs text-gray-500">
                    {endpoint.count} requests
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getResponseTimeColor(endpoint.avgResponseTime)}`}>
                      {endpoint.avgResponseTime.toFixed(0)}ms
                    </div>
                    <div className="text-xs text-gray-500">avg time</div>
                  </div>
                  <Badge className={getErrorRateColor(endpoint.errorRate)}>
                    {endpoint.errorRate.toFixed(1)}% errors
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="flex items-center justify-center pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live data - updates every minute
          </div>
        </div>
      </CardContent>
    </Card>
  );
}