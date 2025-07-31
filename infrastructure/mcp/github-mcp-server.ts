import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';
import { z } from 'zod';

// GitHub API client
class GitHubMCPServer {
  private octokit: Octokit;
  public owner: string;
  public repo: string;

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    
    if (!owner) {
      throw new Error('GITHUB_OWNER environment variable is required');
    }
    
    if (!repo) {
      throw new Error('GITHUB_REPO environment variable is required');
    }

    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  // Repository Secrets Management
  async setRepositorySecret(name: string, value: string): Promise<void> {
    try {
      // Get the repository public key for encryption
      const { data: publicKey } = await this.octokit.rest.actions.getRepoPublicKey({
        owner: this.owner,
        repo: this.repo,
      });

      // Use tweetnacl for encryption (lighter alternative to sodium-native)
      const nacl = await import('tweetnacl');
      const sealedBox = await import('tweetnacl-sealedbox-js');
      const util = await import('tweetnacl-util');
      
      const messageBytes = util.decodeUTF8(value);
      const keyBytes = util.decodeBase64(publicKey.key);
      const encrypted = sealedBox.seal(messageBytes, keyBytes);
      const encryptedValue = util.encodeBase64(encrypted);

      // Create or update the secret
      await this.octokit.rest.actions.createOrUpdateRepoSecret({
        owner: this.owner,
        repo: this.repo,
        secret_name: name,
        encrypted_value: encryptedValue,
        key_id: publicKey.key_id,
      });

      console.log(`✅ Secret ${name} created/updated successfully`);
    } catch (error) {
      console.error(`❌ Failed to set secret ${name}:`, error);
      throw error;
    }
  }

  // Environment Management
  async createEnvironment(name: string, config: {
    deploymentBranches?: string[];
    requiredReviewers?: string[];
    waitTimer?: number;
  } = {}): Promise<void> {
    try {
      // Create environment
      await this.octokit.rest.repos.createOrUpdateEnvironment({
        owner: this.owner,
        repo: this.repo,
        environment_name: name,
        deployment_branch_policy: config.deploymentBranches ? {
          protected_branches: false,
          custom_branch_policies: true,
        } : undefined,
      });

      // Set deployment branch policies if specified
      if (config.deploymentBranches) {
        for (const branch of config.deploymentBranches) {
          await this.octokit.request('POST /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies', {
            owner: this.owner,
            repo: this.repo,
            environment_name: name,
            name: branch,
          });
        }
      }

      // Set protection rules if specified
      if (config.requiredReviewers || config.waitTimer) {
        const protectionRules: any[] = [];

        if (config.requiredReviewers) {
          protectionRules.push({
            type: 'required_reviewers',
            reviewers: config.requiredReviewers.map(reviewer => ({
              type: 'User',
              id: reviewer
            }))
          });
        }

        if (config.waitTimer) {
          protectionRules.push({
            type: 'wait_timer',
            wait_timer: config.waitTimer
          });
        }

        await this.octokit.request('PUT /repos/{owner}/{repo}/environments/{environment_name}/protection-rules', {
          owner: this.owner,
          repo: this.repo,
          environment_name: name,
          protection_rules: protectionRules,
        });
      }

      console.log(`✅ Environment ${name} created successfully`);
    } catch (error) {
      console.error(`❌ Failed to create environment ${name}:`, error);
      throw error;
    }
  }

