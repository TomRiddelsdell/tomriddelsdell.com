#!/usr/bin/env node
/**
 * Secure GitHub Secrets Setup
 * Uses environment variables only - no hardcoded secrets
 */

import { Octokit } from '@octokit/rest';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

class SecureGitHubSetup {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
    this.owner = process.env.GITHUB_OWNER || 'TomRiddelsdell';
    this.repo = process.env.GITHUB_REPO || 'tomriddelsdell.com';
  }

  validateEnvironment() {
    const required = [
      'GITHUB_TOKEN',
      'AWS_ACCOUNT_ID',
      'STAGING_CERTIFICATE_ARN',
      'PRODUCTION_CERTIFICATE_ARN',
      'COGNITO_USER_POOL_ID',
      'DATABASE_URL'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.log('❌ Missing required environment variables:');
      missing.forEach(key => console.log(`   - ${key}`));
      console.log('\n💡 Create a .env file with these values:');
      console.log('   cp .env.template .env');
      console.log('   # Edit .env with your actual values');
      console.log('\n🔒 Values can be found in GITHUB_SETUP_COMPLETE.md');
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
      ['AWS_STAGING_ROLE_ARN', `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/GitHubActions-Staging-Role`],
      ['AWS_PRODUCTION_ROLE_ARN', `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/GitHubActions-Production-Role`],
      ['AWS_MONITORING_ROLE_ARN', `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/GitHubActions-Monitoring-Role`],
      ['STAGING_DOMAIN_NAME', 'dev.tomriddelsdell.com'],
      ['STAGING_CERTIFICATE_ARN', process.env.STAGING_CERTIFICATE_ARN],
      ['STAGING_COGNITO_USER_POOL_ID', process.env.COGNITO_USER_POOL_ID],
      ['STAGING_DATABASE_URL', process.env.DATABASE_URL],
      ['PRODUCTION_DOMAIN_NAME', 'tomriddelsdell.com'],
      ['PRODUCTION_CERTIFICATE_ARN', process.env.PRODUCTION_CERTIFICATE_ARN],
      ['PRODUCTION_COGNITO_USER_POOL_ID', process.env.COGNITO_USER_POOL_ID],
      ['PRODUCTION_DATABASE_URL', process.env.DATABASE_URL],
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
    console.log('🚀 Secure GitHub CI/CD Setup\n');

    // Validate environment
    if (!this.validateEnvironment()) {
      process.exit(1);
    }

    try {
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
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.log('❌ GITHUB_TOKEN environment variable required');
    console.log('\n💡 Add to your .env file:');
    console.log('   GITHUB_TOKEN=github_pat_your_token_here');
    console.log('\n🔗 Create token at: https://github.com/settings/tokens');
    process.exit(1);
  }

  const setup = new SecureGitHubSetup(token);
  await setup.setup();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SecureGitHubSetup };
