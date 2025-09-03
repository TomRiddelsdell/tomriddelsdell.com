# GitHub Copilot Instructions for tomriddelsdell.com

## Project Overview
This is a personal website that acts as a platform for showcasing projects to authorized users.
The project follows Domain Driven Design (DDD) with a focus on architecture and code quality. 
Security, Testing and monitoring are integral parts of the system.

## Architecture & Technology Stack

### Core Architecture
- **Domain Driven Design (DDD)**: Pure domain layer with strict bounded contexts
- **Monorepo Structure**: Organized into domains, interfaces, and infrastructure
- **Layered Architecture**: Clear separation between domain, application, infrastructure, and interface layers
- **Technology Stack**: 
- ***Frontends*** should be TypeScript using React with Vite
- ***Backtends*** should be either TypeScript, Java or Python
- ***Databases*** should be PostgreSQL using Drizzle ORM where appropriate. NeonDB is used for serverless database hosting.
- ***Infrastructure*** should be AWS with CDK for provisioning and management.

### Directory Structure
```
domains/                # Domain layer - business logic and entities
├── identity/           # User management and authentication
├── integration/        # External service integrations
├── analytics/          # Metrics collection and logging
├── notification/       # Multi-channel notification system
├── monitoring/         # System health and performance monitoring
├── shared-kernel/      # Common value objects and domain events
└── app-1,2,.../        # For all access controlled sub applications (e.g. qis-data-management will be an additional domain added here)

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

## Development Workflow

### Code Change Protocol (MANDATORY)
- **Tests** - Always review tests before making changes. Adding new tests for any new functionality is mandatory
- **Break down complex changes** - Split multi-file modifications into reviewable chunks. Suggest multiple commits or new git branches if necessary
- **Explain reasoning and provide options** - Always explain why changes are necessary and provide alternative solutions and their trade offs where appropriate
- **Record Bugs in docs/Bugs.md** - Document any bugs or issues encountered, with reproduction unit test and resolution status
- **Document work done in changes/yyyy-mm-dd-copilot.md** - Summarize changes made regularly, particularly after each commit, including any relevant context or decisions. Updates should be appended at the top of the file with a timestamp. Previous timestamps should not be modified.
- **Git Branching** - Perform minor changes in 'develop' branch. Major changes should be done in feature branches and merged into develop. 

## Technical Standards

### Code Quality
- **DDD Boundaries**: Maintain strict separation between domains
- **Strict Typing**: Strict typing throughout, no `any` types
- **Clean-up**: Remove unused code and dependencies
- **Security First**: All inputs validated, proper authentication checks
- **Test First**: Write tests before implementing features. Bugs should be reproduced with tests before fixing.

### Security Requirements
- **Credentials**: Never hard-code credentials in the codebase or config that will be committed to version control
- **Authentication**: AWS Cognito integration required
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schemas for all inputs
- **Environment Variables**: Centralized configuration with validation
- **Session Management**: Secure session handling with cleanup
- **Environment Variables**: Minimize the use of environment variables. Use centralized config where possible.

## Common Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run test` - Run test suite
- `npm run db:push` - Apply database schema changes
- `./pre-deploy.sh` - Pre-deployment validation

## MCP Servers

### Active MCP Servers
The system integrates with multiple MCP servers for enhanced AI capabilities:

#### AWS API MCP Server
- **Location**: `.devcontainer/Dockerfile.aws-mcp`
- **Purpose**: AWS service management through AI tools
- **Technology**: Python 3.10-slim + uv package manager
- **Package**: `awslabs.aws-api-mcp-server` (official AWS Labs)
- **Port**: 8001
- **Features**: EC2, S3, Lambda, CloudFormation management
- **Authentication**: AWS credentials via environment variables

#### Neon MCP Server (Remote)
- **Type**: Official remote server (recommended approach)
- **URL**: `https://mcp.neon.tech/mcp`
- **Purpose**: PostgreSQL database cost tracking, analytics, and management
- **Technology**: Neon's hosted MCP server
- **Configuration**: `.vscode/mcp.json` file for VS Code integration
- **Authentication**: OAuth flow or Neon API key
- **Features**: Cost monitoring, database metrics, query performance insights, resource management

#### GitHub MCP Server (Remote)
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
- Be concise but thorough in explanations
- Always confirm understanding before proceeding

## Remember
This is a production-ready enterprise system. Always maintain the high standards of code quality, security, and architectural integrity that have been established. When in doubt, ask for clarification rather than making assumptions.
