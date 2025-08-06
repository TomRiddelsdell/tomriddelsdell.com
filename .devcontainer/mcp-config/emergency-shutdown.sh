#!/bin/bash

# Emergency shutdown script for Neptune clusters
# Use if auto-shutdown fails

echo "🚨 Emergency Neptune Shutdown"
echo "============================="

# List all tomriddelsdell Neptune clusters
echo "🔍 Finding Neptune clusters..."
CLUSTERS=$(curl -s -X POST http://aws-mcp:8001/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "action": "describe-db-clusters",
    "parameters": {}
  }' | jq -r '.DBClusters[]? | select(.DBClusterIdentifier | contains("tomriddelsdell")) | .DBClusterIdentifier')

if [ -z "$CLUSTERS" ]; then
    echo "✅ No Neptune clusters found - nothing to shutdown"
    exit 0
fi

echo "Found clusters:"
echo "$CLUSTERS"
echo ""

read -p "⚠️  EMERGENCY SHUTDOWN: Delete ALL Neptune clusters? [y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Emergency shutdown cancelled"
    exit 0
fi

echo "🚨 Initiating emergency shutdown..."

# Delete each cluster
for cluster in $CLUSTERS; do
    echo "Deleting cluster: $cluster"
    
    # First delete instances
    curl -s -X POST http://aws-mcp:8001/mcp/execute \
      -H "Content-Type: application/json" \
      -d "{
        \"action\": \"describe-db-instances\",
        \"parameters\": {
          \"DBClusterIdentifier\": \"$cluster\"
        }
      }" | jq -r '.DBInstances[]?.DBInstanceIdentifier' | while read instance; do
        if [ ! -z "$instance" ]; then
            echo "  Deleting instance: $instance"
            curl -s -X POST http://aws-mcp:8001/mcp/execute \
              -H "Content-Type: application/json" \
              -d "{
                \"action\": \"delete-db-instance\",
                \"parameters\": {
                  \"DBInstanceIdentifier\": \"$instance\",
                  \"SkipFinalSnapshot\": true
                }
              }"
        fi
    done
    
    # Wait then delete cluster
    sleep 10
    echo "  Deleting cluster: $cluster"
    curl -s -X POST http://aws-mcp:8001/mcp/execute \
      -H "Content-Type: application/json" \
      -d "{
        \"action\": \"delete-db-cluster\",
        \"parameters\": {
          \"DBClusterIdentifier\": \"$cluster\",
          \"SkipFinalSnapshot\": true
        }
      }"
done

echo ""
echo "✅ Emergency shutdown initiated"
echo "💰 Check AWS billing in a few minutes to confirm charges stopped"
echo "📋 Monitor AWS Console to verify all resources are deleted"
