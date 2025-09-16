#!/bin/bash
set -e

echo "🚀 Setting up Portfolio Platform development environment..."
echo "📅 $(date)"

# Update package lists
echo "📦 Updating package lists..."
sudo apt-get update -y

# Install essential system tools
echo "🔧 Installing system dependencies..."
sudo apt-get install -y \
    curl \
    wget \
    unzip \
    jq \
    git \
    build-essential \
    gnupg \
    lsb-release \
    software-properties-common

echo "🔧 Installing CLI tools for Portfolio Platform..."

# Install Doppler CLI (Secrets Management)
echo "🔐 Installing Doppler CLI..."
curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sudo sh
doppler --version || echo "⚠️ Doppler installation may need manual verification"

# Install Cloudflare Wrangler (Serverless Deployment)
echo "☁️ Installing Wrangler CLI..."
npm install -g wrangler@latest
wrangler --version

# Install Neon CLI (Database Management)
echo "🗄️ Installing Neon CLI..."
npm install -g neonctl@latest
neonctl --version

# Install Confluent CLI (Kafka Management)
echo "📊 Installing Confluent CLI..."
cd /tmp
curl -L --http1.1 https://cnfl.io/cli | sh -s -- latest
sudo mv bin/confluent /usr/local/bin/confluent
confluent version || echo "⚠️ Confluent CLI installation may need manual verification"

# Install additional development tools
echo "🛠️ Installing additional development utilities..."
npm install -g \
    pnpm@latest \
    @playwright/test \
    eslint \
    prettier \
    typescript \
    ts-node \
    nodemon \
    turbo@latest

# Install Avro tools for event schema management
echo "📋 Installing Avro tools for event sourcing..."
npm install -g \
    avro-typescript \
    avro-js \
    @kafkajs/confluent-schema-registry

# Setup git configuration for development
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
echo "📁 Setting up workspace directories..."
# Work with the current workspace directory structure
CURRENT_DIR=$(pwd)
cd "$CURRENT_DIR" || exit 1

# Ensure directory structure exists (most already exist from git)
mkdir -p packages/{shared,ui-components,events,contracts}
mkdir -p services/{accounts,admin,app-catalog,entitlements}
mkdir -p apps/{app-bar,app-foo}
mkdir -p contracts/{api,events,ui}
mkdir -p tests/{unit,integration,e2e,contract}
mkdir -p infra/{terraform,scripts}

# Set proper permissions for current workspace
echo "🔒 Setting workspace permissions..."
sudo chown -R node:node "$CURRENT_DIR"

# Verify installations
echo "✅ Verifying installations..."
echo "📋 Installation Summary:"
echo "  • Node.js: $(node --version)"
echo "  • npm: $(npm --version)"
echo "  • pnpm: $(pnpm --version)"
echo "  • Doppler: $(doppler --version 2>/dev/null || echo 'needs verification')"
echo "  • Wrangler: $(wrangler --version)"
echo "  • Terraform: $(terraform --version | head -n1)"
echo "  • AWS CLI: $(aws --version | head -n1)"
echo "  • Neon CLI: $(neonctl --version)"
echo "  • Confluent CLI: $(confluent version 2>/dev/null | head -n1 || echo 'needs verification')"
echo "  • Git: $(git --version)"

echo ""
echo "🎉 Development environment setup complete!"
echo "🚀 Ready for Phase 0 implementation!"
echo ""
echo "Next steps:"
echo "1. Set up environment secrets with Doppler: doppler setup"
echo "2. Initialize Terraform: cd infra/terraform && terraform init"
echo "3. Begin Phase 0 as outlined in docs/IMPLEMENTATION_PLAN.md"
echo ""
