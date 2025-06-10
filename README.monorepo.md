# FlowCreate DDD Monorepo

## Architecture Overview

FlowCreate has been restructured as a Domain-Driven Design (DDD) monorepo with clear separation of concerns across five bounded contexts:

- **Identity**: User management and authentication
- **Workflow**: Automation and process management  
- **Integration**: External service connections
- **Analytics**: Metrics and reporting
- **Notification**: Communication channels

## Directory Structure

```
FlowCreate/
├── domains/                    # Pure business logic
│   ├── identity/
│   ├── workflow/
│   ├── integration/
│   ├── analytics/
│   ├── notification/
│   └── shared-kernel/
├── services/                   # Application services
│   ├── identity-service/
│   ├── workflow-service/
│   ├── integration-service/
│   ├── analytics-service/
│   └── notification-service/
├── infrastructure/             # Cross-cutting concerns
│   ├── database/
│   ├── security/
│   ├── message-bus/
│   └── observability/
├── interfaces/                 # External touchpoints
│   ├── web-frontend/
│   ├── api-gateway/
│   └── admin-dashboard/
└── libs/                      # Shared utilities
    ├── logging/
    ├── validation/
    ├── http-client/
    └── testing-utils/
```

## Development Commands

### Monorepo Management
```bash
make install        # Install all dependencies
make build          # Build all services
make test           # Run all tests
```

### Individual Services
```bash
make dev-frontend      # Start web frontend
make dev-gateway       # Start API gateway
make dev-identity      # Start identity service
make dev-workflow      # Start workflow service
make dev-notification  # Start notification service
```

### Docker Development
```bash
docker-compose up              # Start all services
docker-compose up frontend     # Start frontend only
docker-compose up identity     # Start identity service only
```

## Service Communication

Services communicate through:
- **REST APIs**: Synchronous operations
- **Message Bus**: Asynchronous events
- **Shared Database**: Read-only cross-service queries (limited)

## Domain Boundaries

### Identity Domain
- User registration and authentication
- Role and permission management
- Session handling
- OAuth integration

### Workflow Domain
- Workflow creation and execution
- Template management
- Step processing
- Automation logic

### Integration Domain
- External API connections
- Third-party service management
- Data synchronization
- Webhook handling

### Analytics Domain
- User activity tracking
- Performance metrics
- Dashboard data
- Reporting generation

### Notification Domain
- Email notifications
- SMS alerts
- In-app messages
- Template management

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query for state management
- Wouter for routing

### Backend
- Node.js with Express
- TypeScript throughout
- Drizzle ORM with PostgreSQL
- AWS Cognito for authentication

### Infrastructure
- Docker containers
- PostgreSQL database
- Redis for caching
- RabbitMQ for messaging

## Getting Started

1. **Install dependencies**:
   ```bash
   make install
   ```

2. **Start development environment**:
   ```bash
   make dev
   ```

3. **Run specific service**:
   ```bash
   make dev-identity    # For identity service
   make dev-workflow    # For workflow service
   ```

4. **Build for production**:
   ```bash
   make build
   ```

## Testing Strategy

### Unit Tests
- Domain logic testing in isolation
- Service layer functionality
- Infrastructure component testing

### Integration Tests
- Cross-service communication
- Database interactions
- API endpoint validation

### End-to-End Tests
- Complete user workflows
- Multi-service scenarios
- UI automation testing

## Deployment

Each service can be deployed independently:

```bash
# Deploy identity service
cd services/identity-service
npm run build
npm run start

# Deploy workflow service  
cd services/workflow-service
npm run build
npm run start
```

## Migration Status

✅ **Completed**:
- Domain structure created
- Service foundations established
- Infrastructure separation
- Interface layer organization
- Development tooling setup

🔄 **In Progress**:
- Import path updates
- Service activation
- Cross-service testing

## Contributing

1. Choose a bounded context (domain)
2. Work within the appropriate service directory
3. Follow DDD principles for domain logic
4. Use shared infrastructure components
5. Write tests for new functionality

## Architecture Benefits

- **Scalability**: Independent service scaling
- **Maintainability**: Clear separation of concerns
- **Team Ownership**: Bounded context responsibility
- **Technology Flexibility**: Service-specific tech choices
- **Deployment Independence**: Individual service releases