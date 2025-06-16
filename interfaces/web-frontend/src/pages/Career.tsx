import * as React from "react";
import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { GithubIcon, LinkedinIcon, MailIcon, BookOpenIcon, AwardIcon, BriefcaseIcon, GraduationCapIcon } from "lucide-react";

export default function Career() {
  const { isAuthenticated } = useAuth();

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
          <Link href="/career" className="text-blue-600 dark:text-blue-400 font-medium">
            Career
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          ) : (
            <Link href="/">
              <Button>Contact</Button>
            </Link>
          )}
        </nav>
        <Button 
          variant="ghost" 
          className="md:hidden"
        >
          ☰
        </Button>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-5xl mx-auto px-6 md:px-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Professional Journey
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
                A passionate strategist and software engineer with expertise in financial modeling, 
                automated investment strategies, and full-stack development.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <MailIcon className="w-4 h-4 mr-2" />
                  Get In Touch
                </Button>
                <Button size="lg" variant="outline">
                  <LinkedinIcon className="w-4 h-4 mr-2" />
                  Connect on LinkedIn
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-5xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-3 mb-8">
              <BriefcaseIcon className="h-7 w-7 text-blue-600" />
              <h2 className="text-3xl font-bold">Professional Experience</h2>
            </div>
            
            <div className="space-y-8">
              {/* Experience Item */}
              <div className="border-l-4 border-blue-600 pl-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Senior Software Engineer</h3>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">2023 - Present</span>
                </div>
                <p className="text-lg text-blue-600 dark:text-blue-400 mb-3">QuantTech Solutions</p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Leading algorithmic trading platform development with high-frequency trading systems 
                  and risk management platforms with real-time data processing capabilities.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Python</Badge>
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">PostgreSQL</Badge>
                  <Badge variant="secondary">Redis</Badge>
                  <Badge variant="secondary">AWS</Badge>
                </div>
              </div>

              <div className="border-l-4 border-green-600 pl-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Quantitative Analyst</h3>
                  <span className="text-green-600 dark:text-green-400 font-medium">2021 - 2023</span>
                </div>
                <p className="text-lg text-green-600 dark:text-green-400 mb-3">Financial Strategies Group</p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Developed sophisticated quantitative models for portfolio optimization and risk assessment,
                  delivering insights that drove strategic investment decisions.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">MATLAB</Badge>
                  <Badge variant="secondary">R</Badge>
                  <Badge variant="secondary">Bloomberg API</Badge>
                  <Badge variant="secondary">Monte Carlo</Badge>
                  <Badge variant="secondary">VaR Modeling</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Education Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-5xl mx-auto px-6 md:px-12">
            <div className="flex items-center gap-3 mb-8">
              <GraduationCapIcon className="h-7 w-7 text-blue-600" />
              <h2 className="text-3xl font-bold">Education</h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">King's College London</h3>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">2005 - 2009</span>
                </div>
                <div className="mb-2">
                  <span className="text-lg">MSci Mathematics and Computer Science</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  First Class Honours • Springer-Verlag Award for Best Performance
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Carisbrooke High School</h3>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">2003 - 2005</span>
                </div>
                <div className="mb-2">
                  <span className="text-lg">A-Levels</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">A2: Mathematics, Physics, Computing</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">AS: Chemistry, Further Mathematics</p>
              </div>
            </div>
            
            {/* Honors and Awards */}
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-6">
                <AwardIcon className="h-7 w-7 text-amber-500" />
                <h3 className="text-xl font-bold">Honors & Awards</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Springer-Verlag Award (2008)</h4>
                  <p className="text-gray-700 dark:text-gray-300">Best performing MSci student, School of Physical Sciences and Engineering, King's College London</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">MSci Dissertation</h4>
                  <p className="text-gray-700 dark:text-gray-300 italic">Activity modeling and prediction on mobile devices</p>
                  <p className="text-gray-700 dark:text-gray-300">Awarded a distinction, receiving a mark of 85/100.</p>
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