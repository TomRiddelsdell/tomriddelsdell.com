#!/bin/bash

# Configure Neptune MCP Server for Real Cluster
# Updates the MCP server to point to your deployed Neptune cluster

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <stack-name>"
    echo "Example: $0 tomriddelsdell-neptune-1h-20250730-0900"
    exit 1
fi

STACK_NAME="$1"

echo "🔧 Configuring Neptune MCP Server"
echo "================================="
echo "Stack: $STACK_NAME"

# Get Neptune cluster endpoint from CloudFormation
echo "📋 Getting Neptune cluster endpoint..."
ENDPOINT_RESPONSE=$(curl -s -X POST http://aws-mcp:8001/mcp/execute \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"describe-stacks\",
    \"parameters\": {
      \"StackName\": \"$STACK_NAME\"
    }
  }")

# Extract the endpoint from the response
NEPTUNE_ENDPOINT=$(echo "$ENDPOINT_RESPONSE" | grep -o '"NeptuneClusterEndpoint[^"]*"[^"]*"[^"]*"[^"]*"[^"]*"[^"]*' | cut -d'"' -f8 || echo "")

if [ -z "$NEPTUNE_ENDPOINT" ]; then
    echo "❌ Could not get Neptune endpoint from stack: $STACK_NAME"
    echo "Raw response:"
    echo "$ENDPOINT_RESPONSE"
    exit 1
fi

echo "✅ Found Neptune endpoint: $NEPTUNE_ENDPOINT"

# Update Neptune MCP server configuration
echo "🔄 Updating Neptune MCP server configuration..."

# Create updated configuration
cat > mcp-config/neptune-runtime-config.json << EOF
{
  "name": "neptune-mcp-server",
  "version": "1.0.0", 
  "description": "Neptune MCP Server - Connected to real cluster",
  "neptune_endpoint": "$NEPTUNE_ENDPOINT",
  "neptune_port": 8182,
  "aws_region": "eu-west-2",
  "connection_mode": "live",
  "capabilities": {
    "query": {
      "languages": ["gremlin", "sparql"],
      "operations": ["traverse", "filter", "aggregate", "path"]
    },
    "schema": {
      "operations": ["introspect", "validate", "suggest"]
    },
    "management": {
      "operations": ["cluster-status", "performance-metrics"]
    }
  },
  "endpoints": {
    "health": "/health",
    "query": "/neptune/query",
    "schema": "/neptune/schema",
    "gremlin": "/gremlin",
    "sparql": "/sparql"
  }
}
EOF

echo "✅ Configuration updated"

# Test Neptune MCP server with new configuration
echo "🧪 Testing Neptune MCP server connectivity..."
HEALTH_CHECK=$(curl -s http://neptune-mcp:8002/health)
echo "Health: $HEALTH_CHECK"

# Try to update the running Neptune MCP server
echo "🔄 Updating running Neptune MCP server..."
curl -s -X POST http://neptune-mcp:8002/configure \
  -H "Content-Type: application/json" \
  -d "{
    \"neptune_endpoint\": \"$NEPTUNE_ENDPOINT\",
    \"neptune_port\": 8182,
    \"aws_region\": \"eu-west-2\",
    \"connection_mode\": \"live\"
  }" || echo "Note: MCP server may need restart to apply configuration"

echo ""
echo "🎯 Neptune MCP Server Configuration Complete!"
echo "============================================="
echo "Neptune Endpoint: $NEPTUNE_ENDPOINT"
echo "Port: 8182"
echo "Status: Live connection mode"
echo ""
echo "🧪 Test commands:"
echo "  # Check updated health"
echo "  curl http://neptune-mcp:8002/health"
echo ""
echo "  # Test Gremlin query"
echo "  curl -X POST http://neptune-mcp:8002/gremlin \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"query\": \"g.V().count()\"}'"
echo ""
echo "⚠️  Note: If configuration doesn't update immediately,"
echo "   restart the Neptune MCP container:"
echo "   docker-compose restart neptune-mcp"
