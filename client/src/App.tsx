import { Router, Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import MonitoringDashboard from "@/pages/MonitoringDashboard";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/monitoring" component={MonitoringDashboard} />
            <Route>
              <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">FlowCreate Platform</h1>
                <p className="text-gray-600 mb-6">
                  Professional workflow management platform with comprehensive analytics.
                </p>
                <div className="space-y-4">
                  <a href="/monitoring" className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <h2 className="text-lg font-semibold text-blue-600">Monitoring Dashboard</h2>
                    <p className="text-gray-600">Real-time system analytics and performance metrics</p>
                  </a>
                  <div className="block p-4 bg-white rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-800">Backend API Status</h2>
                    <p className="text-green-600">✓ Analytics service running on port 5000</p>
                    <p className="text-green-600">✓ All domain services operational</p>
                  </div>
                </div>
              </div>
            </Route>
          </Switch>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">FlowCreate Workflow Platform</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">System Analytics</h2>
          <p className="text-gray-600 mb-4">Real-time monitoring and performance metrics</p>
          <a href="/monitoring" className="text-blue-600 hover:underline">View Dashboard →</a>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">API Endpoints</h2>
          <p className="text-gray-600 mb-4">Direct access to backend analytics services</p>
          <div className="space-y-2">
            <a href="/api/analytics/dashboard?timeRange=1h" className="block text-blue-600 text-sm hover:underline" target="_blank">Dashboard Data</a>
            <a href="/api/analytics/system-health" className="block text-blue-600 text-sm hover:underline" target="_blank">Health Status</a>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Architecture</h2>
          <p className="text-gray-600 mb-4">Domain-driven design with comprehensive testing</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Identity Domain</li>
            <li>✓ Workflow Domain</li>
            <li>✓ Analytics Domain</li>
            <li>✓ Anti-corruption Layer</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;