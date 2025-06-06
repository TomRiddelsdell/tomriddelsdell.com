import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OIDCAuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  authMode?: 'signin' | 'signup';
}

export function OIDCAuthModal({ isOpen, onOpenChange, authMode = 'signin' }: OIDCAuthModalProps) {
  const auth = useAuth();

  // Close modal when user authenticates
  useEffect(() => {
    if (auth.isAuthenticated) {
      onOpenChange(false);
    }
  }, [auth.isAuthenticated, onOpenChange]);

  const handleSignIn = () => {
    auth.signinRedirect();
  };

  const handleSignUp = () => {
    // For OIDC, we can add signup parameter to the auth request
    auth.signinRedirect({
      extraQueryParams: { 
        prompt: 'login',
        signup: 'true'
      }
    });
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
            <Button 
              onClick={handleSignIn}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              size="lg"
            >
              Sign In
            </Button>
            
            <Button 
              onClick={handleSignUp}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Create Account
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
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication state when component mounts
    if (auth.isLoading) {
      return;
    }
    setIsLoading(false);
  }, [auth.isLoading]);

  if (isLoading || auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (auth.error) {
    console.error("Authentication error:", auth.error);
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}