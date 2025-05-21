import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

// Define the auth response type
interface User {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  photoURL: string | null;
  role: string;
}

interface AuthResponse {
  user: User | null;
}

interface ProtectedRouteProps {
  component: React.ComponentType;
  allowedRoles?: string[];
}

/**
 * A wrapper component that protects routes from unauthorized access
 * If user is not authenticated, they are redirected to the homepage
 * If allowedRoles is provided, user must have one of those roles
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  component: Component, 
  allowedRoles = [] 
}) => {
  const [, setLocation] = useLocation();
  
  // Check authentication status
  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/status'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // If we're loading, show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If there's an error or user is not authenticated
  if (error || !data || !data.user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md">
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">Authentication Required</h2>
          <p className="mb-6 text-center text-gray-600">
            You need to be signed in to access this page. Please sign in to continue.
          </p>
          <button 
            onClick={() => setLocation('/?signin=true')}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(data.user.role)) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-red-500">Access Denied</h1>
        <p className="mb-4">
          You don't have permission to view this page. This page requires one of these roles: 
          {allowedRoles.join(', ')}.
        </p>
        <button 
          onClick={() => setLocation('/')}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition"
        >
          Return to Home
        </button>
      </div>
    );
  }

  // User is authenticated and has required role, render the component
  return <Component />;
};

export default ProtectedRoute;