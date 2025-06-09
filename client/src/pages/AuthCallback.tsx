import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { handleAuthCallback } from '@/lib/simple-auth';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          console.error('Auth error:', error);
          toast({
            title: "Authentication failed",
            description: error === 'access_denied' ? 'Access was denied' : `Error: ${error}`,
            variant: "destructive",
          });
          setLocation('/');
          return;
        }

        if (code) {
          console.log('Processing authentication callback...');
          
          // Process the authentication directly
          await handleAuthCallback(code);
          
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
            variant: "default",
          });
          
          setLocation('/dashboard');
        } else {
          throw new Error('No authorization code received');
        }
      } catch (error) {
        console.error('Callback error:', error);
        toast({
          title: "Authentication failed",
          description: "There was a problem completing your sign in.",
          variant: "destructive",
        });
        setLocation('/');
      }
    };

    handleCallback();
  }, [setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}