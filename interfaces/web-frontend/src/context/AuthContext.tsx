import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, checkAuthStatus, emailSignIn, emailSignUp, googleSignIn, awsSignIn } from "../lib/auth";
import { useToast } from "../hooks/use-toast";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithAWS: () => Promise<void>;
  signOut: () => Promise<void>;
  refetchUser: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Function to refetch user data
  const refetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.id,
          email: userData.email,
          displayName: userData.displayName || userData.email,
          photoURL: null,
          role: userData.role
        });
        return userData;
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setUser(null);
      return null;
    }
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      await refetchUser();
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string, rememberMe?: boolean) => {
    setIsLoading(true);
    try {
      const user = await emailSignIn(email, password, rememberMe);
      setUser(user);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in";
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await emailSignUp(email, password);
      setUser(user);
      toast({
        title: "Account created",
        description: "Your account has been successfully created.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign up";
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const user = await googleSignIn();
      setUser(user);
      toast({
        title: "Welcome back!",
        description: `You have successfully signed in as ${user.displayName || user.email}.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with Google";
      toast({
        title: "Google sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(null);
        
        // If we have a Cognito logout URL, redirect to it
        if (data.cognitoLogoutUrl) {
          window.location.href = data.cognitoLogoutUrl;
          return; // Don't show toast since we're redirecting
        }
        
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
      } else {
        throw new Error('Sign out failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign out";
      toast({
        title: "Sign out failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithAWS = async () => {
    setIsLoading(true);
    try {
      const user = await awsSignIn();
      setUser(user);
      toast({
        title: "Welcome back!",
        description: `You have successfully signed in as ${user.displayName || user.email}.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with AWS";
      toast({
        title: "AWS sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithAWS,
    signOut,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
