import * as React from "react";
import { Button } from "../components/ui/button";
import { Link } from "wouter";
import { GithubIcon, LinkedinIcon, MailIcon } from "lucide-react";
import UnifiedNavbar from "../components/UnifiedNavbar";
import LanguageModal from "../components/LanguageModal";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <UnifiedNavbar />
      
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