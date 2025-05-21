import React from 'react';
import { Navigate, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

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
  const { data, isLoading, error } = useQuery({
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
  if (error || !data?.user) {
    // Redirect to home page with a message
    setLocation('/?auth=required');
    return null;
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