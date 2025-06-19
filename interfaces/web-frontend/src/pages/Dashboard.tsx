import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { Link } from "wouter";
import { SystemHealthCard } from "../components/monitoring/SystemHealthCard";
import { PerformanceMetricsCard } from "../components/monitoring/PerformanceMetricsCard";
import { SimpleUserTable } from "../components/SimpleUserTable";
import { 
  LayoutDashboard, 
  ChartGantt, 
  AppWindow, 
  Clock,
  ArrowRight,
  Plus,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  Shield,
  Database,
  Server,
  AlertTriangle
} from "lucide-react";

function Dashboard() {
  const { user } = useAuth();
  
  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <LayoutDashboard className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/career">
                <Button variant="ghost">Career</Button>
              </Link>
              <Link href="/projects">
                <Button variant="ghost">Projects</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName}!</h1>
          <p className="mt-2 text-gray-600">Here's what's happening with your projects and activities.</p>
        </div>





        {/* Phase 1: Enhanced Monitoring Dashboard */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health Monitoring */}
          <SystemHealthCard />
          
          {/* Performance Metrics */}
          <PerformanceMetricsCard />
        </div>

        {/* Admin Panel: User Management & System Administration */}
        {user?.role === 'admin' && (
          <>
            {/* User Management Table */}
            <div className="mt-6">
              <SimpleUserTable />
            </div>

            {/* System Administration Panel */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Administration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3 w-full">
                      <Database className="h-5 w-5 text-blue-500" />
                      <div className="text-left">
                        <div className="font-medium">Database Health</div>
                        <div className="text-sm text-gray-500">Monitor connections & performance</div>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3 w-full">
                      <Server className="h-5 w-5 text-green-500" />
                      <div className="text-left">
                        <div className="font-medium">Service Status</div>
                        <div className="text-sm text-gray-500">Check all service health</div>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3 w-full">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div className="text-left">
                        <div className="font-medium">Configuration</div>
                        <div className="text-sm text-gray-500">Validate system settings</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}


      </div>
    </div>
  );
}

export default Dashboard;