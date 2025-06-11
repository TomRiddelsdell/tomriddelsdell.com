import * as React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
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

      <main className="flex-1">
        {/* Header Section */}
        <section 
          className="py-16 md:py-24 px-6 md:px-12 flex flex-col items-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.9)), url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="max-w-4xl w-full">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
              Professional Experience
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 text-center mb-8">
              A proven track record in finance and technology with expertise in quantitative trading and risk management.
            </p>
            
            <div className="flex justify-center gap-4 mb-8">
              <Badge className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm">
                Quantitative Finance
              </Badge>
              <Badge className="px-4 py-2 bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 text-sm">
                Risk Management
              </Badge>
              <Badge className="px-4 py-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm">
                Software Engineering
              </Badge>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button className="gap-2">
                <MailIcon size={18} />
                Contact Me
              </Button>
              <Button variant="outline" className="gap-2">
                <BriefcaseIcon size={18} />
                Full CV
              </Button>
            </div>
          </div>
        </section>

        {/* Work Experience Section */}
        <section className="py-16 md:py-20 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <BriefcaseIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h2 className="text-3xl font-bold">Work Experience</h2>
            </div>
            
            {/* Goldman Sachs */}
            <div className="mb-12 relative border-l-2 border-gray-200 dark:border-gray-700 pl-8 pb-2">
              <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Goldman Sachs</h3>
                <span className="text-blue-600 dark:text-blue-400 font-medium">2015 - Present</span>
              </div>
              <div className="mb-2">
                <span className="text-lg font-semibold">Executive Director</span>
                <span className="mx-2">•</span>
                <span className="text-gray-600 dark:text-gray-400">Equity Strategist, Systematic Trading Strategies</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The STS Team at GS is a revenue-generating Quant Team that designs innovative trading strategies to systematically harvest Risk Premia. We tailor combinations of these strategies to complement client portfolios using various portfolio construction techniques.
              </p>
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Technical Lead for the Client Analytics Team; providing the data and insight clients require to understand their position and make future trading decisions.</li>
                <li>Developing and maintaining the Managed Portfolio Platform; enabling clients to leverage GS infrastructure to execute their own trading strategies.</li>
                <li>Using Slang to automate and optimize the execution of trading strategies designed by the STS Team.</li>
                <li>Designing and developing controls to ensure automated compliance with GS Policies, including the building of independent Volatility Surfaces with which we can reprice STS Strategies.</li>
                <li>Providing traders with real-time risk so that they can hedge their positions.</li>
              </ul>
            </div>
            
            {/* Barclays Capital */}
            <div className="mb-12 relative border-l-2 border-gray-200 dark:border-gray-700 pl-8 pb-2">
              <div className="absolute w-4 h-4 bg-teal-600 rounded-full -left-[9px] top-1"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Barclays Capital</h3>
                <span className="text-teal-600 dark:text-teal-400 font-medium">2012 - 2015</span>
              </div>
              <div className="mb-2">
                <span className="text-lg font-semibold">Associate Vice President</span>
                <span className="mx-2">•</span>
                <span className="text-gray-600 dark:text-gray-400">Full-Stack Developer, QASys - Risk and Analytics</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our team was responsible for the layer between the Core Risk Engine and Quant Pricing Library responsible for Life Cycling, model diagnosis, model configuration, and market data management for Exotic Interest Rate Derivatives.
              </p>
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Development and maintenance of a broad and mature stack spanning multiple technologies (C++, C#, Python, VBA).</li>
                <li>Coverage of a wide range of Derivatives products spanning Rates and Credit.</li>
                <li>Line management of 2 junior staff members.</li>
              </ul>
            </div>
            
            {/* Sophis / Misys */}
            <div className="mb-12 relative border-l-2 border-gray-200 dark:border-gray-700 pl-8 pb-2">
              <div className="absolute w-4 h-4 bg-purple-600 rounded-full -left-[9px] top-1"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sophis / Misys</h3>
                <span className="text-purple-600 dark:text-purple-400 font-medium">2009 - 2012</span>
              </div>
              <div className="mb-2">
                <span className="text-lg font-semibold">Senior Consultant</span>
                <span className="mx-2">•</span>
                <span className="text-gray-600 dark:text-gray-400">Financial Engineering / Toolkit</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Sophis sells its cross-asset trading platform to a large variety of buy-side and sell-side institutions. The Toolkit Consultants are responsible for extending it with bespoke client-specific features and training clients' Developers and Quants to build their own solutions.
              </p>
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-2">
                <li>Design and implementation of equity exotics pricing models for a key buy-side client.</li>
                <li>Consulting with multiple Banks and Hedge Funds to gather Business Requirements, produce Technical Specifications, and deliver tailored solutions.</li>
                <li>Running client training days for a range of topics including Pricing Model Development, Bespoke Portfolio Analytics, Sophis SOA Architecture, and UI Dev.</li>
              </ul>
            </div>
            
            {/* Symbian / Nokia */}
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 pl-8 pb-2">
              <div className="absolute w-4 h-4 bg-green-600 rounded-full -left-[9px] top-1"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Symbian / Nokia</h3>
                <span className="text-green-600 dark:text-green-400 font-medium">2008</span>
              </div>
              <div className="mb-2">
                <span className="text-lg font-semibold">Intern</span>
                <span className="mx-2">•</span>
                <span className="text-gray-600 dark:text-gray-400">Research Department - Software Engineer</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                During my 3 months internship, the Research Team Interns developed a Ruby Camera API for Nokia S60 Mobile Phones. We also contributed to the rollout of Agile and DevOps across the Tech Teams.
              </p>
            </div>
          </div>
        </section>
        
        {/* Skills & Education Section */}
        <section className="py-16 md:py-20 px-6 md:px-12 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Skills */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <AwardIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h2 className="text-3xl font-bold">Technical Skills</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">Slang</span>
                    <span className="text-gray-600 dark:text-gray-400">8/10</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">Python</span>
                    <span className="text-gray-600 dark:text-gray-400">6/10</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">C++</span>
                    <span className="text-gray-600 dark:text-gray-400">6/10</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">C#</span>
                    <span className="text-gray-600 dark:text-gray-400">6/10</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">Scala</span>
                    <span className="text-gray-600 dark:text-gray-400">5/10</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">Java</span>
                    <span className="text-gray-600 dark:text-gray-400">4/10</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Education */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <GraduationCapIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h2 className="text-3xl font-bold">Education</h2>
              </div>
              
              <div className="space-y-8">
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">King's College London</h3>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">2005 - 2009</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-lg">Master in Science, Mathematics and Computer Science</span>
                    <p className="text-gray-600 dark:text-gray-400 italic">First Class Honors</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Postgraduate Modules:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Portfolio Risk Management • Financial Markets • Exotic Derivatives • Artificial Intelligence • Advanced Software Engineering • Advanced Software Measurement and Testing</p>
                  </div>
                </div>
                
                <div>
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