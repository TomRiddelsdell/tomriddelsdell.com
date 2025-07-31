/**
 * AWS MCP Client for infrastructure operations
 * Communicates with the AWS MCP server running in the dev container
 */

interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class AWSMCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://aws-mcp:8001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the MCP server is healthy
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
   * Execute an AWS CLI command via MCP
   */
  async execute(command: string, args: string[] = []): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, args }),
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
   * CloudFormation operations
   */
  async cloudformation = {
    /**
     * List all CloudFormation stacks
     */
    listStacks: () => this.execute('cloudformation', ['describe-stacks']),

    /**
     * Get stack details
     */
    describeStack: (stackName: string) => 
      this.execute('cloudformation', ['describe-stacks', '--stack-name', stackName]),

    /**
     * Create a new stack
     */
    createStack: (stackName: string, templateBody: string, parameters: Record<string, string> = {}) => {
      const args = ['create-stack', '--stack-name', stackName, '--template-body', templateBody];
      
      if (Object.keys(parameters).length > 0) {
        const paramString = Object.entries(parameters)
          .map(([key, value]) => `ParameterKey=${key},ParameterValue=${value}`)
          .join(' ');
        args.push('--parameters', paramString);
      }
      
      return this.execute('cloudformation', args);
    },

    /**
     * Delete a stack
     */
    deleteStack: (stackName: string) => 
      this.execute('cloudformation', ['delete-stack', '--stack-name', stackName]),
  };

  /**
   * Neptune operations
   */
  async neptune = {
    /**
     * List Neptune clusters
     */
    listClusters: () => this.execute('neptune', ['describe-db-clusters']),

    /**
     * Get cluster details
     */
    describeCluster: (clusterIdentifier: string) =>
      this.execute('neptune', ['describe-db-clusters', '--db-cluster-identifier', clusterIdentifier]),

    /**
     * List Neptune instances
     */
    listInstances: () => this.execute('neptune', ['describe-db-instances']),
  };

  /**
   * EC2 operations
   */
  async ec2 = {
    /**
     * List VPCs
     */
    listVpcs: () => this.execute('ec2', ['describe-vpcs']),

    /**
     * List security groups
     */
    listSecurityGroups: () => this.execute('ec2', ['describe-security-groups']),

    /**
     * List subnets
     */
    listSubnets: () => this.execute('ec2', ['describe-subnets']),
  };

  /**
   * IAM operations
   */
  async iam = {
    /**
     * List roles
     */
    listRoles: () => this.execute('iam', ['list-roles']),

    /**
     * Create role
     */
    createRole: (roleName: string, assumeRolePolicyDocument: string) =>
      this.execute('iam', [
        'create-role',
        '--role-name', roleName,
        '--assume-role-policy-document', assumeRolePolicyDocument
      ]),
  };

  /**
   * Cost and billing operations
   */
  async cost = {
    /**
     * Get cost and usage for a time period
     */
    getCostAndUsage: (startDate: string, endDate: string, granularity: 'DAILY' | 'MONTHLY' = 'MONTHLY') =>
      this.execute('ce', [
        'get-cost-and-usage',
        '--time-period', `Start=${startDate},End=${endDate}`,
        '--granularity', granularity,
        '--metrics', 'BlendedCost'
      ]),
  };
}

// Export singleton instance
export const awsMCP = new AWSMCPClient(
  process.env.AWS_MCP_ENDPOINT || 'http://localhost:8001'
);
