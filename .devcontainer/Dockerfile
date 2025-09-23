# Portfolio Platform Dev Container
# Optimized Dockerfile for caching CLI tool installations

FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20-bookworm

# Switch to root for installations
USER root

# Install system dependencies for CLI tools
RUN apt-get update && apt-get install -y \
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

# Install Doppler CLI (Secrets Management)
RUN curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sh \
    && doppler --version

# Install Confluent CLI (Kafka Management) 
RUN cd /tmp \
    && curl -L --http1.1 https://cnfl.io/cli | sh -s -- latest \
    && mv bin/confluent /usr/local/bin/confluent \
    && confluent version \
    && rm -rf /tmp/*

# Install npm-based CLI tools as the node user with proper nvm environment
# This ensures tools are installed in the node user's npm global directory
RUN su - node -c "source /usr/local/share/nvm/nvm.sh && npm install -g wrangler@latest neonctl@latest" \
    && su - node -c "source /usr/local/share/nvm/nvm.sh && npm install -g pnpm@latest turbo@latest" \
    && su - node -c "source /usr/local/share/nvm/nvm.sh && npm install -g @playwright/test eslint prettier typescript ts-node nodemon"

# Install Avro tools for event sourcing as node user
RUN su - node -c "source /usr/local/share/nvm/nvm.sh && npm install -g avro-typescript avro-js @kafkajs/confluent-schema-registry"

# Verify all CLI tools are installed and accessible to the node user
RUN echo "=== Verifying CLI Tools Installation ===" \
    && echo "Node.js: $(node --version)" \
    && echo "npm: $(npm --version)" \
    && echo "Doppler: $(doppler --version)" \
    && echo "Confluent: $(confluent version)" \
    && su - node -c "source /usr/local/share/nvm/nvm.sh && echo 'Wrangler: $(wrangler --version)'" \
    && su - node -c "source /usr/local/share/nvm/nvm.sh && echo 'Neon CLI: $(neonctl --version)'" \
    && su - node -c "source /usr/local/share/nvm/nvm.sh && echo 'pnpm: $(pnpm --version)'" \
    && echo "✅ All CLI tools verified successfully"

# Switch back to node user for development
USER node

# Set working directory
WORKDIR /workspaces