  // Repository Information
  async getRepositoryInfo(): Promise<any> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      return data;
    } catch (error) {
      console.error('❌ Failed to get repository info:', error);
      throw error;
    }
  }

  // List Repository Secrets
  async listRepositorySecrets(): Promise<string[]> {
    try {
      const { data } = await this.octokit.rest.actions.listRepoSecrets({
        owner: this.owner,
        repo: this.repo,
      });
      return data.secrets.map((secret: { name: string }) => secret.name);
    } catch (error) {
      console.error('❌ Failed to list secrets:', error);
      throw error;
    }
  }

  // List Environments
  async listEnvironments(): Promise<any[]> {
    try {
      const { data } = await this.octokit.rest.repos.getAllEnvironments({
        owner: this.owner,
        repo: this.repo,
      });
      return data.environments || [];
    } catch (error) {
      console.error('❌ Failed to list environments:', error);
      throw error;
    }
  }

  // Branch Protection
  async setBranchProtection(branch: string, rules: {
    requiredStatusChecks?: boolean;
    enforceAdmins?: boolean;
    requiredPullRequestReviews?: boolean;
    restrictions?: any;
  } = {}): Promise<void> {
    try {
      await this.octokit.rest.repos.updateBranchProtection({
        owner: this.owner,
        repo: this.repo,
        branch,
        required_status_checks: rules.requiredStatusChecks ? {
          strict: true,
          contexts: ['ci/cd-pipeline']
        } : null,
        enforce_admins: rules.enforceAdmins || false,
        required_pull_request_reviews: rules.requiredPullRequestReviews ? {
          required_approving_review_count: 1,
          dismiss_stale_reviews: true
        } : null,
        restrictions: rules.restrictions || null,
      });

      console.log(`✅ Branch protection set for ${branch}`);
    } catch (error) {
      console.error(`❌ Failed to set branch protection for ${branch}:`, error);
      throw error;
    }
  }
}

