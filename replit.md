# FlowCreate - Workflow Automation Platform

## Overview

FlowCreate is a professional TypeScript-based workflow automation platform built with pure Domain Driven Design (DDD) architecture. The system is designed for intelligent workflow creation and enterprise-grade reliability, focusing on separation of concerns and clean architecture principles.

## System Architecture

### Architecture Pattern
- **Domain Driven Design (DDD)**: Pure domain layer with bounded contexts
- **Monorepo Structure**: Organized into domains, services, interfaces, and infrastructure
- **Layered Architecture**: Clear separation between domain, application, infrastructure, and interface layers

### Key Architectural Decisions
- **Technology Stack**: TypeScript throughout for type safety
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: AWS Cognito for enterprise-grade identity management
- **Frontend**: React with Vite for fast development and modern tooling
- **Testing**: Comprehensive testing strategy with Vitest and Playwright

## Key Components

### Domain Layer (`domains/`)
- **Identity Domain**: User management, authentication, and authorization with AWS Cognito integration
- **Workflow Domain**: Core workflow logic, execution, and validation
- **Integration Domain**: External service integrations and data transformation
- **Analytics Domain**: Metrics collection, logging, and issue reproduction
- **Notification Domain**: Multi-channel notification system with SendGrid
- **Shared Kernel**: Common value objects, domain events, and base patterns

### Application Services (`services/`)
- **Identity Service**: User authentication and profile management
- **Workflow Service**: Workflow creation, execution, and management
- **Integration Service**: External API connections and data sync
- **Notification Service**: Email and notification delivery

### Interface Layer (`interfaces/`)
- **API Gateway**: Express.js server handling all HTTP requests and authentication
- **Web Frontend**: React SPA with Shadcn/ui components and Tailwind CSS
- **Test Frontend**: Minimal testing interface for validation

### Infrastructure
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle with type-safe migrations and schema management
- **Logging**: Centralized logging system for issue reproduction and debugging
- **Security**: Rate limiting, CORS, security headers, and input sanitization

## Data Flow

### Authentication Flow
1. User authenticates via AWS Cognito Hosted UI
2. Cognito returns authorization code to callback
3. API Gateway exchanges code for tokens
4. User session established with local database sync
5. Frontend receives authenticated user state

### Workflow Execution Flow
1. User creates workflow through React frontend
2. API Gateway validates and persists workflow configuration
3. Workflow service processes execution logic
4. Integration service handles external API calls
5. Notification service sends status updates
6. Analytics service logs metrics and events

### Data Persistence
- All domain entities persisted via Drizzle ORM
- Database schema managed through migrations
- Session data stored in memory with configurable persistence

## External Dependencies

### Required Services
- **AWS Cognito**: User pool and client configuration required
- **PostgreSQL Database**: Connection string via `DATABASE_URL`
- **SendGrid** (Optional): Email delivery service

### Required Environment Variables
```
DATABASE_URL=postgresql://...
VITE_AWS_COGNITO_CLIENT_ID=your_client_id
VITE_AWS_COGNITO_REGION=your_region
VITE_AWS_COGNITO_USER_POOL_ID=your_pool_id
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SESSION_SECRET=your_session_secret
```

### Optional Environment Variables
```
SENDGRID_API_KEY=SG.your_api_key
AWS_COGNITO_CLIENT_SECRET=your_client_secret
```

## Deployment Strategy

### Development Environment
- **Primary Command**: `npm run dev` - Starts API Gateway with hot reload
- **Alternative**: `NODE_ENV=development tsx interfaces/api-gateway/src/index.ts`
- **Frontend**: Served via Vite development server integrated with Express
- **Database**: Uses same PostgreSQL instance as production

### Production Build
- **Build Command**: `npm run build` - Builds both frontend and backend
- **Start Command**: `npm run start` - Runs production server
- **Deployment**: Configured for Replit autoscale deployment target

### Testing Strategy
- **Unit Tests**: Domain-focused tests with Vitest
- **Integration Tests**: API and service integration tests
- **E2E Tests**: Playwright for full user journey testing
- **Pre-deployment**: Automated test script (`./pre-deploy.sh`) validates environment and runs tests

### Database Management
- **Migrations**: `npm run db:push` applies schema changes
- **Schema**: Defined in `shared/schema.ts` with Drizzle
- **Initialization**: Automatic template seeding on first run

## Changelog
- June 14, 2025. Restored page structure from commit f32ae3d with DDD architecture integration
  - Implemented separate page components (Dashboard, Career, Projects, Tasks, Workflows)
  - Restored sidebar-based navigation with TopNavbar and Sidebar components
  - Updated routing to support individual page navigation
  - Maintained DDD architecture while incorporating f32ae3d page structure
- June 13, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.