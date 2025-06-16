import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useMobile } from "../hooks/use-mobile";
import { GithubIcon, LinkedinIcon, MailIcon, BookOpenIcon, AwardIcon, BriefcaseIcon, GraduationCapIcon } from "lucide-react";
import backgroundImage from "../assets/background.jpg";

export default function Career() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useMobile();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isMobile={isMobile && mobileMenuOpen} />
      
      <main className="flex-grow flex flex-col overflow-hidden">
        <TopNavbar 
          openMobileMenu={() => setMobileMenuOpen(true)} 
          title="Career"
        />
        
        <div className="flex-grow overflow-auto">
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

          {/* Experience Timeline */}
          <section className="py-20 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-6 md:px-12">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Experience</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  A journey through strategic leadership, software engineering, and quantitative finance
                </p>
              </div>

              <div className="space-y-12">
                {/* Experience Item 1 */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="md:w-1/3">
                    <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
                      <h3 className="font-bold text-lg">Senior Software Engineer</h3>
                      <p className="text-blue-600 dark:text-blue-400">QuantTech Solutions</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2023 - Present</p>
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <h4 className="font-semibold text-xl mb-3">Leading Algorithmic Trading Platform Development</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Spearheading the development of high-frequency trading systems and risk management platforms
                      with real-time data processing capabilities.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Python</Badge>
                      <Badge variant="secondary">React</Badge>
                      <Badge variant="secondary">PostgreSQL</Badge>
                      <Badge variant="secondary">Redis</Badge>
                      <Badge variant="secondary">AWS</Badge>
                    </div>
                  </div>
                </div>

                {/* Experience Item 2 */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="md:w-1/3">
                    <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
                      <h3 className="font-bold text-lg">Quantitative Analyst</h3>
                      <p className="text-green-600 dark:text-green-400">Financial Strategies Group</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2021 - 2023</p>
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <h4 className="font-semibold text-xl mb-3">Advanced Financial Modeling & Strategy</h4>
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

                {/* Experience Item 3 */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="md:w-1/3">
                    <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg">
                      <h3 className="font-bold text-lg">Full Stack Developer</h3>
                      <p className="text-purple-600 dark:text-purple-400">TechStart Innovations</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2019 - 2021</p>
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <h4 className="font-semibold text-xl mb-3">End-to-End Application Development</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Built scalable web applications from concept to deployment, focusing on user experience
                      and performance optimization.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">TypeScript</Badge>
                      <Badge variant="secondary">Node.js</Badge>
                      <Badge variant="secondary">Vue.js</Badge>
                      <Badge variant="secondary">MongoDB</Badge>
                      <Badge variant="secondary">Docker</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Skills & Expertise */}
          <section className="py-20 bg-white dark:bg-gray-800">
            <div className="max-w-6xl mx-auto px-6 md:px-12">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Expertise</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Technical skills and domain knowledge developed through years of hands-on experience
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <BriefcaseIcon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold mb-3">Financial Engineering</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Quantitative modeling, risk management, algorithmic trading strategies
                  </p>
                </div>

                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <GraduationCapIcon className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-xl font-semibold mb-3">Software Architecture</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Full-stack development, system design, cloud infrastructure
                  </p>
                </div>

                <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <AwardIcon className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-xl font-semibold mb-3">Data Science</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Machine learning, statistical analysis, predictive modeling
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Education & Certifications */}
          <section className="py-20 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-6 md:px-12">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Education & Certifications</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                  <BookOpenIcon className="w-8 h-8 mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold mb-2">Master of Financial Engineering</h3>
                  <p className="text-blue-600 dark:text-blue-400 mb-2">University of Technology</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Specialized in quantitative finance, derivatives pricing, and risk management
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                  <AwardIcon className="w-8 h-8 mb-4 text-green-600" />
                  <h3 className="text-xl font-semibold mb-2">AWS Solutions Architect</h3>
                  <p className="text-green-600 dark:text-green-400 mb-2">Amazon Web Services</p>
                  <p className="text-gray-600 dark:text-gray-400">
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
                I'm always open to discussing new opportunities and challenges.
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
      </main>
    </div>
  );
}