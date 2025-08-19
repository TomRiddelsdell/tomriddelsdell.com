#!/usr/bin/env tsx

/**
 * Production Deployment Script using Centralized Configuration
 * 
 * This script uses the centralized configuration system to load all required
 * environment variables and then executes the deployment process.
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getConfig } from '../../../configuration/node-config-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function deployWithConfig() {
  try {
    console.log('🔧 Loading configuration from centralized config system...');
    
    // Load configuration using the centralized system
    const config = getConfig();
    
    console.log('✅ Configuration loaded successfully');
    console.log(`   - Environment: ${config.environment}`);
    console.log(`   - Database URL: ${config.database.url ? '✓ Set' : '✗ Missing'}`);
    console.log(`   - Cognito User Pool ID: ${config.cognito.userPoolId ? '✓ Set' : '✗ Missing'}`);
    console.log(`   - AWS Account ID: ${config.integration.github.deployment?.awsAccountId ? '✓ Set' : '✗ Missing'}`);
    console.log(`   - Production Certificate ARN: ${config.integration.github.deployment?.productionCertArn ? '✓ Set' : '✗ Missing'}`);
    
    // Validate required configuration
    if (!config.database.url) {
      throw new Error('DATABASE_URL is required but not configured');
    }
    
    if (!config.cognito.userPoolId) {
      throw new Error('COGNITO_USER_POOL_ID is required but not configured');
    }
    
    if (!config.integration.github.deployment?.awsAccountId) {
      throw new Error('AWS_ACCOUNT_ID is required but not configured in integration.github.deployment');
    }
    
    if (!config.integration.github.deployment?.productionCertArn) {
      throw new Error('PRODUCTION_CERTIFICATE_ARN is required but not configured in integration.github.deployment');
    }
    
    console.log('🚀 Starting deployment with loaded configuration...');
    
    // Set environment variables for the deployment script
    const deploymentEnv = {
      ...process.env,
      DATABASE_URL: config.database.url,
      COGNITO_USER_POOL_ID: config.cognito.userPoolId,
      AWS_ACCOUNT_ID: config.integration.github.deployment?.awsAccountId || '',
      PRODUCTION_CERTIFICATE_ARN: config.integration.github.deployment?.productionCertArn || '',
      NODE_ENV: 'production'
    };
    
    // Get the deployment script path
    const deploymentScript = resolve(__dirname, 'deploy-production.sh');
    
    console.log('🔨 Executing deployment script...');
    console.log(`   Script: ${deploymentScript}`);
    
    // Execute the deployment script with the loaded configuration
    execSync(`bash ${deploymentScript}`, {
      stdio: 'inherit',
      env: deploymentEnv,
      cwd: process.cwd()
    });
    
    console.log('✅ Deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Execute the deployment
deployWithConfig();
