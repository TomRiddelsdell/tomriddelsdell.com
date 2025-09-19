#!/bin/bash
set -e

echo "🚀 Setting up Portfolio Platform development environment..."
echo "📅 $(date)"

# Update package lists (Universal image is Ubuntu-based)
echo "📦 Updating package lists..."
sudo apt-get update -y

# Install additional system tools not in Universal image
echo "🔧 Installing additional system dependencies..."
sudo apt-get install -y \
    gnupg \
    lsb-release \
    software-properties-common

# Universal image includes: Node.js, npm, Python, Java, curl, wget, unzip, jq, git, build-essential
echo "✅ Core tools already available in Universal image:"
echo "  • Node.js: $(node --version)"
echo "  • npm: $(npm --version)"
echo "  • Python: $(python3 --version)"
echo "  • Java: $(java --version | head -n1)"
echo "  • Git: $(git --version)"

# Update npm to latest (Universal image may not have latest)
echo "📦 Updating npm to latest version..."
npm install -g npm@latest
echo "  • Updated npm version: $(npm --version)"

echo "🔧 Installing CLI tools for Portfolio Platform..."

# Install Doppler CLI (Secrets Management) - NOT in Universal image
echo "🔐 Installing Doppler CLI..."
curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sudo sh
doppler --version || echo "⚠️ Doppler installation may need manual verification"

# Install Cloudflare Wrangler (Serverless Deployment) - NOT in Universal image
echo "☁️ Installing Wrangler CLI..."
npm install -g wrangler@latest
wrangler --version

# Install Neon CLI (Database Management) - NOT in Universal image
echo "🗄️ Installing Neon CLI..."
npm install -g neonctl@latest
neonctl --version

# Install Confluent CLI (Kafka Management) - NOT in Universal image
echo "📊 Installing Confluent CLI..."
cd /tmp
curl -L --http1.1 https://cnfl.io/cli | sh -s -- latest
sudo mv bin/confluent /usr/local/bin/confluent
confluent version || echo "⚠️ Confluent CLI installation may need manual verification"

# Install GitHub CLI manually (feature download failed)
echo "🐙 Installing GitHub CLI..."
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
&& sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
&& sudo apt update \
&& sudo apt install gh -y
gh --version || echo "⚠️ GitHub CLI installation may need manual verification"

# Install additional development tools
echo "🛠️ Installing additional development utilities..."
# Universal image includes: basic npm, but not these specific packages
npm install -g \
    pnpm@latest \
    @playwright/test@latest \
    eslint@latest \
    prettier@latest \
    typescript@latest \
    ts-node@latest \
    nodemon@latest \
    turbo@latest \
    @types/node@latest

# Install Avro tools for event schema management - NOT in Universal image
echo "📋 Installing Avro tools for event sourcing..."
npm install -g \
    avro-typescript@latest \
    avro-js@latest \
    @kafkajs/confluent-schema-registry@latest

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
sudo chown -R codespace:codespace "$CURRENT_DIR"

# Verify installations
echo "✅ Verifying all installations..."
echo ""
echo "📋 Pre-installed in Universal Image:"
echo "  • Node.js: $(node --version)"
echo "  • npm: $(npm --version) (updated)"
echo "  • Python: $(python3 --version)"
echo "  • Java: $(java --version | head -n1 2>/dev/null || echo 'Java 24 available via feature')"
echo "  • Git: $(git --version)"
echo "  • Terraform: $(terraform --version | head -n1 2>/dev/null || echo 'Available via feature')"
echo "  • AWS CLI: $(aws --version 2>/dev/null | head -n1 || echo 'Available via feature')"
echo ""
echo "🆕 Newly Installed Tools:"
echo "  • pnpm: $(pnpm --version 2>/dev/null || echo 'installation pending')"
echo "  • Doppler: $(doppler --version 2>/dev/null || echo 'needs verification')"
echo "  • Wrangler: $(wrangler --version 2>/dev/null || echo 'installation pending')"
echo "  • Neon CLI: $(neonctl --version 2>/dev/null || echo 'installation pending')"
echo "  • Confluent CLI: $(confluent version 2>/dev/null | head -n1 || echo 'needs verification')"
echo "  • GitHub CLI: $(gh --version 2>/dev/null | head -n1 || echo 'installation pending')"

echo ""
echo "🔐 Setting up Doppler environment variables..."
if [ -n "$DOPPLER_TOKEN" ]; then
    echo "✅ DOPPLER_TOKEN found, configuring automatic secret injection..."
    
    # Add Doppler environment variable injection to bashrc
    cat >> ~/.bashrc << 'EOF'

# Auto-inject Doppler secrets as environment variables
if command -v doppler &> /dev/null && [ -n "$DOPPLER_TOKEN" ]; then
    # Only inject if not already done (check for marker)
    if [ -z "$DOPPLER_SECRETS_LOADED" ]; then
        eval "$(doppler run --project tomriddelsdell-dev --config dev --command env 2>/dev/null | grep -E '^(CONFLUENT_CLOUD_|CLOUDFLARE_|NEON_|AWS_|GITHUB_TOKEN)' | sed 's/^/export /')"
        export DOPPLER_SECRETS_LOADED=true
    fi
fi
EOF
    
    echo "✅ Doppler secrets will be auto-injected in new shell sessions"
    
    # Also inject for current session
    if doppler whoami > /dev/null 2>&1; then
        echo "🔄 Injecting secrets for current session..."
        eval "$(doppler run --project tomriddelsdell-dev --config dev --command env 2>/dev/null | grep -E '^(CONFLUENT_CLOUD_|CLOUDFLARE_|NEON_|AWS_|GITHUB_TOKEN)' | sed 's/^/export /')"
        export DOPPLER_SECRETS_LOADED=true
        echo "✅ Secrets injected for current session"
    else
        echo "⚠️  Doppler authentication failed, skipping secret injection"
    fi
else
    echo "⚠️  DOPPLER_TOKEN not found, skipping secret injection"
fi

echo ""
echo "🎉 Development environment setup complete!"
echo "🚀 Ready for multi-language development with:"
echo "   • Node.js/TypeScript (✅ Ready)"
echo "   • Python 3.12 (✅ Ready)" 
echo "   • Java 24 (✅ Ready)"
echo "   • All Ubuntu tools (✅ Ready)"
echo ""
