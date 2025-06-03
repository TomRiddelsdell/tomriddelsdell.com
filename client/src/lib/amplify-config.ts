import { Amplify } from 'aws-amplify';

// Configure Amplify with your existing Cognito settings
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID,
      loginWith: {
        email: true,
      },
      region: import.meta.env.VITE_AWS_REGION,
    },
  },
};

// Initialize Amplify
Amplify.configure(amplifyConfig);

export default amplifyConfig;