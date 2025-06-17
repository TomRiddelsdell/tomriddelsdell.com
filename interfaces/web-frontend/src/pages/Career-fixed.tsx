import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { GithubIcon, LinkedinIcon, MailIcon, BookOpenIcon, AwardIcon, BriefcaseIcon, GraduationCapIcon } from "lucide-react";
import backgroundImage from "../assets/background.jpg";

export default function Career() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex flex-col">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <h1 className="text-xl font-bold text-gray-900">tomriddelsdell.com</h1>
            <div className="flex space-x-6">
              <a href="/" className="text-gray-600 hover:text-blue-600">Home</a>
              <a href="/career" className="text-blue-600 font-medium">Career</a>
              <a href="/projects" className="text-gray-600 hover:text-blue-600">Projects</a>
              <a href="/tasks" className="text-gray-600 hover:text-blue-600">Tasks</a>
              <a href="/workflows" className="text-gray-600 hover:text-blue-600">Workflows</a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section 
          className="relative py-20 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${backgroundImage})`,
          }}
        >
          <div className="max-w-6xl mx-auto px-6 md:px-12 text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Professional Journey
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
              A passionate strategist and software engineer with expertise in financial modeling, 
              automated investment strategies, and full-stack development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <MailIcon className="w-4 h-4 mr-2" />
                Get In Touch
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                <LinkedinIcon className="w-4 h-4 mr-2" />
                Connect on LinkedIn
              </Button>
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Experience</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Building innovative solutions at the intersection of finance and technology
              </p>
            </div>

            <div className="space-y-12">
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Senior Financial Engineer</h3>
                    <p className="text-blue-600 dark:text-blue-400 mb-2">FinTech Solutions Inc.</p>
                    <p className="text-gray-600 dark:text-gray-400">2022 - Present</p>
                  </div>
                  <Badge variant="secondary">Current</Badge>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Leading the development of algorithmic trading systems and risk management platforms. 
                  Architected microservices handling $50M+ in daily trading volume with 99.9% uptime.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge>Python</Badge>
                  <Badge>TypeScript</Badge>
                  <Badge>AWS</Badge>
                  <Badge>PostgreSQL</Badge>
                  <Badge>React</Badge>
                </div>
              </div>

              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Quantitative Developer</h3>
                    <p className="text-blue-600 dark:text-blue-400 mb-2">Hedge Fund Analytics</p>
                    <p className="text-gray-600 dark:text-gray-400">2020 - 2022</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Developed automated trading strategies and portfolio optimization algorithms. 
                  Built real-time market data processing systems and backtesting frameworks.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge>Python</Badge>
                  <Badge>C++</Badge>
                  <Badge>Machine Learning</Badge>
                  <Badge>Docker</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Education & Certifications */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Education & Certifications</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <BookOpenIcon className="w-8 h-8 mb-4 text-blue-600" />
                <h3 className="text-xl font-semibold mb-2">Master of Financial Engineering</h3>
                <p className="text-blue-600 mb-2">University of Technology</p>
                <p className="text-gray-600">
                  Specialized in quantitative finance, derivatives pricing, and risk management
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <AwardIcon className="w-8 h-8 mb-4 text-green-600" />
                <h3 className="text-xl font-semibold mb-2">AWS Solutions Architect</h3>
                <p className="text-green-600 mb-2">Amazon Web Services</p>
                <p className="text-gray-600">
                  Professional certification in cloud architecture and infrastructure design
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-500 text-white">
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Let's Build Something Amazing Together
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Whether you're looking for strategic consulting or technical expertise, 
              I'm here to help transform your ideas into reality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <MailIcon className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <LinkedinIcon className="w-4 h-4 mr-2" />
                Connect on LinkedIn
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}