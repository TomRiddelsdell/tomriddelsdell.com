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
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.editor "code --wait"

# Create project workspace directories if they don't exist
echo "📁 Setting up workspace directories..."
mkdir -p /workspaces/packages/{shared,ui-components,events,contracts}
mkdir -p /workspaces/services/{accounts,admin,app-catalog,entitlements}
mkdir -p /workspaces/apps/{app-bar,app-foo}
mkdir -p /workspaces/contracts/{api,events,ui}
mkdir -p /workspaces/tests/{unit,integration,e2e,contract}
mkdir -p /workspaces/infra/{terraform,scripts}

# Set proper permissions
echo "🔒 Setting workspace permissions..."
sudo chown -R node:node /workspaces

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
