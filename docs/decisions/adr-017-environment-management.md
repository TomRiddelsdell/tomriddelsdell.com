# ADR-017: Environment Management Strategy

## Status

Proposed

## Context

We need to define our environment management strategy including the number of environments, configuration handling, secret management, local development setup, and testing strategies. This strategy must balance simplicity for initial development with the ability to scale as the platform grows.

## Decision

### Environment Strategy

**Two-Environment Approach (Initial):**

- **Development Environment**: Shared development environment for integration testing
- **Production Environment**: Live production environment serving real users
- **Local Development**: Individual developer environments running locally

**Environment Characteristics:**

```yaml
environments:
  local:
    purpose: 'Individual developer testing and rapid iteration'
    database: 'Local PostgreSQL or Neon dev branch per developer'
    workers: 'Local Cloudflare Workers development server'
    event_store: 'Local event store instance'
    projections: 'Local projection databases'

  development:
    purpose: 'Shared integration testing and feature validation'
    database: 'neon-dev'
    workers: 'dev.tomriddelsdell.com'
    event_store: 'Shared development event store'
    projections: 'Shared development projection databases'

  production:
    purpose: 'Live production environment'
    database: 'neon-prod'
    workers: 'tomriddelsdell.com'
    event_store: 'Production event store with backups'
    projections: 'Production projection databases with monitoring'
```

### Development Workflow

**Feature Development Process:**

1. **Local Development**: Developer works on feature branch locally
2. **Local Testing**: Run unit and integration tests locally
3. **Development Deployment**: Merge to `develop` branch triggers deployment to dev environment
4. **Integration Testing**: Validate feature works in shared environment
5. **Production Deployment**: Merge to `main` branch triggers production deployment

**Branch Strategy:**

- **Feature branches**: Developed and tested locally
- **Develop branch**: Continuous deployment to development environment
- **Main branch**: Continuous deployment to production environment
- **No staging environment**: Development environment serves as staging

### Environment-Specific Configuration

**Configuration Management:**

- **Environment variables**: Separate `.env` files per environment
- **Configuration hierarchy**: Default values → Environment-specific overrides
- **Type-safe configuration**: TypeScript interfaces for all config
- **Validation**: Runtime validation of required configuration values

**Configuration Structure:**

```typescript
// src/config/environment.ts
interface EnvironmentConfig {
  environment: 'local' | 'development' | 'production';
  database: {
    url: string;
    maxConnections: number;
    ssl: boolean;
  };
  workers: {
    baseUrl: string;
    environment: string;
  };
  eventStore: {
    encryptionKey: string;
    retentionDays: number;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Environment-specific configurations
const configs = {
  local: {
    database: { maxConnections: 5, ssl: false },
    monitoring: { enabled: false, logLevel: 'debug' },
  },
  development: {
    database: { maxConnections: 10, ssl: true },
    monitoring: { enabled: true, logLevel: 'info' },
  },
  production: {
    database: { maxConnections: 20, ssl: true },
    monitoring: { enabled: true, logLevel: 'warn' },
  },
};
```

### Secret Management Strategy

**Secret Categories:**

- **Database credentials**: Connection strings, authentication tokens
- **API keys**: Third-party service credentials
- **Encryption keys**: Event store encryption, JWT signing keys
- **Service credentials**: Inter-service authentication tokens

**Doppler Secret Management:**

- **Local**: Doppler CLI with personal development tokens
- **Development**: Doppler service tokens for dev environment
- **Production**: Doppler service tokens with restricted access
- **GitHub Actions**: Doppler service tokens injected as environment variables

**Secret Organization in Doppler:**

```yaml
# Doppler project structure
project: tomriddelsdell-platform
environments:
  local:
    configs:
      - dev_personal # Individual developer configs
  development:
    configs:
      - dev_shared # Shared development environment
  production:
    configs:
      - prod # Production environment
      - prod_backup # Backup/disaster recovery configs
```

**Secret Rotation:**

- **Frequency**: Quarterly for production, annually for development
- **Process**: Doppler's automated rotation capabilities
- **Rollover**: Doppler's versioning supports multiple valid keys during rotation
- **Monitoring**: Doppler webhooks for secret expiration alerts

**Secret Management Implementation:**

