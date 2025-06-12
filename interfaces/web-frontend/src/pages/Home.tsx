import * as React from "react";
import { Button } from "../components/ui/button";
import { Link } from "wouter";
import { GithubIcon, LinkedinIcon, MailIcon } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

export default function Home() {
  const [authUser, setAuthUser] = React.useState<{ id: number; email: string } | null>(null);
  const isAuthenticated = !!authUser;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  // Form state
  const [contactForm, setContactForm] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setContactForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify(contactForm),
      });

      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully. Thank you for reaching out!",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-6 md:px-12 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text cursor-pointer">
              Tom Riddelsdell
            </div>
          </Link>
          
          <nav className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="text-blue-600 dark:text-blue-400 font-medium">
              Home
            </Link>
            <Link href="/career" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
              Career
            </Link>
            {isAuthenticated && (
              <Link href="/projects" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Projects
              </Link>
            )}
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            ) : (
              <Button onClick={() => setAuthUser({ id: 1, email: 'tom@example.com' })}>
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <Button 
            variant="ghost" 
            className="md:hidden" 
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative py-24 md:py-32 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/attached_assets/background.jpg')`
        }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center text-white">
            <div className="mb-8">
              <img
                src="/attached_assets/me.jpg"
                alt="Tom Riddelsdell"
                className="w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto mb-6 border-4 border-white shadow-xl object-cover"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Tom Riddelsdell
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Quantitative Finance Professional
            </p>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-gray-300">
              Passionate about financial markets, quantitative analysis, and building innovative 
              trading solutions. Experienced in risk management and systematic trading strategies.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/career">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  View My Career
                </Button>
              </Link>
              {isAuthenticated && (
                <Link href="/projects">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                    See Projects
                  </Button>
                </Link>
              )}
            </div>

            {/* Social Links */}
            <div className="flex justify-center gap-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <GithubIcon className="w-6 h-6" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <LinkedinIcon className="w-6 h-6" />
              </a>
              <a
                href="mailto:contact@example.com"
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <MailIcon className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <main>
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">About Me</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                I'm a quantitative finance professional with a passion for markets, 
                data analysis, and systematic trading strategies.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Quantitative Analysis</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Mathematical modeling and statistical analysis for financial markets and risk assessment.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Trading Systems</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Development of systematic trading strategies and automated execution systems.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Risk Management</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Portfolio optimization and risk assessment for institutional trading strategies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Market Insights Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Market Insights</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Real-time financial data and market analysis tools.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
              <div className="text-center">
                <img 
                  src="/attached_assets/impliedvol.jpeg" 
                  alt="Implied Volatility Surface"
                  className="mx-auto rounded-lg shadow-md mb-4 max-w-full h-auto"
                />
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced volatility surface modeling and analysis for derivatives pricing
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Interested in discussing quantitative finance, trading strategies, or potential collaborations?
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      value={contactForm.name}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 focus:border-blue-500 outline-none"
                      placeholder="Your Name"
                      required
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={contactForm.email}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 focus:border-blue-500 outline-none"
                      placeholder="Your Email"
                      required
                    />
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    id="subject"
                    value={contactForm.subject}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 focus:border-blue-500 outline-none"
                    placeholder="Subject"
                  />
                </div>
                <div className="relative">
                  <textarea
                    id="message"
                    rows={4}
                    value={contactForm.message}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 focus:border-blue-500 outline-none"
                    placeholder="Your Message"
                    required
                  ></textarea>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
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