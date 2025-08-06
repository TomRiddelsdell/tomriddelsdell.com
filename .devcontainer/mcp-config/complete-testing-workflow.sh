#!/bin/bash

# Complete Neptune Testing Workflow
# Deploy → Configure → Test → Monitor

set -e

echo "🚀 Complete Neptune Testing Workflow"
echo "===================================="

# Step 1: Deploy Neptune cluster
echo "📦 Step 1: Deploying 1-hour Neptune cluster..."
./mcp-config/deploy-1hour-neptune.sh

# Get the cluster name from the deployment
CLUSTER_NAME="tomriddelsdell-neptune-1h-$(date +%Y%m%d-%H%M)"

echo ""
echo "⏳ Step 2: Waiting for cluster to be ready..."
echo "   This usually takes 5-10 minutes..."

# Wait for cluster to be available
echo "   Checking cluster status every 30 seconds..."
for i in {1..20}; do
    sleep 30
    echo "   Check $i/20: Polling cluster status..."
    
    CLUSTER_STATUS=$(curl -s -X POST http://aws-mcp:8001/mcp/execute \
      -H "Content-Type: application/json" \
      -d "{
        \"action\": \"describe-db-clusters\",
        \"parameters\": {
          \"DBClusterIdentifier\": \"$CLUSTER_NAME\"
        }
      }" | grep -o '"Status":"[^"]*' | cut -d'"' -f4 || echo "")
    
    echo "   Status: $CLUSTER_STATUS"
    
    if [ "$CLUSTER_STATUS" = "available" ]; then
        echo "   ✅ Cluster is ready!"
        break
    fi
    
    if [ $i -eq 20 ]; then
        echo "   ⚠️  Timeout waiting for cluster. Check AWS Console."
        exit 1
    fi
done

echo ""
echo "🔧 Step 3: Configuring Neptune MCP server..."
./mcp-config/configure-neptune-mcp.sh "$CLUSTER_NAME"

echo ""
echo "🧪 Step 4: Testing Neptune connectivity..."

# Test basic connectivity
echo "Testing health endpoint..."
curl -s http://neptune-mcp:8002/health

echo ""
echo "Testing Gremlin query (count vertices)..."
curl -s -X POST http://neptune-mcp:8002/gremlin \
  -H "Content-Type: application/json" \
  -d '{"query": "g.V().count()"}' || echo "Gremlin endpoint may not be ready yet"

echo ""
echo "✅ Neptune Testing Environment Ready!"
echo "===================================="
echo "Cluster: $CLUSTER_NAME"
echo "Duration: 60 minutes remaining"
echo "Neptune MCP: http://neptune-mcp:8002"
echo ""
echo "🧪 Example test commands:"
echo "  # Add a vertex"
echo "  curl -X POST http://neptune-mcp:8002/gremlin \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"query\": \"g.addV(\\\"person\\\").property(\\\"name\\\", \\\"test\\\")\"}'"
echo ""
echo "  # Count vertices"
echo "  curl -X POST http://neptune-mcp:8002/gremlin \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"query\": \"g.V().count()\"}'"
echo ""
echo "  # Get all vertices"
echo "  curl -X POST http://neptune-mcp:8002/gremlin \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"query\": \"g.V().valueMap()\"}'"
echo ""
echo "📊 Monitor session:"
echo "  ./mcp-config/monitor-sessions.sh"
echo ""
echo "⏰ Auto-shutdown: $(date -d '+1 hour' '+%Y-%m-%d %H:%M:%S')"
