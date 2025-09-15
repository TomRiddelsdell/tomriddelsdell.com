# Implementation Plan - Portfolio Platform
**Date Created**: September 15, 2025  
**Last Updated**: September 15, 2025  
**Project**: tomriddelsdell.com - Portfolio Platform  
**Architecture**: Event-Sourced Microservices in Monorepo  

## 📋 Executive Summary

This comprehensive implementation plan outlines the step-by-step execution of the portfolio platform based on our event-sourced, microservices-in-monorepo architecture. The plan addresses cloud provider setup, MCP server configuration, foundational infrastructure, core domain implementation, and production deployment.


---

## 🎯 **PHASE 0: Pre-Implementation Assessment & Setup** *(Week 1)*

### **Current State Analysis**

✅ **Completed Components:**
- Comprehensive ADR documentation (22 ADRs)
- Directory structure with packages organization
- MCP server infrastructure (GitHub, Neon)
- Development environment configuration
- Authentication strategy (OAuth2/OIDC)
- Event sourcing foundations

⚠️ **Partially Complete:**
- Domain model definitions (entities defined, event integration missing)
- Event versioning (strategy defined, implementation missing)
- Infrastructure setup (templates ready, not deployed)
- Frontend framework (Next.js configured, GraphQL missing)

❌ **Missing Critical Components:**
- Message bus implementation (Kafka integration)
- Projection strategy implementation
- Production deployment pipeline
- Comprehensive testing framework

### **Step 0.1: Environment Validation** *(Day 1)*

```bash
# Validate development environment
git checkout develop
git pull origin develop

# Rebuild dev container with new configuration
code .
# Use Command Palette: "Dev Containers: Rebuild Container"

# Verify CLI tools are installed
doppler --version
wrangler --version
confluent version
pnpm --version
terraform --version
```

### **Step 0.2: Development Container Setup** *(Day 1)*

#### **0.2.1: Dev Container Configuration**
```json
// .devcontainer/devcontainer.json
{
  "name": "Portfolio Platform Development",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:18-bookworm",
  "features": {
    "ghcr.io/devcontainers/features/docker-outside-of-docker:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/terraform:1": {
      "version": "1.5.0"
    }
  },
  "postCreateCommand": ".devcontainer/setup.sh",
  "customizations": {
    "vscode": {
      "extensions": [
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-typescript-next",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-json",
        "hashicorp.terraform",
        "ms-playwright.playwright",
        "ms-vscode.test-adapter-converter"
      ],
      "settings": {
        "typescript.preferences.importModuleSpecifier": "relative",
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode"
      }
    }
  },
  "forwardPorts": [3000, 8080, 9090],
  "remoteEnv": {
    "PATH": "${containerEnv:PATH}:/usr/local/bin"
  }
}
```

#### **0.2.2: CLI Tools Installation Script**
```bash
# .devcontainer/setup.sh
#!/bin/bash
set -e

echo "🚀 Setting up Portfolio Platform development environment..."

# Update package lists
sudo apt-get update

# Install essential tools
sudo apt-get install -y \
  curl \
  wget \
  unzip \
  jq \
  git \
  build-essential

echo "📦 Installing CLI tools..."

# Install Doppler CLI
echo "Installing Doppler CLI..."
curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sudo sh
doppler --version

# Install Cloudflare Wrangler
echo "Installing Wrangler CLI..."
npm install -g wrangler@latest
wrangler --version

# Install Confluent CLI
echo "Installing Confluent CLI..."
cd /tmp
curl -O http://packages.confluent.io/archive/7.1/confluent-7.1.1.tar.gz
tar xzf confluent-7.1.1.tar.gz
sudo mv confluent-7.1.1 /opt/confluent
echo "export PATH=/opt/confluent/bin:$PATH" >> ~/.bashrc
export PATH=/opt/confluent/bin:$PATH

# Download Confluent Cloud CLI library
curl -sS -o /tmp/ccloud_library.sh https://raw.githubusercontent.com/confluentinc/examples/latest/utils/ccloud_library.sh
chmod +x /tmp/ccloud_library.sh
sudo mv /tmp/ccloud_library.sh /usr/local/bin/
confluent version

# Install Terraform CLI
echo "Installing Terraform CLI..."
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
terraform --version

# Install Neon CLI
echo "Installing Neon CLI..."
npm install -g neonctl
neonctl --version

# Install pnpm
echo "Installing pnpm..."
npm install -g pnpm@latest
pnpm --version

# Install additional development tools
echo "Installing development utilities..."
npm install -g \
  @playwright/test \
  eslint \
  prettier \
  typescript \
  ts-node \
  nodemon

# Install Avro tools for schema generation
echo "Installing Avro tools..."
npm install -g avro-typescript avro-js @kafkajs/confluent-schema-registry

# Setup git configuration
echo "Configuring git..."
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.editor "code --wait"

# Create necessary directories
echo "Creating project directories..."
mkdir -p /workspaces/{packages,apps,services,contracts,tests}
mkdir -p /workspaces/contracts/{api,events}
mkdir -p /workspaces/tests/{unit,integration,e2e}

# Set permissions
echo "Setting permissions..."
sudo chown -R vscode:vscode /workspaces
chmod +x /workspaces/.devcontainer/setup.sh

echo "✅ Development environment setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Run 'doppler login' to authenticate with Doppler"
echo "2. Run 'wrangler login' to authenticate with Cloudflare"  
echo "3. Run 'confluent login --save' to authenticate with Confluent Cloud"
echo "4. Run 'neonctl auth' to authenticate with Neon"
echo "5. Run 'gh auth login' for GitHub CLI authentication"
echo "6. Configure MCP servers in VS Code"
echo ""
```

