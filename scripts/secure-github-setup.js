#!/usr/bin/env node
/**
 * Secure GitHub Secrets Setup
 * Uses centralized configuration service instead of direct environment variables
 */

import { Octokit } from '@octokit/rest';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { getConfig } from '../infrastructure/configuration/node-config-service.js';

// Load environment variables from .env file
dotenv.config();

class SecureGitHubSetup {
  constructor(token, config) {
    this.octokit = new Octokit({ auth: token });
    this.owner = config.integration.github.owner;
    this.repo = config.integration.github.repo;
    this.deploymentConfig = config.integration.github.deployment;
    this.cognitoConfig = config.cognito;
    this.databaseUrl = config.database.url;
  }

  validateConfiguration() {
    const required = [
      { name: 'GitHub Token', value: this.deploymentConfig.awsAccountId },
      { name: 'AWS Account ID', value: this.deploymentConfig.awsAccountId },
      { name: 'Staging Certificate ARN', value: this.deploymentConfig.stagingCertArn },
      { name: 'Production Certificate ARN', value: this.deploymentConfig.productionCertArn },
      { name: 'Cognito User Pool ID', value: this.cognitoConfig.userPoolId },
      { name: 'Database URL', value: this.databaseUrl }
    ];

    const missing = required.filter(item => !item.value || item.value === 'REQUIRED');
    
    if (missing.length > 0) {
      console.log('❌ Missing required configuration values:');
      missing.forEach(item => console.log(`   - ${item.name}`));
      console.log('\n💡 Set these environment variables or update configuration:');
      console.log('   - GITHUB_TOKEN, AWS_ACCOUNT_ID, STAGING_CERTIFICATE_ARN');
      console.log('   - PRODUCTION_CERTIFICATE_ARN, COGNITO_USER_POOL_ID, DATABASE_URL');
      console.log('\n🔒 Values can be found in deployment documentation');
      return false;
    }
    return true;
  }

  async createEnvironments() {
    console.log('🌍 Creating GitHub environments...');
    
    try {
      // Create staging environment
      await this.octokit.rest.repos.createOrUpdateEnvironment({
        owner: this.owner,
        repo: this.repo,
        environment_name: 'staging',
      });
      console.log('✅ Staging environment created');

      // Create production environment  
      await this.octokit.rest.repos.createOrUpdateEnvironment({
        owner: this.owner,
        repo: this.repo,
        environment_name: 'production',
      });
      console.log('✅ Production environment created');

    } catch (error) {
      console.error('❌ Failed to create environments:', error.message);
      throw error;
    }
  }

  generateSecretsList() {
    const secrets = [
      ['AWS_STAGING_ROLE_ARN', `arn:aws:iam::${this.deploymentConfig.awsAccountId}:role/GitHubActions-Staging-Role`],
      ['AWS_PRODUCTION_ROLE_ARN', `arn:aws:iam::${this.deploymentConfig.awsAccountId}:role/GitHubActions-Production-Role`],
      ['AWS_MONITORING_ROLE_ARN', `arn:aws:iam::${this.deploymentConfig.awsAccountId}:role/GitHubActions-Monitoring-Role`],
      ['STAGING_DOMAIN_NAME', 'dev.tomriddelsdell.com'],
      ['STAGING_CERTIFICATE_ARN', this.deploymentConfig.stagingCertArn],
      ['STAGING_COGNITO_USER_POOL_ID', this.cognitoConfig.userPoolId],
      ['STAGING_DATABASE_URL', this.databaseUrl],
      ['PRODUCTION_DOMAIN_NAME', 'tomriddelsdell.com'],
      ['PRODUCTION_CERTIFICATE_ARN', this.deploymentConfig.productionCertArn],
      ['PRODUCTION_COGNITO_USER_POOL_ID', this.cognitoConfig.userPoolId],
      ['PRODUCTION_DATABASE_URL', this.databaseUrl],
    ];

    console.log('\n📝 GitHub CLI Commands (recommended):');
    console.log('# Run these commands to set all secrets securely:\n');
    
    secrets.forEach(([name, value]) => {
      console.log(`gh secret set ${name} --body "${value}" --repo ${this.owner}/${this.repo}`);
    });

    console.log('\n🎯 OR manually via web interface:');
    console.log(`🔗 https://github.com/${this.owner}/${this.repo}/settings/secrets/actions\n`);

    return secrets;
  }

  async setup() {
    console.log('🚀 Secure GitHub CI/CD Setup using centralized configuration\n');

    // Validate configuration
    if (!this.validateConfiguration()) {
      process.exit(1);
    }

    try {
      console.log('✅ Configuration validated successfully');
      console.log(`   GitHub: ${this.owner}/${this.repo}`);
      console.log(`   AWS Account: ${this.deploymentConfig.awsAccountId}`);
      console.log('');

      // Create environments
      await this.createEnvironments();
      
      // Generate secrets list
      const secrets = this.generateSecretsList();
      
      console.log(`\n✅ Setup complete! ${secrets.length} secrets ready to configure.`);
      console.log('\n🎉 Your CI/CD pipeline will be active once secrets are set!');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    }
  }
}

async function main() {
  // Load centralized configuration
  let config;
  try {
    config = getConfig();
  } catch (error) {
    console.log('❌ Failed to load configuration:', error.message);
    console.log('💡 Ensure all required environment variables are set');
    process.exit(1);
  }

  const token = config.integration.github.token;
  
  if (!token || token === 'REQUIRED' || token === '') {
    console.log('❌ GITHUB_TOKEN not configured');
    console.log('\n💡 Set your GitHub token:');
    console.log('   export GITHUB_TOKEN="github_pat_your_token_here"');
    console.log('\n🔗 Create token at: https://github.com/settings/tokens');
    process.exit(1);
  }

  const setup = new SecureGitHubSetup(token, config);
  await setup.setup();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SecureGitHubSetup };
