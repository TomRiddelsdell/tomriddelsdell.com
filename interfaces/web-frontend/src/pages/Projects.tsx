import React from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Link } from "wouter";
import { 
  LayoutDashboard, 
  FolderOpen,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar
} from "lucide-react";

export default function Projects() {
  const projects = [
    {
      id: 1,
      title: "Trading Algorithm Optimization",
      description: "Enhanced systematic trading strategies for equity derivatives with improved risk metrics",
      status: "active",
      progress: 85,
      tags: ["Slang", "Risk Management", "Derivatives"],
      lastUpdated: "2 hours ago"
    },
    {
      id: 2,
      title: "Portfolio Risk Analytics",
      description: "Real-time portfolio risk monitoring and stress testing framework",
      status: "completed",
      progress: 100,
      tags: ["Python", "Analytics", "Risk"],
      lastUpdated: "1 day ago"
    },
    {
      id: 3,
      title: "Market Data Pipeline",
      description: "High-frequency market data ingestion and processing system",
      status: "in-progress",
      progress: 60,
      tags: ["C++", "Infrastructure", "Data"],
      lastUpdated: "5 hours ago"
    },
    {
      id: 4,
      title: "Regulatory Reporting Automation",
      description: "Automated regulatory reporting for CCAR and stress testing",
      status: "planning",
      progress: 15,
      tags: ["Compliance", "Automation", "Reporting"],
      lastUpdated: "3 days ago"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "planning":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "planning":
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FolderOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Projects</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/career">
                <Button variant="ghost">Career</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Professional Projects</h1>
              <p className="mt-2 text-gray-600">
                Manage and track professional projects and initiatives across trading systems, risk management, and regulatory compliance
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {project.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(project.status)}
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm line-clamp-3">
                  {project.description}
                </p>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {project.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Updated {project.lastUpdated}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project Statistics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-green-600 mb-2">Active</h3>
                <p className="text-2xl font-bold text-gray-700">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Completed</h3>
                <p className="text-2xl font-bold text-gray-700">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-600 mb-2">In Progress</h3>
                <p className="text-2xl font-bold text-gray-700">
                  {projects.filter(p => p.status === 'in-progress').length}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Planning</h3>
                <p className="text-2xl font-bold text-gray-700">
                  {projects.filter(p => p.status === 'planning').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}