#### **0.2.3: Package Manager Configuration**
```json
// .npmrc
registry=https://registry.npmjs.org/
package-lock=false
prefer-frozen-lockfile=true
auto-install-peers=true
```

```yaml
# .pnpmfile.cjs
module.exports = {
  hooks: {
    readPackage(pkg) {
      // Ensure consistent dependency versions across workspace
      if (pkg.dependencies) {
        if (pkg.dependencies.typescript && !pkg.dependencies.typescript.startsWith('5.')) {
          pkg.dependencies.typescript = '^5.2.0'
        }
        if (pkg.dependencies.react && !pkg.dependencies.react.startsWith('18.')) {
          pkg.dependencies.react = '^18.2.0'
        }
      }
      return pkg
    }
  }
}
```

#### **0.2.4: VS Code Workspace Configuration**
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.workingDirectories": [
    "packages/*",
    "apps/*", 
    "services/*"
  ],
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  }
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode", 
    "ms-vscode.vscode-json",
    "hashicorp.terraform",
    "ms-playwright.playwright",
    "ms-vscode.test-adapter-converter",
    "github.copilot",
    "github.copilot-chat",
    "ms-vscode.remote-containers"
  ]
}
```

### **Step 0.3: Dependency Verification** *(Day 1)*

**Required Tools & Access:**
- [x] Cloudflare account for Workers and Pages deployment
- [x] Doppler account for secret management
- [x] Neon account for PostgreSQL database
- [x] Confluent Cloud account for Kafka message bus
- [x] GitHub repository with appropriate permissions
- [x] Grafana Cloud account for monitoring (free tier)

**Development Environment:**
- [x] VS Code with dev container (configured with all CLI tools)
- [x] MCP servers configured and running (Neon, GitHub)
- [x] Doppler CLI for secret management
- [x] Cloudflare Wrangler CLI
- [x] Confluent CLI for Kafka management
- [x] Docker and docker-compose
- [x] Node.js 18+ with pnpm
- [x] Terraform CLI
- [x] Avro TypeScript tools
- [x] Testing frameworks (Playwright, Jest)

### **Step 0.4: Critical ADR Review** *(Day 2)*

**Priority Order for Implementation:**
1. **ADR-005** (Domain Model) - CRITICAL BLOCKER - 6 ADRs dependent
2. **ADR-007** (Event Versioning) - CRITICAL - Event sourcing dependent  
3. **ADR-022** (Message Bus Architecture) - HIGH - Integration dependent
4. **ADR-012** (Projection Strategy) - HIGH - Query-side dependent
5. **ADR-015** (Deployment Strategy) - MEDIUM - Production dependent

**Decision**: Complete ADR-005 and ADR-007 in Phase 1 as absolute priority.

---

## 🏗️ **PHASE 1: Foundation Infrastructure** *(Week 2-3)*

### **Step 1.1: Cloud Provider Setup** *(Days 3-5)*

#### **1.1.1: CLI Authentication Setup**
```bash
# Authenticate all CLI tools in the dev container

# 1. Doppler authentication
doppler login
# This opens browser for OAuth authentication

# 2. Cloudflare Wrangler authentication  
wrangler login
# This opens browser for Cloudflare OAuth

# 3. Confluent CLI authentication
confluent login --save
# This prompts for email/password and saves credentials
# Required for Confluent Cloud managed connectors and Kafka clusters

# After login, set default environment and cluster
confluent environment list
confluent environment use <default-env-id>
confluent kafka cluster list
confluent kafka cluster use <cluster-id>

# Create API keys for Kafka cluster
confluent api-key create --resource <cluster-id>
confluent api-key use <api-key> --resource <cluster-id>

# Enable and configure Schema Registry
confluent schema-registry cluster enable --cloud gcp --geo us
confluent api-key create --resource <schema-registry-cluster-id>

# 4. Neon CLI authentication
neonctl auth
# This opens browser for Neon authentication via GitHub/Google OAuth
# Or use API key: export NEON_API_KEY=<your-api-key>

# 5. Terraform CLI setup (no authentication needed, providers handle auth)

# 6. GitHub CLI authentication (for MCP integration)
gh auth login
# Select GitHub.com, HTTPS, authenticate via browser

# 7. Verify all authentications
echo "Testing CLI authentications..."
doppler projects list
wrangler whoami  
confluent environment list
neonctl me
terraform --version
gh auth status

echo "✅ All CLI tools authenticated successfully!"
```

#### **1.1.2: Doppler Project & Secret Setup**
```bash
# Install Doppler CLI (Shell Script method - works on all platforms)
curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sudo sh

