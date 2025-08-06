#!/bin/bash

# 1-Hour Neptune Testing Cluster Deployment
# Automatically shuts down after 1 hour to control costs

set -e

CLUSTER_NAME="tomriddelsdell-neptune-1h-$(date +%Y%m%d-%H%M)"
TEMPLATE_FILE="mcp-config/neptune-1hour-template-fixed.json"

echo "🚀 Starting 1-Hour Neptune Testing Session"
echo "=========================================="
echo "Cluster: $CLUSTER_NAME"
echo "Duration: 60 minutes"
echo "Estimated Cost: ~$0.074"
echo "Auto-shutdown: Enabled"
echo ""
echo "🚨 COST WARNING: This will incur AWS charges!"
echo "   - Neptune is NOT in AWS Free Tier"
echo "   - Minimum cost: $0.074 per hour"
echo "   - Forgotten cluster = $1.78/day, $54/month"
echo "   - Auto-shutdown is CRITICAL for cost control"
echo ""
echo "💡 See docs/NEPTUNE_COST_WARNING.md for full details"
echo ""

# Confirm deployment
read -p "⚠️  Deploy 1-hour Neptune cluster? This will charge ~$0.074 to your AWS account. [y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo "✅ Deploying 1-hour Neptune cluster..."

# Deploy using AWS MCP Server
curl -s -X POST http://aws-mcp:8001/mcp/execute \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"create-stack\",
    \"parameters\": {
      \"StackName\": \"$CLUSTER_NAME\",
      \"TemplateBody\": \"$(cat $TEMPLATE_FILE | tr -d '\n' | sed 's/"/\\"/g')\",
      \"Parameters\": [
        {
          \"ParameterKey\": \"ClusterIdentifier\",
          \"ParameterValue\": \"$CLUSTER_NAME\"
        },
        {
          \"ParameterKey\": \"SessionDurationMinutes\",
          \"ParameterValue\": \"60\"
        }
      ],
      \"Tags\": [
        {
          \"Key\": \"Project\",
          \"Value\": \"tomriddelsdell.com\"
        },
        {
          \"Key\": \"Purpose\",
          \"Value\": \"1-hour-testing\"
        },
        {
          \"Key\": \"AutoShutdown\",
          \"Value\": \"true\"
        }
      ]
    }
  }" | jq .

echo ""
echo "🎯 Neptune Testing Session Started!"
echo "=================================="
echo "Cluster Name: $CLUSTER_NAME"
echo "Available for: 60 minutes"
echo "Auto-shutdown: $(date -d '+1 hour' '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "📋 Monitor deployment:"
echo "  AWS Console → CloudFormation → $CLUSTER_NAME"
echo ""
echo "⏳ Next Steps (wait 5-10 minutes for cluster to be ready):"
echo "  1. Configure Neptune MCP server:"
echo "     ./mcp-config/configure-neptune-mcp.sh $CLUSTER_NAME"
echo ""
echo "  2. Test Neptune connectivity:"
echo "     curl http://neptune-mcp:8002/health"
echo ""
echo "  3. Run Gremlin queries:"
echo "     curl -X POST http://neptune-mcp:8002/gremlin \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"query\": \"g.V().count()\"}'"
echo ""
echo "⚠️  Remember: Cluster will auto-delete after 1 hour!"
echo "   Estimated cost: ~$0.074 for full session"
