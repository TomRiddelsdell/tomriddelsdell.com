import * as React from "react";
import { Button } from "./ui/button";
import { redirectToCognito } from "../lib/simple-auth";
import { useAuth } from "../context/AuthContext";
import { Link } from "wouter";

interface MainNavigationProps {
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
  onContactClick?: () => void;
}

export default function MainNavigation({ 
  onMobileMenuToggle, 
  showMobileMenu = false,
  onContactClick 
}: MainNavigationProps) {
  const { user: authUser, signOut } = useAuth();
  const isAuthenticated = !!authUser;

  // Handle user sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      // Default behavior - scroll to contact section
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* Main Navigation Header */}
      <header className="py-4 border-b bg-white dark:bg-gray-900 full-width-section">
        <div className="content-width flex justify-between items-center">
          <div className="text-2xl font-bold gradient-text">
            Tom Riddelsdell
          </div>
          <nav className="hidden md:flex space-x-8 items-center">
            <Link href="/career">
              <span className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 nav-link cursor-pointer">
                Career
              </span>
            </Link>
            <Link href="/projects">
              <span className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 nav-link cursor-pointer">
                Projects
              </span>
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard">
                <span className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 nav-link cursor-pointer">
                  Dashboard
                </span>
              </Link>
            )}
            <button
              onClick={handleContactClick}
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 nav-link"
            >
              Contact
            </button>
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div
                  className="flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                  onClick={() => {
                    handleSignOut();
                  }}
                  title="Click to sign out"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span>Logged In</span>
                </div>
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
              </div>
            ) : (
              <Button onClick={redirectToCognito}>Sign In</Button>
            )}
          </nav>
          {/* Mobile nav toggle */}
          <Button
            variant="ghost"
            className="md:hidden"
            size="icon"
            onClick={onMobileMenuToggle}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-40 bg-white dark:bg-gray-900 flex flex-col overflow-y-auto mobile-menu">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="text-xl font-bold gradient-text">
              Tom Riddelsdell
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileMenuToggle}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          </div>
          <nav className="flex flex-col p-4 space-y-4">
            <NavigationLinks
              isAuthenticated={isAuthenticated}
              className="text-lg py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onMobileMenuToggle}
            />
            <button
              onClick={() => {
                handleContactClick();
                if (onMobileMenuToggle) onMobileMenuToggle();
              }}
              className="text-lg py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
            >
              Contact
            </button>
            {isAuthenticated ? (
              <>
                <div className="flex items-center py-2 px-4">
                  <div className="flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm mr-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span>Logged In</span>
                  </div>
                </div>
                <Link href="/dashboard">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={onMobileMenuToggle}
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => {
                    handleSignOut();
                    if (onMobileMenuToggle) onMobileMenuToggle();
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => {
                  redirectToCognito();
                  if (onMobileMenuToggle) onMobileMenuToggle();
                }}
                className="w-full"
              >
                Sign In
              </Button>
            )}
          </nav>
        </div>
      )}
    </>
  );
}