# Verify installation
doppler --version

# Authenticate with Doppler (opens browser)
doppler login

# Create project for portfolio platform
doppler projects create portfolio-platform

# Create configuration environments
doppler configs create dev --project portfolio-platform
doppler configs create staging --project portfolio-platform  
doppler configs create production --project portfolio-platform

# Configure project setup (run in repository root)
cd /workspaces
doppler setup --project portfolio-platform --config dev

# Alternative: Create doppler.yaml for automatic setup
cat > doppler.yaml << 'EOF'
setup:
  project: portfolio-platform
  config: dev
EOF
```

#### **1.1.2: Doppler Project & Secret Setup**
```bash
# Create project for portfolio platform  
doppler projects create portfolio-platform

# Create configuration environments
doppler configs create dev --project portfolio-platform
doppler configs create staging --project portfolio-platform  
doppler configs create production --project portfolio-platform

# Configure project setup (run in repository root)
cd /workspaces
doppler setup --project portfolio-platform --config dev

# Alternative: Create doppler.yaml for automatic setup
cat > doppler.yaml << 'EOF'
setup:
  project: portfolio-platform
  config: dev
EOF
```

#### **1.1.3: Environment Secrets Configuration**
```bash
# Set development environment secrets
doppler secrets set --config dev \
  CLOUDFLARE_API_TOKEN="your_cloudflare_token" \
  NEON_API_KEY="your_neon_api_key" \
  CONFLUENT_API_KEY="your_confluent_api_key" \
  CONFLUENT_API_SECRET="your_confluent_api_secret" \
  GITHUB_TOKEN="your_github_token"

# Set staging environment secrets
doppler secrets set --config staging \
  CLOUDFLARE_API_TOKEN="your_staging_cloudflare_token" \
  NEON_API_KEY="your_staging_neon_api_key" \
  CONFLUENT_API_KEY="your_staging_confluent_api_key" \
  CONFLUENT_API_SECRET="your_staging_confluent_api_secret"

# Set production environment secrets
doppler secrets set --config production \
  CLOUDFLARE_API_TOKEN="your_prod_cloudflare_token" \
  NEON_API_KEY="your_prod_neon_api_key" \
  CONFLUENT_API_KEY="your_prod_confluent_api_key" \
  CONFLUENT_API_SECRET="your_prod_confluent_api_secret"

# Test secret retrieval
doppler secrets get NEON_API_KEY --config dev
```

#### **1.1.4: Development Workflow Integration**
```bash
# Use Doppler to run development commands with secrets injected
doppler run -- npm run dev

# For multiple commands or long-running processes
doppler run -- bash -c "
  export NODE_ENV=development
  npm run build
  npm run start
"

# Enable automatic restarts when secrets change (Team plan feature)
doppler run --watch -- npm run dev

# Remove any existing .env files (security best practice)
rm -f .env .env.local .env.development .env.production
echo "*.env*" >> .gitignore
```

#### **1.1.5: Terraform Infrastructure Deployment**
```bash
cd /workspaces/infra/terraform

# Deploy Doppler configuration
cd doppler
terraform init
doppler run --config production -- terraform plan
doppler run --config production -- terraform apply -auto-approve

# Deploy Neon database
cd ../neon  
terraform init
doppler run --config production -- terraform plan
doppler run --config production -- terraform apply -auto-approve

# Deploy Confluent Kafka cluster
cd ../kafka
terraform init  
doppler run --config production -- terraform plan
doppler run --config production -- terraform apply -auto-approve

# Deploy Cloudflare configuration
cd ../cloudflare
terraform init
doppler run --config production -- terraform plan
doppler run --config production -- terraform apply -auto-approve
```

#### **1.1.6: MCP Server Configuration Enhancement**

**Update `.vscode/mcp.json`:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@githubcopilot/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "neon": {
      "command": "npx", 
      "args": ["-y", "@neon/mcp-server"],
      "env": {
        "NEON_API_KEY": "${NEON_API_KEY}"
      }
    }
  }
}
```

**Test MCP Integration:**
```bash
# Test MCP servers via VS Code MCP interface
# Neon MCP: Database operations, query execution, branch management
# GitHub MCP: Repository operations, issues, pull requests

# Verify Neon integration
echo "Testing Neon database connection..."
# Use VS Code MCP interface to test database queries

# Verify GitHub integration  
echo "Testing GitHub repository access..."
# Use VS Code MCP interface to test repository operations

# Test with Doppler secrets injection
doppler run -- code . # Opens VS Code with secrets available
```

### **Step 1.2: Database Setup** *(Day 6)*

#### **1.2.1: Neon Database Configuration**
```sql
-- Create main database with branches
-- Execute via Neon MCP server

-- Main database: portfolio_prod (production)
CREATE DATABASE portfolio_prod;

-- Development branch: portfolio_dev  
-- (Created automatically via Neon branching)

-- Staging branch: portfolio_staging
-- (Created automatically via Neon branching)

-- Create initial schemas
\c portfolio_dev;

CREATE SCHEMA portfolio_management;
CREATE SCHEMA contact_management; 
CREATE SCHEMA event_store;
CREATE SCHEMA projections;

-- Event store tables (from ADR-006)
CREATE TABLE event_store.events (
  event_id UUID PRIMARY KEY,
  aggregate_id VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_data JSONB NOT NULL,
  event_version INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  correlation_id UUID,
  causation_id UUID,
  metadata JSONB,
  sequence_number BIGSERIAL
);

CREATE INDEX idx_events_aggregate ON event_store.events(aggregate_id, sequence_number);
CREATE INDEX idx_events_type ON event_store.events(event_type, timestamp);
```

