# GitHub Copilot Instructions for tomriddelsdell.com

## General Guidance
- Always prefer **clarity and correctness** over brevity.
- Follow **Domain-Driven Design (DDD)** principles in all code, documentation, and suggestions.
- Ensure code is **well-structured, readable, and maintainable**.
- Prefer **explicitness** (naming, interfaces, contracts) over implicit or "magic" behavior.
- Generate **tests alongside code** where appropriate. Favour TDD practices.
- **Record Bugs in docs/Bugs.md** - Document any bugs or issues encountered, with reproduction unit test and resolution status
- **Document work done in changes/yyyy-mm-dd-copilot.md** - Summarize changes made, including any relevant context or decisions
- **Git Branching** - Perform minor changes in 'develop' branch. Major changes should be done in feature branches and merged into develop. 
---

## Domain-Driven Design (DDD)
- Treat each service or app as a **bounded context** with its own ubiquitous language.
- Maintain separation between:
  - **Domain layer** (entities, aggregates, value objects, domain events, invariants).
  - **Application layer** (use cases, commands, queries, orchestrations).
  - **Infrastructure layer** (adapters for persistence, messaging, APIs).
- Domain logic must not import infrastructure code or depend on external frameworks.
- Use **aggregates** to enforce invariants and control access to domain events.
- Name classes, functions, and files consistently with the **ubiquitous language**.

---

## Event Sourcing & CQRS
- Capture all state changes as **domain events**.
- Append events to a store in an **append-only** fashion with versioning to support optimistic concurrency.
- Build **read models** (projections) from event streams for queries and UI needs.
- Ensure **projections are rebuildable** from event history.
- Use the **outbox pattern** for reliable publishing of events to message buses.
- Consumers must be **idempotent** when applying events or handling side effects.

---

## Hexagonal Architecture (Ports & Adapters)
- Define **ports** (interfaces) for persistence, messaging, external APIs, and other infrastructure.
- Implement **adapters** that fulfill these ports for specific infrastructure technologies.
- Application and domain layers depend only on ports, not on concrete adapter implementations.
- Keep adapters thin and focused — never allow infrastructure logic to leak into the domain.

---

## Contracts & Interfaces
- Define all inter-service communication via **explicit contracts** (e.g., schemas, APIs, event definitions).
- Version contracts carefully; maintain backward compatibility where possible.
- Store contracts in a dedicated `/contracts` directory.
- Generate client/server code from contracts, never hardcode schema assumptions in multiple places.

---

## Testing
- Write **unit tests** for domain logic — these should run without infrastructure dependencies.
- Write **integration tests** for adapters (persistence, messaging, APIs).
- Write **end-to-end tests** for key workflows across services.
- Add **contract tests** to ensure producers and consumers adhere to agreed schemas.
- Favor **fast, deterministic tests** over brittle or flaky ones.

---

## Documentation
- Keep architecture decisions recorded as **ADRs** in `/docs/decisions`.
- Maintain a **glossary** of domain terms in `/docs/glossary.md`.
- Document conventions and style in `/docs/conventions.md`.
- Update documentation when introducing significant changes in design, contracts, or architecture.

---

## Coding Style
- Use **descriptive names** that reflect domain meaning, not implementation detail.
- Write **small, composable functions** with single responsibilities.
- Avoid duplication; extract reusable concepts where patterns emerge.
- Follow consistent folder and module structure: `domain`, `app`, `adapters`, `tests`.
- Include meaningful docstrings or comments for complex logic.

---

## Security & Reliability
- Never hardcode secrets; always depend on injected configuration.
- Apply **least privilege** principles for access and permissions.
- Ensure **multi-tenancy** is enforced at both the application and persistence layers where applicable.
- Handle **errors and failures gracefully**; log meaningfully, avoid silent failures.
- Favor **auditable designs**: security-sensitive actions should produce immutable audit events.

---


## Copilot Interaction
When providing suggestions:
1. **Respect domain boundaries** — don’t collapse domain and infrastructure logic together.  
2. **Ask clarifying questions** if requirements are ambiguous.  
3. **Explain reasoning** behind design choices, not just code output.  
4. **Align with existing docs** (`architecture-overview.md`, ADRs, glossary).  
5. **Stay consistent** with prior patterns in the codebase.  

---

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
