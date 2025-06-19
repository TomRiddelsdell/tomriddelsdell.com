import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { FolderOpenIcon, CalendarIcon, UsersIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon, Menu, Globe, ChevronDown, Bell, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import LanguageModal from "../components/LanguageModal";

export default function Projects() {
  const { user, signOut } = useAuth();
  const { currentLanguage, t, changeLanguage, availableLanguages } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleLanguageModal = () => {
    document.dispatchEvent(new CustomEvent('toggle-language-modal'));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const projects = [
    {
      id: 1,
      name: "Quantitative Trading Platform",
      status: "in-progress",
      progress: 75,
      deadline: "2025-07-15",
      description: "Building algorithmic trading system with real-time market data integration",
      team: ["Tom Riddelsdell", "Sarah Chen", "Mike Johnson"],
      priority: "high"
    },
    {
      id: 2,
      name: "Risk Management Dashboard",
      status: "completed",
      progress: 100,
      deadline: "2025-06-01",
      description: "Comprehensive risk analytics and monitoring system for portfolio management",
      team: ["Tom Riddelsdell", "David Kim"],
      priority: "high"
    },
    {
      id: 3,
      name: "Client Portal Enhancement",
      status: "planning",
      progress: 25,
      deadline: "2025-08-30",
      description: "Modernizing client interface with enhanced reporting and analytics",
      team: ["Tom Riddelsdell", "Lisa Wong", "Alex Rodriguez"],
      priority: "medium"
    },
    {
      id: 4,
      name: "Market Data Pipeline",
      status: "in-progress",
      progress: 60,
      deadline: "2025-07-01",
      description: "Real-time data processing system for multiple market feeds",
      team: ["Tom Riddelsdell", "James Park"],
      priority: "high"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <Link href="/">
                <span className="text-xl font-bold text-gray-900">Tom Riddelsdell</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/career" className="text-gray-700 hover:text-blue-600 transition-colors">
                Career
              </Link>
              <Link href="/projects" className="text-blue-600 font-medium">
                Projects
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/workflows" className="text-gray-700 hover:text-blue-600 transition-colors">
                Workflows
              </Link>
              <Link href="/tasks" className="text-gray-700 hover:text-blue-600 transition-colors">
                Tasks
              </Link>
            </nav>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              {/* Language Dropdown */}
              <DropdownMenu open={langDropdownOpen} onOpenChange={setLangDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center text-sm text-gray-700 hover:text-gray-900"
                  >
                    <Globe className="mr-1" size={16} />
                    <span>{currentLanguage}</span>
                    <ChevronDown className="ml-1" size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {availableLanguages.map((lang) => (
                    <DropdownMenuItem 
                      key={lang.code} 
                      onClick={() => {
                        changeLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                    >
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={toggleLanguageModal}>
                    {t("moreLanguages")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <Bell size={20} />
              </Button>
              
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <HelpCircle size={20} />
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                        <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth/login">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}

              {/* Mobile menu button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-gray-500 hover:text-gray-700"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu size={20} />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
                <Link href="/career" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                  Career
                </Link>
                <Link href="/projects" className="block px-3 py-2 text-blue-600 font-medium">
                  Projects
                </Link>
                <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                <Link href="/workflows" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                  Workflows
                </Link>
                <Link href="/tasks" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                  Tasks
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-grow">
        
        <div className="min-h-screen flex flex-col">

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center text-gray-900">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Project Portfolio
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Comprehensive overview of ongoing and completed projects in financial technology and quantitative analysis.
          </p>
        </div>
      </section>

      {/* Project Stats */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpenIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{projects.length}</h3>
              <p className="text-gray-600">Active Projects</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{projects.filter(p => p.status === 'completed').length}</h3>
              <p className="text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{projects.filter(p => p.status === 'in-progress').length}</h3>
              <p className="text-gray-600">In Progress</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">12</h3>
              <p className="text-gray-600">Team Members</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl font-bold text-center mb-12">Current Projects</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {projects.map((project) => (
              <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge 
                        variant="outline"
                        className={`${
                          project.status === "completed"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : project.status === "in-progress"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-yellow-100 text-yellow-800 border-yellow-300"
                        }`}
                      >
                        {project.status.replace("-", " ")}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={`${
                          project.priority === "high"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                        }`}
                      >
                        {project.priority} priority
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{project.progress}%</div>
                    <div className="text-sm text-gray-500">complete</div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{project.description}</p>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Progress</span>
                    <span className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Due: {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        project.progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{project.team.length} team members</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button size="sm">
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl font-bold text-center mb-12">Project Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpenIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Trading Systems</h3>
              <p className="text-gray-600 mb-4">Algorithmic trading platforms and quantitative analysis tools</p>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">2 Active Projects</Badge>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Risk Management</h3>
              <p className="text-gray-600 mb-4">Portfolio risk analysis and monitoring systems</p>
              <Badge variant="outline" className="bg-green-50 text-green-700">1 Completed</Badge>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Client Solutions</h3>
              <p className="text-gray-600 mb-4">Customer-facing platforms and reporting tools</p>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">1 In Planning</Badge>
            </div>
          </div>
        </div>
      </section>
        </div>
      </main>
    </div>
  );
}