#### **1.2.2: Confluent Kafka Topic Setup**
```bash
# Configure Kafka topics via Confluent Cloud
# Execute through Confluent CLI with Doppler secrets

# Install Confluent CLI
curl -L --http1.1 https://cnfl.io/cli | sh -s -- latest

# Login to Confluent Cloud using Doppler secrets
doppler run -- confluent login --save

# Create cluster (if not already created via Terraform)
doppler run -- confluent kafka cluster create portfolio-platform \
  --cloud gcp \
  --region us-central1 \
  --type basic

# Development environment topics
doppler run -- confluent kafka topic create dev.portfolio-management.user.user-registered \
  --partitions 3 \
  --config cleanup.policy=compact

doppler run -- confluent kafka topic create dev.portfolio-management.project.project-created \
  --partitions 3 \
  --config cleanup.policy=compact

doppler run -- confluent kafka topic create dev.contact-management.contact.contact-request-submitted \
  --partitions 1 \
  --config cleanup.policy=delete,retention.ms=604800000
```

### **Step 1.3: Monitoring & Observability** *(Day 7)*

#### **1.3.1: Grafana Cloud Setup**
```bash
# Configure monitoring stack
# Grafana Cloud for metrics and dashboards
# Loki for log aggregation

# Install Grafana Agent
curl -O -L "https://github.com/grafana/agent/releases/latest/download/grafana-agent-linux-amd64.zip"
unzip grafana-agent-linux-amd64.zip

# Configure agent.yaml
cat > agent.yaml << EOF
server:
  http_listen_port: 12345

prometheus:
  wal_directory: /tmp/wal
  global:
    scrape_interval: 15s
  configs:
    - name: portfolio-metrics
      remote_write:
        - url: https://prometheus-prod-10-prod-us-central-0.grafana.net/api/prom/push
          basic_auth:
            username: ${GRAFANA_USERNAME}
            password: ${GRAFANA_API_KEY}
EOF
```

---

## 🏛️ **PHASE 2: Core Domain Implementation** *(Week 3-5)*

### **Step 2.1: Complete Domain Model (ADR-005)** *(Days 8-10)*

#### **2.1.1: Domain Entities & Value Objects**
```bash
# Create domain implementation
mkdir -p packages/shared-domain/src/{entities,value-objects,events}

# Implement according to packages/shared-domain/README.md
```

**Key Implementation Files:**
```typescript
// packages/shared-domain/src/entities/EntityId.ts
export abstract class EntityId<T> {
  constructor(protected readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('EntityId cannot be empty');
    }
  }
  
  equals(other: EntityId<T>): boolean {
    return this.value === other.value;
  }
  
  toString(): string {
    return this.value;
  }
}

// packages/shared-domain/src/value-objects/Email.ts
export class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email address');
    }
  }
  
  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  getValue(): string {
    return this.value;
  }
}

// services/portfolio/domain/entities/User.ts
export class User extends AggregateRoot {
  constructor(
    private readonly userId: UserId,
    private email: Email,
    private displayName: string,
    private registrationDate: Date
  ) {
    super(userId);
  }
  
  static register(email: Email, displayName: string): User {
    const user = new User(
      UserId.generate(),
      email,
      displayName,
      new Date()
    );
    
    user.addDomainEvent(new UserRegisteredEvent(
      user.userId,
      email,
      displayName,
      new Date()
    ));
    
    return user;
  }
}
```

#### **2.1.2: Domain Events Structure**
```typescript
// packages/shared-domain/src/events/DomainEvent.ts
export abstract class DomainEvent {
  constructor(
    public readonly eventId: string,
    public readonly eventType: string,
    public readonly aggregateId: string,
    public readonly aggregateType: string,
    public readonly version: number,
    public readonly timestamp: Date,
    public readonly correlationId?: string,
    public readonly causationId?: string,
    public readonly metadata: EventMetadata = {}
  ) {}
}

// services/portfolio/domain/events/UserRegisteredEvent.ts
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly displayName: string,
    public readonly registrationDate: Date
  ) {
    super(
      generateEventId(),
      'UserRegistered',
      userId.toString(),
      'User',
      1,
      new Date()
    );
  }
}
```

### **Step 2.2: Event Versioning Implementation (ADR-007)** *(Days 11-13)*

#### **2.2.1: Schema Registry Setup**
```bash
# Configure Confluent Schema Registry
# Create Avro schemas for all domain events

# Create schema directory
mkdir -p contracts/events/avro/user
mkdir -p contracts/events/avro/project
mkdir -p contracts/events/avro/contact
```

