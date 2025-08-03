/**
 * Neon MCP Client for PostgreSQL database operations
 * Communicates with the Neon MCP server running in the dev container
 */

interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface NeonProject {
  id: string;
  name: string;
  region_id: string;
  created_at: string;
  updated_at: string;
}

interface NeonDatabase {
  id: string;
  name: string;
  owner_name: string;
  created_at: string;
}

interface NeonBranch {
  id: string;
  name: string;
  primary: boolean;
  created_at: string;
  updated_at: string;
}

export class NeonMCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://neon-mcp:8003') {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the Neon MCP server is healthy
   */
  async health(): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Execute a Neon CLI command via MCP
   */
  async execute(command: string[]): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * List all Neon projects
   */
  async listProjects(): Promise<MCPResponse<NeonProject[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/projects`);
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * List databases for a project
   */
  async listDatabases(projectId: string): Promise<MCPResponse<NeonDatabase[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/databases?project_id=${projectId}`);
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * List branches for a project
   */
  async listBranches(projectId: string): Promise<MCPResponse<NeonBranch[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/branches?project_id=${projectId}`);
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Project management operations
   */
  projects = {
    /**
     * List all projects
     */
    list: () => this.listProjects(),

    /**
     * Get project details
     */
    get: (projectId: string) => 
      this.execute(['projects', 'get', projectId, '--output', 'json']),

    /**
     * Create a new project
     */
    create: (name: string, region?: string) => {
      const command = ['projects', 'create', '--name', name];
      if (region) {
        command.push('--region', region);
      }
      command.push('--output', 'json');
      return this.execute(command);
    },

    /**
     * Delete a project
     */
    delete: (projectId: string) => 
      this.execute(['projects', 'delete', projectId, '--output', 'json']),
  };

  /**
   * Database operations
   */
  databases = {
    /**
     * List databases for a project
     */
    list: (projectId: string) => this.listDatabases(projectId),

    /**
     * Create a database
     */
    create: (projectId: string, name: string, owner?: string) => {
      const command = ['databases', 'create', '--project-id', projectId, '--name', name];
      if (owner) {
        command.push('--owner', owner);
      }
      command.push('--output', 'json');
      return this.execute(command);
    },

    /**
     * Delete a database
     */
    delete: (projectId: string, databaseId: string) => 
      this.execute(['databases', 'delete', projectId, databaseId, '--output', 'json']),
  };

  /**
   * Branch operations
   */
  branches = {
    /**
     * List branches for a project
     */
    list: (projectId: string) => this.listBranches(projectId),

    /**
     * Create a branch
     */
    create: (projectId: string, name: string, parent?: string) => {
      const command = ['branches', 'create', '--project-id', projectId, '--name', name];
      if (parent) {
        command.push('--parent', parent);
      }
      command.push('--output', 'json');
      return this.execute(command);
    },

    /**
     * Delete a branch
     */
    delete: (projectId: string, branchId: string) => 
      this.execute(['branches', 'delete', projectId, branchId, '--output', 'json']),
  };

  /**
   * Connection string operations
   */
  connections = {
    /**
     * Get connection string for a database
     */
    string: (projectId: string, databaseName?: string, role?: string) => {
      const command = ['connection-string', '--project-id', projectId];
      if (databaseName) {
        command.push('--database-name', databaseName);
      }
      if (role) {
        command.push('--role-name', role);
      }
      return this.execute(command);
    },
  };
}

// Export singleton instance
export const neonMCP = new NeonMCPClient(
  process.env.NEON_MCP_ENDPOINT || 'http://localhost:8003'
);
