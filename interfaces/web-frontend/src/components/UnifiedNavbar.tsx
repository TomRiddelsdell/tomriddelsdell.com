import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Bell, HelpCircle, Globe, ChevronDown, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { redirectToCognito } from "../lib/simple-auth";
import NavigationLinks from "./NavigationLinks";

interface UnifiedNavbarProps {
  title?: string;
  showMobileMenuToggle?: boolean;
  onMobileMenuToggle?: () => void;
}

export default function UnifiedNavbar({ 
  title = "Tom Riddelsdell", 
  showMobileMenuToggle = false,
  onMobileMenuToggle 
}: UnifiedNavbarProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const { currentLanguage, t, changeLanguage, availableLanguages } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isAuthenticated = !!user;

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

  const toggleMobileMenu = () => {
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    } else {
      setShowMobileMenu(!showMobileMenu);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {showMobileMenuToggle && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-4 text-gray-500 hover:text-gray-700 md:hidden"
                  onClick={toggleMobileMenu}
                >
                  <Menu className="text-2xl" />
                </Button>
              )}
              <Link href="/">
                <div className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
                  {title}
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
              <NavigationLinks isAuthenticated={isAuthenticated} />
              <a
                href="#contact"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Contact
              </a>
              
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

              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div
                    className="flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm cursor-pointer hover:bg-green-200 transition-colors"
                    onClick={handleSignOut}
                    title="Click to sign out"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span>Logged In</span>
                  </div>
                  <Link href="/dashboard">
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                  {user && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                      <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ) : (
                <Button onClick={redirectToCognito}>Sign In</Button>
              )}
            </nav>

            {/* Mobile Menu Toggle */}
            {!showMobileMenuToggle && (
              <Button
                variant="ghost"
                className="md:hidden"
                size="icon"
                onClick={toggleMobileMenu}
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && !showMobileMenuToggle && (
        <div className="md:hidden fixed inset-0 z-40 bg-white flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="text-xl font-bold text-gray-900">
              {title}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileMenu(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex flex-col p-4 space-y-4">
            <NavigationLinks
              isAuthenticated={isAuthenticated}
              className="flex flex-col space-y-4"
              onClick={() => setShowMobileMenu(false)}
            />
            <a
              href="#contact"
              className="text-gray-700 hover:text-blue-600 transition-colors py-2"
              onClick={() => setShowMobileMenu(false)}
            >
              Contact
            </a>
            {isAuthenticated ? (
              <div className="flex flex-col space-y-4 pt-4 border-t">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full" onClick={() => setShowMobileMenu(false)}>
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    handleSignOut();
                    setShowMobileMenu(false);
                  }}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full mt-4"
                onClick={() => {
                  redirectToCognito();
                  setShowMobileMenu(false);
                }}
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