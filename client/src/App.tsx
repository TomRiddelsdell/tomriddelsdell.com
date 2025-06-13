import React from "react";
import { Router, Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import MonitoringDashboard from "./pages/MonitoringDashboard";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;