import { McpClient } from '@modelcontextprotocol/client';
import { McpServer } from '@modelcontextprotocol/server';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio.js';
import { spawn } from 'child_process';

/**
 * GitHub MCP Client - provides automated GitHub repository management
 */
export class GitHubMCPClient {
  private client: McpClient;
  private initialized = false;

  constructor() {
    this.client = new McpClient();
  }

  /**
   * Initialize the connection to GitHub MCP server
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Connect via HTTP to the GitHub MCP server running in container
      const endpoint = process.env.GITHUB_MCP_ENDPOINT || 'http://github-mcp:8003';
      
      // For now, we'll use stdio transport locally, but this could be HTTP transport
      const serverProcess = spawn('node', ['/workspaces/infrastructure/mcp/dist/github-mcp-server.js'], {
        stdio: 'pipe',
        env: process.env
      });

      const transport = new StdioClientTransport(
        serverProcess.stdout,
        serverProcess.stdin
      );

      await this.client.connect(transport);
      this.initialized = true;
      console.log('✅ GitHub MCP Client connected');
    } catch (error) {
      console.error('❌ Failed to connect to GitHub MCP server:', error);
      throw error;
    }
  }

  /**
   * Set a repository secret
   */
  async setSecret(name: string, value: string): Promise<void> {
    await this.initialize();
    
    try {
      const result = await this.client.callTool('github_set_secret', {
        name,
        value
      });
      console.log(`✅ Secret ${name} set:`, result);
    } catch (error) {
      console.error(`❌ Failed to set secret ${name}:`, error);
      throw error;
    }
  }

  /**
   * Create a deployment environment
   */
  async createEnvironment(name: string, options: {
    deploymentBranches?: string[];
    requiredReviewers?: string[];
    waitTimer?: number;
  } = {}): Promise<void> {
    await this.initialize();
    
    try {
      const result = await this.client.callTool('github_create_environment', {
        name,
        ...options
      });
      console.log(`✅ Environment ${name} created:`, result);
    } catch (error) {
      console.error(`❌ Failed to create environment ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(): Promise<any> {
    await this.initialize();
    
    try {
      const result = await this.client.callTool('github_get_repo_info', {});
      return JSON.parse(result.content[0].text);
    } catch (error) {
      console.error('❌ Failed to get repository info:', error);
      throw error;
    }
  }

  /**
   * List all repository secrets
   */
  async listSecrets(): Promise<string[]> {
    await this.initialize();
    
    try {
      const result = await this.client.callTool('github_list_secrets', {});
      return result.content[0].text.replace('Repository secrets: ', '').split(', ');
    } catch (error) {
      console.error('❌ Failed to list secrets:', error);
      throw error;
    }
  }

  /**
   * List all deployment environments
   */
  async listEnvironments(): Promise<any[]> {
    await this.initialize();
    
    try {
      const result = await this.client.callTool('github_list_environments', {});
      return JSON.parse(result.content[0].text);
    } catch (error) {
      console.error('❌ Failed to list environments:', error);
      throw error;
    }
  }

  /**
   * Set branch protection rules
   */
  async setBranchProtection(branch: string, options: {
    requiredStatusChecks?: boolean;
    enforceAdmins?: boolean;
    requiredPullRequestReviews?: boolean;
  } = {}): Promise<void> {
    await this.initialize();
    
    try {
      const result = await this.client.callTool('github_set_branch_protection', {
        branch,
        ...options
      });
      console.log(`✅ Branch protection set for ${branch}:`, result);
    } catch (error) {
      console.error(`❌ Failed to set branch protection for ${branch}:`, error);
      throw error;
    }
  }

  /**
   * Complete CI/CD setup with all secrets and environments
   */
  async setupCompleteCICD(config: {
    awsAccountId: string;
    stagingCertArn: string;
    productionCertArn: string;
    cognitoUserPoolId?: string;
    databaseUrl?: string;
  }): Promise<void> {
    await this.initialize();
    
    try {
      const result = await this.client.callTool('github_setup_cicd_complete', config);
      console.log('🎉 Complete CI/CD setup finished:', result.content[0].text);
    } catch (error) {
      console.error('❌ Failed to complete CI/CD setup:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the GitHub MCP server
   */
  async disconnect(): Promise<void> {
    if (this.initialized) {
      await this.client.close();
      this.initialized = false;
      console.log('✅ GitHub MCP Client disconnected');
    }
  }
}

// Export a singleton instance
export const githubMCP = new GitHubMCPClient();