**User Events Schema:**
```json
// contracts/events/avro/user/UserRegistered-v1.avsc
{
  "type": "record",
  "name": "UserRegistered",
  "namespace": "com.tomriddelsdell.portfolio.events.user",
  "version": 1,
  "fields": [
    {"name": "eventId", "type": "string"},
    {"name": "userId", "type": "string"},
    {"name": "email", "type": "string"},
    {"name": "displayName", "type": "string"},
    {"name": "registrationDate", "type": {"type": "long", "logicalType": "timestamp-millis"}},
    {"name": "timestamp", "type": {"type": "long", "logicalType": "timestamp-millis"}},
    {"name": "version", "type": "int", "default": 1}
  ]
}
```

#### **2.2.2: Code Generation Pipeline**
```bash
# Install Avro code generation
npm install -D avro-typescript

# Create generation script
cat > scripts/generate-contracts.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Generating TypeScript types from Avro schemas..."

# Generate TypeScript types
npx avro-typescript \
  --input contracts/events/avro \
  --output packages/event-contracts/src/generated

echo "✅ Contract generation complete!"
EOF

chmod +x scripts/generate-contracts.sh
./scripts/generate-contracts.sh
```

#### **2.2.3: Event Upcasting Framework**
```typescript
// packages/event-contracts/src/upcasting/EventUpcaster.ts
export interface EventUpcaster {
  canUpcast(eventType: string, version: number): boolean;
  upcast(event: any): any;
}

export class UserRegisteredUpcaster implements EventUpcaster {
  canUpcast(eventType: string, version: number): boolean {
    return eventType === 'UserRegistered' && version < 2;
  }
  
  upcast(event: any): any {
    // Upcast from v1 to v2
    if (event.version === 1) {
      return {
        ...event,
        version: 2,
        profileImage: null, // New field added in v2
        preferences: {
          emailNotifications: true,
          theme: 'light'
        }
      };
    }
    return event;
  }
}
```

### **Step 2.3: Event Store Integration** *(Days 14-15)*

#### **2.3.1: Repository Implementation**
```typescript
// packages/shared-infra/src/event-store/NeonEventStore.ts
export class NeonEventStore implements EventStore {
  constructor(private readonly connection: NeonConnection) {}
  
  async saveEvents(aggregateId: string, events: DomainEvent[]): Promise<void> {
    const transaction = await this.connection.begin();
    
    try {
      for (const event of events) {
        await transaction.query(
          `INSERT INTO event_store.events 
           (event_id, aggregate_id, aggregate_type, event_type, event_data, event_version, timestamp, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            event.eventId,
            event.aggregateId, 
            event.aggregateType,
            event.eventType,
            JSON.stringify(event),
            event.version,
            event.timestamp,
            JSON.stringify(event.metadata)
          ]
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const result = await this.connection.query(
      'SELECT * FROM event_store.events WHERE aggregate_id = $1 ORDER BY sequence_number',
      [aggregateId]
    );
    
    return result.rows.map(row => this.deserializeEvent(row));
  }
}
```

---

## 🔌 **PHASE 3: Message Bus & Integration** *(Week 5-6)*

### **Step 3.1: Message Bus Implementation (ADR-022)** *(Days 16-18)*

#### **3.1.1: Kafka Adapter Implementation**
```typescript
// packages/shared-infra/src/messaging/KafkaMessageBusAdapter.ts
export class KafkaMessageBusAdapter implements MessageBusAdapter {
  constructor(private readonly config: ConfluentCloudConfig) {}
  
  async connect(): Promise<void> {
    // Use Confluent REST API for serverless compatibility
    this.restClient = new ConfluentRestClient({
      endpoint: this.config.restProxyUrl,
      apiKey: this.config.apiKey,
      apiSecret: this.config.apiSecret
    });
  }
  
  async publish(topic: string, message: string): Promise<void> {
    await this.restClient.produce({
      topic,
      messages: [{
        key: this.extractAggregateId(message),
        value: message,
        headers: {
          'content-type': 'application/json',
          'schema-version': '1'
        }
      }]
    });
  }
  
  async subscribe(topic: string, handler: MessageHandler): Promise<void> {
    // Implement webhook-based consumption for Cloudflare Workers
    await this.setupWebhookSubscription(topic, handler);
  }
}
```

#### **3.1.2: Outbox Pattern Implementation**
```typescript
// packages/shared-infra/src/messaging/OutboxPublisher.ts
export class OutboxPublisher {
  constructor(
    private readonly eventStore: EventStore,
    private readonly messageBus: MessageBus,
    private readonly eventSelector: IntegrationEventSelector
  ) {}
  
  async publishPendingEvents(): Promise<void> {
    const unpublishedEvents = await this.eventStore.getUnpublishedEvents();
    
    for (const event of unpublishedEvents) {
      if (this.eventSelector.shouldPublish(event)) {
        const integrationEvent = this.transformToIntegrationEvent(event);
        await this.messageBus.publish(
          this.getTopicName(integrationEvent), 
          JSON.stringify(integrationEvent)
        );
        await this.eventStore.markAsPublished(event.eventId);
      }
    }
  }
  