```typescript
// src/config/secrets.ts
interface SecretManager {
  getDatabaseUrl(): Promise<string>;
  getEncryptionKey(): Promise<string>;
  getApiKey(service: string): Promise<string>;
  rotateSecret(name: string): Promise<void>;
}

class DopplerSecretManager implements SecretManager {
  constructor(private environment: string) {}

  async getDatabaseUrl(): Promise<string> {
    // Doppler automatically injects secrets as environment variables
    return this.getRequired('DATABASE_URL');
  }

  async getEncryptionKey(): Promise<string> {
    return this.getRequired('ENCRYPTION_KEY');
  }

  async getApiKey(service: string): Promise<string> {
    const key = `${service.toUpperCase()}_API_KEY`;
    return this.getRequired(key);
  }

  async rotateSecret(name: string): Promise<void> {
    // Integration with Doppler API for automated rotation
    // Implementation depends on specific secret type
    throw new Error('Secret rotation requires Doppler API integration');
  }

  private getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(
        `Required secret ${key} not found. Ensure Doppler is configured correctly.`
      );
    }
    return value;
  }
}
```

### Local Development Setup

**Developer Environment Requirements:**

- **Node.js**: Version 20+ with npm/yarn
- **PostgreSQL**: Local instance or Neon development branch
- **Cloudflare Workers CLI**: Wrangler for local development
- **Docker**: For running dependent services locally
- **Doppler CLI**: For secret management and environment configuration

**Doppler Local Setup:**

```bash
# Install Doppler CLI
curl -Ls https://cli.doppler.com/install.sh | sh

# Login to Doppler
doppler login

# Setup project and environment
doppler setup --project tomriddelsdell-platform --config dev_personal

# Run development with Doppler
doppler run -- npm run dev:start
```

**Local Development Stack:**

```yaml
# docker-compose.local.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-tomriddelsdell_local}
      POSTGRES_USER: ${POSTGRES_USER:-dev}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-dev}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

**Development Scripts with Doppler:**

```json
// package.json scripts
{
  "scripts": {
    "dev:setup": "doppler setup && docker-compose -f docker-compose.local.yml up -d",
    "dev:migrate": "doppler run -- npm run migrate:up -- --env=local",
    "dev:seed": "doppler run -- npm run seed -- --env=local",
    "dev:start": "doppler run -- wrangler dev",
    "dev:test": "doppler run -- jest --watch",
    "dev:clean": "docker-compose -f docker-compose.local.yml down -v"
  }
}
```

### Testing Environment Strategy

**Local Testing:**

- **Unit tests**: Jest with domain-focused test suites
- **Integration tests**: Test against local database and services
- **Contract tests**: Validate event schemas and API contracts
- **E2E tests**: Playwright against local application

**Development Environment Testing:**

- **Smoke tests**: Basic functionality verification after deployment
- **Integration tests**: Cross-service communication validation
- **Performance tests**: Basic load testing with realistic data
- **User acceptance testing**: Manual testing of user journeys

**Testing Configuration:**

```typescript
// src/config/testing.ts
interface TestConfig {
  environment: string;
  database: {
    url: string;
    resetBetweenTests: boolean;
  };
  fixtures: {
    loadTestData: boolean;
    userCount: number;
    projectCount: number;
  };
}

