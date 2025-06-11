import { useEffect, useState } from 'react';

interface DashboardMetrics {
  avgResponseTime: number;
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
}

interface TimelinePoint {
  timestamp: string;
  responseTime: number;
  errorRate: number;
}

interface ActivityItem {
  description: string;
  timestamp: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  timeline: TimelinePoint[];
  recentActivity: ActivityItem[];
}

export default function MonitoringDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/analytics/dashboard?timeRange=1h');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Monitoring Dashboard</h1>
        <div className="text-center py-8">Loading analytics data...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Monitoring Dashboard</h1>
        <div className="text-center py-8 text-gray-500">Unable to load analytics data</div>
      </div>
    );
  }

  const { metrics, timeline, recentActivity } = dashboardData;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Monitoring Dashboard</h1>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Response Time</h3>
          <p className="text-3xl font-bold">{metrics.avgResponseTime}ms</p>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Active Users</h3>
          <p className="text-3xl font-bold">{metrics.activeUsers}</p>
        </div>
        <div className="bg-purple-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Total Requests</h3>
          <p className="text-3xl font-bold">{metrics.totalRequests}</p>
        </div>
        <div className="bg-red-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Error Rate</h3>
          <p className="text-3xl font-bold">{metrics.errorRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Timeline */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Performance Timeline</h2>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <div className="text-gray-500">
              {timeline.length > 0 
                ? `${timeline.length} data points available`
                : 'No timeline data available'
              }
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">{activity.description}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-500">System running normally</div>
            )}
          </div>
        </div>
      </div>

      {/* API Links */}
      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h2 className="text-xl font-bold mb-4">Analytics API Endpoints</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a 
            href="/api/analytics/dashboard?timeRange=1h" 
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dashboard Data
          </a>
          <a 
            href="/api/analytics/logs?timeRange=1h" 
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            System Logs
          </a>
          <a 
            href="/api/analytics/system-health" 
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Health Status
          </a>
          <a 
            href="/api/analytics/alerts" 
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Active Alerts
          </a>
        </div>
      </div>
    </div>
  );
}