  private getTopicName(event: IntegrationEvent): string {
    return `${process.env.ENVIRONMENT}.${event.metadata.boundedContext}.${event.aggregateType.toLowerCase()}.${event.eventType.toLowerCase()}`;
  }
}
```

### **Step 3.2: Projection Strategy Implementation (ADR-012)** *(Days 19-21)*

#### **3.2.1: Projection Infrastructure**
```typescript
// packages/shared-infra/src/projections/ProjectionWorker.ts
export abstract class ProjectionWorker {
  constructor(
    protected readonly messageBus: MessageBus,
    protected readonly projectionStore: ProjectionStore,
    protected readonly checkpointManager: CheckpointManager
  ) {}
  
  async start(): Promise<void> {
    const subscriptions = await this.getSubscriptions();
    
    for (const [eventType, handler] of subscriptions) {
      await this.messageBus.subscribe(
        this.getTopicName(eventType),
        this.wrapHandler(handler),
        {
          consumerGroup: this.getConsumerGroupId(),
          autoCommit: false
        }
      );
    }
  }
  
  private wrapHandler(handler: EventHandler): EventHandler {
    return async (event: IntegrationEvent) => {
      try {
        await handler(event);
        await this.updateCheckpoint(event);
      } catch (error) {
        await this.handleError(event, error);
        throw error;
      }
    };
  }
  
  protected abstract getSubscriptions(): Promise<Map<string, EventHandler>>;
  protected abstract getConsumerGroupId(): string;
}
```

#### **3.2.2: User Profile Projection**
```typescript
// services/portfolio/projections/UserProfileProjectionWorker.ts
export class UserProfileProjectionWorker extends ProjectionWorker {
  protected async getSubscriptions(): Promise<Map<string, EventHandler>> {
    return new Map([
      ['UserRegistered', this.handleUserRegistered.bind(this)],
      ['UserProfileUpdated', this.handleUserProfileUpdated.bind(this)],
      ['ProjectCreated', this.handleProjectCreated.bind(this)]
    ]);
  }
  
  private async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    const userProfile = {
      userId: event.userId,
      email: event.email,
      displayName: event.displayName,
      registrationDate: event.registrationDate,
      projectCount: 0,
      lastActivity: event.timestamp
    };
    
    await this.projectionStore.upsert('user_profiles', event.userId, userProfile);
  }
  
  protected getConsumerGroupId(): string {
    return 'user-profile-projection';
  }
}
```

---

## 🚀 **PHASE 4: Application Layer** *(Week 6-7)*

### **Step 4.1: API Implementation** *(Days 22-24)*

#### **4.1.1: Command Handlers**
```typescript
// services/portfolio/app/commands/RegisterUserCommandHandler.ts
export class RegisterUserCommandHandler implements CommandHandler<RegisterUserCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: EventPublisher
  ) {}
  
  async handle(command: RegisterUserCommand): Promise<void> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Create new user aggregate
    const user = User.register(
      new Email(command.email),
      command.displayName
    );
    
    // Save to event store
    await this.userRepository.save(user);
    
    // Events will be published via outbox pattern
  }
}
```

#### **4.1.2: Query Handlers**
```typescript
// services/portfolio/app/queries/GetUserProfileQueryHandler.ts
export class GetUserProfileQueryHandler implements QueryHandler<GetUserProfileQuery> {
  constructor(private readonly projectionStore: ProjectionStore) {}
  
