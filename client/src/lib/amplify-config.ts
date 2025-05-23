import { Amplify } from 'aws-amplify';

// Configure Amplify with your existing Cognito settings
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-2_g2Bs4XiwN',
      userPoolClientId: '483n96q9sudb248kp2sgto7i47',
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