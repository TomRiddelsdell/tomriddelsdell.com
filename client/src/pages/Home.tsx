import * as React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { Link } from "wouter";
import { GithubIcon, LinkedinIcon, MailIcon } from "lucide-react";
import profilePic from "../assets/profile.jpg";
import backgroundImage from "../assets/background.jpg";
import familyImage from "../assets/family.jpg";
import ImpliedVolDisplay from "@/components/ImpliedVolDisplay";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Navigation */}
      <header className="py-4 px-6 md:px-12 flex justify-between items-center border-b bg-white dark:bg-gray-900">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text">
          Tom Riddelsdell
        </div>
        <nav className="hidden md:flex space-x-8 items-center">
          <Link href="/career" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Career
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/projects" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Projects
              </Link>
              <Link href="/tasks" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Tasks
              </Link>
            </>
          )}
          <a href="#contact" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Contact
          </a>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          ) : (
            <Button 
              onClick={() => {
                setAuthMode('signin');
                setShowAuthModal(true);
              }}
            >
              Sign In
            </Button>
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

      <main className="flex-1">
        {/* Hero Section */}
        <section 
          className="relative py-16 md:py-24 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between bg-white dark:bg-gray-900"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.35)), url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="md:w-1/2 mb-10 md:mb-0 flex flex-col items-center justify-center">
            {/* Implied Volatility Visualization */}
            <div className="bg-transparent dark:bg-transparent p-4 md:p-5 rounded-2xl shadow-lg mb-8 h-[360px] w-full md:w-[90%] backdrop-blur-sm overflow-hidden border border-white/10 dark:border-white/5">
              <ImpliedVolDisplay />
            </div>
            <div className="flex space-x-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600"
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
              >
                Join My Network
              </Button>
              <Link href="/career">
                <Button size="lg" variant="outline">
                  View Career
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center items-center">
            <div className="w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-white/30 dark:border-gray-700/30 shadow-xl">
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>





        {/* Contact Section */}
        <section 
          id="contact" 
          className="pt-20 md:pt-28 pb-16 md:pb-24 px-6 md:px-12 bg-cover bg-center bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-8"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.35)), url(${familyImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white drop-shadow-sm">Get In Touch</h2>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-white/40 dark:bg-gray-800/40 p-6 rounded-lg shadow-md backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white drop-shadow-sm">Contact Information</h3>
                <p className="text-gray-800 dark:text-gray-200 mb-6 font-medium">
                  I'm always open to discussing new projects, opportunities, or partnerships. 
                  Feel free to reach out through any of the following channels:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MailIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-4" />
                    <span className="text-gray-600 dark:text-gray-300">tom.riddelsdell@example.com</span>
                  </div>
                  <div className="flex items-center">
                    <LinkedinIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-4" />
                    <a href="https://linkedin.com" className="text-blue-600 dark:text-blue-400 hover:underline">linkedin.com/in/tomriddelsdell</a>
                  </div>
                  <div className="flex items-center">
                    <GithubIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-4" />
                    <a href="https://github.com" className="text-blue-600 dark:text-blue-400 hover:underline">github.com/tomriddelsdell</a>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/40 dark:bg-gray-800/40 p-6 rounded-lg shadow-md backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white drop-shadow-sm">Send a Message</h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                      <input
                        type="text"
                        id="name"
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                      placeholder="Subject"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                      placeholder="Your message..."
                    ></textarea>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600"
                  >
                    Send Message
                  </Button>
                </form>
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

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{authMode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <AuthModal />
            
            <div className="mt-4 text-center">
              {authMode === 'signin' ? (
                <p className="text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('signin')}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}