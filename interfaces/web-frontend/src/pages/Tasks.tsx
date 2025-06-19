import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { CheckCircleIcon, ClockIcon, AlertTriangleIcon, PlusIcon, CalendarIcon, Menu, Globe, ChevronDown, Bell, HelpCircle } from "lucide-react";
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

export default function Tasks() {
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

  const tasks = [
    {
      id: 1,
      title: "Review data migration workflow",
      priority: "high",
      status: "pending",
      dueDate: "2025-06-14",
      assignee: "Tom Riddelsdell"
    },
    {
      id: 2,
      title: "Configure API rate limiting",
      priority: "medium",
      status: "in-progress",
      dueDate: "2025-06-16",
      assignee: "Tom Riddelsdell"
    },
    {
      id: 3,
      title: "Update integration documentation",
      priority: "low",
      status: "completed",
      dueDate: "2025-06-12",
      assignee: "Tom Riddelsdell"
    },
    {
      id: 4,
      title: "Test new authentication flow",
      priority: "high",
      status: "pending",
      dueDate: "2025-06-15",
      assignee: "Tom Riddelsdell"
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
              <Link href="/workflows" className="text-gray-700 hover:text-blue-600 transition-colors">
                Workflows
              </Link>
              <Link href="/tasks" className="text-blue-600 font-medium">
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
                <Link href="/workflows" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                  Workflows
                </Link>
                <Link href="/tasks" className="block px-3 py-2 text-blue-600 font-medium">
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
                <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
                <p className="text-gray-600 mt-2">Manage your workflow tasks and assignments</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Add Task
              </button>
            </div>

        <div className="mb-6 flex space-x-4">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            All Tasks
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Pending
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            In Progress
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Completed
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Task List</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        readOnly
                      />
                      <h3 className={`text-lg font-medium ${
                        task.status === "completed" ? "line-through text-gray-500" : "text-gray-900"
                      }`}>
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {task.status.replace("-", " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      <span>Assigned to: {task.assignee}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      Edit
                    </button>
                    <button className="px-3 py-1 text-gray-600 hover:bg-gray-50 rounded transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Tasks</h3>
            <div className="text-3xl font-bold text-red-600">
              {tasks.filter(t => t.status === "pending").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">In Progress</h3>
            <div className="text-3xl font-bold text-blue-600">
              {tasks.filter(t => t.status === "in-progress").length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
            <div className="text-3xl font-bold text-green-600">
              {tasks.filter(t => t.status === "completed").length}
            </div>
          </div>
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}