# GitHub Copilot Instructions for tomriddelsdell.com

## Architecture & Technology Stack

### Core Architecture
- **Domain Driven Design (DDD)**: Repository is divided into strict bounded contexts with minimal dependencies between domains. Adderence to concepts including: Domain Events, Integration Events, Value Objects, Entities, Aggregates, Modules, Services, Repositories, Factories and Anti-Corruption Layers
- **Clean Architecture**: Each domain follows clean architecture principles with clear separation of concerns.
- **Event Sourcing with CQRS and an Event Bus**: Asynchronous processing with clear separation of commands and queries. Events are published to an event bus for processing by interested consumers.
- **Monorepo Structure**: Organized into domains, interfaces, and infrastructure
- **Layered Architecture**: Clear separation between domain, application, infrastructure, and interface layers
- **Deployment Style**: Hybrid (modular monolith + selected microservices). Landing Page, Identity, Notifications and Service Discovery domains are to be bundled as a Modular Monolith into a single Micro Service. All other domains will be implemented as separate Micro Services.

## Development Workflow

### Code Change Protocol
- **Tests** - Always review tests before making changes. Adding new tests for any new functionality is mandatory
- **Break down complex changes** - Split multi-file modifications into reviewable chunks. Suggest multiple commits or new git branches if necessary
- **Explain reasoning and provide options** - Always explain why changes are necessary and provide alternative solutions and their trade offs where appropriate
- **Document work done in changes/yyyy-mm-dd-<short description>.md** - Summarize changes made regularly, particularly after each commit, including any relevant context or decisions. Updates should be appended at the top of the file with a timestamp. Previous timestamps should not be modified.
- **Record Bugs in docs/Bugs.md** - Document any bugs or issues encountered, with reproduction unit test and resolution status
- **Changes** Never delete the changes directory or any of its files. Only modify the file matching today's date.
- **Git Branching** - Perform minor changes in 'develop' branch. Major changes should be done in feature branches and merged into develop. 
- **Creating Files** - Avoid creating file in the root directory. Use appropriate subdirectories following the established DDD structure.

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

## MCP Servers

### Active MCP Servers
The system integrates with multiple MCP servers for enhanced AI capabilities:

#### Neon MCP Server (Remote)
- **Type**: Official remote server (recommended approach)
- **URL**: `https://mcp.neon.tech/mcp`
- **Purpose**: PostgreSQL database cost tracking, analytics, and management
- **Technology**: Neon's hosted MCP server
- **Configuration**: `.vscode/settings.json` amazonQ.mcp.servers
- **Authentication**: OAuth flow or Neon API key
- **Features**: Cost monitoring, database metrics, query performance insights, resource management

#### GitHub MCP Server (Remote)
- **Type**: Official GitHub-hosted remote server
- **URL**: `https://api.githubcopilot.com/mcp/`
- **Purpose**: GitHub repository and workflow management
- **Technology**: GitHub's official Go-based server
- **Authentication**: GitHub Copilot OAuth or Personal Access Token
- **Features**: Repository management, Issues, PRs, CI/CD, code analysis

#### AWS CLI MCP Server
- **Type**: Official Model Context Protocol server
- **Package**: `@modelcontextprotocol/server-aws-cli`
- **Purpose**: AWS infrastructure management through AI tools
- **Authentication**: AWS credentials via environment variables
- **Features**: EC2, S3, Lambda, CloudFormation management

## CLI Tools

### Required CLI Tools
The development environment includes these essential CLI tools for platform development and deployment:

#### **Doppler CLI**
- **Purpose**: Centralized secrets management across all environments
- **Installation**: `curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sudo sh`
- **Usage**: Manages environment variables, API keys, and configuration secrets
- **Key Commands**:
  - `doppler secrets set --config dev` - Set development secrets
  - `doppler secrets get NEON_API_KEY --config dev` - Retrieve specific secrets
  - `doppler run -- npm run dev` - Run commands with injected secrets
- **Integration**: Used for all environment configurations (dev, staging, production)

#### **Wrangler CLI** 
- **Purpose**: Cloudflare Workers deployment and management
- **Installation**: `npm install -g wrangler@latest`
- **Usage**: Deploy serverless functions, manage Workers KV, configure routes
- **Key Commands**:
  - `wrangler deploy` - Deploy Workers to Cloudflare
  - `wrangler dev` - Local development server with Workers runtime
  - `wrangler kv:namespace create` - Manage Workers KV storage
- **Integration**: Primary deployment tool for API endpoints and serverless functions

#### **Terraform CLI**
- **Purpose**: Infrastructure as Code deployment and management
- **Installation**: Via HashiCorp official repository
- **Usage**: Deploy and manage cloud infrastructure across providers
- **Key Commands**:
  - `terraform plan` - Preview infrastructure changes
  - `terraform apply` - Deploy infrastructure changes
  - `terraform destroy` - Remove infrastructure resources
- **Integration**: Manages Neon databases, Confluent Kafka, Cloudflare configuration

#### **Neon CLI (neonctl)**
- **Purpose**: PostgreSQL database management and operations
- **Installation**: `npm install -g neonctl`
- **Usage**: Database branching, query execution, schema management
- **Key Commands**:
  - `neonctl branches create` - Create database branch for development
  - `neonctl databases list` - List all databases in project
  - `neonctl sql-editor` - Interactive SQL query interface
- **Integration**: Essential for event sourcing database operations and migrations

#### **Confluent CLI**
- **Purpose**: Apache Kafka cluster and streaming management
- **Installation**: Platform-specific installer from Confluent
- **Usage**: Manage Kafka topics, producers, consumers, and connectors
- **Key Commands**:
  - `confluent kafka cluster list` - List available Kafka clusters
  - `confluent kafka topic create` - Create new Kafka topics
  - `confluent kafka consumer consume` - Test message consumption
- **Integration**: Critical for event bus and message streaming operations

### CLI Tool Integration Notes
- **Environment Variables**: All CLIs configured through Doppler for consistent secret management
- **Authentication**: Each tool uses project-specific API keys managed securely
- **Development Workflow**: Tools integrated into package.json scripts for common operations
- **Container Support**: All CLIs available in development container for consistent environment
- **Automation**: CLIs used in GitHub Actions for CI/CD pipeline automation

## Common Commands

### Development Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Production build with optimization
- `npm run test` - Run comprehensive test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Code linting and formatting check
- `npm run type-check` - TypeScript type validation

### Database Operations
- `doppler run -- neonctl sql-editor` - Interactive database queries with secrets
- `neonctl branches create feature/new-schema` - Create database branch for schema changes
- `terraform apply -target=module.neon` - Deploy database infrastructure changes

### Deployment Commands  
- `wrangler deploy` - Deploy Cloudflare Workers to production
- `terraform plan` - Preview all infrastructure changes
- `doppler run -- terraform apply` - Deploy infrastructure with injected secrets

### Development Workflow
- `doppler run -- npm run dev` - Start development with all environment secrets
- `git checkout -b feature/new-feature && npm run test` - Create feature branch and validate
- `doppler secrets get --config dev` - View current development configuration

## Communication Style
- Be concise but thorough in explanations
- Always confirm understanding before proceeding
- Reference specific ADRs when making architectural decisions
- Prioritize security and testing in all recommendations

## Remember
This is a production-ready enterprise system following Domain Driven Design with Event Sourcing. Always maintain the high standards of code quality, security, and architectural integrity that have been established. When in doubt, reference the comprehensive ADR collection in `/docs/decisions/` or ask for clarification rather than making assumptions.