// MCP Server setup
const server = new Server(
  {
    name: 'github-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize GitHub client
let githubClient: GitHubMCPServer;

try {
  githubClient = new GitHubMCPServer();
} catch (error) {
  console.error('Failed to initialize GitHub client:', error);
  process.exit(1);
}

// Tool definitions
const tools = [
  {
    name: 'github_set_secret',
    description: 'Set a repository secret in GitHub',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Secret name' },
        value: { type: 'string', description: 'Secret value' },
      },
      required: ['name', 'value'],
    },
  },
  {
    name: 'github_create_environment',
    description: 'Create a deployment environment in GitHub',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Environment name' },
        deploymentBranches: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Allowed deployment branches'
        },
        requiredReviewers: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Required reviewers (usernames)'
        },
        waitTimer: { type: 'number', description: 'Wait timer in minutes' },
      },
      required: ['name'],
    },
  },
  {
    name: 'github_get_repo_info',
    description: 'Get repository information',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'github_list_secrets',
    description: 'List all repository secrets',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'github_list_environments',
    description: 'List all deployment environments',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'github_set_branch_protection',
    description: 'Set branch protection rules',
    inputSchema: {
      type: 'object',
      properties: {
        branch: { type: 'string', description: 'Branch name' },
        requiredStatusChecks: { type: 'boolean', description: 'Require status checks' },
        enforceAdmins: { type: 'boolean', description: 'Enforce for admins' },
        requiredPullRequestReviews: { type: 'boolean', description: 'Require PR reviews' },
      },
      required: ['branch'],
    },
  },
  {
    name: 'github_setup_cicd_complete',
    description: 'Complete GitHub CI/CD setup with all secrets and environments',
    inputSchema: {
      type: 'object',
      properties: {
        awsAccountId: { type: 'string', description: 'AWS Account ID' },
        stagingCertArn: { type: 'string', description: 'Staging certificate ARN' },
        productionCertArn: { type: 'string', description: 'Production certificate ARN' },
        cognitoUserPoolId: { type: 'string', description: 'Cognito User Pool ID' },
        databaseUrl: { type: 'string', description: 'Database connection URL' },
        stagingDomainName: { type: 'string', description: 'Staging domain name' },
        productionDomainName: { type: 'string', description: 'Production domain name' },
      },
      required: ['awsAccountId', 'stagingCertArn', 'productionCertArn'],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request: { params: { name: string; arguments?: any } }) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error(`Missing arguments for tool ${name}`);
  }

  try {
    switch (name) {
      case 'github_set_secret':
        if (typeof args.name !== 'string' || typeof args.value !== 'string') {
          throw new Error('github_set_secret requires name and value as strings');
        }
        await githubClient.setRepositorySecret(args.name, args.value);
        return {
          content: [
            {
              type: 'text',
              text: `Secret ${args.name} set successfully`,
            },
          ],
        };

      case 'github_create_environment':
        if (typeof args.name !== 'string') {
          throw new Error('github_create_environment requires name as string');
        }
        await githubClient.createEnvironment(args.name, {
          deploymentBranches: args.deploymentBranches,
          requiredReviewers: args.requiredReviewers,
          waitTimer: args.waitTimer,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Environment ${args.name} created successfully`,
            },
          ],
        };

      case 'github_get_repo_info':
        const repoInfo = await githubClient.getRepositoryInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(repoInfo, null, 2),
            },
          ],
        };

      case 'github_list_secrets':
        const secrets = await githubClient.listRepositorySecrets();
        return {
          content: [
            {
              type: 'text',
              text: `Repository secrets: ${secrets.join(', ')}`,
            },
          ],
        };

      case 'github_list_environments':
        const environments = await githubClient.listEnvironments();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(environments, null, 2),
            },
          ],
        };

      case 'github_set_branch_protection':
        if (typeof args.branch !== 'string') {
          throw new Error('github_set_branch_protection requires branch as string');
        }
        await githubClient.setBranchProtection(args.branch, {
          requiredStatusChecks: args.requiredStatusChecks,
          enforceAdmins: args.enforceAdmins,
          requiredPullRequestReviews: args.requiredPullRequestReviews,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Branch protection set for ${args.branch}`,
            },
          ],
        };

      case 'github_setup_cicd_complete':
        // Complete CI/CD setup with all required secrets and environments
        if (typeof args.awsAccountId !== 'string') {
          throw new Error('github_setup_cicd_complete requires awsAccountId as string');
        }
        const secrets_to_create = [
          // AWS Role ARNs
          ['AWS_STAGING_ROLE_ARN', `arn:aws:iam::${args.awsAccountId}:role/GitHubActions-Staging-Role`],
          ['AWS_PRODUCTION_ROLE_ARN', `arn:aws:iam::${args.awsAccountId}:role/GitHubActions-Production-Role`],
          ['AWS_MONITORING_ROLE_ARN', `arn:aws:iam::${args.awsAccountId}:role/GitHubActions-Monitoring-Role`],
          
          // Staging Environment
          ['STAGING_DOMAIN_NAME', args.stagingDomainName || process.env.STAGING_DOMAIN_NAME || ''],
          ['STAGING_CERTIFICATE_ARN', args.stagingCertArn || ''],
          ['STAGING_COGNITO_USER_POOL_ID', args.cognitoUserPoolId || process.env.COGNITO_USER_POOL_ID || ''],
          ['STAGING_DATABASE_URL', args.databaseUrl || process.env.DATABASE_URL || ''],
          
          // Production Environment
          ['PRODUCTION_DOMAIN_NAME', args.productionDomainName || process.env.PRODUCTION_DOMAIN_NAME || ''],
          ['PRODUCTION_CERTIFICATE_ARN', args.productionCertArn || ''],
          ['PRODUCTION_COGNITO_USER_POOL_ID', args.cognitoUserPoolId || process.env.COGNITO_USER_POOL_ID || ''],
          ['PRODUCTION_DATABASE_URL', args.databaseUrl || process.env.DATABASE_URL || ''],
        ];

        // Create all secrets
        for (const [name, value] of secrets_to_create) {
          await githubClient.setRepositorySecret(name, value);
        }

        // Create environments
        await githubClient.createEnvironment('staging', {
          deploymentBranches: ['develop'],
        });

        await githubClient.createEnvironment('production', {
          deploymentBranches: ['main'],
          requiredReviewers: [process.env.GITHUB_REQUIRED_REVIEWER || githubClient.owner],
          waitTimer: 0,
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ Complete CI/CD setup finished!\n\nCreated ${secrets_to_create.length} secrets and 2 environments.\n\nYour GitHub Actions CI/CD pipeline is now fully configured and ready to deploy!`,
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitHub MCP server running on stdio');
  
  // Simple health check (for Docker healthcheck)
  if (process.env.PORT) {
    const http = await import('http');
    const healthServer = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', service: 'github-mcp' }));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    
    healthServer.listen(process.env.PORT || 8003, () => {
      console.error(`Health check server running on port ${process.env.PORT || 8003}`);
    });
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
