import { Link } from "wouter";

interface NavigationLinksProps {
  isAuthenticated: boolean;
  className?: string;
  onClick?: () => void;
}

export default function NavigationLinks({ isAuthenticated, className = "", onClick }: NavigationLinksProps) {
  if (!isAuthenticated) return null;

  const baseClasses = "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 nav-link";
  const linkClasses = className || baseClasses;

  return (
    <>
      <Link
        href="/career"
        className={linkClasses}
        onClick={onClick}
      >
        Career
      </Link>
      <Link
        href="/projects"
        className={linkClasses}
        onClick={onClick}
      >
        Projects
      </Link>
      <Link
        href="/tasks"
        className={linkClasses}
        onClick={onClick}
      >
        Tasks
      </Link>
      <Link
        href="/dashboard"
        className={linkClasses}
        onClick={onClick}
      >
        Dashboard
      </Link>
      <Link
        href="/workflows"
        className={linkClasses}
        onClick={onClick}
      >
        Workflows
      </Link>
    </>
  );
}