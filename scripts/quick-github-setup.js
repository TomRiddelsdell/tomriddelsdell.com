#!/usr/bin/env node
/**
 * Quick GitHub CI/CD Setup Script
 * Uses centralized configuration service instead of direct environment variables
 */

import { Octokit } from '@octokit/rest';
import { getConfig } from '../infrastructure/configuration/node-config-service.js';

class GitHubSetup {
  constructor(token, config) {
    this.octokit = new Octokit({ auth: token });
    this.owner = config.integration.github.owner;
    this.repo = config.integration.github.repo;
    this.deploymentConfig = config.integration.github.deployment;
    this.cognitoConfig = config.cognito;
    this.databaseUrl = config.database.url;
  }

  async setSecret(name, value) {
    console.log(`📝 Setting secret: ${name}`);
    
    try {
      // Get repository public key
      const { data: publicKey } = await this.octokit.rest.actions.getRepoPublicKey({
        owner: this.owner,
        repo: this.repo,
      });

      // For simplicity, we'll use the GitHub CLI approach or manual setup
      // as the encryption is complex without proper crypto libraries
      console.log(`   Secret ${name} ready to set (requires manual setup for now)`);
      
      return { name, value, keyId: publicKey.key_id };
    } catch (error) {
      console.error(`❌ Failed to prepare secret ${name}:`, error.message);
      throw error;
    }
  }

  async createEnvironment(name, options = {}) {
    console.log(`🌍 Creating environment: ${name}`);
    
    try {
      // Create environment
      await this.octokit.rest.repos.createOrUpdateEnvironment({
        owner: this.owner,
        repo: this.repo,
        environment_name: name,
      });

      console.log(`✅ Environment ${name} created successfully`);
    } catch (error) {
      console.error(`❌ Failed to create environment ${name}:`, error.message);
      throw error;
    }
  }

  async verifySetup() {
    console.log('🔍 Verifying GitHub repository access...');
    
    try {
      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      
      console.log(`✅ Repository access confirmed: ${repo.full_name}`);
      return true;
    } catch (error) {
      console.error('❌ Cannot access repository:', error.message);
      return false;
    }
  }

  async showManualInstructions() {
    console.log('\n📋 MANUAL SETUP INSTRUCTIONS');
    console.log('=' .repeat(50));
    console.log('');
    console.log(`🔗 Go to: https://github.com/${this.owner}/${this.repo}/settings/secrets/actions`);
    console.log('');
    console.log('Click "New repository secret" for each:');
    console.log('');

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

    secrets.forEach(([name, value], index) => {
      console.log(`${index + 1}. Name: ${name}`);
      console.log(`   Value: ${value}`);
      console.log('');
    });

    console.log('🌍 Then create environments:');
    console.log(`🔗 Go to: https://github.com/${this.owner}/${this.repo}/settings/environments`);
    console.log('');
    console.log('1. Create "staging" environment - deployment branches: develop');
    console.log('2. Create "production" environment - deployment branches: main, required reviewers: TomRiddelsdell');
  }

  async quickSetup() {
    console.log('🚀 GitHub CI/CD Quick Setup');
    console.log('');

    // Verify access
    const hasAccess = await this.verifySetup();
    if (!hasAccess) {
      console.log('❌ Setup failed - cannot access repository');
      return;
    }

    try {
      // Create environments (this part can be automated)
      await this.createEnvironment('staging');
      await this.createEnvironment('production');
      
      console.log('');
      console.log('✅ Environments created successfully!');
      console.log('');
      
      // Show manual instructions for secrets
      await this.showManualInstructions();
      
      console.log('');
      console.log('🎉 Once secrets are added manually, your CI/CD pipeline will be fully active!');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
    }
  }
}

// Main execution
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
    console.log('');
    console.log('Create a token at: https://github.com/settings/tokens');
    console.log('Required scopes: repo, workflow, admin:repo_hook');
    console.log('');
    console.log('Then set: export GITHUB_TOKEN="your_token"');
    process.exit(1);
  }

  console.log('✅ Configuration loaded successfully from Node Config service');
  console.log(`   GitHub: ${config.integration.github.owner}/${config.integration.github.repo}`);
  console.log('');

  const setup = new GitHubSetup(token, config);
  await setup.quickSetup();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { GitHubSetup };
