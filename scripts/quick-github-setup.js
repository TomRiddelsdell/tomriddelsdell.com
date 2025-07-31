#!/usr/bin/env node
/**
 * Quick GitHub CI/CD Setup Script
 * Sets up GitHub secrets and environments using the Octokit API directly
 */

import { Octokit } from '@octokit/rest';

// Configuration from environment variables - NEVER hardcode secrets!
const CONFIG = {
  awsAccountId: process.env.AWS_ACCOUNT_ID || '',
  stagingCertArn: process.env.STAGING_CERTIFICATE_ARN || '',
  productionCertArn: process.env.PRODUCTION_CERTIFICATE_ARN || '',
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || '',
  databaseUrl: process.env.DATABASE_URL || '',
  owner: process.env.GITHUB_OWNER || 'TomRiddelsdell',
  repo: process.env.GITHUB_REPO || 'tomriddelsdell.com'
};

class GitHubSetup {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }

  async setSecret(name, value) {
    console.log(`📝 Setting secret: ${name}`);
    
    try {
      // Get repository public key
      const { data: publicKey } = await this.octokit.rest.actions.getRepoPublicKey({
        owner: CONFIG.owner,
        repo: CONFIG.repo,
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
        owner: CONFIG.owner,
        repo: CONFIG.repo,
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
        owner: CONFIG.owner,
        repo: CONFIG.repo,
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
    console.log('🔗 Go to: https://github.com/TomRiddelsdell/tomriddelsdell.com/settings/secrets/actions');
    console.log('');
    console.log('Click "New repository secret" for each:');
    console.log('');

    const secrets = [
      ['AWS_STAGING_ROLE_ARN', `arn:aws:iam::${CONFIG.awsAccountId}:role/GitHubActions-Staging-Role`],
      ['AWS_PRODUCTION_ROLE_ARN', `arn:aws:iam::${CONFIG.awsAccountId}:role/GitHubActions-Production-Role`],
      ['AWS_MONITORING_ROLE_ARN', `arn:aws:iam::${CONFIG.awsAccountId}:role/GitHubActions-Monitoring-Role`],
      ['STAGING_DOMAIN_NAME', 'dev.tomriddelsdell.com'],
      ['STAGING_CERTIFICATE_ARN', CONFIG.stagingCertArn],
      ['STAGING_COGNITO_USER_POOL_ID', CONFIG.cognitoUserPoolId],
      ['STAGING_DATABASE_URL', CONFIG.databaseUrl],
      ['PRODUCTION_DOMAIN_NAME', 'tomriddelsdell.com'],
      ['PRODUCTION_CERTIFICATE_ARN', CONFIG.productionCertArn],
      ['PRODUCTION_COGNITO_USER_POOL_ID', CONFIG.cognitoUserPoolId],
      ['PRODUCTION_DATABASE_URL', CONFIG.databaseUrl],
    ];

    secrets.forEach(([name, value], index) => {
      console.log(`${index + 1}. Name: ${name}`);
      console.log(`   Value: ${value}`);
      console.log('');
    });

    console.log('🌍 Then create environments:');
    console.log('🔗 Go to: https://github.com/TomRiddelsdell/tomriddelsdell.com/settings/environments');
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
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.log('❌ GITHUB_TOKEN environment variable required');
    console.log('');
    console.log('Create a token at: https://github.com/settings/tokens');
    console.log('Required scopes: repo, workflow, admin:repo_hook');
    console.log('');
    console.log('Then run: export GITHUB_TOKEN="your_token"');
    process.exit(1);
  }

  const setup = new GitHubSetup(token);
  await setup.quickSetup();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { GitHubSetup };
