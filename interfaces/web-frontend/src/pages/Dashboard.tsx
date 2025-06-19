import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { Link } from "wouter";
import { SystemHealthCard } from "../components/monitoring/SystemHealthCard";
import { PerformanceMetricsCard } from "../components/monitoring/PerformanceMetricsCard";
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

  const stats = [
    {
      title: "Active Projects",
      value: "3",
      icon: <ChartGantt className="h-6 w-6" />,
      change: "+2 this month",
      trend: "up"
    },
    {
      title: "Completed Tasks",
      value: "24",
      icon: <Activity className="h-6 w-6" />,
      change: "+12 this week",
      trend: "up"
    },
    {
      title: "Time Saved",
      value: "15h",
      icon: <Clock className="h-6 w-6" />,
      change: "+5h this week",
      trend: "up"
    },
    {
      title: "Connected Apps",
      value: "8",
      icon: <AppWindow className="h-6 w-6" />,
      change: "+1 this month",
      trend: "up"
    }
  ];

  const recentActivity = [
    {
      title: "Portfolio Website Updated",
      type: "Project",
      time: "2 hours ago",
      status: "completed"
    },
    {
      title: "Client Meeting Scheduled",
      type: "Event",
      time: "4 hours ago",
      status: "upcoming"
    },
    {
      title: "Code Review Completed",
      type: "Development",
      time: "6 hours ago",
      status: "completed"
    }
  ];

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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {stat.change}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Activity</span>
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {activity.type}
                      </Badge>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={activity.status === 'completed' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/projects">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Project
                </Button>
              </Link>
              <Link href="/career">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  View Career Timeline
                </Button>
              </Link>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Phase 1: Enhanced Monitoring Dashboard */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health Monitoring */}
          <SystemHealthCard />
          
          {/* Performance Metrics */}
          <PerformanceMetricsCard />
        </div>

        {/* Configuration & Security Status */}
        {user?.role === 'admin' && (
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
        )}

        {/* Professional Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Professional Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Current Role</h3>
                <p className="text-gray-700">Executive Director at Goldman Sachs</p>
                <p className="text-sm text-gray-500 mt-1">Systematic Trading Strategies</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-green-600 mb-2">Experience</h3>
                <p className="text-gray-700">10+ Years</p>
                <p className="text-sm text-gray-500 mt-1">Financial Technology & Quantitative Finance</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-600 mb-2">Expertise</h3>
                <p className="text-gray-700">Risk Management & Trading Systems</p>
                <p className="text-sm text-gray-500 mt-1">Python, Slang, C++, Financial Modeling</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;