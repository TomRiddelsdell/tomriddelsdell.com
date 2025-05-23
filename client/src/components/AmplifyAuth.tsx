import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AmplifyAuthProps {
  children: React.ReactNode;
}

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  authMode?: 'signin' | 'signup';
}

function AuthModal({ isOpen, onOpenChange, authMode = 'signin' }: AuthModalProps) {
  const { user } = useAuthenticator();

  // Close modal when user authenticates
  useEffect(() => {
    if (user) {
      onOpenChange(false);
    }
  }, [user, onOpenChange]);

  const components = {
    Header() {
      return (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Welcome</h2>
          <p className="text-gray-600 mt-2">Sign in to your account or create a new one</p>
        </div>
      );
    }
  };

  const formFields = {
    signIn: {
      username: {
        placeholder: 'Enter your email address',
        label: 'Email',
        inputProps: { required: true },
      },
    },
    signUp: {
      email: {
        placeholder: 'Enter your email address',
        label: 'Email',
        inputProps: { required: true },
      },
      password: {
        placeholder: 'Enter your password',
        label: 'Password',
        inputProps: { required: true },
      },
      confirm_password: {
        placeholder: 'Confirm your password',
        label: 'Confirm Password',
        inputProps: { required: true },
      },
    },
    forceNewPassword: {
      password: {
        placeholder: 'Enter your new password',
        label: 'New Password',
        inputProps: { required: true },
      },
    },
    forgotPassword: {
      username: {
        placeholder: 'Enter your email address',
        label: 'Email',
        inputProps: { required: true },
      },
    },
    confirmResetPassword: {
      confirmation_code: {
        placeholder: 'Enter your confirmation code',
        label: 'Confirmation Code',
        inputProps: { required: true },
      },
      confirm_password: {
        placeholder: 'Enter your new password',
        label: 'New Password',
        inputProps: { required: true },
      },
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Authentication</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Authenticator
            components={components}
            formFields={formFields}
            loginMechanisms={['email']}
            hideSignUp={false}
            initialState={authMode === 'signup' ? 'signUp' : 'signIn'}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export the AuthModal component so it can be used in Home.tsx
export { AuthModal };

export default function AmplifyAuth({ children }: AmplifyAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on component mount
    const checkAuthState = async () => {
      try {
        const user = await getCurrentUser();
        console.log('User is authenticated:', user.username);
        setIsAuthenticated(true);
      } catch (error) {
        console.log('User is not authenticated');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthState();
  }, []);

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
    <Authenticator.Provider>
      {isAuthenticated ? (
        <Authenticator>
          {({ signOut, user }) => (
            <div className="min-h-screen">
              {children}
            </div>
          )}
        </Authenticator>
      ) : (
        <div className="min-h-screen">
          {/* Render children (main page) even when not authenticated */}
          {children}
        </div>
      )}
    </Authenticator.Provider>
  );
}