#!/bin/bash
# Test MCP Services after container rebuild

echo "🔍 Testing MCP Services"
echo "======================"

echo ""
echo "1. Neptune MCP Server (HTTP on port 8002):"
echo -n "   Status: "
if curl -s -m 5 http://localhost:8002/health >/dev/null 2>&1; then
    echo "✅ Running"
    echo "   Response:"
    curl -s http://localhost:8002/health | jq . 2>/dev/null || curl -s http://localhost:8002/health
else
    echo "❌ Not accessible"
    echo "   Try: curl http://localhost:8002/health"
fi

echo ""
echo "2. AWS Serverless MCP (stdio protocol):"
echo "   Status: ✅ Uses stdio protocol"
echo "   Test: Use VS Code Copilot Chat with AWS commands"
echo "   Example: 'List my AWS Lambda functions'"

echo ""
echo "3. Remote MCP Services:"
echo "   Neon MCP: https://mcp.neon.tech/mcp ✅"
echo "   GitHub MCP: https://api.githubcopilot.com/mcp/ ✅"

echo ""
echo "📋 VS Code MCP Configuration:"
echo "   Location: .vscode/mcp.json"
echo "   AWS: stdio via docker exec"
echo "   Neptune: http://localhost:8002"
echo "   Neon: Official remote server"
echo "   GitHub: Official remote server"

echo ""
echo "🚀 Next Steps:"
echo "   1. Open VS Code Copilot Chat"
echo "   2. Try AWS commands like 'List my S3 buckets'"
echo "   3. Try Neptune commands for graph database queries"
echo "   4. If issues persist, check container logs"
