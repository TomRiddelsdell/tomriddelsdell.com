#!/bin/bash

echo "🔍 Testing Amazon Q MCP Server Setup..."

# Check AWS CLI availability
echo "📦 Checking AWS CLI availability..."
if command -v aws > /dev/null 2>&1; then
    echo "✅ AWS CLI is available"
    aws --version
else
    echo "❌ AWS CLI is not available"
    exit 1
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "✅ AWS credentials are configured"
    aws sts get-caller-identity
else
    echo "❌ AWS credentials not configured"
    echo "💡 Run: aws configure (credentials should be mounted from host)"
fi

# Check GitHub token
echo "🐙 Checking GitHub token..."
if [ -n "$GITHUB_TOKEN" ]; then
    echo "✅ GITHUB_TOKEN is set"
    if gh auth status >/dev/null 2>&1; then
        echo "✅ GitHub CLI is authenticated"
    else
        echo "⚠️ GitHub CLI authentication issue"
    fi
else
    echo "⚠️ GITHUB_TOKEN not set in environment"
    echo "💡 Add GITHUB_TOKEN to .env for GitHub MCP functionality"
fi

# Check VS Code MCP configuration
echo "📝 Checking VS Code MCP configuration..."
if [ -f "/workspaces/.vscode/mcp.json" ]; then
    echo "✅ MCP configuration file exists"
    echo "📄 Configuration:"
    cat /workspaces/.vscode/mcp.json | jq .
else
    echo "❌ MCP configuration file missing"
fi

if [ -f "/workspaces/.vscode/settings.json" ]; then
    echo "✅ VS Code settings file exists"
    if grep -q "amazonQ.mcp.servers" /workspaces/.vscode/settings.json; then
        echo "✅ Amazon Q MCP configuration found"
    else
        echo "❌ Amazon Q MCP configuration missing"
    fi
else
    echo "❌ VS Code settings file missing"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Restart VS Code to load MCP configuration"
echo "2. Open Amazon Q chat and test commands:"
echo "   AWS: 'List my AWS regions' or 'Show my S3 buckets'"
echo "   GitHub: 'Show my repositories' or 'List recent issues'"
echo "3. Ensure GITHUB_TOKEN is set in .env for GitHub MCP"
echo ""
echo "📚 Available MCP capabilities:"
echo "   AWS MCP:"
echo "     • CloudFormation operations"
echo "     • EC2 resource management"
echo "     • S3 bucket operations"
echo "     • IAM role management"
echo "     • Cost analysis"
echo "   GitHub MCP:"
echo "     • Repository management"
echo "     • Issue and PR operations"
echo "     • Code search and analysis"
echo "     • Workflow management"
echo "     • Organization insights"