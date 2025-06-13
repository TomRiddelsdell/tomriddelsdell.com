import * as React from "react";
import { Button } from "../components/ui/button";
import { redirectToCognito } from "../lib/simple-auth";
import { useAuth } from "../context/AuthContext";
import { Link } from "wouter";
import { GithubIcon, LinkedinIcon, MailIcon } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import profilePic from "../assets/profile.jpg";
import backgroundImage from "../assets/background.jpg";
import ImpliedVolDisplay from "../components/ImpliedVolDisplay";
import NavigationLinks from "../components/NavigationLinks";

export default function Home() {
  const { user: authUser, signOut } = useAuth();
  const isAuthenticated = !!authUser;
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

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
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
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
        body: JSON.stringify(contactForm)
      });

      // Clear form
      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      // Show success message
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

  // Handle Cognito callback
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      // Exchange authorization code for tokens
      fetch("/api/auth/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          redirectUri: window.location.origin + "/",
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            toast({
              title: "Welcome!",
              description: "You have successfully signed in",
              variant: "default",
            });
            // Clean URL
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
          } else {
            toast({
              title: "Authentication failed",
              description: "There was a problem completing your sign-in.",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          console.error("Auth callback error:", error);
          toast({
            title: "Authentication failed",
            description: "There was a problem completing your sign-in.",
            variant: "destructive",
          });
        });
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden page-container">
      {/* Navigation */}
      <header className="py-4 border-b bg-white dark:bg-gray-900 full-width-section">
        <div className="content-width flex justify-between items-center">
          <div className="text-2xl font-bold gradient-text">
            Tom Riddelsdell
          </div>
          <nav className="hidden md:flex space-x-8 items-center">
            <NavigationLinks isAuthenticated={isAuthenticated} />
            <a
              href="#contact"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 nav-link"
            >
              Contact
            </a>
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div
                  className="flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                  onClick={() => {
                    handleSignOut();
                  }}
                  title="Click to sign out"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span>Logged In</span>
                </div>
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
              </div>
            ) : (
              <Button onClick={redirectToCognito}>Sign In</Button>
            )}
          </nav>
          {/* Mobile nav toggle */}
          <Button
            variant="ghost"
            className="md:hidden"
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-40 bg-white dark:bg-gray-900 flex flex-col overflow-y-auto mobile-menu">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="text-xl font-bold gradient-text">
              Tom Riddelsdell
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileMenu(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          </div>
          <nav className="flex flex-col p-4 space-y-4">
            <NavigationLinks
              isAuthenticated={isAuthenticated}
              className="text-lg py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setShowMobileMenu(false)}
            />
            <a
              href="#contact"
              className="text-lg py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setShowMobileMenu(false)}
            >
              Contact
            </a>
            {isAuthenticated ? (
              <>
                <div className="flex items-center py-2 px-4">
                  <div className="flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm mr-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span>Logged In</span>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="block"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Button className="w-full" variant="outline">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <Button
                className="w-full mt-2"
                onClick={() => {
                  redirectToCognito();
                  setShowMobileMenu(false);
                }}
              >
                Sign In
              </Button>
            )}
          </nav>
        </div>
      )}

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative py-16 md:py-24 bg-white dark:bg-gray-900 full-width-section"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.9)), url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="content-width flex flex-col md:flex-row items-center justify-between">
            <div className="w-full md:w-1/2 mb-10 md:mb-0 flex flex-col justify-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text sr-only">
                Tom Riddelsdell
              </h1>
              <div className="bg-white/50 backdrop-blur-sm p-5 rounded-lg shadow-md mb-8">
                <p className="text-xl md:text-2xl text-slate-900 dark:text-slate-900 leading-relaxed">
                  Strategist & Software Engineer with expertise in financial
                  modeling, automated investment strategies, risk management,
                  and full-stack development.
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
                  src={profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
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
              <p className="italic text-blue-300 text-sm sm:text-base">
                — Navigating markets through data-driven decisions
              </p>
            </div>

            <div className="w-full md:w-1/2 h-[300px] sm:h-[350px] md:h-[400px] order-1 md:order-2 flex items-center justify-center">
              <div className="w-full h-full max-w-md">
                <ImpliedVolDisplay />
              </div>
            </div>
          </div>
        </section>

        {/* Career Section */}
        <section id="career" className="py-16 bg-gray-50 dark:bg-gray-800 full-width-section section-fade-in">
          <div className="content-width">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Career Development</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Years Experience</h3>
                <div className="text-3xl font-bold text-blue-600">8+</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Automation & Integration</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Projects Completed</h3>
                <div className="text-3xl font-bold text-green-600">50+</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Successful deliveries</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Team Size</h3>
                <div className="text-3xl font-bold text-purple-600">12</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current team members</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skills Assessment</h3>
                <div className="space-y-4">
                  {[
                    { name: "Workflow Automation", level: 95 },
                    { name: "API Integration", level: 90 },
                    { name: "Data Processing", level: 85 },
                    { name: "System Design", level: 88 }
                  ].map((skill, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{skill.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{skill.level}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${skill.level}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Achievements</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-400 pl-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Automation Excellence Award</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Reduced manual processing time by 75% through innovative workflow design</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">2024</span>
                  </div>
                  <div className="border-l-4 border-blue-400 pl-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Innovation Leadership</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Led team that delivered 15+ successful automation projects</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">2024</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-16 bg-white dark:bg-gray-900 full-width-section section-fade-in">
          <div className="content-width">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Projects</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                {
                  name: "Customer Data Migration",
                  status: "in-progress",
                  progress: 75,
                  description: "Migrating legacy customer data to new CRM system"
                },
                {
                  name: "API Integration Hub",
                  status: "completed",
                  progress: 100,
                  description: "Centralized API gateway for third-party integrations"
                },
                {
                  name: "Automated Reporting System",
                  status: "planning",
                  progress: 25,
                  description: "Real-time analytics and reporting dashboard"
                }
              ].map((project, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                          project.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : project.status === "in-progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {project.status.replace("-", " ")}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{project.progress}%</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">complete</div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tasks Section */}
        <section id="tasks" className="py-16 bg-gray-50 dark:bg-gray-800 full-width-section section-fade-in">
          <div className="content-width">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Current Tasks</h2>
            
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {[
                  {
                    title: "Review data migration workflow",
                    priority: "high",
                    status: "pending",
                    dueDate: "2025-06-14"
                  },
                  {
                    title: "Configure API rate limiting",
                    priority: "medium",
                    status: "in-progress",
                    dueDate: "2025-06-16"
                  },
                  {
                    title: "Update integration documentation",
                    priority: "low",
                    status: "completed",
                    dueDate: "2025-06-12"
                  }
                ].map((task, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        readOnly
                      />
                      <h3 className={`text-lg font-medium ${
                        task.status === "completed" ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"
                      }`}>
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : task.status === "in-progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {task.status.replace("-", " ")}
                      </span>
                    </div>
                    <div className="mt-2 ml-8 text-sm text-gray-500 dark:text-gray-400">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Workflows Section */}
        <section id="workflows" className="py-16 bg-white dark:bg-gray-900 full-width-section section-fade-in">
          <div className="content-width">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Active Workflows</h2>
            
            <div className="grid grid-cols-1 gap-6">
              {[
                {
                  name: "Data Processing Pipeline",
                  status: "running",
                  lastRun: "2 minutes ago",
                  description: "Automated data validation and transformation"
                },
                {
                  name: "Email Marketing Campaign",
                  status: "paused",
                  lastRun: "1 hour ago",
                  description: "Scheduled email sequences for customer engagement"
                },
                {
                  name: "Inventory Management",
                  status: "running",
                  lastRun: "15 minutes ago",
                  description: "Stock level monitoring and reorder automation"
                }
              ].map((workflow, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{workflow.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            workflow.status === "running"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          }`}
                        >
                          {workflow.status}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-2">{workflow.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last run: {workflow.lastRun}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section
          id="contact"
          className="pt-16 sm:pt-20 md:pt-28 pb-12 sm:pb-16 md:pb-24 bg-cover bg-center bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-8 full-width-section section-fade-in"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.9)), url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="content-width">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-900 dark:text-white drop-shadow-sm">
              Get In Touch
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
              <div className="bg-white/40 dark:bg-gray-800/40 p-6 rounded-lg shadow-md backdrop-blur-sm">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white drop-shadow-sm">
                  Contact Information
                </h3>
                <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-4 sm:mb-6 font-medium">
                  I'm always open to discussing new projects, opportunities, or
                  partnerships. Feel free to reach out through any of the
                  following channels:
                </p>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center">
                    <MailIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-all">
                      t.riddelsdell@gmail.com
                    </span>
                  </div>
                  <div className="flex items-center">
                    <LinkedinIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 mr-3 sm:mr-4 flex-shrink-0" />
                    <a
                      href="https://www.linkedin.com/in/thomas-riddelsdell-1140bb16/"
                      className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      linkedin.com/in/thomas-riddelsdell-1140bb16
                    </a>
                  </div>
                  <div className="flex items-center">
                    <GithubIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 mr-3 sm:mr-4 flex-shrink-0" />
                    <a
                      href="https://github.com"
                      className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      github.com/tomriddelsdell
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-gray-800/40 p-6 rounded-lg shadow-md backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white drop-shadow-sm">
                  Send a Message
                </h3>
                <form className="space-y-4" onSubmit={handleContactSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-field">
                      <input
                        type="text"
                        id="name"
                        value={contactForm.name}
                        onChange={handleInputChange}
                        className="w-full p-2 pt-5 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 focus:border-blue-500 outline-none"
                        placeholder=" "
                        required
                      />
                      <label
                        htmlFor="name"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Name
                      </label>
                    </div>
                    <div className="form-field">
                      <input
                        type="email"
                        id="email"
                        value={contactForm.email}
                        onChange={handleInputChange}
                        className="w-full p-2 pt-5 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 focus:border-blue-500 outline-none"
                        placeholder=" "
                        required
                      />
                      <label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Email
                      </label>
                    </div>
                  </div>
                  <div className="form-field">
                    <input
                      type="text"
                      id="subject"
                      value={contactForm.subject}
                      onChange={handleInputChange}
                      className="w-full p-2 pt-5 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 focus:border-blue-500 outline-none"
                      placeholder=" "
                    />
                    <label
                      htmlFor="subject"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Subject
                    </label>
                  </div>
                  <div className="form-field">
                    <textarea
                      id="message"
                      rows={4}
                      value={contactForm.message}
                      onChange={handleInputChange}
                      className="w-full p-2 pt-5 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 focus:border-blue-500 outline-none"
                      placeholder=" "
                      required
                    ></textarea>
                    <label
                      htmlFor="message"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Message
                    </label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-bg gradient-bg-hover btn-hover-lift"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 md:px-12 border-t bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-xl font-bold gradient-text mb-4 md:mb-0">
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