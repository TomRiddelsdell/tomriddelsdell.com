import * as React from "react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { redirectToCognito } from "../lib/simple-auth";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "wouter";
import { GithubIcon, LinkedinIcon, MailIcon } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import NavigationWrapper from "../components/NavigationWrapper";
import ImpliedVolDisplay from "../components/ImpliedVolDisplay";

// Use public assets path for immediate loading
const profilePicUrl = "/me.jpg";
const backgroundImageUrl = "/background.jpg";

export default function Home() {
  const { user: authUser, signOut } = useAuth();
  const { t } = useLanguage();
  const isAuthenticated = !!authUser;
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const callbackProcessedRef = React.useRef(false);

  // Handle user sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify(contactForm),
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast({
        title: "Message sent successfully!",
        description: "Thank you for reaching out. I'll get back to you soon.",
        variant: "default",
      });

      // Reset form
      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again or contact me directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auth callback processing
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code && !callbackProcessedRef.current) {
      callbackProcessedRef.current = true;
      
      // Clean URL immediately to prevent reprocessing
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname,
      );
      
      // Add a delay to ensure single request processing
      setTimeout(async () => {
        try {
          const response = await fetch("/api/auth/callback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              redirectUri: window.location.origin + "/",
            }),
          });
          
          const data = await response.json();
          
          // Only show success message, ignore errors that are typically from duplicate requests
          if (response.ok && (data.success || data.id)) {
            toast({
              title: "Welcome!",
              description: "You have successfully signed in",
              variant: "default",
            });
          } else if (response.status === 400 && data.error?.includes("expired")) {
            // This is likely a duplicate request - don't show error, wait for success
            console.log("Auth code already used - this is normal for duplicate requests");
          } else if (!data.error?.includes("already authenticated")) {
            // Only show actual authentication failures
            toast({
              title: "Authentication failed",
              description: "There was a problem completing your sign-in.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Auth callback error:", error);
          // Only show error if it's not a network/duplicate request issue
          if (!(error as any)?.message?.includes("fetch")) {
            toast({
              title: "Authentication error",
              description: "Network error during authentication. Please try again.",
              variant: "destructive",
            });
          }
        }
      }, 100);
    }
  }, [toast]);

  // Section animation on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll(".section-fade-in");

      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        if (sectionTop < windowHeight * 0.85) {
          section.classList.add("visible");
        }
      });
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <NavigationWrapper title="Home">
      <div className="bg-white min-h-screen overflow-hidden">
        {/* Hero Section */}
          <section className="py-12 sm:py-16 md:py-20 text-center hero-section full-width-section section-fade-in">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${backgroundImageUrl})` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/70 to-gray-900/80"></div>
            <div className="content-width relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="w-full md:w-1/2 text-left space-y-6 md:space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-slate-100 hero-title">
                      <span className="block">Tom</span>
                      <span className="block text-blue-400">Riddelsdell</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-100 leading-relaxed">
                      Executive Director at Goldman Sachs with expertise in systematic trading strategies, 
                      quantitative finance, and full-stack financial technology development.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto gradient-bg gradient-bg-hover btn-hover-lift"
                      onClick={() => {
                        const cognitoUrl = `https://eu-west-2g2bs4xiwn.auth.eu-west-2.amazoncognito.com/signup?client_id=483n96q9sudb248kp2sgto7i47&response_type=code&scope=openid+email+phone&redirect_uri=${encodeURIComponent(window.location.origin + "/")}`;
                        window.location.href = cognitoUrl;
                      }}
                    >
                      Join My Network
                    </Button>
                    {isAuthenticated && (
                      <Link href="/career" className="w-full sm:w-auto">
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full sm:w-auto btn-hover-lift"
                        >
                          View Career
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
                <div className="w-full md:w-1/2 flex justify-center items-center mt-8 md:mt-0">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white/30 dark:border-gray-700/30 shadow-xl">
                    <img
                      src={profilePicUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quant Developer Quote Section with Volatility Surface */}
          <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-900/90 via-slate-900/90 to-gray-900/90 text-white full-width-section section-fade-in">
            <div className="content-width flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
              <div className="w-full md:w-1/2 order-2 md:order-1 mt-8 md:mt-0">
                <p className="text-lg sm:text-xl md:text-2xl font-light leading-relaxed mb-4 sm:mb-6 text-gray-200">
                  "In quantitative finance, the most elegant models are those that
                  balance mathematical rigor with practical application. The
                  beauty lies not in complexity, but in the precision with which
                  we can forecast market behavior."
                </p>
                <div className="flex space-x-6">
                  <a
                    href="mailto:t.riddelsdell@gmail.com"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <MailIcon className="w-6 h-6" />
                  </a>
                  <a
                    href="https://github.com/tomriddelsdell"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <GithubIcon className="w-6 h-6" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/thomas-riddelsdell-1140bb16/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <LinkedinIcon className="w-6 h-6" />
                  </a>
                </div>
              </div>
              <div className="w-full md:w-1/2 order-1 md:order-2">
                <ImpliedVolDisplay />
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section
            id="contact"
            className="py-16 sm:py-20 bg-gradient-to-br from-slate-100 to-gray-200 full-width-section section-fade-in"
          >
            <div className="content-width">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Let's Connect
                </h2>
                <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                  Interested in discussing quantitative finance, systematic trading, 
                  or innovative technology projects? I'd love to hear from you.
                </p>
              </div>

              <div className="max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={contactForm.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={contactForm.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={contactForm.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="What would you like to discuss?"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={contactForm.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Tell me about your project or inquiry..."
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gradient-bg gradient-bg-hover btn-hover-lift"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>
            </div>
          </section>
        </div>
    </NavigationWrapper>
  );
}