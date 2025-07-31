/**
 * Neptune MCP Client for graph database operations
 * Communicates with the Neptune MCP server running in the dev container
 */

interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  note?: string;
}

interface GraphSchema {
  vertices: string[] | Array<{label: string; properties: string[]}>;
  edges: string[] | Array<{label: string; from: string; to: string}>;
}

export class NeptuneMCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://neptune-mcp:8002') {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the Neptune MCP server is healthy
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
   * Execute a graph query (Gremlin or SPARQL)
   */
  async query(query: string, language: 'gremlin' | 'sparql' = 'gremlin'): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/neptune/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, language }),
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
   * Get the graph schema
   */
  async getSchema(): Promise<MCPResponse<GraphSchema>> {
    try {
      const response = await fetch(`${this.baseUrl}/neptune/schema`);
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Common Gremlin query patterns for hierarchical transactions
   */
  async transactions = {
    /**
     * Find all transactions for an account
     */
    byAccount: (accountId: string) => 
      this.query(`g.V().hasLabel('Account').has('id', '${accountId}').out('contains').out('part_of').hasLabel('Transaction')`),

    /**
     * Find transaction hierarchy path
     */
    hierarchy: (transactionId: string) =>
      this.query(`g.V().hasLabel('Transaction').has('id', '${transactionId}').path().by('id').by(label)`),

    /**
     * Aggregate transactions by portfolio
     */
    byPortfolio: (portfolioId: string) =>
      this.query(`g.V().hasLabel('Portfolio').has('id', '${portfolioId}').in('part_of').hasLabel('Transaction').valueMap()`),

    /**
     * Find large transactions above threshold
     */
    largeTransactions: (minAmount: number) =>
      this.query(`g.V().hasLabel('Transaction').has('amount', gt(${minAmount})).valueMap()`),

    /**
     * Transaction flow between accounts
     */
    flow: (fromAccountId: string, toAccountId: string) =>
      this.query(`g.V().hasLabel('Account').has('id', '${fromAccountId}').out('transfers_to').hasLabel('Transaction').out('transfers_to').hasLabel('Account').has('id', '${toAccountId}').path()`),
  };

  /**
   * Schema inspection helpers
   */
  async schema = {
    /**
     * Get all vertex labels
     */
    vertexLabels: () => this.query('g.V().label().dedup()'),

    /**
     * Get all edge labels  
     */
    edgeLabels: () => this.query('g.E().label().dedup()'),

    /**
     * Get properties for a vertex label
     */
    vertexProperties: (label: string) => 
      this.query(`g.V().hasLabel('${label}').properties().key().dedup()`),

    /**
     * Count vertices by label
     */
    vertexCounts: () => this.query('g.V().groupCount().by(label)'),

    /**
     * Count edges by label
     */
    edgeCounts: () => this.query('g.E().groupCount().by(label)'),
  };

  /**
   * Performance and analysis queries
   */
  async analysis = {
    /**
     * Get graph statistics
     */
    stats: () => this.query('g.V().count().next(); g.E().count()'),

    /**
     * Find disconnected components
     */
    components: () => this.query('g.V().emit().repeat(both().simplePath()).times(10).group().by(path().count(local))'),

    /**
     * Find most connected vertices (hubs)
     */
    hubs: (limit: number = 10) => 
      this.query(`g.V().project('vertex', 'degree').by().by(bothE().count()).order().by(select('degree'), desc).limit(${limit})`),
  };
}

// Export singleton instance
export const neptuneMCP = new NeptuneMCPClient(
  process.env.NEPTUNE_MCP_ENDPOINT || 'http://localhost:8002'
);
