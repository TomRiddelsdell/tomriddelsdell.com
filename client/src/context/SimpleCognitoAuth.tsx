import React, { createContext, useContext, useState, useEffect } from 'react';
import { cognitoAuth, CognitoUser } from '@/lib/cognito-auth';

interface AuthContextType {
  user: CognitoUser | null;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SimpleCognitoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await cognitoAuth.checkAuth();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = () => {
    cognitoAuth.signIn();
  };

  const signOut = () => {
    cognitoAuth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSimpleCognitoAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSimpleCognitoAuth must be used within a SimpleCognitoAuthProvider');
  }
  return context;
}