const testConfigs = {
  local: {
    database: { resetBetweenTests: true },
    fixtures: { loadTestData: true, userCount: 10, projectCount: 50 },
  },
  development: {
    database: { resetBetweenTests: false },
    fixtures: { loadTestData: false, userCount: 100, projectCount: 500 },
  },
};
```

## Implementation Details

### Environment Detection

```typescript
// src/config/environment-detector.ts
export function detectEnvironment(): string {
  // Check Doppler environment first
  if (process.env.DOPPLER_ENVIRONMENT) {
    return process.env.DOPPLER_ENVIRONMENT;
  }

  // Fallback to NODE_ENV
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  // Detect based on hostname or other indicators
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'tomriddelsdell.com') return 'production';
    if (hostname === 'dev.tomriddelsdell.com') return 'development';
  }

  return 'local';
}
```

### Configuration Loading

```typescript
// src/config/loader.ts
export async function loadConfiguration(): Promise<EnvironmentConfig> {
  const environment = detectEnvironment();

  // Validate Doppler configuration
  if (!process.env.DOPPLER_PROJECT) {
    console.warn('DOPPLER_PROJECT not set. Secrets may not be available.');
  }

  const baseConfig = await loadBaseConfig();
  const envConfig = await loadEnvironmentConfig(environment);

  const config = mergeConfigs(baseConfig, envConfig);
  validateConfiguration(config);

  return config;
}
```

### Deployment with Doppler

```yaml
# .github/workflows/deploy.yml
env:
  NODE_ENV: ${{ github.ref == 'refs/heads/main' && 'production' || 'development' }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Doppler CLI
        uses: dopplerhq/cli-action@v3

      - name: Deploy to Development
        if: github.ref == 'refs/heads/develop'
        env:
          DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN_DEV }}
        run: |
          doppler secrets download --format env --no-file | source /dev/stdin
          # Deploy commands here

      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        env:
          DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN_PROD }}
        run: |
          doppler secrets download --format env --no-file | source /dev/stdin
          # Deploy commands here
```

## Alternatives Considered

1. **Three-environment approach (dev/staging/prod)**: Added complexity without clear benefit for current scale
2. **Per-developer cloud environments**: Cost prohibitive and unnecessary for current team size
3. **Shared staging environment**: Redundant with development environment serving this purpose
4. **Feature branch environments**: Overkill for current development velocity
5. **Container-based local development**: Added complexity for questionable benefit
6. **GitHub Actions secrets**: Limited secret management capabilities and poor developer experience
7. **AWS Secrets Manager**: More complex setup and higher costs for current scale
8. **HashiCorp Vault**: Overkill for current requirements and operational overhead

## Consequences

**Benefits:**

- **Simple environment model** reduces operational overhead
- **Fast local development** with immediate feedback loops
- **Clear promotion path** from local → development → production
- **Cost-effective approach** with minimal infrastructure requirements
- **Easy debugging** with fewer environment-specific issues
- **Centralized secret management** with Doppler reduces security risks
- **Developer-friendly secret access** via CLI and automatic injection
- **Audit trail** for all secret access and changes

**Drawbacks:**

- **Shared development environment** may have conflicts during parallel development
- **No staging environment** means production is first place some integrations are tested
- **Limited environment parity** between local and cloud environments
- **Doppler dependency** introduces third-party service dependency
- **Additional tooling** developers need to learn and maintain

## Trade-offs

**Simplicity vs Safety:**

- Choosing fewer environments over comprehensive testing environments
- Accepting some production risk for faster development velocity

**Cost vs Features:**

- Minimizing infrastructure costs over having dedicated staging environments
- Deferring advanced environment features until growth justifies complexity

**Developer Experience vs Operations:**

- Optimizing for fast local development over perfect environment parity
- Accepting some manual operations to avoid premature automation

## Migration Strategy

**Phase 1: Two-Environment Setup (MVP)**

- Local and development environments
- Basic configuration management
- Manual secret rotation
- Docker Compose for local dependencies

**Phase 2: Enhanced Development (Growth)**

- Add staging environment if needed
- Automated secret rotation
- Enhanced local development tools
- Per-feature environment capability

**Phase 3: Advanced Operations (Scale)**

- Multi-region environments
- Advanced configuration management
- Chaos engineering in non-production
- Comprehensive environment monitoring

## Security Considerations

**Environment Isolation:**

- **Network separation**: Development and production in separate networks
- **Data isolation**: No production data in development environments
- **Access control**: Different Doppler service tokens per environment
- **Audit logging**: Doppler provides comprehensive audit trails

**Doppler Security Features:**

- **Encryption at rest and in transit**: All secrets encrypted with AES-256
- **Role-based access control**: Granular permissions per environment
- **Secret versioning**: Full history of secret changes
- **Webhook monitoring**: Real-time notifications for secret access
- **Service token scoping**: Tokens limited to specific environments and permissions
- **No secret logging**: Doppler ensures secrets never appear in logs

**Configuration Security:**

- **No sensitive data in code**: All sensitive config via Doppler
- **Configuration validation**: Runtime checks for required security settings
- **Default security**: Secure defaults with explicit opt-out for less secure options
- **Secret rotation automation**: Doppler supports automated rotation workflows
