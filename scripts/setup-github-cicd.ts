#!/usr/bin/env node
/**
 * GitHub CI/CD Setup Script
 * Automates the complete GitHub repository configuration for CI/CD pipeline
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';

interface SetupConfig {
  githubToken: string;
  awsAccountId: string;
  stagingCertArn: string;
  productionCertArn: string;
  cognitoUserPoolId: string;
  databaseUrl: string;
  owner: string;
  repo: string;
}

class GitHubCICDSetup {
  private config: SetupConfig;
  private apiBase = 'https://api.github.com';

  constructor(config: SetupConfig) {
    this.config = config;
  }

  private async githubRequest(endpoint: string, method = 'GET', data?: any) {
    const url = `${this.apiBase}${endpoint}`;
    const options: any = {
      method,
      headers: {
        'Authorization': `token ${this.config.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'tomriddelsdell-cicd-setup'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    return response.json();
  }

  private async encryptSecret(value: string): Promise<{ encrypted_value: string, key_id: string }> {
    // Get repository public key
    const publicKeyData = await this.githubRequest(`/repos/${this.config.owner}/${this.config.repo}/actions/secrets/public-key`);
    
    // Use Node.js crypto for encryption (simpler than sodium-native in script)
    const crypto = await import('crypto');
    const sodium = await import('sodium-native');
    
    const messageBytes = Buffer.from(value);
    const keyBytes = Buffer.from(publicKeyData.key, 'base64');
    const encryptedBytes = Buffer.alloc(messageBytes.length + sodium.crypto_box_SEALBYTES);
    
    sodium.crypto_box_seal(encryptedBytes, messageBytes, keyBytes);
    
    return {
      encrypted_value: encryptedBytes.toString('base64'),
      key_id: publicKeyData.key_id
    };
  }

  async setSecret(name: string, value: string): Promise<void> {
    console.log(`📝 Setting secret: ${name}`);
    
    try {
      const encrypted = await this.encryptSecret(value);
      
      await this.githubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/actions/secrets/${name}`,
        'PUT',
        encrypted
      );
      
      console.log(`✅ Secret ${name} set successfully`);
    } catch (error) {
      console.error(`❌ Failed to set secret ${name}:`, error);
      throw error;
    }
  }

  async createEnvironment(name: string, options: {
    deploymentBranches?: string[];
    requiredReviewers?: string[];
    waitTimer?: number;
  } = {}): Promise<void> {
    console.log(`🌍 Creating environment: ${name}`);
    
    try {
      // Create environment
      await this.githubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/environments/${name}`,
        'PUT',
        {
          deployment_branch_policy: options.deploymentBranches ? {
            protected_branches: false,
            custom_branch_policies: true
          } : null
        }
      );

      // Set deployment branch policies
      if (options.deploymentBranches) {
        for (const branch of options.deploymentBranches) {
          await this.githubRequest(
            `/repos/${this.config.owner}/${this.config.repo}/environments/${name}/deployment-branch-policies`,
            'POST',
            { name: branch }
          );
        }
      }

      // Set protection rules
      if (options.requiredReviewers || options.waitTimer) {
        const protectionRules: any[] = [];

        if (options.requiredReviewers) {
          protectionRules.push({
            type: 'required_reviewers',
            reviewers: options.requiredReviewers.map(reviewer => ({
              type: 'User',
              id: reviewer
            }))
          });
        }

        if (options.waitTimer !== undefined) {
          protectionRules.push({
            type: 'wait_timer',
            wait_timer: options.waitTimer
          });
        }

        await this.githubRequest(
          `/repos/${this.config.owner}/${this.config.repo}/environments/${name}/protection-rules`,
          'PUT',
          { protection_rules: protectionRules }
        );
      }

      console.log(`✅ Environment ${name} created successfully`);
    } catch (error) {
      console.error(`❌ Failed to create environment ${name}:`, error);
      throw error;
    }
  }

  async setupAllSecrets(): Promise<void> {
    const secrets = [
      // AWS Role ARNs
      ['AWS_STAGING_ROLE_ARN', `arn:aws:iam::${this.config.awsAccountId}:role/GitHubActions-Staging-Role`],
      ['AWS_PRODUCTION_ROLE_ARN', `arn:aws:iam::${this.config.awsAccountId}:role/GitHubActions-Production-Role`],
      ['AWS_MONITORING_ROLE_ARN', `arn:aws:iam::${this.config.awsAccountId}:role/GitHubActions-Monitoring-Role`],
      
      // Staging Environment
      ['STAGING_DOMAIN_NAME', 'dev.tomriddelsdell.com'],
      ['STAGING_CERTIFICATE_ARN', this.config.stagingCertArn],
      ['STAGING_COGNITO_USER_POOL_ID', this.config.cognitoUserPoolId],
      ['STAGING_DATABASE_URL', this.config.databaseUrl],
      
      // Production Environment
      ['PRODUCTION_DOMAIN_NAME', 'tomriddelsdell.com'],
      ['PRODUCTION_CERTIFICATE_ARN', this.config.productionCertArn],
      ['PRODUCTION_COGNITO_USER_POOL_ID', this.config.cognitoUserPoolId],
      ['PRODUCTION_DATABASE_URL', this.config.databaseUrl],
    ];

    console.log(`🔐 Setting up ${secrets.length} repository secrets...`);
    
    for (const [name, value] of secrets) {
      await this.setSecret(name, value);
    }
  }

  async setupEnvironments(): Promise<void> {
    console.log('🌍 Setting up deployment environments...');
    
    // Create staging environment
    await this.createEnvironment('staging', {
      deploymentBranches: ['develop']
    });

    // Create production environment with protection
    await this.createEnvironment('production', {
      deploymentBranches: ['main'],
      requiredReviewers: [this.config.owner],
      waitTimer: 0
    });
  }

  async setupComplete(): Promise<void> {
    console.log('🚀 Starting complete GitHub CI/CD setup...\n');
    
    try {
      // Set up all secrets
      await this.setupAllSecrets();
      console.log('');
      
      // Set up environments
      await this.setupEnvironments();
      console.log('');
      
      console.log('🎉 GitHub CI/CD setup complete!');
      console.log('');
      console.log('✅ Created repository secrets');
      console.log('✅ Created staging environment (deploys from develop branch)');
      console.log('✅ Created production environment (deploys from main branch with approval)');
      console.log('');
      console.log('🔗 Next steps:');
      console.log('1. Validate SSL certificates in AWS Console');
      console.log('2. Test the pipeline by creating a PR');
      console.log('3. Deploy to staging by pushing to develop branch');
      console.log('4. Deploy to production by merging to main branch');
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  // Check for GitHub token
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.error('');
    console.error('Create a Personal Access Token at: https://github.com/settings/tokens');
    console.error('Required scopes: repo, workflow, admin:repo_hook');
    process.exit(1);
  }

  // Configuration from environment or command line arguments
  const config: SetupConfig = {
    githubToken,
    awsAccountId: process.env.AWS_ACCOUNT_ID || '',
    stagingCertArn: process.env.STAGING_CERTIFICATE_ARN || '',
    productionCertArn: process.env.PRODUCTION_CERTIFICATE_ARN || '',
    cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || '',
    databaseUrl: process.env.DATABASE_URL || '',
    owner: process.env.GITHUB_OWNER || 'TomRiddelsdell',
    repo: process.env.GITHUB_REPO || 'tomriddelsdell.com'
  };

  // Validate required configuration
  const requiredFields = ['awsAccountId', 'stagingCertArn', 'productionCertArn'];
  const missingFields = requiredFields.filter(field => !config[field as keyof SetupConfig]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required configuration:');
    missingFields.forEach(field => console.error(`   - ${field}`));
    console.error('\n💡 Set these environment variables:');
    console.error('   export AWS_ACCOUNT_ID="your_aws_account_id"');
    console.error('   export STAGING_CERTIFICATE_ARN="your_staging_cert_arn"');
    console.error('   export PRODUCTION_CERTIFICATE_ARN="your_production_cert_arn"');
    console.error('\n🔒 Values can be found in GITHUB_SETUP_COMPLETE.md');
    process.exit(1);
  }

  const setup = new GitHubCICDSetup(config);
  await setup.setupComplete();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { GitHubCICDSetup };
