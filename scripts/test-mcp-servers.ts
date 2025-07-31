#!/usr/bin/env tsx

/**
 * Test script to verify MCP servers are working correctly
 * Run with: npm run test:mcp
 */

import { awsMCP } from '../infrastructure/mcp/aws-mcp-client';
import { neptuneMCP } from '../infrastructure/mcp/neptune-mcp-client';

async function testAWSMCP() {
  console.log('🔧 Testing AWS MCP Server...');
  
  try {
    // Test health
    const health = await awsMCP.health();
    console.log('✅ AWS MCP Health:', health);

    // Test AWS CLI command
    const regions = await awsMCP.execute('ec2', ['describe-regions', '--output', 'json']);
    console.log('✅ AWS Regions:', regions.success ? 'Retrieved successfully' : regions.error);

    // Test CloudFormation
    const stacks = await awsMCP.cloudformation.listStacks();
    console.log('✅ CloudFormation Stacks:', stacks.success ? 'Retrieved successfully' : stacks.error);

    // Test Neptune clusters
    const clusters = await awsMCP.neptune.listClusters();
    console.log('✅ Neptune Clusters:', clusters.success ? 'Retrieved successfully' : clusters.error);

  } catch (error) {
    console.error('❌ AWS MCP Error:', error);
  }
}

async function testNeptuneMCP() {
  console.log('\n🔗 Testing Neptune MCP Server...');
  
  try {
    // Test health
    const health = await neptuneMCP.health();
    console.log('✅ Neptune MCP Health:', health);

    // Test schema retrieval
    const schema = await neptuneMCP.getSchema();
    console.log('✅ Neptune Schema:', schema);

    // Test a simple query
    const mockQuery = await neptuneMCP.query('g.V().count()');
    console.log('✅ Neptune Query Test:', mockQuery);

    // Test transaction queries
    const accountTransactions = await neptuneMCP.transactions.byAccount('ACCT-123');
    console.log('✅ Account Transactions:', accountTransactions);

    // Test schema inspection
    const vertexLabels = await neptuneMCP.schema.vertexLabels();
    console.log('✅ Vertex Labels:', vertexLabels);

  } catch (error) {
    console.error('❌ Neptune MCP Error:', error);
  }
}

async function main() {
  console.log('🚀 Testing MCP Servers Integration\n');
  
  await testAWSMCP();
  await testNeptuneMCP();
  
  console.log('\n✨ MCP Server tests complete!');
  console.log('\n📚 Next steps:');
  console.log('1. Configure actual Neptune endpoint when ready');
  console.log('2. Use MCP clients in your application for infrastructure operations');
  console.log('3. Design your transaction hierarchy schema');
  console.log('4. Generate CloudFormation templates for Neptune cluster');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { testAWSMCP, testNeptuneMCP };
