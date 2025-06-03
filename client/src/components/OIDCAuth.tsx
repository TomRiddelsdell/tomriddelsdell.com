import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OIDCAuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  authMode?: 'signin' | 'signup';
}

export function OIDCAuthModal({ isOpen, onOpenChange, authMode = 'signin' }: OIDCAuthModalProps) {
  const { isAuthenticated, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Close modal when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      onOpenChange(false);
    }
  }, [isAuthenticated, onOpenChange]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      await signUp(email, password);
    } catch (error) {
      console.error('Sign up failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl mx-auto max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="sr-only">Authentication</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome</h2>
            <p className="text-gray-600 mt-2">Sign in to your account or create a new one</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              onClick={handleSignIn}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              size="lg"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <Button 
              onClick={handleSignUp}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OIDCAuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}