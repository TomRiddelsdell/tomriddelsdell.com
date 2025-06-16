import * as React from "react";
import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { GithubIcon, LinkedinIcon, MailIcon, BookOpenIcon, AwardIcon, BriefcaseIcon, GraduationCapIcon } from "lucide-react";
import backgroundImage from "../assets/background.jpg";

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
            <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
              <GithubIcon className="w-4 h-4 mr-2" />
              View Projects
            </Button>
          </div>
        </div>
      </section>

      {/* Experience Overview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Experience Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BriefcaseIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">8+ Years</h3>
              <p className="text-gray-600">Professional Experience</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AwardIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">50+ Projects</h3>
              <p className="text-gray-600">Successfully Delivered</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCapIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple</h3>
              <p className="text-gray-600">Certifications & Awards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Skills & Expertise */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Skills & Expertise</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Technical Skills */}
            <div>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <BookOpenIcon className="w-6 h-6 mr-2 text-blue-600" />
                Technical Skills
              </h3>
              <div className="space-y-4">
                {[
                  { name: "Financial Modeling & Analysis", level: 95 },
                  { name: "Full-Stack Development", level: 90 },
                  { name: "Quantitative Analysis", level: 88 },
                  { name: "Risk Management Systems", level: 85 },
                  { name: "API Development & Integration", level: 92 },
                  { name: "Database Design & Optimization", level: 87 }
                ].map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-sm text-gray-600">{skill.level}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional Experience */}
            <div>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <BriefcaseIcon className="w-6 h-6 mr-2 text-green-600" />
                Professional Experience
              </h3>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-lg">Senior Software Engineer</h4>
                  <p className="text-blue-600">Financial Technology Company</p>
                  <p className="text-sm text-gray-600 mb-2">2020 - Present</p>
                  <p className="text-gray-700">Leading development of quantitative trading systems and risk management platforms.</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-lg">Quantitative Analyst</h4>
                  <p className="text-green-600">Investment Management Firm</p>
                  <p className="text-sm text-gray-600 mb-2">2018 - 2020</p>
                  <p className="text-gray-700">Developed automated trading strategies and portfolio optimization models.</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-lg">Financial Analyst</h4>
                  <p className="text-purple-600">Banking Institution</p>
                  <p className="text-sm text-gray-600 mb-2">2016 - 2018</p>
                  <p className="text-gray-700">Built financial models and risk assessment frameworks for institutional clients.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements & Certifications */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Achievements & Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "CFA Charterholder",
                issuer: "CFA Institute",
                year: "2019",
                type: "certification"
              },
              {
                title: "AWS Solutions Architect",
                issuer: "Amazon Web Services",
                year: "2021",
                type: "certification"
              },
              {
                title: "Innovation Award",
                issuer: "Tech Excellence Awards",
                year: "2022",
                type: "award"
              },
              {
                title: "Financial Modeling Expert",
                issuer: "Financial Institute",
                year: "2020",
                type: "certification"
              },
              {
                title: "Team Leadership Excellence",
                issuer: "Professional Development",
                year: "2023",
                type: "award"
              },
              {
                title: "Quantitative Analysis Specialist",
                issuer: "Analytics Association",
                year: "2021",
                type: "certification"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    item.type === 'certification' ? 'bg-blue-100' : 'bg-yellow-100'
                  }`}>
                    {item.type === 'certification' ? 
                      <GraduationCapIcon className={`w-6 h-6 ${item.type === 'certification' ? 'text-blue-600' : 'text-yellow-600'}`} /> :
                      <AwardIcon className="w-6 h-6 text-yellow-600" />
                    }
                  </div>
                  <Badge variant="outline">{item.year}</Badge>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.issuer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Let's Work Together</h2>
          <p className="text-xl mb-8 opacity-90">
            Interested in collaborating on financial technology projects or quantitative analysis?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-blue-600">
              <MailIcon className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-blue-600">
              <LinkedinIcon className="w-4 h-4 mr-2" />
              Connect on LinkedIn
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}