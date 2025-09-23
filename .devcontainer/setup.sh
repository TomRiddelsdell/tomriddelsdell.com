#!/bin/bash
set -e

echo "🚀 Setting up Portfolio Platform development environment..."
echo "📅 $(date)"

echo "🔍 Verifying pre-installed CLI tools..."

# Verify all CLI tools are available and working
echo "📋 CLI Tools Status:"
echo "  • Node.js: $(node --version)"
echo "  • npm: $(npm --version)"
echo "  • pnpm: $(pnpm --version 2>/dev/null || echo 'NOT FOUND')"
echo "  • Doppler: $(doppler --version 2>/dev/null || echo 'NOT FOUND')"
echo "  • Wrangler: $(wrangler --version 2>/dev/null || echo 'NOT FOUND')"  
echo "  • Neon CLI: $(neonctl --version 2>/dev/null || echo 'NOT FOUND')"
echo "  • Confluent CLI: $(confluent version 2>/dev/null | head -n1 || echo 'NOT FOUND')"
echo "  • Terraform: $(terraform --version | head -n1)"
echo "  • AWS CLI: $(aws --version | head -n1)"
echo "  • GitHub CLI: $(gh --version | head -n1)"

# Validate critical tools are working
echo ""
echo "🧪 Running CLI tool validation..."

# Check if essential tools are accessible
MISSING_TOOLS=()

if ! command -v doppler >/dev/null 2>&1; then
    MISSING_TOOLS+=("doppler")
fi

if ! command -v wrangler >/dev/null 2>&1; then
    MISSING_TOOLS+=("wrangler")  
fi

if ! command -v neonctl >/dev/null 2>&1; then
    MISSING_TOOLS+=("neonctl")
fi

if ! command -v confluent >/dev/null 2>&1; then
    MISSING_TOOLS+=("confluent")
fi

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "❌ Missing CLI tools: ${MISSING_TOOLS[*]}"
    echo "This indicates the Dockerfile installation failed."
    exit 1
fi

echo "✅ All essential CLI tools are available!"

# Setup git configuration for development  
echo ""
echo "⚙️ Configuring git..."

# Configure git user if environment variables are provided
if [ -n "$GIT_USER_NAME" ]; then
    git config --global user.name "$GIT_USER_NAME"
    echo "  • Git name configured: $GIT_USER_NAME"
else
    echo "  • GIT_USER_NAME not set, skipping git user.name configuration"
fi

if [ -n "$GIT_USER_EMAIL" ]; then
    git config --global user.email "$GIT_USER_EMAIL"
    echo "  • Git email configured: $GIT_USER_EMAIL"
else
    echo "  • GIT_USER_EMAIL not set, skipping git user.email configuration"
fi

git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.editor "code --wait"

# Create project workspace directories if they don't exist
echo ""
echo "📁 Setting up workspace directories..."
# Work with the current workspace directory structure
CURRENT_DIR=$(pwd)

# Ensure directory structure exists (most already exist from git)
mkdir -p packages/{shared,ui-components,events,contracts}
mkdir -p services/{accounts,admin,app-catalog,entitlements}
mkdir -p apps/{app-bar,app-foo}
mkdir -p contracts/{api,events,ui}
mkdir -p tests/{unit,integration,e2e,contract}
mkdir -p infra/{terraform,scripts}

echo ""
echo "🎉 Development environment setup complete!"
echo "🚀 CLI tools pre-installed via optimized Dockerfile!"
echo ""
echo "Next steps:"
echo "1. Set up environment secrets with Doppler: doppler setup --project tomriddelsdell-infra"
echo "2. Initialize Terraform: cd infra/terraform && terraform init"
echo "3. Begin Phase 0 as outlined in docs/IMPLEMENTATION_PLAN.md"
echo ""
