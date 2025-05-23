import { Amplify } from 'aws-amplify';

// Configure Amplify with your existing Cognito settings
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-2_g2Bs4XiwN',
      userPoolClientId: '5ul4gn8k517s87iv49t6qd9l1m',
      loginWith: {
        email: true,
      },
      region: 'eu-west-2',
    },
  },
};

// Initialize Amplify
Amplify.configure(amplifyConfig);

export default amplifyConfig;