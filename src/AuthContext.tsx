import { Authenticator } from '@aws-amplify/ui-react'
import { AuthContext, User } from './Auth';
import { ReactNode } from 'react';


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <AuthContext.Provider value={{ user: user as User, signOut: signOut || (() => {}) }}>
          {children}
        </AuthContext.Provider>
      )}
    </Authenticator>
  );
};

