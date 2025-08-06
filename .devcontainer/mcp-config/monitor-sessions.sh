#!/bin/bash

# Neptune Testing Session Monitor
# Track active sessions and costs

echo "🔍 Neptune Testing Session Monitor"
echo "================================="

# Check for active Neptune clusters
echo "📊 Active Neptune Clusters:"
curl -s -X POST http://aws-mcp:8001/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "action": "describe-db-clusters",
    "parameters": {}
  }' | jq -r '.DBClusters[]? | select(.DBClusterIdentifier | contains("tomriddelsdell")) | "Cluster: " + .DBClusterIdentifier + " | Status: " + .Status + " | Created: " + .ClusterCreateTime' || echo "No active clusters found"

echo ""
echo "💰 Cost Tracking:"
echo "  - Each hour costs: ~$0.074"
echo "  - Current session started: Check CloudFormation console"
echo "  - Auto-shutdown: 60 minutes after creation"

echo ""
echo "🛠️  Available Commands:"
echo "  ./deploy-1hour-neptune.sh  - Start new 1-hour session"
echo "  ./check-session-status.sh  - Check current session"
echo "  ./emergency-shutdown.sh    - Emergency shutdown (if needed)"

echo ""
echo "⚠️  Cost Management:"
echo "  - Always verify auto-shutdown is working"
echo "  - Check AWS billing after each session"
echo "  - Maximum cost per session: $0.074"
