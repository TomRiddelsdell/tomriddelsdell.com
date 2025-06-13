import React from "react";

interface NavigationLinksProps {
  isAuthenticated: boolean;
  className?: string;
  onClick?: () => void;
}

export default function NavigationLinks({ isAuthenticated, className = "", onClick }: NavigationLinksProps) {
  if (!isAuthenticated) return null;

  const baseClasses = "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 nav-link cursor-pointer";
  const linkClasses = className || baseClasses;

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    if (onClick) onClick();
  };

  return (
    <>
      <span
        className={linkClasses}
        onClick={() => scrollToSection('career')}
      >
        Career
      </span>
      <span
        className={linkClasses}
        onClick={() => scrollToSection('projects')}
      >
        Projects
      </span>
      <span
        className={linkClasses}
        onClick={() => scrollToSection('tasks')}
      >
        Tasks
      </span>
      <span
        className={linkClasses}
        onClick={() => scrollToSection('workflows')}
      >
        Workflows
      </span>
    </>
  );
}