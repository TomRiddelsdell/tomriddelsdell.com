import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { server } from '../mocks/server';

// Mock component to test auth context
function TestComponent() {
  const { user, isLoading, signOut, refetchUser } = useAuth();
  
  const handleSignIn = async () => {
    // Simulate auth callback with valid code
    await fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'valid_test_code' })
    });
    await refetchUser();
  };
  
  return (
    <div>
      <div data-testid="user-status">
        {isLoading ? 'Loading...' : user ? `Welcome ${user.email}` : 'Not authenticated'}
      </div>
      <button onClick={handleSignIn}>
        Sign In
      </button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('Authentication', () => {
  it('should show not authenticated initially', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('user-status')).toHaveTextContent('Not authenticated');
  });

  it('should handle successful sign in', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    
    fireEvent.click(screen.getByText('Sign In'));
    
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Welcome test@example.com');
    });
  });

  it('should handle sign out', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    
    // Sign in first
    fireEvent.click(screen.getByText('Sign In'));
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Welcome test@example.com');
    });
    
    // Then sign out
    fireEvent.click(screen.getByText('Sign Out'));
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not authenticated');
    });
  });
});