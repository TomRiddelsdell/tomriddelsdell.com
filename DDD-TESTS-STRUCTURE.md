# DDD Testing Architecture

## Test Organization by Domain Boundaries

The tests are now organized according to Domain-Driven Design principles with clear separation by bounded context and testing layer.

### Domain Layer Tests
Pure business logic testing without infrastructure dependencies:

```
domains/
├── identity/tests/
│   ├── unit/identity-domain.test.ts          # User entity and value object tests
│   └── integration/                          # Domain service integration tests
├── workflow/tests/
│   ├── unit/workflow-domain.test.ts          # Workflow entity and business rule tests
│   └── integration/                          # Workflow orchestration tests
├── integration/tests/
│   ├── unit/integration-domain.test.ts       # External service domain tests
│   └── integration/                          # API integration tests
├── analytics/tests/
│   ├── unit/analytics-domain.test.ts         # Metrics and reporting domain tests
│   └── integration/analytics-compatibility.test.ts  # Cross-domain analytics tests
└── notification/tests/
    ├── unit/notification-domain.test.ts      # Notification domain logic tests
    └── integration/                          # Communication channel tests
```

### Service Layer Tests
Application service and use case testing:

```
services/
├── identity-service/tests/
│   ├── unit/identity-application.test.ts     # Use case handler tests
│   └── integration/                          # Database and external service tests
├── workflow-service/tests/
│   ├── unit/                                 # Workflow application service tests
│   └── integration/workflow-integration.test.ts  # Service integration tests
├── notification-service/tests/
│   ├── unit/notification-application.test.ts # Notification service tests
│   └── integration/                          # Email/SMS provider tests
└── integration-service/tests/
    ├── unit/integration-application.test.ts  # Integration orchestration tests
    └── integration/                          # Third-party API tests
```

### Infrastructure Layer Tests
Cross-cutting concern and infrastructure component testing:

```
infrastructure/tests/
├── unit/database.test.ts                     # Database connection and query tests
└── integration/
    ├── auth-regression.test.ts               # Authentication infrastructure tests
    ├── database-regression.test.ts           # Database migration and schema tests
    ├── performance-regression.test.ts        # Performance and load tests
    └── regression-suite.test.ts              # Full system regression tests
```

### Interface Layer Tests
External interface and API testing:

```
interfaces/
├── web-frontend/tests/
│   ├── unit/auth.test.tsx                    # React component unit tests
│   └── e2e/                                  # Frontend end-to-end tests
└── api-gateway/tests/
    ├── unit/                                 # Gateway routing tests
    └── integration/api.test.ts               # API integration tests
```

### End-to-End Tests
Cross-service and user journey testing:

```
tests-e2e/
├── auth-flow.spec.ts                         # Complete authentication flows
└── auth.spec.ts                              # User authentication scenarios
```

### Shared Testing Utilities
Common testing infrastructure and utilities:

```
libs/testing-utils/src/
├── validation.test.ts                        # Input validation test utilities
├── setup.ts                                  # Test environment setup
├── server.ts                                 # Mock server utilities
├── auth-context.tsx                          # React authentication mocks
└── handlers/                                 # Mock API handlers
```

## Testing Strategy by Layer

### 1. Domain Layer Testing
- **Focus**: Pure business logic, entities, value objects, domain services
- **Dependencies**: None (isolated unit tests)
- **Tools**: Jest/Vitest with domain-specific test builders
- **Examples**: User validation rules, workflow step logic, notification templates

### 2. Application Layer Testing
- **Focus**: Use case orchestration, application services, command/query handlers
- **Dependencies**: Mocked domain repositories and infrastructure
- **Tools**: Jest/Vitest with dependency injection mocks
- **Examples**: User registration workflows, workflow execution orchestration

### 3. Infrastructure Layer Testing
- **Focus**: Database access, external APIs, messaging, security
- **Dependencies**: Real databases (test instances), external service mocks
- **Tools**: Integration testing with testcontainers or dedicated test environments
- **Examples**: Database migrations, API client integrations, authentication flows

### 4. Interface Layer Testing
- **Focus**: API contracts, frontend components, user interactions
- **Dependencies**: Full application stack or service mocks
- **Tools**: React Testing Library, Playwright, API testing frameworks
- **Examples**: REST endpoint contracts, React component behavior, user workflows

### 5. End-to-End Testing
- **Focus**: Complete user journeys across all services
- **Dependencies**: Full application deployment
- **Tools**: Playwright, Cypress, or similar E2E frameworks
- **Examples**: User registration → workflow creation → execution → notification

## Test Execution Commands

### Domain Tests
```bash
# Test specific domains
cd domains/identity && npm test
cd domains/workflow && npm test
cd domains/notification && npm test
```

### Service Tests
```bash
# Test individual services
cd services/identity-service && npm test
cd services/workflow-service && npm test
cd services/notification-service && npm test
```

### Infrastructure Tests
```bash
# Test infrastructure components
cd infrastructure && npm test
```

### Interface Tests
```bash
# Test frontend and API gateway
cd interfaces/web-frontend && npm test
cd interfaces/api-gateway && npm test
```

### Full Test Suite
```bash
# Run all tests across the monorepo
make test
npm run test:all
```

## Benefits of DDD Test Organization

### 1. **Clear Ownership**
Each domain team owns their test suite completely

### 2. **Parallel Execution**
Tests can run independently across domains and services

### 3. **Focused Testing**
Domain tests focus on business logic, service tests on orchestration

### 4. **Easier Maintenance**
Test organization mirrors code organization for easier navigation

### 5. **Deployment Confidence**
Layered testing strategy catches issues at appropriate levels

### 6. **Team Boundaries**
Test organization supports team autonomy and responsibility

This testing architecture ensures comprehensive coverage while maintaining the clean boundaries established by the DDD monorepo structure.