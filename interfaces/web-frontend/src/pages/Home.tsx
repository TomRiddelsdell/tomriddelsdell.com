import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useState } from "react";
import meImagePath from "@assets/me.jpg";
import backgroundImagePath from "@assets/background.jpg";

export default function Home() {
  const [isAuthenticated] = useState(false); // Replace with actual auth state

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="py-4 px-6 md:px-12 flex justify-between items-center border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text cursor-pointer">
            Tom Riddelsdell
          </div>
        </Link>
        <nav className="hidden md:flex space-x-8 items-center">
          <Link href="/" className="text-blue-600 dark:text-blue-400 font-medium">
            Home
          </Link>
          <Link href="/career" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Career
          </Link>
          <Link href="/projects" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Projects
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          ) : (
            <Button>Contact</Button>
          )}
        </nav>
        {/* Mobile nav toggle */}
        <Button 
          variant="ghost" 
          className="md:hidden" 
          size="icon"
          onClick={() => {}}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section 
          className="relative py-20 px-6 md:px-12 text-center bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${backgroundImagePath})` }}
        >
          <div className="max-w-4xl mx-auto text-white">
            <div className="mb-8">
              <img 
                src={meImagePath} 
                alt="Tom Riddelsdell" 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto mb-6 border-4 border-white shadow-xl object-cover"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Tom Riddelsdell
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Software Engineer & Technology Leader
            </p>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-gray-300">
              Passionate about building innovative solutions that make a difference. 
              Experienced in full-stack development, system architecture, and team leadership.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/career">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  View My Career
                </Button>
              </Link>
              <Link href="/projects">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                  See Projects
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 px-6 md:px-12 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">About Me</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                I'm a software engineer with a passion for creating elegant solutions to complex problems.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-blue-600">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Development</h3>
                  <p className="text-gray-600">
                    Full-stack development with modern technologies and best practices.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-teal-600">
                      <path d="M12 3a6.364 6.364 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Architecture</h3>
                  <p className="text-gray-600">
                    Designing scalable systems and technical solutions for complex challenges.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-purple-600">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="m22 21-3-3m0 0a5.5 5.5 0 1 1-7.8 0L15 18Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Leadership</h3>
                  <p className="text-gray-600">
                    Leading teams and mentoring developers to achieve exceptional results.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-12 border-t bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text mb-4 md:mb-0">
            Tom Riddelsdell
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Tom Riddelsdell. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}