# FlowCreate - Pure DDD Architecture

## Architecture Overview
FlowCreate has been transformed from a legacy monolithic structure to a pure Domain Driven Design (DDD) monorepo architecture.

## Directory Structure

### Core DDD Boundaries
- **`domains/`** - Core business domains with clear boundaries
  - `identity/` - User authentication and authorization
  - `workflow/` - Workflow creation and execution
  - `analytics/` - Data analysis and reporting
  - `integration/` - Third-party service connections
  - `notification/` - Communication services
  - `shared-kernel/` - Shared domain concepts

### Application Layer
- **`services/`** - Application services for each domain
- **`interfaces/`** - User interfaces and API gateways
  - `api-gateway/` - Main API entry point
  - `web-frontend/` - React-based UI
  - `admin-dashboard/` - Administrative interface

### Infrastructure Layer
- **`infrastructure/`** - Cross-cutting concerns
  - `database/` - Data persistence
  - `security/` - Authentication and authorization
  - `observability/` - Monitoring and logging
  - `tests/` - Testing infrastructure

### Shared Libraries
- **`libs/`** - Reusable utilities and shared libraries

## Key Transformations Completed
✅ Removed legacy `src/` directory and `server/` bridge
✅ Moved shared schema to `domains/shared-kernel/`
✅ Reorganized E2E tests to `infrastructure/tests/e2e/`
✅ Moved deployment configs to `infrastructure/deployment/`
✅ Consolidated documentation into single architecture guide
✅ Updated all import paths to reflect new DDD structure

## Authentication
- AWS Cognito integration with database synchronization
- Role-based access control
- Session management

## Database
- PostgreSQL with Drizzle ORM
- Domain-specific schemas in shared kernel
- Automated migrations

## Deployment
- Replit Deployments ready
- Infrastructure as code in `infrastructure/deployment/`
- Automated testing pipeline

The platform now follows pure DDD principles with clear domain boundaries, separation of concerns, and enterprise-ready architecture patterns.