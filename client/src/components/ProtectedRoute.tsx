import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path?: string;
}

// Component to wrap routes that should only be accessible to authenticated users
export default function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show nothing briefly while checking authentication status
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If user is authenticated, render the requested component
  if (isAuthenticated) {
    return <Component {...rest} />;
  }

  // If not authenticated, redirect to home with a prompt to login
  return <Redirect to="/?login=true" />;
}