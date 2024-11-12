import { createContext } from 'react';
import { useContext } from 'react';

export interface User {
  signInDetails: {
    loginId: string;
  };
}

interface AuthContextType {
  user: User | null;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
