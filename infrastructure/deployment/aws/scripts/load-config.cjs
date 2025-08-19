#!/usr/bin/env node

// Simple configuration loader for deployment scripts (CommonJS version)
// Load environment variables FIRST before requiring config

// Load .env file before requiring any modules (suppress dotenv output)
require('dotenv').config({ quiet: true });

// Now require config after environment variables are loaded
const config = require('config');

try {
  // Determine environment from ENVIRONMENT variable or default to production
  const environment = process.env.ENVIRONMENT || 'production';
  
  // Load configuration using the Node.js config package
  const deploymentConfig = {
    domainName: config.get('domain.name') || 'tomriddelsdell.com',
    certificateArn: environment === 'staging' 
      ? config.get('integration.github.deployment.stagingCertArn')
      : config.get('integration.github.deployment.productionCertArn'),
    databaseUrl: config.get('database.url'),
    cognitoUserPoolId: config.get('cognito.userPoolId'),
    environment: environment
  };
  
  // Validate required configuration
  const requiredFields = ['certificateArn', 'databaseUrl', 'cognitoUserPoolId'];
  const missingFields = requiredFields.filter(field => !deploymentConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('Missing required configuration fields:', missingFields);
    process.exit(1);
  }
  
  // Output configuration in JSON format for shell script consumption
  console.log(JSON.stringify(deploymentConfig, null, 2));
} catch (error) {
  console.error('Failed to load configuration:', error.message);
  process.exit(1);
}
