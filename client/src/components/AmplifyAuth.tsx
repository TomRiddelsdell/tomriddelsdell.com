import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

interface AmplifyAuthProps {
  children: React.ReactNode;
}

export default function AmplifyAuth({ children }: AmplifyAuthProps) {
  useEffect(() => {
    // Check if user is already authenticated on component mount
    const checkAuthState = async () => {
      try {
        const user = await getCurrentUser();
        console.log('User is authenticated:', user.username);
      } catch (error) {
        console.log('User is not authenticated');
      }
    };
    
    checkAuthState();
  }, []);

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
    <Authenticator
      components={components}
      formFields={formFields}
      loginMechanisms={['email']}
    >
      {({ signOut, user }) => (
        <div className="min-h-screen">
          {children}
        </div>
      )}
    </Authenticator>
  );
}