#!/bin/bash

# Neptune Cluster Deployment Script for tomriddelsdell.com
# This script uses the AWS MCP Server to provision Neptune infrastructure

set -e

# Configuration
STACK_PREFIX="tomriddelsdell-neptune"
VPC_STACK_NAME="${STACK_PREFIX}-vpc"
NEPTUNE_STACK_NAME="${STACK_PREFIX}-cluster"
REGION="eu-west-2"  # Your configured region

echo "🚀 Neptune Cluster Deployment for tomriddelsdell.com"
echo "=================================================="

# Function to call AWS MCP Server
call_aws_mcp() {
    local action="$1"
    local parameters="$2"
    
    echo "Calling AWS MCP Server: $action"
    curl -s -X POST http://localhost:8001/mcp/execute \
        -H "Content-Type: application/json" \
        -d "{
            \"action\": \"$action\",
            \"parameters\": $parameters
        }" | jq .
}

# Check MCP Server health
echo "🔍 Checking AWS MCP Server health..."
if ! curl -s http://localhost:8001/health > /dev/null; then
    echo "❌ AWS MCP Server not accessible at localhost:8001"
    echo "Please ensure the MCP server is running with: docker-compose up -d aws-mcp"
    exit 1
fi

echo "✅ AWS MCP Server is healthy"

# Step 1: Deploy VPC infrastructure
echo ""
echo "📦 Step 1: Deploying VPC infrastructure..."
VPC_PARAMS='{
    "StackName": "'${VPC_STACK_NAME}'",
    "TemplateBody": "@mcp-config/vpc-template.json",
    "Parameters": [
        {
            "ParameterKey": "Environment",
            "ParameterValue": "test"
        }
    ],
    "Tags": [
        {
            "Key": "Project",
            "Value": "tomriddelsdell.com"
        },
        {
            "Key": "ManagedBy", 
            "Value": "AWS-MCP-Server"
        }
    ]
}'

call_aws_mcp "create-stack" "$VPC_PARAMS"

# Wait for VPC stack to complete
echo "⏳ Waiting for VPC stack to complete..."
WAIT_PARAMS='{
    "StackName": "'${VPC_STACK_NAME}'"
}'

# Poll stack status (simplified - in production, implement proper waiting)
echo "Note: Check AWS Console for stack progress. Continuing with Neptune stack preparation..."

# Step 2: Deploy Neptune cluster
echo ""
echo "🗄️  Step 2: Deploying Neptune cluster..."
NEPTUNE_PARAMS='{
    "StackName": "'${NEPTUNE_STACK_NAME}'", 
    "TemplateBody": "@mcp-config/neptune-cluster-template.json",
    "Parameters": [
        {
            "ParameterKey": "ClusterIdentifier",
            "ParameterValue": "tomriddelsdell-neptune-test"
        },
        {
            "ParameterKey": "InstanceClass", 
            "ParameterValue": "db.t3.medium"
        },
        {
            "ParameterKey": "Environment",
            "ParameterValue": "test"
        }
    ],
    "Tags": [
        {
            "Key": "Project",
            "Value": "tomriddelsdell.com"
        },
        {
            "Key": "ManagedBy",
            "Value": "AWS-MCP-Server"
        }
    ]
}'

call_aws_mcp "create-stack" "$NEPTUNE_PARAMS"

# Step 3: Get stack outputs
echo ""
echo "📋 Step 3: Retrieving stack information..."
DESCRIBE_PARAMS='{
    "StackName": "'${NEPTUNE_STACK_NAME}'"
}'

call_aws_mcp "describe-stacks" "$DESCRIBE_PARAMS"

echo ""
echo "✅ Neptune cluster deployment initiated!"
echo ""
echo "🔗 Next steps:"
echo "1. Monitor stack progress in AWS Console"
echo "2. VPC Stack: ${VPC_STACK_NAME}"
echo "3. Neptune Stack: ${NEPTUNE_STACK_NAME}" 
echo "4. Region: ${REGION}"
echo ""
echo "💡 Stack outputs will contain:"
echo "   - Neptune cluster endpoint"
echo "   - Neptune read endpoint"
echo "   - Cluster port (8182)"
echo ""
echo "🧪 Once complete, test connectivity with Neptune MCP Server at localhost:8002"
