#!/bin/bash

# Post-create script for dev container
# This script runs after the container is created

set -e

echo "🚀 Setting up development environment..."

# Ensure GitHub CLI is properly installed and accessible
if ! command -v gh &> /dev/null; then
    echo "Installing GitHub CLI..."
    cd /tmp
    wget https://github.com/cli/cli/releases/download/v2.32.1/gh_2.32.1_linux_amd64.tar.gz -O gh.tar.gz
    tar -xzf gh.tar.gz
    sudo cp gh_2.32.1_linux_amd64/bin/gh /usr/local/bin/
    rm -rf gh_2.32.1_linux_amd64 gh.tar.gz
    cd /workspaces
fi

# Verify CLI tools are working
echo "🔍 Verifying CLI tools..."

echo "✓ Node.js: $(node --version)"
echo "✓ npm: $(npm --version)"
echo "✓ AWS CLI: $(aws --version | head -n1)"
echo "✓ GitHub CLI: $(gh --version | head -n1)"

# Check if .env file exists
if [ ! -f "/workspaces/.env" ]; then
    echo "⚠️  .env file not found. Copy from template:"
    echo "   cp .env.template .env"
    echo "   # Then edit .env with your actual values"
fi

# Install project dependencies if package.json exists
if [ -f "/workspaces/package.json" ]; then
    echo "📦 Installing project dependencies..."
    cd /workspaces
    npm install
fi

# Install MCP server dependencies if they exist
if [ -f "/workspaces/infrastructure/mcp/package.json" ]; then
    echo "🔧 Installing MCP server dependencies..."
    cd /workspaces/infrastructure/mcp
    npm install
    cd /workspaces
fi

# Set up git configuration if not already set
if [ -z "$(git config --global user.name)" ]; then
    echo "⚙️  Configure git with your details:"
    echo "   git config --global user.name 'Your Name'"
    echo "   git config --global user.email 'your.email@example.com'"
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if aws sts get-caller-identity >/dev/null 2>&1; then
    echo "✅ AWS credentials are working"
    aws sts get-caller-identity --query 'Account' --output text | xargs -I {} echo "Account ID: {}"
else
    echo "⚠️  AWS credentials not configured. Run: aws configure"
fi

# Check GitHub authentication if token is set
if [ -n "$GITHUB_TOKEN" ]; then
    echo "🐙 Checking GitHub authentication..."
    if gh auth status >/dev/null 2>&1; then
        echo "✅ GitHub CLI is authenticated"
    else
        echo "⚠️  GitHub authentication issue. Token may be invalid."
    fi
else
    echo "⚠️  GITHUB_TOKEN not set in environment"
fi

echo ""
echo "🎉 Development environment ready!"
echo ""
echo "📋 Quick commands:"
echo "  • Test GitHub setup: node scripts/secure-github-setup.js"
echo "  • Check AWS status: aws sts get-caller-identity"
echo "  • List GitHub secrets: gh secret list --repo TomRiddelsdell/tomriddelsdell.com"
echo "  • Run test workflow: gh workflow run '🧪 Test Workflow'"
echo ""
