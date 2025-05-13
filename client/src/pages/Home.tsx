import * as React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { Link } from "wouter";
import { GithubIcon, LinkedinIcon, MailIcon } from "lucide-react";
import profilePic from "../assets/profile.jpg";
import backgroundImage from "../assets/background.jpg";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="py-4 px-6 md:px-12 flex justify-between items-center border-b">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text">
          Tom Riddelsdell
        </div>
        <nav className="hidden md:flex space-x-8 items-center">
          <a href="#about" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            About
          </a>
          <a href="#skills" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Skills
          </a>
          <a href="#experience" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Experience
          </a>
          <a href="#projects" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Projects
          </a>
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
          className="relative py-16 md:py-24 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7)), url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="block">Hi, I'm Tom Riddelsdell</span>
            </h1>
            
            {/* Skills Bubbles Visualization */}
            <div className="flex flex-wrap gap-2 mb-8">
              <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium animate-float-slow">
                Data Science
              </div>
              <div className="px-3 py-2 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded-full font-medium animate-float-medium">
                Quantitative Analysis
              </div>
              <div className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full font-medium animate-float-fast">
                Machine Learning
              </div>
              <div className="px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full font-medium animate-float-medium">
                Software Engineering
              </div>
              <div className="px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full font-medium animate-float-slow">
                Cloud Architecture
              </div>
              <div className="px-3 py-2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full font-medium animate-float-fast">
                Financial Modeling
              </div>
            </div>
            <div className="flex space-x-4">
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
              <a href="#projects">
                <Button size="lg" variant="outline">
                  View Projects
                </Button>
              </a>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-gradient-to-r from-blue-600 to-teal-500">
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 md:py-24 px-6 md:px-12 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">About Me</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">My Background</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  With over 10 years of experience at the intersection of finance and technology, 
                  I specialize in developing quantitative models and algorithms for financial markets,
                  risk assessment, and portfolio optimization.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  I've worked with leading investment firms and tech companies including Google and AWS,
                  where I've developed scalable solutions for processing and analyzing large financial datasets.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">My Approach</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  I believe in leveraging cutting-edge technology to solve complex financial problems.
                  My approach combines rigorous mathematical modeling with practical software engineering
                  to deliver solutions that are both theoretically sound and practically implementable.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  I'm passionate about continuously learning and adapting to new technologies and methodologies
                  in the rapidly evolving fields of quantitative finance and software engineering.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="py-16 md:py-24 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Skills & Expertise</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Technical Skills */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Technical Skills</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Python (NumPy, Pandas, Scikit-learn)
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    TypeScript/JavaScript (React, Node.js)
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    R for Statistical Analysis
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    SQL & NoSQL Databases
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cloud Platforms (AWS, GCP)
                  </li>
                </ul>
              </div>
              
              {/* Quantitative Skills */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-teal-600 dark:text-teal-400">Quantitative Skills</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-teal-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Time Series Analysis
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-teal-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Statistical Modeling
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-teal-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Machine Learning Algorithms
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-teal-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Risk Management Models
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-teal-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Portfolio Optimization
                  </li>
                </ul>
              </div>
              
              {/* Finance Knowledge */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">Finance Knowledge</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Derivatives Pricing
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Algorithmic Trading
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Market Microstructure
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Fixed Income Securities
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ESG Investment Analysis
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section id="experience" className="py-16 md:py-24 px-6 md:px-12 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Professional Experience</h2>
            
            <div className="space-y-12">
              {/* Google Experience */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">Google</h3>
                  <p className="text-gray-500 dark:text-gray-400">Senior Quantitative Engineer</p>
                  <p className="text-gray-500 dark:text-gray-400">2019 - Present</p>
                </div>
                <div className="md:w-2/3">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Leading a team of engineers developing advanced pricing models for Google Cloud Financial Services solutions.
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                    <li>Designed and implemented a real-time risk assessment system for cloud-based financial applications</li>
                    <li>Developed ML algorithms to optimize cloud resource allocation for high-frequency trading systems</li>
                    <li>Created a distributed data processing pipeline for financial time-series analysis</li>
                    <li>Collaborated with product teams to integrate quantitative features into Google Cloud's financial offerings</li>
                  </ul>
                </div>
              </div>
              
              {/* AWS Experience */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400">Amazon Web Services</h3>
                  <p className="text-gray-500 dark:text-gray-400">Quantitative Developer</p>
                  <p className="text-gray-500 dark:text-gray-400">2015 - 2019</p>
                </div>
                <div className="md:w-2/3">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Worked on AWS FinTech solutions team developing cloud-based financial modeling systems.
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                    <li>Built serverless architectures for financial analytics processing using AWS Lambda and Step Functions</li>
                    <li>Implemented Monte Carlo simulation frameworks for risk analysis on distributed systems</li>
                    <li>Developed APIs for connecting financial data providers with AWS-based analytics systems</li>
                    <li>Optimized performance of large-scale financial calculations using AWS Batch and EC2</li>
                  </ul>
                </div>
              </div>
              
              {/* JPMorgan Experience */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400">JPMorgan Chase</h3>
                  <p className="text-gray-500 dark:text-gray-400">Quantitative Analyst</p>
                  <p className="text-gray-500 dark:text-gray-400">2012 - 2015</p>
                </div>
                <div className="md:w-2/3">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Worked in the Quantitative Research division developing models for derivatives pricing and risk management.
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                    <li>Developed and validated pricing models for exotic derivatives products</li>
                    <li>Created VaR models for market risk assessment across multiple asset classes</li>
                    <li>Built automated reporting systems for regulatory compliance</li>
                    <li>Collaborated with trading desks to implement real-time pricing tools</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-16 md:py-24 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Featured Projects</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Project 1 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
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
                    <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">View Project →</a>
                  </div>
                </div>
              </div>
              
              {/* Project 2 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
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
                    <a href="#" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium">View Project →</a>
                  </div>
                </div>
              </div>
              
              {/* Project 3 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
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
                    <a href="#" className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium">View Project →</a>
                  </div>
                </div>
              </div>
              
              {/* Project 4 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
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
                    <a href="#" className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium">View Project →</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 md:py-24 px-6 md:px-12 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Get In Touch</h2>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-bold mb-4">Contact Information</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
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
              
              <div>
                <h3 className="text-xl font-bold mb-4">Send a Message</h3>
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