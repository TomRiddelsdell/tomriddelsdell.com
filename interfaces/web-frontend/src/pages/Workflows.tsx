import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { PlayIcon, PauseIcon, SettingsIcon, Menu, Globe, ChevronDown, Bell, HelpCircle } from "lucide-react";
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

export default function Workflows() {
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

  const workflows = [
    {
      id: 1,
      name: "Data Processing Pipeline",
      status: "running",
      lastRun: "2 minutes ago",
      description: "Automated data validation and transformation"
    },
    {
      id: 2,
      name: "Email Marketing Campaign",
      status: "paused",
      lastRun: "1 hour ago",
      description: "Scheduled email sequences for customer engagement"
    },
    {
      id: 3,
      name: "Inventory Management",
      status: "running",
      lastRun: "15 minutes ago",
      description: "Stock level monitoring and reorder automation"
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
              <Link href="/projects" className="text-gray-700 hover:text-blue-600 transition-colors">
                Projects
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/workflows" className="text-blue-600 font-medium">
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
                <Link href="/projects" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                  Projects
                </Link>
                <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                <Link href="/workflows" className="block px-3 py-2 text-blue-600 font-medium">
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
        
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
                <p className="text-gray-600 mt-2">Manage your automated processes</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Create New Workflow
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-semibold text-gray-900">{workflow.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.status === "running"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {workflow.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">{workflow.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Last run: {workflow.lastRun}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                    Edit
                  </button>
                  <button
                    className={`px-3 py-1 rounded transition-colors ${
                      workflow.status === "running"
                        ? "text-red-600 hover:bg-red-50"
                        : "text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {workflow.status === "running" ? "Pause" : "Start"}
                  </button>
                </div>
              </div>
            </div>
          ))}
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Workflow Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <div className="text-blue-600 font-semibold">Data Integration</div>
                  <div className="text-sm text-gray-600 mt-1">Connect and sync data sources</div>
                </div>
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <div className="text-blue-600 font-semibold">Notification System</div>
                  <div className="text-sm text-gray-600 mt-1">Automated alerts and messages</div>
                </div>
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <div className="text-blue-600 font-semibold">Report Generation</div>
                  <div className="text-sm text-gray-600 mt-1">Scheduled data reports</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}