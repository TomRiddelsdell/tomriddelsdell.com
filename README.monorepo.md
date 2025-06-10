# FlowCreate Platform - DDD Monorepo

A workflow automation platform built with Domain-Driven Design (DDD) principles and hexagonal architecture.

## Architecture Overview

```
flowcreate-platform/
├── domains/                    # Pure domain logic (bounded contexts)
│   ├── identity/              # User authentication & authorization
│   ├── workflow/              # Workflow automation logic
│   ├── integration/           # App connections & data mapping
│   ├── analytics/             # Metrics & reporting
│   ├── notification/          # Multi-channel notifications
│   └── shared-kernel/         # Shared domain concepts
├── services/                  # Application services (microservices)
│   ├── identity-service/      # Identity management API
│   ├── workflow-service/      # Workflow orchestration
│   ├── integration-service/   # External API integrations
│   ├── analytics-service/     # Analytics & reporting
│   └── notification-service/  # Notification delivery
├── infrastructure/            # Cross-cutting infrastructure
│   ├── database/             # Database schemas & migrations
│   ├── message-bus/          # Event messaging
│   └── observability/        # Monitoring & logging
├── interfaces/               # External interfaces
│   ├── api-gateway/          # API routing & authentication
│   ├── web-frontend/         # React user interface
│   └── admin-dashboard/      # Administrative interface
└── libs/                     # Shared utilities
    ├── logging/              # Centralized logging
    ├── monitoring/           # Metrics collection
    ├── http-client/          # HTTP client utilities
    └── validation/           # Shared validation logic
```

## Domain-Driven Design Structure

### Bounded Contexts

1. **Identity Domain** - User management, authentication, authorization
2. **Workflow Domain** - Automation workflows, triggers, actions
3. **Integration Domain** - External app connections, data transformation
4. **Analytics Domain** - Metrics, dashboards, reporting
5. **Notification Domain** - Email, SMS, push notifications

### Layer Responsibilities

- **Domain Layer**: Pure business logic, entities, value objects, domain services
- **Application Layer**: Use cases, command/query handlers, application services
- **Infrastructure Layer**: Database, external APIs, messaging, frameworks
- **Interface Layer**: REST APIs, web interfaces, GraphQL endpoints

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose
- npm 8+

### Development Setup

```bash
# Install dependencies
npm install

# Set up development environment
docker-compose up -d

# Run database migrations
npm run migration:up

# Start all services
npm run dev
```

### Available Commands

```bash
npm run build          # Build all packages
npm run test           # Run all tests
npm run lint           # Lint all packages
npm run dev            # Start development environment
npm run start:prod     # Start production environment
npm run clean          # Clean all build artifacts
```

## Service Architecture

Each service follows hexagonal architecture:

- **Application Layer**: Use case orchestration
- **Domain Layer**: Business logic (imported from domains/)
- **Infrastructure Layer**: External integrations
- **API Layer**: HTTP endpoints and controllers

## Infrastructure

### Database
- PostgreSQL with domain-specific schemas
- Separate migrations per domain
- Event sourcing for audit trails

### Messaging
- RabbitMQ for domain events
- Redis for caching and sessions
- Event-driven inter-service communication

### Observability
- Prometheus metrics
- Grafana dashboards
- Jaeger distributed tracing
- ELK stack for centralized logging

## Development Guidelines

### Domain Rules
- No infrastructure dependencies in domain layer
- Rich domain models with business logic
- Domain events for cross-boundary communication
- Repository pattern for data access

### Service Communication
- Async messaging for domain events
- Synchronous HTTP for queries
- API Gateway for external interfaces
- Circuit breakers for resilience

### Testing Strategy
- Unit tests for domain logic
- Integration tests for services
- Contract tests for APIs
- End-to-end tests for user journeys

## Deployment

### Local Development
```bash
docker-compose up -d
npm run dev
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
See individual service README files for specific configuration.

## Contributing

1. Follow DDD principles
2. Keep domains pure
3. Test domain logic thoroughly
4. Document architectural decisions
5. Use conventional commits

## License

MIT License - see LICENSE file for details