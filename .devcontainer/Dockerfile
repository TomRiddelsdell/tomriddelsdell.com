# Portfolio Platform Development Container
# Optimized for event-sourced microservices development
FROM mcr.microsoft.com/devcontainers/universal:2-linux

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Update package lists and install essential system tools (cached layer)
RUN apt-get update -y && apt-get install -y \
    curl \
    wget \
    unzip \
    jq \
    git \
    build-essential \
    gnupg \
    lsb-release \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Install all CLI tools in a single layer to ensure consistency
RUN echo "🔧 Installing CLI tools for Portfolio Platform..." && \
    # Install Doppler CLI (Secrets Management)
    echo "🔐 Installing Doppler CLI..." && \
    curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sh && \
    # Install Confluent CLI (Kafka Management) 
    echo "📊 Installing Confluent CLI..." && \
    cd /tmp && \
    curl -L --http1.1 https://cnfl.io/cli | sh -s -- latest && \
    mv bin/confluent /usr/local/bin/confluent && \
    # Switch to codespace user for npm installs to use correct Node.js environment
    echo "☁️ Installing Wrangler and Neon CLI as codespace user..." && \
    su - codespace -c "npm install -g wrangler@latest neonctl@latest" && \
    # Install additional development tools as codespace user
    echo "🛠️ Installing additional development utilities..." && \
    su - codespace -c "npm install -g @playwright/test eslint prettier typescript ts-node nodemon turbo@latest" && \
    # Install Avro tools for event schema management as codespace user
    echo "📋 Installing Avro tools for event sourcing..." && \
    su - codespace -c "npm install -g avro-typescript avro-js @kafkajs/confluent-schema-registry"

# Reset to interactive mode
ENV DEBIAN_FRONTEND=

# Verification layer (will show in build output and help debug issues)
RUN echo "✅ Installation verification:" && \
    echo "  • Node.js: $(node --version)" && \
    echo "  • npm: $(npm --version)" && \
    echo "  • pnpm: $(pnpm --version)" && \
    echo "  • Doppler: $(doppler --version 2>/dev/null || echo 'MISSING')" && \
    echo "  • Confluent CLI: $(confluent version 2>/dev/null | head -n1 || echo 'MISSING')" && \
    echo "  • Terraform: $(terraform --version 2>/dev/null | head -n1 || echo 'from features')" && \
    echo "  • AWS CLI: $(aws --version 2>/dev/null | head -n1 || echo 'from features')" && \
    echo "  • GitHub CLI: $(gh --version 2>/dev/null | head -n1 || echo 'from base image')" && \
    echo "  • Git: $(git --version)" && \
    # Test as codespace user for npm-installed tools
    echo "🔍 Testing tools as codespace user..." && \
    su - codespace -c "wrangler --version" && echo "  ✅ Wrangler OK" && \
    su - codespace -c "neonctl --version" && echo "  ✅ Neon CLI OK" && \
    # Fail the build if critical tools are missing
    echo "🔍 Verifying critical CLI tools are accessible..." && \
    doppler --version > /dev/null && echo "  ✅ Doppler OK" && \
    confluent version > /dev/null && echo "  ✅ Confluent CLI OK"

# Switch back to codespace user
USER codespace