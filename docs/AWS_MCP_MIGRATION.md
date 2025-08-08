# AWS MCP Server Migration Guide

## Overview
This document describes the migration from custom HTTP-based AWS MCP server to the official AWS Labs `aws-serverless-mcp-server` package.

## Changes Made

### 1. Dockerfile Migration
**File**: `.devcontainer/Dockerfile.aws-mcp`
- **Before**: `awslabs.aws-api-mcp-server` with FastAPI HTTP wrapper
- **After**: `aws-serverless-mcp-server` (official AWS Labs package)
- **Protocol**: Changed from HTTP to stdio (Standard Input/Output)

### 2. VS Code MCP Configuration
**File**: `.vscode/mcp.json`
- **Before**: HTTP-based integration (`"type": "http"`)
- **After**: stdio-based integration (`"type": "stdio"`) with Docker exec
- **Command**: `docker exec -i devcontainer-aws-mcp-1 aws-serverless-mcp-server`

### 3. Docker Compose Changes
**File**: `.devcontainer/docker-compose.yml`
- **Removed**: Port mapping `8001:8001` (no longer needed)
- **Added**: `stdin_open: true` and `tty: true` for stdio communication
- **Environment**: Removed AWS_MCP_ENDPOINT variable

### 4. Client Code Updates
**File**: `infrastructure/mcp/aws-mcp-client.ts`
- **Status**: Marked as deprecated
- **Reason**: AWS MCP now uses stdio protocol for VS Code integration
- **Recommendation**: Use AWS SDK directly or VS Code MCP integration

## Benefits of Migration

### ✅ Official AWS Labs Support
- Using the official `aws-serverless-mcp-server` package
- Better compatibility with AWS services
- Regular updates and support from AWS Labs

### ✅ Proper MCP Protocol Integration
- Native MCP protocol instead of custom HTTP wrapper
- Better performance and reliability
- Standard MCP communication patterns

### ✅ VS Code Integration
- Direct integration with VS Code MCP extension
- Native AI tool capabilities for AWS operations
- Improved developer experience

## Usage After Migration

### VS Code Integration
The AWS MCP server now integrates directly with VS Code through the MCP extension:

1. **Tools Available**: AWS CLI commands, CloudFormation, Lambda, etc.
2. **Access**: Available through Copilot Chat and MCP tools
3. **Configuration**: Automatically configured via `.vscode/mcp.json`

### Programmatic Access
For programmatic access to AWS services, use AWS SDK directly:

```typescript
import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";

const client = new CloudFormationClient({ region: "eu-west-2" });
const response = await client.send(new DescribeStacksCommand({}));
```

### CLI Access
For CLI operations, use AWS CLI directly:

```bash
aws cloudformation describe-stacks
aws neptune describe-db-clusters
aws ec2 describe-vpcs
```

## Verification Steps

### 1. Rebuild Container
```bash
# Rebuild the dev container to apply changes
Command Palette > "Dev Containers: Rebuild Container"
```

### 2. Test MCP Integration
- Open VS Code in the workspace
- Use Copilot Chat to interact with AWS MCP tools
- Verify AWS operations work through MCP

### 3. Update Scripts
Scripts that used the HTTP client should be updated to use:
- AWS CLI directly
- AWS SDK
- VS Code MCP integration

## Breaking Changes

### ⚠️ HTTP Client Deprecated
- `AWSMCPClient` class is now deprecated
- HTTP endpoints (`/health`, `/mcp/execute`) no longer available
- Scripts using HTTP client need updates

### ⚠️ Environment Variables
- `AWS_MCP_ENDPOINT` removed from environment
- MCP communication now via stdio protocol

## Migration Checklist

- [x] Update Dockerfile to use `aws-serverless-mcp-server`
- [x] Update VS Code MCP configuration
- [x] Remove HTTP port mapping from docker-compose
- [x] Update environment variables
- [x] Mark HTTP client as deprecated
- [x] Create migration documentation
- [ ] Test AWS MCP functionality in VS Code
- [ ] Update deployment scripts to use AWS CLI directly
- [ ] Update monitoring scripts

## Next Steps

1. **Test Integration**: Verify AWS MCP works in VS Code after container rebuild
2. **Update Scripts**: Migrate scripts from HTTP client to AWS CLI/SDK
3. **Documentation**: Update team documentation about new MCP usage patterns
4. **Monitoring**: Update Neptune deployment scripts to work with new setup

## Rollback Plan

If issues occur, rollback by:
1. Reverting changes to the four main files
2. Rebuilding the container
3. The old HTTP-based system will be restored

---

**Note**: This migration aligns with AWS Labs official recommendations and provides better long-term support and functionality.
