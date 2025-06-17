import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AuthModal from './AuthModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [isAuthenticated, isLoading]);

  // Add listener for successful authentication
  useEffect(() => {
    const handleAuthSuccess = () => {
      setShowAuthModal(false);
    };
    
    window.addEventListener('authSuccess', handleAuthSuccess);
    return () => {
      window.removeEventListener('authSuccess', handleAuthSuccess);
    };
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  // Render auth dialog if not authenticated
  return (
    <>
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <AuthModal />
        </DialogContent>
      </Dialog>
      
      {isAuthenticated ? children : (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold mb-4">Protected Content</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view this content.</p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
            onClick={() => setShowAuthModal(true)}
          >
            Sign In
          </button>
        </div>
      )}
    </>
  );
}

export default ProtectedRoute;