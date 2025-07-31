# GitHub Copilot Instructions for tomriddelsdell.com

## Project Overview
This is a personal website with enterprise-grade architecture using pure Domain Driven Design (DDD). The system provides secure access to sub-projects with comprehensive monitoring, authentication, and workflow capabilities.

## Architecture & Technology Stack

### Core Architecture
- **Domain Driven Design (DDD)**: Pure domain layer with strict bounded contexts
- **Monorepo Structure**: Organized into domains, interfaces, and infrastructure
- **Layered Architecture**: Clear separation between domain, application, infrastructure, and interface layers
- **Technology Stack**: TypeScript throughout, React with Vite, PostgreSQL with Drizzle ORM, AWS Cognito, Express.js

### Directory Structure
```
domains/                 # Domain layer - business logic and entities
├── identity/           # User management and authentication
├── workflow/           # Core workflow logic and execution
├── integration/        # External service integrations
├── analytics/          # Metrics collection and logging
├── notification/       # Multi-channel notification system
├── monitoring/         # System health and performance monitoring
└── shared-kernel/      # Common value objects and domain events

interfaces/             # Interface layer - external boundaries
├── api-gateway/        # Express.js HTTP API
└── web-frontend/       # React SPA with Shadcn/ui

infrastructure/         # Infrastructure concerns
├── database/           # PostgreSQL, migrations, schemas
├── security/           # Authentication, authorization, RBAC
└── configuration/      # Environment and system configuration
```

### Import Patterns
- Use `@shared/*` for shared kernel references
- Always import from `domains/shared-kernel/src/*` for shared components
- Maintain strict DDD boundaries - no cross-domain imports except through shared kernel
- Database schema defined in `domains/shared-kernel/src/schema.ts`

## Development Workflow - CRITICAL

### Code Change Protocol (MANDATORY)
1. **Always ask before making changes** - Never implement code modifications without explicit confirmation
2. **Present changes first** - Describe what will be modified, which files affected, expected outcome
3. **Wait for approval** - Never proceed without explicit user confirmation
4. **Break down complex changes** - Split multi-file modifications into reviewable chunks
5. **Explain reasoning** - Always explain why changes are necessary
6. **Record Bugs in docs/Bugs.md** - Document any bugs or issues encountered, with reproduction unit test and resolution status.

### Required Change Format
```
Problem: [Brief description of the issue]
Proposed Solution: [What needs to be changed]
Files Affected: [List of files to be modified]
Implementation Steps: [Step-by-step approach]
Confirmation: "Should I proceed with these changes?"
```

### Emergency Exceptions Only
- User explicitly says "go ahead and implement"
- User gives blanket approval for specific task
- Critical security issue requires immediate action

## Technical Standards

### Code Quality
- **TypeScript**: Strict typing throughout, no `any` types
- **DDD Boundaries**: Maintain strict separation between domains
- **Security First**: All inputs validated, proper authentication checks
- **Testing**: Domain-focused tests with Vitest, integration tests, E2E with Playwright. Follow Test-First best practices.

### Database Operations
- **ORM**: All database operations through Drizzle ORM
- **Migrations**: Use `npm run db:push` for schema changes
- **Schema**: Centrally defined in shared kernel
- **Type Safety**: Leverage Drizzle's type-safe queries

### Security Requirements
- **Authentication**: AWS Cognito integration required
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schemas for all inputs
- **Environment Variables**: Centralized configuration with validation
- **Session Management**: Secure session handling with cleanup

## Common Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run test` - Run test suite
- `npm run db:push` - Apply database schema changes
- `./pre-deploy.sh` - Pre-deployment validation

## Key Components to Remember

### Domains
- **Identity**: User management, AWS Cognito integration
- **Workflow**: Core business logic and execution
- **Monitoring**: System health, metrics, performance tracking
- **Shared Kernel**: Value objects, events, common patterns

### Infrastructure
- **Database**: PostgreSQL with Neon serverless, connection pooling
- **Authentication**: AWS Cognito with hosted UI
- **Security**: Rate limiting, CORS, security headers
- **Configuration**: Environment-based with Zod validation
- **MCP Servers**: Model Context Protocol integration for AI tool capabilities

## MCP (Model Context Protocol) Architecture

### Active MCP Servers
The system integrates with multiple MCP servers for enhanced AI capabilities:

#### 1. AWS API MCP Server
- **Location**: `.devcontainer/Dockerfile.aws-mcp`
- **Purpose**: AWS service management through AI tools
- **Technology**: Python 3.10-slim + uv package manager
- **Package**: `awslabs.aws-api-mcp-server` (official AWS Labs)
- **Port**: 8001
- **Features**: EC2, S3, Lambda, CloudFormation management
- **Authentication**: AWS credentials via environment variables

#### 2. Amazon Neptune MCP Server  
- **Location**: `.devcontainer/Dockerfile.neptune-mcp`
- **Purpose**: Graph database operations through AI tools
- **Technology**: Python 3.10-slim + uv package manager
- **Package**: `awslabs.amazon-neptune-mcp-server` (official AWS Labs)
- **Port**: 8002
- **Features**: Graph queries, relationship analysis, data exploration
- **Configuration**: NEPTUNE_ENDPOINT environment variable

#### 3. GitHub MCP Server (Remote)
- **Type**: Official GitHub-hosted remote server
- **URL**: `https://api.githubcopilot.com/mcp/`
- **Purpose**: GitHub repository and workflow management
- **Technology**: GitHub's official Go-based server
- **Authentication**: GitHub Copilot OAuth or Personal Access Token
- **Features**: Repository management, Issues, PRs, CI/CD, code analysis

### MCP Integration Notes
- **Docker Compose**: All MCP servers defined in `.devcontainer/docker-compose.yml`
- **HTTP Wrappers**: Custom FastAPI wrappers for AWS/Neptune servers (ports 8001/8002)
- **Official Packages**: Using AWS Labs official packages for reliability
- **Base Image**: Switched from Alpine to Debian-slim for PyTorch compatibility
- **Package Manager**: Using `uv` for faster dependency management
- **Health Checks**: HTTP endpoints for container health monitoring

### MCP Server Management
- **Build Issues**: Documented in `docs/Bugs.md` (DEV-001, DEV-002)
- **Configuration**: Environment variables in devcontainer.json
- **Networking**: Internal Docker network communication
- **Development**: Accessible via forwarded ports for debugging

## Communication Style
- Use simple, everyday language
- Avoid technical jargon when explaining to user
- Be concise but thorough in explanations
- Always confirm understanding before proceeding

## Remember
This is a production-ready enterprise system. Always maintain the high standards of code quality, security, and architectural integrity that have been established. When in doubt, ask for clarification rather than making assumptions.
