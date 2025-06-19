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
- **Schema**: Defined in `domains/shared-kernel/src/schema.ts` with Drizzle
- **Initialization**: Automatic template seeding on first run

## Changelog
- June 19, 2025. COMPLETED: Enhanced Dashboard with User Management Interface
  - Added comprehensive user management section displaying all users and their authorized roles
  - Created user statistics dashboard showing Total Users (4), Active Users (4), Admin Users (1)
  - Implemented user table with role badges (admin/user), login counts, and activity tracking
  - Added authentication-gated access requiring admin privileges to view user management
  - Enhanced admin panel with system administration tools and user directory
- June 19, 2025. COMPLETED: Phase 1 Enhanced Dashboard - Monitoring & Administration Hub
  - Implemented comprehensive monitoring domain with health service, metrics service, and monitoring orchestration
  - Added monitoring database schema: system_metrics, service_health, performance_metrics, audit_logs, configuration_status
  - Created real-time system health monitoring with service status tracking (database, auth, api-gateway)
  - Built performance metrics dashboard with endpoint statistics, response times, and error rate monitoring
  - Enhanced Dashboard page with live monitoring components and admin-only system administration panel
  - Added API routes for monitoring: /api/monitoring/status, /api/monitoring/health, /api/monitoring/metrics, /api/monitoring/dashboard-stats
  - Implemented automatic health checks with 30-second intervals and performance metric collection
  - Created SystemHealthCard and PerformanceMetricsCard React components with real-time data updates
  - Added role-based access control for admin monitoring features and configuration validation
- June 19, 2025. COMPLETED: Phase 0 Security Hardening - Critical vulnerabilities eliminated
  - Removed hardcoded session secret from auth-config.ts using centralized configuration
  - Fixed insecure wildcard CORS configuration with proper origin validation
  - Eliminated hardcoded production domains throughout the codebase
  - Implemented comprehensive environment variable validation with startup checks
  - Created secure CORS middleware with configurable origins and development fallbacks
  - Updated rate limiting to use centralized configuration with environment-specific thresholds
  - Implemented configurable Content Security Policy through centralized system
  - Application now starts successfully with secure configuration validation
  - Created SECURITY_VALIDATION_REPORT.md documenting all fixes and compliance status
- June 19, 2025. CRITICAL: Security hardening and centralized configuration implementation
  - Implemented comprehensive centralized configuration system with type-safe validation
  - Created base configuration schema with Zod validation for all security settings
  - Developed environment-specific configuration loading with secure defaults
  - Comprehensive environment template (.env.example) with security documentation
  - Identified and documented critical security vulnerabilities requiring immediate attention
  - Created Phase 0 security roadmap prioritizing configuration externalization
  - Updated Plan.txt to include 1-2 week security hardening timeline before feature work
  - Addressed hardcoded secrets, insecure CORS, and missing environment validation
- June 19, 2025. Complete project cleanup and component simplification
  - Fixed React import issue in Dashboard page that was causing loading failures
  - Removed all unused components and pages to streamline the codebase
  - Eliminated complex sidebar and navigation dependencies causing import errors
  - Rebuilt Projects page with self-contained navigation matching Dashboard approach
  - Updated MainNavigation component to inline navigation links without dependencies
  - Cleaned up 30+ unused UI components and 10+ unused page components
  - Each page now has its own integrated navigation for better isolation and reliability
  - Maintained professional content while ensuring all pages load without errors
- June 19, 2025. Navigation refactoring and Dashboard page rebuild
  - Extracted navigation bar into reusable MainNavigation component for better code organization
  - Removed Tasks and Workflows pages and all references from navigation and routing
  - Completely rebuilt Dashboard page with self-contained implementation to fix loading issues
  - Added professional dashboard featuring Goldman Sachs role, activity tracking, and quick actions
  - Streamlined application to focus on core portfolio sections: Home, Career, Projects, Dashboard
  - Maintained all original Home page content while improving component reusability
  - Updated sidebar and navigation components to reflect simplified page structure
- June 19, 2025. Enhanced career page with authentic professional content
  - Replaced placeholder content with actual Goldman Sachs Executive Director experience
  - Added comprehensive work history: Goldman Sachs (2015-Present), Barclays Capital (2012-2015), Sophis/Misys (2009-2012)
  - Integrated King's College London MSci education with First Class Honours and Springer-Verlag Award
  - Updated technical skills section with accurate programming language proficiencies (Slang 8/10, Python 6/10, etc.)
  - Enhanced contact information with authentic details and professional positioning
  - Improved language throughout for elegance and precision
- June 19, 2025. Enforced strict DDD architectural boundaries
  - Removed root-level dist/ directory that violated domain separation
  - Build artifacts now properly contained within interface boundaries
  - Career page updated with authentic professional information
  - Fixed React import issues preventing proper page rendering
  - Maintained clean separation between domains, interfaces, and infrastructure
- June 17, 2025. Completed comprehensive DDD architecture cleanup
  - Removed all legacy directories (services/, shared/, client/) 
  - Consolidated all imports to proper DDD structure using @shared/* paths
  - Updated TypeScript configuration for correct module resolution
  - Moved template initialization to infrastructure/database/initTemplates.ts
  - Fixed all import paths to reference domains/shared-kernel/src/*
  - Validated complete directory structure alignment with DDD principles
- June 17, 2025. Upgraded to Vite 6.3.5 (latest version)
  - Migrated from Vite 5.4.15 to 6.3.5 for improved performance and stability
  - Updated @vitejs/plugin-react to 4.5.2 for enhanced React integration
  - Maintained full compatibility with existing DDD architecture
- June 17, 2025. Fixed authentication UI flickering and completed DDD migration
  - Implemented callback protection to prevent duplicate authentication processing
  - Enhanced error handling to show only one consistent authentication result
  - Migrated client directory to interfaces/web-frontend following DDD patterns
  - Updated Tailwind and components.json configurations for new structure
- June 14, 2025. Restored page structure from commit f32ae3d with DDD architecture integration
  - Implemented separate page components (Dashboard, Career, Projects)
  - Restored sidebar-based navigation with TopNavbar and Sidebar components
  - Updated routing to support individual page navigation
  - Maintained DDD architecture while incorporating f32ae3d page structure
- June 13, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.