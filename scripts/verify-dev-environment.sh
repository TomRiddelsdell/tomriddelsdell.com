#!/bin/bash

# Dev Container CLI Tools Verification Script
# Ensures all required CLI tools are properly installed and configured

set -e

echo "🔍 Verifying Dev Container CLI Tools Setup"
echo "=========================================="
echo ""

# Color functions
red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }

# Check function
check_tool() {
    local tool=$1
    local check_cmd=$2
    local install_hint=$3
    
    echo -n "Checking $tool... "
    if command -v $tool >/dev/null 2>&1; then
        echo "$(green '✓ Found')"
        if [ -n "$check_cmd" ]; then
            echo "  Version: $($check_cmd 2>/dev/null | head -n1)"
        fi
        return 0
    else
        echo "$(red '✗ Missing')"
        if [ -n "$install_hint" ]; then
            echo "  Install: $install_hint"
        fi
        return 1
    fi
}

# Core CLI Tools
echo "$(blue '📦 Core CLI Tools')"
check_tool "node" "node --version"
check_tool "npm" "npm --version"
check_tool "git" "git --version"
check_tool "curl" "curl --version"
check_tool "wget" "wget --version"
check_tool "jq" "jq --version"
echo ""

# AWS Tools
echo "$(blue '☁️  AWS Tools')"
check_tool "aws" "aws --version"
check_tool "cdk" "cdk --version"
echo ""

# GitHub Tools
echo "$(blue '🐙 GitHub Tools')"
check_tool "gh" "gh --version"
echo ""

# Development Tools
echo "$(blue '⚒️  Development Tools')"
check_tool "tsc" "tsc --version" "npm install -g typescript"
check_tool "tsx" "tsx --version" "npm install -g tsx"
check_tool "dotenv" "dotenv --version" "npm install -g dotenv-cli"
echo ""

# Environment Configuration
echo "$(blue '🔧 Environment Configuration')"

# Check .env file
echo -n "Checking .env file... "
if [ -f "/workspaces/.env" ]; then
    echo "$(green '✓ Found')"
    echo "  Contains $(grep -c '^[^#]' /workspaces/.env 2>/dev/null || echo 0) environment variables"
else
    echo "$(yellow '⚠ Missing')"
    echo "  Create from template: cp .env.template .env"
fi

# Check AWS credentials
echo -n "Checking AWS credentials... "
if aws sts get-caller-identity >/dev/null 2>&1; then
    account_id=$(aws sts get-caller-identity --query Account --output text)
    echo "$(green '✓ Valid')"
    echo "  Account: $account_id"
else
    echo "$(red '✗ Invalid/Missing')"
    echo "  Configure: aws configure"
fi

# Check GitHub authentication
echo -n "Checking GitHub authentication... "
if gh auth status >/dev/null 2>&1; then
    echo "$(green '✓ Authenticated')"
    user=$(gh api user --jq .login 2>/dev/null || echo "unknown")
    echo "  User: $user"
else
    echo "$(red '✗ Not authenticated')"
    echo "  Set GITHUB_TOKEN environment variable"
fi
echo ""

# GitHub Repository Status
echo "$(blue '📊 Repository Status')"

# Check secrets
echo -n "Checking repository secrets... "
secret_count=$(gh secret list --repo TomRiddelsdell/tomriddelsdell.com 2>/dev/null | wc -l)
if [ $secret_count -gt 0 ]; then
    echo "$(green "✓ $secret_count secrets configured")"
else
    echo "$(red '✗ No secrets found')"
    echo "  Run: node scripts/secure-github-setup.js"
fi

# Check environments
echo -n "Checking deployment environments... "
env_count=$(gh api repos/TomRiddelsdell/tomriddelsdell.com/environments --jq '.environments | length' 2>/dev/null || echo 0)
if [ $env_count -gt 0 ]; then
    echo "$(green "✓ $env_count environments configured")"
    gh api repos/TomRiddelsdell/tomriddelsdell.com/environments --jq '.environments[] | "  - " + .name' 2>/dev/null
else
    echo "$(red '✗ No environments found')"
fi

# Check workflows
echo -n "Checking GitHub Actions workflows... "
workflow_count=$(gh workflow list --repo TomRiddelsdell/tomriddelsdell.com 2>/dev/null | wc -l)
if [ $workflow_count -gt 0 ]; then
    echo "$(green "✓ $workflow_count workflows active")"
else
    echo "$(yellow '⚠ No workflows found')"
fi
echo ""

# MCP Servers Status
echo "$(blue '🔗 MCP Servers')"
check_mcp_server() {
    local name=$1
    local port=$2
    local url="http://localhost:$port/health"
    
    echo -n "Checking $name MCP server (port $port)... "
    if curl -s "$url" >/dev/null 2>&1; then
        echo "$(green '✓ Running')"
    else
        echo "$(yellow '⚠ Not running')"
        echo "  Start with: docker-compose up -d"
    fi
}

check_mcp_server "AWS" 8001
check_mcp_server "Neptune" 8002

# Remote MCP Servers
echo -n "Checking remote Neon MCP server... "
if curl -s "https://mcp.neon.tech/health" >/dev/null 2>&1; then
    echo "$(green '✓ Available')"
else
    echo "$(yellow '⚠ Remote service unavailable')"
fi

echo -n "Checking remote GitHub MCP server... "
if curl -s "https://api.githubcopilot.com/mcp/health" >/dev/null 2>&1; then
    echo "$(green '✓ Available')"
else
    echo "$(yellow '⚠ Remote service unavailable')"
fi
echo ""

# Summary
echo "$(blue '📋 Summary')"
echo "Development environment verification complete!"
echo ""
echo "$(yellow '💡 Quick Commands:')"
echo "  • Setup GitHub: node scripts/secure-github-setup.js"
echo "  • Test workflow: gh workflow run '🧪 Test Workflow'"
echo "  • List secrets: gh secret list --repo TomRiddelsdell/tomriddelsdell.com"
echo "  • Check costs: gh workflow run '💰 AWS Cost & Infrastructure Monitoring'"
echo "  • Security breach response: ./scripts/launch-security-breach-response.sh"
echo ""
