import { CognitoIdentityProviderClient, UpdateUserPoolClientCommand, DescribeUserPoolClientCommand } from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({
  region: process.env.VITE_AWS_COGNITO_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function setupStableAuth() {
  const userPoolId = process.env.VITE_AWS_COGNITO_USER_POOL_ID;
  const clientId = process.env.VITE_AWS_COGNITO_CLIENT_ID;
  
  // Use your deployed Replit app domain as the stable URL
  const stableDomain = 'https://tomriddelsdell.replit.app';

  console.log('Setting up stable authentication with domain:', stableDomain);

  try {
    // Get current configuration
    const describeCommand = new DescribeUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
    });

    const currentConfig = await client.send(describeCommand);
    
    // Set stable callback URLs that won't change
    const stableCallbackUrls = [
      `${stableDomain}/auth/callback`,
      'https://tomriddelsdell.com/auth/callback'
    ];

    const stableLogoutUrls = [
      stableDomain,
      'https://tomriddelsdell.com'
    ];

    // Update Cognito with stable URLs
    const updateCommand = new UpdateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      CallbackURLs: stableCallbackUrls,
      LogoutURLs: stableLogoutUrls,
      AllowedOAuthFlows: currentConfig.UserPoolClient.AllowedOAuthFlows,
      AllowedOAuthScopes: currentConfig.UserPoolClient.AllowedOAuthScopes,
      AllowedOAuthFlowsUserPoolClient: currentConfig.UserPoolClient.AllowedOAuthFlowsUserPoolClient,
      SupportedIdentityProviders: currentConfig.UserPoolClient.SupportedIdentityProviders,
    });

    await client.send(updateCommand);
    
    console.log('AWS Cognito configured with stable URLs:');
    console.log('Callback URLs:', stableCallbackUrls);
    console.log('Logout URLs:', stableLogoutUrls);
    console.log('');
    console.log('Add these environment variables to your Replit Secrets:');
    console.log('PRODUCTION_DOMAIN=' + stableDomain);
    console.log('USE_PRODUCTION_DOMAIN_FOR_DEV=true');

  } catch (error) {
    console.error('Error setting up stable authentication:', error);
    process.exit(1);
  }
}

setupStableAuth();