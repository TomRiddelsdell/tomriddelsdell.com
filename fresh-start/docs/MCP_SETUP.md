# AWS MCP Server Setup

This document describes the AWS MCP (Model Context Protocol) server setup for infrastructure management and Neptune graph database operations.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your App      │    │   AWS MCP       │    │  Neptune MCP    │
│   (Port 5000)   │    │   (Port 8001)   │    │   (Port 8002)   │
│                 │    │                 │    │                 │
│ MCP Clients ────┼───▶│ AWS CLI Proxy   │    │ Graph Queries   │
│                 │    │ CloudFormation  │    │ Schema Tools    │
│                 │    │ Cost Analysis   │    │ Gremlin/SPARQL  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Setup

### 1. Development Container

The MCP servers are automatically started when you rebuild your dev container:

```bash
# Rebuild the dev container to include MCP servers
Command Palette > "Dev Containers: Rebuild Container"
```

### 2. Test the Setup

```bash
# Test both MCP servers
npm run test:mcp
```

### 3. Health Checks

- AWS MCP Server: http://localhost:8001/health
- Neptune MCP Server: http://localhost:8002/health

## Usage Examples

### AWS Infrastructure Management

```typescript
import { awsMCP } from '../infrastructure/mcp/aws-mcp-client';

// List CloudFormation stacks
const stacks = await awsMCP.cloudformation.listStacks();

// Get cost analysis
const costs = await awsMCP.cost.getCostAndUsage('2024-01-01', '2024-01-31');

// Create Neptune cluster
await awsMCP.cloudformation.createStack(
  'neptune-transactions',
  neptuneTemplate,
  { Environment: 'development' }
);
```

### Neptune Graph Operations

```typescript
import { neptuneMCP } from '../infrastructure/mcp/neptune-mcp-client';

// Get schema
const schema = await neptuneMCP.getSchema();

// Query transactions by account
const transactions = await neptuneMCP.transactions.byAccount('ACCT-123');

// Custom Gremlin query
const result = await neptuneMCP.query(
  `g.V().hasLabel('Account').has('id', 'ACCT-123')
   .repeat(out('contains'))
   .until(hasLabel('Transaction'))
   .where(has('amount', gt(1000)))
   .path()`
);
```

## Configuration

### Environment Variables

```bash
# MCP Server endpoints (auto-configured in dev container)
AWS_MCP_ENDPOINT=http://aws-mcp:8001
NEPTUNE_MCP_ENDPOINT=http://neptune-mcp:8002

# Neptune cluster (when you create one)
NEPTUNE_ENDPOINT=your-cluster.cluster-xyz.us-east-1.neptune.amazonaws.com
```

### AWS Credentials

AWS credentials are already configured in your dev container:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_DEFAULT_REGION=eu-west-2`

## Neptune Project Workflow

### 1. Design Phase (Current)
```typescript
// Use MCP to explore AWS resources
const vpcs = await awsMCP.ec2.listVpcs();
const costs = await awsMCP.cost.getCostAndUsage('2024-01-01', '2024-01-31');

// Design transaction schema with Neptune MCP
const schema = await neptuneMCP.getSchema();
```

### 2. Infrastructure Creation
```typescript
// Generate CloudFormation template for Neptune
const template = generateNeptuneTemplate();
await awsMCP.cloudformation.createStack('neptune-transactions', template);
```

### 3. Schema Development
```typescript
// Test queries against mock data
await neptuneMCP.transactions.byAccount('ACCT-123');
await neptuneMCP.schema.vertexLabels();
```

### 4. Real Data Integration
```bash
# Configure real Neptune endpoint
export NEPTUNE_ENDPOINT=your-cluster.cluster-xyz.us-east-1.neptune.amazonaws.com
```

## Next Steps

1. **Test the MCP setup**: `npm run test:mcp`
2. **Design your transaction hierarchy** using the Neptune MCP schema tools
3. **Generate CloudFormation templates** for your Neptune infrastructure
4. **Create development queries** for your transaction analysis needs

## Troubleshooting

### MCP Servers Not Starting
```bash
# Check container logs
docker-compose logs aws-mcp
docker-compose logs neptune-mcp
```

### Connection Issues
```bash
# Verify ports are forwarded
curl http://localhost:8001/health
curl http://localhost:8002/health
```

### AWS Permissions
```bash
# Test AWS CLI access
aws sts get-caller-identity
aws ec2 describe-regions
```

## Benefits

- **Interactive Infrastructure Design**: I can query your actual AWS setup and suggest optimizations
- **Real-time Cost Analysis**: Check costs before deploying Neptune clusters
- **Schema Development**: Design and test graph queries before implementation
- **CloudFormation Generation**: Create infrastructure templates with AI assistance
- **Query Optimization**: Test Gremlin queries against your actual data structure
