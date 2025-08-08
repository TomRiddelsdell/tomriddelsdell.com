/**
 * AWS MCP Client for infrastructure operations
 * 
 * NOTE: This client is now deprecated in favor of direct MCP protocol integration.
 * The AWS Serverless MCP Server now uses stdio protocol instead of HTTP.
 * 
 * For VS Code integration, use the MCP configuration in .vscode/mcp.json
 * For programmatic access, consider using AWS SDK directly or AWS CLI
 */

interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * @deprecated Use AWS SDK or AWS CLI directly
 * The AWS MCP server now uses stdio protocol for VS Code integration
 */
export class AWSMCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8001') {
    this.baseUrl = baseUrl;
    console.warn('AWSMCPClient is deprecated. AWS MCP Server now uses stdio protocol.');
  }

  /**
   * @deprecated The AWS MCP server no longer exposes HTTP endpoints
   */
  async health(): Promise<MCPResponse> {
    return {
      success: false,
      error: 'AWS MCP Client is deprecated. Use AWS SDK directly or VS Code MCP integration.'
    };
  }

  /**
   * @deprecated Use AWS CLI or SDK directly
   */
  async execute(command: string, args: string[] = []): Promise<MCPResponse> {
    return {
      success: false,
      error: 'AWS MCP Client is deprecated. Use AWS CLI directly or VS Code MCP integration.'
    };
  }

  // Keep the method signatures for backward compatibility but mark as deprecated
  cloudformation = {
    listStacks: () => this.execute('cloudformation', ['describe-stacks']),
    describeStack: (stackName: string) => 
      this.execute('cloudformation', ['describe-stacks', '--stack-name', stackName]),
    createStack: (stackName: string, templateBody: string, parameters: Record<string, string> = {}) =>
      this.execute('cloudformation', ['create-stack']),
    deleteStack: (stackName: string) => 
      this.execute('cloudformation', ['delete-stack', '--stack-name', stackName]),
  };

  neptune = {
    listClusters: () => this.execute('neptune', ['describe-db-clusters']),
    describeCluster: (clusterIdentifier: string) =>
      this.execute('neptune', ['describe-db-clusters', '--db-cluster-identifier', clusterIdentifier]),
    listInstances: () => this.execute('neptune', ['describe-db-instances']),
  };

  ec2 = {
    listVpcs: () => this.execute('ec2', ['describe-vpcs']),
    listSecurityGroups: () => this.execute('ec2', ['describe-security-groups']),
    listSubnets: () => this.execute('ec2', ['describe-subnets']),
  };

  iam = {
    listRoles: () => this.execute('iam', ['list-roles']),
    createRole: (roleName: string, assumeRolePolicyDocument: string) =>
      this.execute('iam', ['create-role']),
  };

  cost = {
    getCostAndUsage: (startDate: string, endDate: string, granularity: 'DAILY' | 'MONTHLY' = 'MONTHLY') =>
      this.execute('ce', ['get-cost-and-usage']),
  };
}

// Export singleton instance (deprecated)
export const awsMCP = new AWSMCPClient(
  process.env.AWS_MCP_ENDPOINT || 'http://localhost:8001'
);

/**
 * Recommended approach for AWS operations:
 * 
 * 1. For VS Code integration: Use MCP configuration in .vscode/mcp.json
 * 2. For programmatic access: Use AWS SDK directly
 * 3. For CLI operations: Use AWS CLI directly
 * 
 * Example with AWS SDK:
 * 
 * import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
 * 
 * const client = new CloudFormationClient({ region: "eu-west-2" });
 * const response = await client.send(new DescribeStacksCommand({}));
 */