  async handle(query: GetUserProfileQuery): Promise<UserProfileView> {
    const userProfile = await this.projectionStore.findById(
      'user_profiles', 
      query.userId
    );
    
    if (!userProfile) {
      throw new Error('User not found');
    }
    
    return userProfile;
  }
}
```

#### **4.1.3: Cloudflare Workers API**
```typescript
// apps/portfolio-api/src/handlers/userHandler.ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    if (request.method === 'POST' && url.pathname === '/api/users/register') {
      const body = await request.json();
      
      const commandHandler = new RegisterUserCommandHandler(
        new EventSourcedUserRepository(
          new NeonEventStore(env.DATABASE_URL)
        ),
        new OutboxEventPublisher()
      );
      
      try {
        await commandHandler.handle(new RegisterUserCommand(
          body.email,
          body.displayName
        ));
        
        return new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
}
```

### **Step 4.2: Frontend Integration** *(Days 25-26)*

#### **4.2.1: Next.js API Routes**
```typescript
// apps/portfolio-web/src/pages/api/users/register.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Call Cloudflare Worker API
    const response = await fetch(`${process.env.API_BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### **4.2.2: React Components with Authentication**
```tsx
// apps/portfolio-web/src/components/UserRegistration.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function UserRegistration() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName })
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      // Redirect to OAuth login
      await login();
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

---

## 🧪 **PHASE 5: Testing & Quality Assurance** *(Week 7-8)*

### **Step 5.1: Testing Framework Setup (ADR-021)** *(Days 27-28)*

#### **5.1.1: Domain Testing**
```typescript
// packages/testing-utils/src/builders/UserBuilder.ts
export class UserBuilder {
  private userId = UserId.generate();
  private email = new Email('test@example.com');
  private displayName = 'Test User';
  
  withUserId(userId: UserId): this {
    this.userId = userId;
    return this;
  }
  
  withEmail(email: string): this {
    this.email = new Email(email);
    return this;
  }
  
  build(): User {
    return new User(this.userId, this.email, this.displayName, new Date());
  }
}

// services/portfolio/domain/__tests__/User.test.ts
describe('User Domain Entity', () => {
  it('should register new user and publish event', () => {
    // Given
    const email = new Email('john@example.com');
    const displayName = 'John Doe';
    
    // When
    const user = User.register(email, displayName);
    
    // Then
    expect(user.getId()).toBeDefined();
    expect(user.getUncommittedEvents()).toHaveLength(1);
    expect(user.getUncommittedEvents()[0]).toBeInstanceOf(UserRegisteredEvent);
  });
});
```

#### **5.1.2: Integration Testing**
```typescript
// services/portfolio/__tests__/integration/UserRegistration.test.ts
describe('User Registration Integration', () => {
  let eventStore: EventStore;
  let messageBus: MessageBus;
  let commandHandler: RegisterUserCommandHandler;
  
  beforeEach(async () => {
    eventStore = new InMemoryEventStore();
    messageBus = new InMemoryMessageBus();
    commandHandler = new RegisterUserCommandHandler(
      new EventSourcedUserRepository(eventStore),
      new OutboxEventPublisher(eventStore, messageBus)
    );
  });
  
  it('should register user and publish integration event', async () => {
    // Given
    const command = new RegisterUserCommand('john@example.com', 'John Doe');
    
    // When
    await commandHandler.handle(command);
    
    // Then
    const events = await eventStore.getAllEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('UserRegistered');
    
    const publishedEvents = messageBus.getPublishedEvents();
    expect(publishedEvents).toHaveLength(1);
  });
});
```

### **Step 5.2: End-to-End Testing** *(Days 29-30)*

#### **5.2.1: API Testing with Playwright**
```typescript
// tests/e2e/user-registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should register new user successfully', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=displayName]', 'Test User');
    
    // Submit form
    await page.click('[data-testid=submit-button]');
    
    // Expect redirect to login
    await expect(page).toHaveURL('/login');
    
    // Verify success message
    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
  });
});
```

---

## 🚢 **PHASE 6: Production Deployment** *(Week 8-9)*

### **Step 6.1: Deployment Pipeline (ADR-015)** *(Days 31-33)*

#### **6.1.1: GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy Portfolio Platform

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:all
      
      - name: Run E2E tests
        run: npm run test:e2e

  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: SonarQube Scan
        uses: sonarqube-quality-gate-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  deploy-staging:
    needs: [test, sonarqube]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Cloudflare Workers (Staging)
        run: |
          npm install -g wrangler
          wrangler deploy --env staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          
  deploy-production:
    needs: [test, sonarqube]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Cloudflare Workers (Production)
        run: |
          npm install -g wrangler
          wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

#### **6.1.2: Cloudflare Workers Configuration**
```toml
# wrangler.toml
name = "portfolio-platform"
main = "apps/portfolio-api/dist/index.js"
compatibility_date = "2024-09-15"

[env.staging]
name = "portfolio-platform-staging"
vars = { ENVIRONMENT = "staging" }

[env.staging.vars]
DATABASE_URL = "postgresql://..."
KAFKA_BOOTSTRAP_SERVERS = "..."
AUTH_ISSUER = "https://auth.tomriddelsdell.dev"

[env.production]
name = "portfolio-platform-production" 
vars = { ENVIRONMENT = "production" }

[env.production.vars]
DATABASE_URL = "postgresql://..."
KAFKA_BOOTSTRAP_SERVERS = "..."
AUTH_ISSUER = "https://auth.tomriddelsdell.com"
```

### **Step 6.2: Production Monitoring** *(Days 34-35)*

#### **6.2.1: Monitoring Dashboard Setup**
```typescript
// monitoring/grafana-dashboards/portfolio-platform.json
{
  "dashboard": {
    "title": "Portfolio Platform - Production",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"portfolio-api\"}[5m])"
          }
        ]
      },
      {
        "title": "Event Processing Lag",
        "type": "graph", 
        "targets": [
          {
            "expr": "kafka_consumer_lag_sum{consumer_group=\"user-profile-projection\"}"
          }
        ]
      },
      {
        "title": "Database Connection Pool",
        "type": "graph",
        "targets": [
          {
            "expr": "neon_active_connections{database=\"portfolio_prod\"}"
          }
        ]
      }
    ]
  }
}
```

#### **6.2.2: Alerting Rules**
```yaml
# monitoring/alerting/portfolio-alerts.yml
groups:
  - name: portfolio-platform
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: EventProcessingLag
        expr: kafka_consumer_lag_sum > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Event processing lag is high"
          
      - alert: DatabaseConnectionsHigh
        expr: neon_active_connections / neon_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool near capacity"
```

---

## 📊 **Success Metrics & Validation** 

### **Technical Metrics**
- **Event Processing**: < 100ms p95 latency for event publishing
- **API Performance**: < 200ms p95 response time for queries
- **System Availability**: 99.5% uptime (target from ADR-015)
- **Test Coverage**: > 80% code coverage across all packages

### **Business Metrics**  
- **User Registration**: Functional user registration and authentication flow
- **Project Management**: CRUD operations for portfolio projects
- **Contact System**: Contact form submission and processing
- **Admin Dashboard**: Basic administrative functionality

### **Architecture Validation**
- **Event Sourcing**: Complete event flow from command to projection
- **CQRS**: Separate read and write models operational
- **Domain Isolation**: Clear boundaries between bounded contexts
- **Integration Events**: Cross-context communication via message bus

### **Operational Metrics**
- **Deployment**: Automated deployment pipeline functional
- **Monitoring**: Full observability stack operational
- **Error Handling**: Graceful degradation and recovery
- **Security**: Authentication and authorization working

---

## 🚨 **Risk Mitigation & Contingencies**

### **High-Risk Areas**

#### **1. Event Sourcing Complexity**
**Risk**: Implementation complexity may cause delays  
**Mitigation**: 
- Start with simple aggregates (User, Project)
- Implement comprehensive testing early
- Use proven patterns from packages/shared-domain

#### **2. Kafka Serverless Integration**
**Risk**: HTTP-based Kafka may have performance issues  
**Mitigation**:
- Implement connection pooling and caching
- Monitor latency carefully
- Have Redis fallback adapter ready

#### **3. Database Migration Complexity**
**Risk**: Event store and projection migrations may be complex  
**Mitigation**:
- Use Neon branching for safe migrations
- Implement projection rebuilds from events
- Test migration scripts thoroughly

### **Contingency Plans**

#### **Scenario 1: Kafka Performance Issues**
- **Fallback**: Switch to Redis message bus adapter
- **Timeline**: 2-3 days to implement and test
- **Impact**: Reduced throughput but functional system

#### **Scenario 2: Event Sourcing Implementation Delays**
- **Fallback**: Implement CRUD-based approach initially
- **Timeline**: 1 week to pivot
- **Migration**: Add event sourcing later as enhancement

#### **Scenario 3: Frontend Integration Problems**
- **Fallback**: API-only release with Postman documentation
- **Timeline**: Continue with backend, add frontend later
- **Impact**: Delayed user interface but functional backend

---

## 📅 **Detailed Timeline & Milestones**

### **Week 1: Foundation** 
- **Days 1-2**: Environment setup and validation
- **Days 3-5**: Cloud provider configuration  
- **Days 6-7**: Database and monitoring setup
- **Milestone**: Infrastructure functional

### **Week 2-3: Core Implementation**
- **Days 8-10**: Domain model completion (ADR-005)
- **Days 11-13**: Event versioning implementation (ADR-007)
- **Days 14-15**: Event store integration
- **Milestone**: Core domain functional

### **Week 4-5: Integration Layer**
- **Days 16-18**: Message bus implementation (ADR-022)
- **Days 19-21**: Projection strategy implementation (ADR-012)
- **Milestone**: Event-driven architecture functional

### **Week 6-7: Application Layer**
- **Days 22-24**: API and command handlers
- **Days 25-26**: Frontend integration
- **Milestone**: End-to-end user flows working

### **Week 8: Testing & Deployment**
- **Days 27-28**: Comprehensive testing setup
- **Days 29-30**: E2E testing implementation
- **Days 31-33**: Production deployment pipeline
- **Days 34-35**: Monitoring and alerting
- **Milestone**: Production-ready system

---

## 🎯 **Next Immediate Actions**

### **Today (Day 1)**
1. ✅ **Setup dev container**: Configure development environment with all CLI tools
2. 🔄 **Authenticate CLI tools**: Login to Doppler, Wrangler, Confluent, GitHub
3. 🔄 **Create implementation branch**: `git checkout -b feature/implementation-phase-1`
4. 🔄 **Set up project tracking**: Create GitHub issues for each phase
5. 🔄 **Configure Doppler**: Set up secret management for all environments

### **This Week (Days 2-7)**
1. 🔄 **Deploy infrastructure**: Terraform apply for all cloud providers
2. 🔄 **Configure databases**: Set up Neon with proper schemas
3. 🔄 **Test MCP integration**: Verify all servers working correctly
4. 🔄 **Set up monitoring**: Basic Grafana dashboards and alerts

### **Prerequisites Check**
Before proceeding, ensure you have:
- [ ] Cloudflare account with Workers and Pages enabled
- [ ] Doppler account for secret management  
- [ ] Neon account with API access
- [ ] Confluent Cloud account for Kafka message bus
- [ ] GitHub repository with appropriate permissions
- [ ] SonarQube/SonarCloud account for code quality
- [ ] Grafana Cloud account for monitoring (free tier)

---

**This implementation plan provides a comprehensive, step-by-step approach to building the portfolio platform. Each phase builds upon the previous one, with clear success criteria and risk mitigation strategies.**

**Estimated Total Cost**: $500-1,500 (primarily cloud services)  
**Estimated Timeline**: 8-12 weeks with 2-3 developers  
**Risk Level**: Medium (well-documented architecture with proven patterns)**

Ready to proceed with Phase 0? Let me know if you need any clarification or want to adjust the timeline or approach!
