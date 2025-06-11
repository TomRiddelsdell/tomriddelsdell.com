import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  Database, 
  Clock, 
  Users, 
  Zap,
  TrendingUp,
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  component: string;
  category: string;
  context: {
    userId?: string;
    workflowId?: string;
    requestId?: string;
  };
}

interface SystemHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  score: number;
  lastChecked: string;
  metrics: {
    responseTime?: number;
    errorRate?: number;
    cpuUsage?: number;
    memoryUsage?: number;
  };
}

interface Alert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'suppressed';
  message: string;
  triggeredAt: string;
  component: string;
}

export default function MonitoringDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [logFilter, setLogFilter] = useState({
    level: 'all',
    component: 'all',
    search: ''
  });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch analytics data from our domain
  const { data: dashboardData, refetch } = useQuery({
    queryKey: ['/api/analytics/dashboard', selectedTimeRange],
    queryFn: () => fetchAnalyticsData(selectedTimeRange),
    refetchInterval: 30000,
  });

  const { data: logsData } = useQuery({
    queryKey: ['/api/analytics/logs', logFilter, selectedTimeRange],
    queryFn: () => fetchSystemLogs(logFilter, selectedTimeRange),
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['/api/analytics/health'],
    queryFn: () => fetchSystemHealthData(),
    refetchInterval: 15000,
  });

  const { data: activeAlerts } = useQuery({
    queryKey: ['/api/analytics/alerts'],
    queryFn: () => fetchActiveAlerts(),
    refetchInterval: 10000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time analytics and system health monitoring</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">Last 15m</SelectItem>
              <SelectItem value="1h">Last 1h</SelectItem>
              <SelectItem value="6h">Last 6h</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7d</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard
          title="System Status"
          status={getOverallSystemStatus(systemHealth)}
          icon={Activity}
          description="Overall system health"
        />
        <MetricCard
          title="Active Alerts"
          value={activeAlerts?.filter((a: Alert) => a.status === 'active').length || 0}
          icon={AlertTriangle}
          color="destructive"
          description="Requiring attention"
        />
        <MetricCard
          title="API Response Time"
          value={dashboardData?.metrics?.avgResponseTime || 0}
          unit="ms"
          icon={Zap}
          color="primary"
          description="Average last hour"
        />
        <MetricCard
          title="Active Users"
          value={dashboardData?.metrics?.activeUsers || 0}
          icon={Users}
          color="success"
          description="Current active sessions"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="investigate">Investigate</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab dashboardData={dashboardData} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <LogsTab 
            logsData={logsData} 
            logFilter={logFilter} 
            setLogFilter={setLogFilter} 
          />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <MetricsTab dashboardData={dashboardData} />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <HealthTab systemHealth={systemHealth} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsTab alerts={activeAlerts} />
        </TabsContent>

        <TabsContent value="investigate" className="space-y-4">
          <InvestigateTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HealthCard({ title, status, icon: Icon, description }: {
  title: string;
  status: 'healthy' | 'degraded' | 'down';
  icon: any;
  description: string;
}) {
  const statusColors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
          <span className="text-2xl font-bold capitalize">{status}</span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value, unit, icon: Icon, color, description }: {
  title: string;
  value: number;
  unit?: string;
  icon: any;
  color?: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toLocaleString()}{unit && <span className="text-sm font-normal ml-1">{unit}</span>}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function OverviewTab({ dashboardData }: { dashboardData: any }) {
  if (!dashboardData) return <div>Loading analytics data...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Timeline</CardTitle>
          <CardDescription>Response time and error rate over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.timeline?.map((point: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">{new Date(point.timestamp).toLocaleTimeString()}</span>
                <div className="flex gap-4">
                  <span className="text-sm">Response: {point.responseTime}ms</span>
                  <span className="text-sm">Errors: {point.errorRate}%</span>
                </div>
              </div>
            )) || <p className="text-muted-foreground">No timeline data available</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Statistics</CardTitle>
          <CardDescription>Current system performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Requests</span>
              <span className="font-medium">{dashboardData.metrics?.totalRequests || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Error Rate</span>
              <span className="font-medium">{dashboardData.metrics?.errorRate || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Response Time</span>
              <span className="font-medium">{dashboardData.metrics?.avgResponseTime || 0}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <span className="font-medium">{dashboardData.metrics?.activeUsers || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.recentActivity?.map((activity: any, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
                <Badge variant={activity.type === 'error' ? 'destructive' : 'secondary'}>
                  {activity.type}
                </Badge>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LogsTab({ logsData, logFilter, setLogFilter }: {
  logsData: LogEntry[];
  logFilter: any;
  setLogFilter: (filter: any) => void;
}) {
  const levelColors = {
    TRACE: 'bg-gray-100 text-gray-800',
    DEBUG: 'bg-blue-100 text-blue-800',
    INFO: 'bg-green-100 text-green-800',
    WARN: 'bg-yellow-100 text-yellow-800',
    ERROR: 'bg-red-100 text-red-800',
    FATAL: 'bg-red-500 text-white',
  };

  return (
    <div className="space-y-4">
      {/* Log Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Log Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={logFilter.search}
                  onChange={(e) => setLogFilter({ ...logFilter, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Select value={logFilter.level} onValueChange={(value) => setLogFilter({ ...logFilter, level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="WARN">Warning</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="DEBUG">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Component</label>
              <Select value={logFilter.component} onValueChange={(value) => setLogFilter({ ...logFilter, component: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Components</SelectItem>
                  <SelectItem value="api-server">API Server</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="auth-service">Auth Service</SelectItem>
                  <SelectItem value="workflow-engine">Workflow Engine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
          <CardDescription>
            {logsData?.length || 0} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logsData?.map((log) => (
              <div key={log.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={levelColors[log.level]}>{log.level}</Badge>
                      <span className="text-xs text-muted-foreground">{log.component}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{log.message}</p>
                    {log.context && (
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        {log.context.userId && <span>User: {log.context.userId}</span>}
                        {log.context.workflowId && <span>Workflow: {log.context.workflowId}</span>}
                        {log.context.requestId && <span>Request: {log.context.requestId}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-8">No logs found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricsTab({ dashboardData }: { dashboardData: any }) {
  if (!dashboardData) return <div>Loading metrics data...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MetricRow label="CPU Usage" value={dashboardData.systemMetrics?.cpu || 0} unit="%" color="blue" />
            <MetricRow label="Memory Usage" value={dashboardData.systemMetrics?.memory || 0} unit="%" color="green" />
            <MetricRow label="Disk Usage" value={dashboardData.systemMetrics?.disk || 0} unit="%" color="yellow" />
            <MetricRow label="Network I/O" value={dashboardData.systemMetrics?.network || 0} unit="MB/s" color="purple" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Metrics</CardTitle>
          <CardDescription>Application performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MetricRow label="Requests/min" value={dashboardData.appMetrics?.requestsPerMin || 0} unit="" color="blue" />
            <MetricRow label="Error Rate" value={dashboardData.appMetrics?.errorRate || 0} unit="%" color="red" />
            <MetricRow label="Cache Hit Rate" value={dashboardData.appMetrics?.cacheHitRate || 0} unit="%" color="green" />
            <MetricRow label="Queue Length" value={dashboardData.appMetrics?.queueLength || 0} unit="jobs" color="purple" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricRow({ label, value, max, unit, color }: {
  label: string;
  value: number;
  max?: number;
  unit: string;
  color: string;
}) {
  const percentage = max ? (value / max) * 100 : Math.min(value, 100);
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value} {max && `/ ${max}`} {unit}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function HealthTab({ systemHealth }: { systemHealth: SystemHealth[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {systemHealth?.map((component) => (
        <Card key={component.component}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{component.component}</CardTitle>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    component.status === 'healthy'
                      ? 'bg-green-500'
                      : component.status === 'degraded'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-sm capitalize">{component.status}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Health Score</span>
                <span className="font-medium">{component.score}/100</span>
              </div>
              
              {component.metrics.responseTime && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="font-medium">{component.metrics.responseTime}ms</span>
                </div>
              )}
              
              {component.metrics.errorRate !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Error Rate</span>
                  <span className="font-medium">{component.metrics.errorRate}%</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Checked</span>
                <span className="text-xs">{new Date(component.lastChecked).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )) || (
        <p className="text-muted-foreground text-center py-8 col-span-full">No health data available</p>
      )}
    </div>
  );
}

function AlertsTab({ alerts }: { alerts: Alert[] }) {
  const severityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-4">
      {alerts?.map((alert) => (
        <Alert key={alert.id} className="p-4">
          <AlertTriangle className="h-4 w-4" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{alert.name}</h4>
              <div className="flex items-center space-x-2">
                <Badge className={severityColors[alert.severity]}>{alert.severity}</Badge>
                <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                  {alert.status}
                </Badge>
              </div>
            </div>
            <AlertDescription className="mb-2">{alert.message}</AlertDescription>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Component: {alert.component}</span>
              <span>Triggered: {new Date(alert.triggeredAt).toLocaleString()}</span>
            </div>
          </div>
        </Alert>
      )) || (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No active alerts</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InvestigateTab() {
  const [investigation, setInvestigation] = useState({
    timeRange: '1h',
    userId: '',
    workflowId: '',
    incidentTime: '',
  });

  const handleStartInvestigation = async () => {
    if (!investigation.incidentTime) {
      alert('Please select an incident time');
      return;
    }

    try {
      const response = await fetch('/api/analytics/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(investigation),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Investigation results:', result);
      }
    } catch (error) {
      console.error('Investigation failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Issue Investigation</CardTitle>
          <CardDescription>
            Investigate issues using centralized logs and system metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Incident Time</label>
              <Input
                type="datetime-local"
                value={investigation.incidentTime}
                onChange={(e) => setInvestigation({ ...investigation, incidentTime: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID (optional)</label>
              <Input
                placeholder="user_123"
                value={investigation.userId}
                onChange={(e) => setInvestigation({ ...investigation, userId: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Workflow ID (optional)</label>
              <Input
                placeholder="workflow_456"
                value={investigation.workflowId}
                onChange={(e) => setInvestigation({ ...investigation, workflowId: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={investigation.timeRange} onValueChange={(value) => setInvestigation({ ...investigation, timeRange: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">±15 minutes</SelectItem>
                  <SelectItem value="30m">±30 minutes</SelectItem>
                  <SelectItem value="1h">±1 hour</SelectItem>
                  <SelectItem value="2h">±2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button onClick={handleStartInvestigation}>
              <Search className="h-4 w-4 mr-2" />
              Start Investigation
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investigation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start an investigation to see results here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Data fetching functions that connect to our analytics domain
async function fetchAnalyticsData(timeRange: string) {
  const response = await fetch(`/api/analytics/dashboard?timeRange=${timeRange}`);
  if (!response.ok) throw new Error('Failed to fetch analytics data');
  return response.json();
}

async function fetchSystemLogs(filter: any, timeRange: string) {
  const params = new URLSearchParams({
    timeRange,
    level: filter.level,
    component: filter.component,
    search: filter.search,
  });
  
  const response = await fetch(`/api/analytics/logs?${params}`);
  if (!response.ok) throw new Error('Failed to fetch logs');
  return response.json();
}

async function fetchSystemHealthData() {
  const response = await fetch('/api/analytics/health');
  if (!response.ok) throw new Error('Failed to fetch system health');
  return response.json();
}

async function fetchActiveAlerts() {
  const response = await fetch('/api/analytics/alerts');
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
}

function getOverallSystemStatus(systemHealth: SystemHealth[] | undefined): 'healthy' | 'degraded' | 'down' {
  if (!systemHealth || systemHealth.length === 0) return 'down';
  
  const statuses = systemHealth.map(h => h.status);
  
  if (statuses.includes('down')) return 'down';
  if (statuses.includes('degraded')) return 'degraded';
  return 'healthy';
}