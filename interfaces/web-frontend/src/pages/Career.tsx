import React from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { MailIcon, LinkedinIcon, GithubIcon, ExternalLinkIcon } from "lucide-react";

export default function Career() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Tom Riddelsdell</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Home</a>
                <a href="/career" className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium">Career</a>
                <a href="/projects" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Projects</a>
                <a href="/contact" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Professional Journey
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Strategist & Software Engineer with expertise in financial modeling, 
                automated investment strategies, risk management, and full-stack development.
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
              {/* Experience Item 1 */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl">Senior Software Engineer</CardTitle>
                      <CardDescription className="text-blue-600 font-medium">QuantTech Solutions</CardDescription>
                    </div>
                    <Badge variant="secondary" className="mt-2 md:mt-0">2023 - Present</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-lg mb-3">Leading Algorithmic Trading Platform Development</h4>
                  <p className="text-gray-600 mb-4">
                    Spearheading the development of high-frequency trading systems and risk management platforms
                    with real-time data processing capabilities.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Python</Badge>
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">PostgreSQL</Badge>
                    <Badge variant="outline">Redis</Badge>
                    <Badge variant="outline">AWS</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Experience Item 2 */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl">Quantitative Analyst</CardTitle>
                      <CardDescription className="text-green-600 font-medium">Financial Strategies Group</CardDescription>
                    </div>
                    <Badge variant="secondary" className="mt-2 md:mt-0">2021 - 2023</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-lg mb-3">Advanced Financial Modeling & Strategy</h4>
                  <p className="text-gray-600 mb-4">
                    Developed sophisticated quantitative models for portfolio optimization and risk assessment,
                    delivering insights that drove strategic investment decisions.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">MATLAB</Badge>
                    <Badge variant="outline">R</Badge>
                    <Badge variant="outline">Bloomberg API</Badge>
                    <Badge variant="outline">Monte Carlo</Badge>
                    <Badge variant="outline">VaR Modeling</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Experience Item 3 */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl">Full Stack Developer</CardTitle>
                      <CardDescription className="text-purple-600 font-medium">TechStart Innovations</CardDescription>
                    </div>
                    <Badge variant="secondary" className="mt-2 md:mt-0">2019 - 2021</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-lg mb-3">End-to-End Application Development</h4>
                  <p className="text-gray-600 mb-4">
                    Built scalable web applications from concept to deployment, focusing on user experience
                    and performance optimization.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">TypeScript</Badge>
                    <Badge variant="outline">Node.js</Badge>
                    <Badge variant="outline">Vue.js</Badge>
                    <Badge variant="outline">MongoDB</Badge>
                    <Badge variant="outline">Docker</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Core Expertise</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Technical skills and domain knowledge developed through years of hands-on experience
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <h3 className="text-xl font-semibold mb-3 text-blue-600">Financial Engineering</h3>
                <p className="text-gray-600">
                  Quantitative modeling, risk management, algorithmic trading strategies
                </p>
              </div>

              <div className="text-center p-6 bg-green-50 rounded-xl">
                <h3 className="text-xl font-semibold mb-3 text-green-600">Software Architecture</h3>
                <p className="text-gray-600">
                  Full-stack development, system design, cloud infrastructure
                </p>
              </div>

              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <h3 className="text-xl font-semibold mb-3 text-purple-600">Data Science</h3>
                <p className="text-gray-600">
                  Machine learning, statistical analysis, predictive modeling
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Let's Connect</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Interested in discussing opportunities or collaborating on innovative projects?
            </p>
            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-center">
                <MailIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                <span className="text-gray-600">t.riddelsdell@gmail.com</span>
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
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Tom Riddelsdell. Building the future of finance and technology.
          </p>
        </div>
      </footer>
    </div>
  );
}