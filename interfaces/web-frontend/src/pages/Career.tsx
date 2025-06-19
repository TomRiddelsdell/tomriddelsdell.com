import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { MailIcon, LinkedinIcon, GithubIcon, ExternalLinkIcon, Menu, Globe, ChevronDown, Bell, HelpCircle } from "lucide-react";
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

export default function Career() {
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
    <div className="min-h-screen bg-white">
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
              <Link href="/career" className="text-blue-600 font-medium">
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
                <Link href="/career" className="block px-3 py-2 text-blue-600 font-medium">
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
      
      <main className="bg-white min-h-screen">
          {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Professional Journey
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Executive Director at Goldman Sachs with expertise in systematic trading strategies, 
                quantitative finance, and full-stack financial technology development.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <MailIcon className="w-4 h-4 mr-2" />
                  Get In Touch
                </Button>
                <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                  <LinkedinIcon className="w-4 h-4 mr-2" />
                  Connect on LinkedIn
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Experience Timeline */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Professional Experience</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                A journey through strategic leadership, software engineering, and quantitative finance
              </p>
            </div>

            <div className="space-y-12">
              {/* Goldman Sachs */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl">Executive Director</CardTitle>
                      <CardDescription className="text-blue-600 font-medium">Goldman Sachs</CardDescription>
                    </div>
                    <Badge variant="secondary" className="mt-2 md:mt-0">2015 - Present</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-lg mb-3">Equity Strategist • Systematic Trading Strategies</h4>
                  <p className="text-gray-600 mb-4">
                    Technical Lead for the Client Analytics Team within the STS revenue-generating Quant division, 
                    designing innovative trading strategies to systematically harvest risk premia and developing 
                    sophisticated portfolio construction techniques for institutional clients.
                  </p>
                  <ul className="text-gray-600 mb-4 space-y-2">
                    <li>• Leading development of the Managed Portfolio Platform enabling clients to execute proprietary strategies</li>
                    <li>• Automating strategy execution using Slang with real-time risk management and hedging capabilities</li>
                    <li>• Building automated compliance controls and independent volatility surfaces for strategy repricing</li>
                    <li>• Providing analytics and insights that drive multi-million dollar client trading decisions</li>
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Slang</Badge>
                    <Badge variant="outline">Python</Badge>
                    <Badge variant="outline">Quantitative Finance</Badge>
                    <Badge variant="outline">Risk Management</Badge>
                    <Badge variant="outline">Portfolio Analytics</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Barclays Capital */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl">Associate Vice President</CardTitle>
                      <CardDescription className="text-green-600 font-medium">Barclays Capital</CardDescription>
                    </div>
                    <Badge variant="secondary" className="mt-2 md:mt-0">2012 - 2015</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-lg mb-3">Full-Stack Developer • QASys Risk and Analytics</h4>
                  <p className="text-gray-600 mb-4">
                    Led development of the critical interface layer between Core Risk Engine and Quant Pricing Library 
                    for exotic interest rate derivatives, managing model lifecycle, configuration, and market data systems.
                  </p>
                  <ul className="text-gray-600 mb-4 space-y-2">
                    <li>• Architected and maintained multi-technology stack spanning rates and credit derivatives</li>
                    <li>• Managed team of 2 junior developers while delivering enterprise-scale risk systems</li>
                    <li>• Implemented model diagnosis and market data management for complex derivative products</li>
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">C++</Badge>
                    <Badge variant="outline">C#</Badge>
                    <Badge variant="outline">Python</Badge>
                    <Badge variant="outline">VBA</Badge>
                    <Badge variant="outline">Derivatives Pricing</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Sophis/Misys */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl">Senior Consultant</CardTitle>
                      <CardDescription className="text-purple-600 font-medium">Sophis / Misys</CardDescription>
                    </div>
                    <Badge variant="secondary" className="mt-2 md:mt-0">2009 - 2012</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-lg mb-3">Financial Engineering • Toolkit Development</h4>
                  <p className="text-gray-600 mb-4">
                    Specialized in extending cross-asset trading platforms with bespoke features for premier 
                    buy-side and sell-side institutions, delivering tailored solutions and comprehensive training programs.
                  </p>
                  <ul className="text-gray-600 mb-4 space-y-2">
                    <li>• Designed equity exotics pricing models for key institutional clients</li>
                    <li>• Delivered technical specifications and solutions for banks and hedge funds</li>
                    <li>• Conducted client training on pricing models, analytics, and platform architecture</li>
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Financial Engineering</Badge>
                    <Badge variant="outline">Equity Exotics</Badge>
                    <Badge variant="outline">SOA Architecture</Badge>
                    <Badge variant="outline">Portfolio Analytics</Badge>
                    <Badge variant="outline">Client Training</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Symbian/Nokia - Early Career */}
              <Card className="border-l-4 border-l-gray-500">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl">Software Engineering Intern</CardTitle>
                      <CardDescription className="text-gray-600 font-medium">Symbian / Nokia</CardDescription>
                    </div>
                    <Badge variant="secondary" className="mt-2 md:mt-0">2008</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-lg mb-3">Research Department • Mobile Development</h4>
                  <p className="text-gray-600 mb-4">
                    Three-month research internship developing innovative mobile technologies and contributing 
                    to enterprise software development methodologies.
                  </p>
                  <ul className="text-gray-600 mb-4 space-y-2">
                    <li>• Developed Ruby Camera API for Nokia S60 mobile phones</li>
                    <li>• Contributed to Agile and DevOps rollout across technology teams</li>
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Ruby</Badge>
                    <Badge variant="outline">Mobile Development</Badge>
                    <Badge variant="outline">Agile Methodologies</Badge>
                    <Badge variant="outline">DevOps</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Education Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Education</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Academic foundation in mathematics, computer science, and financial engineering
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader>
                  <CardTitle className="text-xl">Master of Science</CardTitle>
                  <CardDescription className="text-indigo-600 font-medium">King's College London</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-lg">Mathematics and Computer Science</h4>
                    <Badge variant="secondary">2005 - 2009</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">First Class Honours</p>
                  <p className="text-gray-600 mb-3">
                    <strong>Postgraduate Modules:</strong> Portfolio Risk Management, Financial Markets, 
                    Exotic Derivatives, Artificial Intelligence, Advanced Software Engineering, 
                    Software Measurement and Testing
                  </p>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Academic Award:</strong> Springer-Verlag Award for Best Performing MSci Student (2008)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="text-xl">MSci Dissertation</CardTitle>
                  <CardDescription className="text-orange-600 font-medium">Activity Modeling and Prediction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-lg">Mobile Device User Behavior</h4>
                    <Badge variant="secondary">Distinction (85/100)</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">
                    <strong>Supervisor:</strong> Dr. Odinaldo Rodrigues
                  </p>
                  <p className="text-gray-600">
                    Research exploring machine learning techniques for modeling and predicting user behavior 
                    patterns on smartphone devices, contributing to early mobile analytics methodologies.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Technical Skills Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Technical Expertise</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Programming languages and technical skills refined through enterprise-scale projects
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Programming Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Slang</span>
                      <div className="flex gap-1">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        ))}
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Python</span>
                      <div className="flex gap-1">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-green-500 rounded-full"></div>
                        ))}
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">C++</span>
                      <div className="flex gap-1">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        ))}
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">C#</span>
                      <div className="flex gap-1">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        ))}
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Scala</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-red-500 rounded-full"></div>
                        ))}
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Java</span>
                      <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        ))}
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-xl">
                  <h3 className="text-xl font-semibold mb-3 text-blue-600">Systematic Trading</h3>
                  <p className="text-gray-600">
                    Risk premia strategies, portfolio construction, automated execution systems
                  </p>
                </div>

                <div className="text-center p-6 bg-green-50 rounded-xl">
                  <h3 className="text-xl font-semibold mb-3 text-green-600">Financial Engineering</h3>
                  <p className="text-gray-600">
                    Derivatives pricing, volatility modeling, quantitative risk management
                  </p>
                </div>

                <div className="text-center p-6 bg-purple-50 rounded-xl">
                  <h3 className="text-xl font-semibold mb-3 text-purple-600">Platform Development</h3>
                  <p className="text-gray-600">
                    Enterprise architecture, client analytics, compliance automation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Professional Contact</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Available for strategic consulting, quantitative finance projects, and technology leadership opportunities.
            </p>
            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-center">
                <MailIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                <a 
                  href="mailto:t.riddelsdell@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  t.riddelsdell@gmail.com
                </a>
              </div>
              <div className="flex items-center justify-center">
                <span className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 text-center">📱</span>
                <span className="text-gray-600">07713014880</span>
              </div>
              <div className="flex items-center justify-center">
                <LinkedinIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                <a
                  href="https://www.linkedin.com/in/thomas-riddelsdell-1140bb16/"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  linkedin.com/in/thomas-riddelsdell-1140bb16
                </a>
              </div>
              <div className="flex items-center justify-center">
                <GithubIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                <a
                  href="https://github.com/tomriddelsdell"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/tomriddelsdell
                </a>
              </div>
              <div className="flex items-center justify-center text-sm text-gray-500 mt-4">
                <span>Wye Valley Cottage, Underhill, Brockweir, NP16 7PF</span>
              </div>
            </div>
          </div>
        </section>
        </main>
      
      <LanguageModal />
    </div>
  );
}