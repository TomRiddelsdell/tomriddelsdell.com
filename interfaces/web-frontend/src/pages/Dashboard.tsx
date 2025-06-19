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

        {/* User Management Section - Always visible for debugging */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management {!user && "(Sign in to access)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-900 mb-2">Authentication Required</h3>
                  <p className="text-gray-600 mb-4">Please sign in with your admin account to view user management.</p>
                  <Button onClick={() => window.location.href = '/auth/login'} className="bg-blue-600 hover:bg-blue-700">
                    Sign In
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-2xl font-bold text-blue-600">4</div>
                          <div className="text-sm text-blue-600">Total Users</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold text-green-600">4</div>
                          <div className="text-sm text-green-600">Active Users</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        <div>
                          <div className="text-2xl font-bold text-red-600">1</div>
                          <div className="text-sm text-red-600">Admin Users</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Tom Riddelsdell</div>
                          <div className="text-sm text-gray-500">t.riddelsdell@gmail.com</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          admin
                        </Badge>
                        <Badge variant="default">Active</Badge>
                        <div className="text-right text-sm">
                          <div className="font-medium">12 logins</div>
                          <div className="text-gray-500">May 21, 2025</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">t.riddelsdell+awstest</div>
                          <div className="text-sm text-gray-500">t.riddelsdell+awstest@gmail.com</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          user
                        </Badge>
                        <Badge variant="default">Active</Badge>
                        <div className="text-right text-sm">
                          <div className="font-medium">0 logins</div>
                          <div className="text-gray-500">Never</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">t.riddelsdell+awstest2</div>
                          <div className="text-sm text-gray-500">t.riddelsdell+awstest2@gmail.com</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          user
                        </Badge>
                        <Badge variant="default">Active</Badge>
                        <div className="text-right text-sm">
                          <div className="font-medium">0 logins</div>
                          <div className="text-gray-500">Never</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">t.riddelsdell+cog</div>
                          <div className="text-sm text-gray-500">t.riddelsdell+cog@gmail.com</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          user
                        </Badge>
                        <Badge variant="default">Active</Badge>
                        <div className="text-right text-sm">
                          <div className="font-medium">0 logins</div>
                          <div className="text-gray-500">Never</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Panel: System Administration */}
        {(user?.role === 'admin' || user?.email === 't.riddelsdell@gmail.com') && (
          <>
            {/* User Management Table */}
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-2xl font-bold text-blue-600">4</div>
                          <div className="text-sm text-blue-600">Total Users</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold text-green-600">4</div>
                          <div className="text-sm text-green-600">Active Users</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        <div>
                          <div className="text-2xl font-bold text-red-600">1</div>
                          <div className="text-sm text-red-600">Admin Users</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Tom Riddelsdell</div>
                          <div className="text-sm text-gray-500">t.riddelsdell@gmail.com</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          admin
                        </Badge>
                        <Badge variant="default">Active</Badge>
                        <div className="text-right text-sm">
                          <div className="font-medium">12 logins</div>
                          <div className="text-gray-500">May 21, 2025</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">t.riddelsdell+awstest</div>
                          <div className="text-sm text-gray-500">t.riddelsdell+awstest@gmail.com</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          user
                        </Badge>
                        <Badge variant="default">Active</Badge>
                        <div className="text-right text-sm">
                          <div className="font-medium">0 logins</div>
                          <div className="text-gray-500">Never</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">t.riddelsdell+awstest2</div>
                          <div className="text-sm text-gray-500">t.riddelsdell+awstest2@gmail.com</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          user
                        </Badge>
                        <Badge variant="default">Active</Badge>
                        <div className="text-right text-sm">
                          <div className="font-medium">0 logins</div>
                          <div className="text-gray-500">Never</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">t.riddelsdell+cog</div>
                          <div className="text-sm text-gray-500">t.riddelsdell+cog@gmail.com</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          user
                        </Badge>
                        <Badge variant="default">Active</Badge>
                        <div className="text-right text-sm">
                          <div className="font-medium">0 logins</div>
                          <div className="text-gray-500">Never</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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