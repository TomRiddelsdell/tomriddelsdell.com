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
- **Document work done in changes/yyyy-mm-dd-copilot.md** - Summarize changes made regularly, particularly after each commit, including any relevant context or decisions. Updates should be appended at the top of the file with a timestamp. Previous timestamps should not be modified.
- **Record Bugs in docs/Bugs.md** - Document any bugs or issues encountered, with reproduction unit test and resolution status
- **Changes** Never delete the changes directory or any of its files. Only modify the file matching today's date.
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

## MCP Servers

### Active MCP Servers
The system integrates with multiple MCP servers for enhanced AI capabilities:

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


