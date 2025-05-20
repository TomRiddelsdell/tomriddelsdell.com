import { Authenticator } from '@aws-amplify/ui-react'
import { AuthContext, User } from './Auth';

export const AuthProvider = () => {

  return (
    <Authenticator>
      {({ user }) => (
        <AuthContext.Provider value={{ user: user as User }} />
      )}
    </Authenticator>
  );
};
