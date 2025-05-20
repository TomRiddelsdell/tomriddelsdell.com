import { createContext } from 'react';
import { useContext } from 'react';
import { availableApps } from './AppConfig';
import { AppAccessScope } from './AppAccessScope';

export interface User {
  signInDetails: {
    loginId: string;
  };
}

export interface AuthContextType {
  user: User | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(){
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useVisibleApps()
{
  const { user } = useAuth();

  return availableApps.filter((app) => user ? true : app.access == AppAccessScope.public)
}