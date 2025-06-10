import * as React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "wouter";
import backgroundImage from "../assets/background.jpg";

export default function Projects() {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  // If not authenticated, redirect to home
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="py-4 px-6 md:px-12 flex justify-between items-center border-b">
        <Link href="/">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text cursor-pointer">
            Tom Riddelsdell
          </div>
        </Link>
        <nav className="hidden md:flex space-x-8 items-center">
          <Link href="/" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Home
          </Link>
          <Link href="/career" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Career
          </Link>
          <Link href="/projects" className="text-blue-600 dark:text-blue-400 font-medium">
            Projects
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
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

      <main className="flex-1">
        {/* Projects Header */}
        <section 
          className="py-16 md:py-24 px-6 md:px-12 flex flex-col items-center justify-center text-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.85)), url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">My Projects</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              A collection of quantitative finance and software engineering projects I've been working on.
              This page is only visible to authenticated users.
            </p>
          </div>
        </section>

        {/* Projects Grid */}
        <section className="py-16 md:py-20 px-6 md:px-12">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Project 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center">
                <svg className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Quantum Portfolio Optimizer</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  An advanced portfolio optimization system using quantum computing algorithms to find optimal asset allocations under complex constraints.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">Python</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">Qiskit</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">AWS Braket</span>
                </div>
                <div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
            </div>
            
            {/* Project 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-400 flex items-center justify-center">
                <svg className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">NLP Market Sentiment Analyzer</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  A machine learning system that analyzes financial news, social media, and earnings calls to predict market sentiment for various assets.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm">Python</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm">TensorFlow</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm">GCP</span>
                </div>
                <div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
            </div>
            
            {/* Project 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-green-500 to-teal-400 flex items-center justify-center">
                <svg className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">High-Frequency Trading Simulator</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  A simulation environment for testing high-frequency trading strategies with nanosecond precision and realistic market microstructure.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm">C++</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm">CUDA</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm">AWS</span>
                </div>
                <div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
            </div>
            
            {/* Project 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-red-500 to-orange-400 flex items-center justify-center">
                <svg className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">ESG Investment Analytics Platform</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  A comprehensive platform for analyzing environmental, social, and governance factors in investment decisions.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-sm">TypeScript</span>
                  <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-sm">React</span>
                  <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-sm">Node.js</span>
                </div>
                <div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

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