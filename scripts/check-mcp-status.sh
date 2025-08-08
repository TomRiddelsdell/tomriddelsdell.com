#!/bin/bash
# MCP Server Status Check Script

echo "🔍 MCP Server Status Check"
echo "========================="

# Check if we're in a dev container
if [ -f "/.devcontainer" ]; then
    echo "✅ Running in dev container"
else
    echo "⚠️  Not in dev container - some checks may fail"
fi

echo ""
echo "📋 Configuration Files:"

# Check MCP configuration
if [ -f ".vscode/mcp.json" ]; then
    echo "✅ VS Code MCP configuration found"
    echo "   AWS Serverless MCP: stdio protocol"
    echo "   Neptune MCP: http://localhost:8002"
else
    echo "❌ VS Code MCP configuration missing"
fi

# Check Docker Compose configuration
if [ -f ".devcontainer/docker-compose.yml" ]; then
    echo "✅ Docker Compose configuration found"
    grep -q "aws-mcp:" .devcontainer/docker-compose.yml && echo "   AWS MCP service configured"
    grep -q "neptune-mcp:" .devcontainer/docker-compose.yml && echo "   Neptune MCP service configured"
else
    echo "❌ Docker Compose configuration missing"
fi

echo ""
echo "🔌 Network Connectivity:"

# Test Neptune MCP (should be accessible via HTTP)
if curl -s -m 5 http://localhost:8002/health >/dev/null 2>&1; then
    echo "✅ Neptune MCP server responding"
    curl -s http://localhost:8002/health | jq . 2>/dev/null || echo "   (Response not JSON)"
else
    echo "❌ Neptune MCP server not accessible"
fi

# Test for AWS MCP (stdio protocol - can't test directly)
echo "ℹ️  AWS Serverless MCP uses stdio protocol (not HTTP testable)"

echo ""
echo "🏃 Running Processes:"
if ps aux | grep -E "(mcp|aws-serverless)" | grep -v grep | grep -q .; then
    echo "✅ MCP-related processes found:"
    ps aux | grep -E "(mcp|aws-serverless)" | grep -v grep | sed 's/^/   /'
else
    echo "⚠️  No MCP-related processes visible in this container"
    echo "   (This is normal - MCP servers run in separate containers)"
fi

echo ""
echo "📁 MCP Configuration Details:"
echo "   AWS Serverless MCP:"
echo "     Protocol: stdio"
echo "     Command: docker exec -i devcontainer_aws-mcp_1 aws-serverless-mcp-server"
echo "     Status: Requires VS Code MCP extension to test"
echo ""
echo "   Neptune MCP:"
echo "     Protocol: http"
echo "     URL: http://localhost:8002"
echo "     Status: $(curl -s -m 2 http://localhost:8002/health >/dev/null 2>&1 && echo "Running" || echo "Not accessible")"

echo ""
echo "🔧 Next Steps:"
echo "1. If Neptune MCP is not running, rebuild the dev container:"
echo "   Command Palette > Dev Containers: Rebuild Container"
echo ""
echo "2. To test AWS Serverless MCP:"
echo "   - Use VS Code Copilot Chat"
echo "   - Try commands like 'List my AWS Lambda functions'"
echo "   - The MCP integration should provide AWS capabilities"
echo ""
echo "3. If issues persist:"
echo "   - Check Docker Desktop is running"
echo "   - Verify .env file has AWS credentials"
echo "   - Check VS Code MCP extension is installed"
