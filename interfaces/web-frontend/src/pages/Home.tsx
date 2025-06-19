import * as React from "react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Link } from "wouter";
import { GithubIcon, LinkedinIcon, MailIcon, Menu, Globe, ChevronDown, Bell, HelpCircle } from "lucide-react";
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

export default function Home() {
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

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
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
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Tom Riddelsdell
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                Executive Director at Goldman Sachs • Systematic Trading Strategies
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/career">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    View Career
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Available for strategic consulting and quantitative finance projects.
            </p>
            <div className="flex justify-center space-x-6">
              <a href="mailto:t.riddelsdell@gmail.com" className="text-blue-600 hover:text-blue-700">
                <MailIcon className="h-8 w-8" />
              </a>
              <a href="https://www.linkedin.com/in/thomas-riddelsdell-1140bb16/" className="text-blue-600 hover:text-blue-700">
                <LinkedinIcon className="h-8 w-8" />
              </a>
              <a href="https://github.com/tomriddelsdell" className="text-blue-600 hover:text-blue-700">
                <GithubIcon className="h-8 w-8" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <LanguageModal />
    </div>
  );
}