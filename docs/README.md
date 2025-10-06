# Documentation Index

Welcome to the tomriddelsdell.com platform documentation. This repository follows Domain-Driven Design (DDD) with Event Sourcing and CQRS patterns.

## Quick Links

- **[Architecture Overview](./architecture.md)** - System architecture, design principles, and technology stack
- **[ADR Index](./decisions/README.md)** - Architectural decisions with FAQ mapping
- **[Markdown Standards](./markdown-standards.md)** - Documentation style guide and conventions

## Operational Guides

Essential guides for development, deployment, and operations:

- **[Environment Strategy](./operations/environment-strategy.md)** - ⭐ **NEW** Local/Staging/Production environment definitions
- **[Doppler Setup](./operations/doppler-setup.md)** - Secret management configuration and environments
- **[Doppler GitHub Integration](./operations/doppler-github-integration.md)** - CI/CD secret management patterns
- **[CI/CD Database Architecture](./operations/ci-cd-database-architecture.md)** - Testing infrastructure with Neon
- **[Neon CI Setup](./operations/neon-ci-setup.md)** - Database branch configuration for automated testing
- **[DNSSEC Configuration](./operations/dnssec-configuration.md)** - DNS security setup for Cloudflare/GoDaddy

## Documentation by Topic

### Event Sourcing & CQRS

- **[ADR-006: Event Sourcing Implementation](./decisions/adr-006-event-sourcing-implementation.md)** - Core event sourcing strategy
- **[ADR-007: Event Versioning](./decisions/adr-007-event-versioning.md)** - Schema evolution and upcasting
- **[ADR-008: Snapshots](./decisions/adr-008-snapshots.md)** - Snapshot strategy for performance
- **[ADR-009: Event Replay Strategy](./decisions/adr-009-replay-strategy.md)** - Projection rebuilds and replay
- **[ADR-012: Projection Strategy](./decisions/adr-012-projection-strategy.md)** - Read model design and updates

### Domain-Driven Design

- **[ADR-001: Business Domain](./decisions/adr-001-business-domain.md)** - Domain model and bounded contexts
- **[ADR-005: Domain Model and Aggregates](./decisions/adr-005-domain-model-and-aggregates.md)** - Aggregate design
- **[ADR-016: Application Architecture Standards](./decisions/adr-016-application-architecture-standards.md)** - Hexagonal architecture

### Infrastructure & Deployment

- **[ADR-014: Infrastructure and Deployment](./decisions/adr-014-infrastructure-and-deployment.md)** - Cloud infrastructure strategy
- **[ADR-015: Deployment Strategy](./decisions/adr-015-deployment-strategy.md)** - CI/CD and deployment patterns
- **[ADR-017: Environment Management](./decisions/adr-017-environment-management.md)** - Environment strategy and configuration
- **[Operations: CI/CD Database](./operations/ci-cd-database-architecture.md)** - Neon test branch architecture

### Security & Compliance

- **[ADR-003: Authentication Strategy](./decisions/adr-003-authentication-strategy.md)** - AWS Cognito integration
- **[ADR-004: Security and Compliance](./decisions/adr-004-security-compliance.md)** - Security requirements
- **[ADR-018: OAuth and Authorization](./decisions/adr-018-oauth-and-authorization.md)** - Authorization patterns
- **[Security Incidents](./security-incidents/)** - Security incident documentation and resolutions

### API & Integration

- **[ADR-011: Message Bus Strategy](./decisions/adr-011-message-bus-strategy.md)** - Kafka integration
- **[ADR-020: API Design Standards](./decisions/adr-020-api-design-standards.md)** - REST API conventions
- **[ADR-022: Kafka REST Proxy](./decisions/adr-022-kafka-rest-proxy.md)** - HTTP-based Kafka access

### Testing & Quality

- **[ADR-021: Testing Strategy](./decisions/adr-021-testing-strategy.md)** - Comprehensive testing approach
- **[Operations: CI/CD Database](./operations/ci-cd-database-architecture.md)** - Test infrastructure details

## Getting Started

### For New Developers

1. **Read**: [Environment Strategy](./operations/environment-strategy.md) - **START HERE** - Understand Local/Staging/Production
2. **Read**: [Architecture Overview](./architecture.md) - Understand system design
3. **Review**: [ADR-001: Business Domain](./decisions/adr-001-business-domain.md) - Learn the domain
4. **Review**: [ADR-016: Application Standards](./decisions/adr-016-application-architecture-standards.md) - Coding conventions
5. **Setup**: [Doppler Setup Guide](./operations/doppler-setup.md) - Configure local environment
6. **Reference**: [Markdown Standards](./markdown-standards.md) - Documentation guidelines

### For Operations/DevOps

1. **Start**: [Environment Strategy](./operations/environment-strategy.md) - **CRITICAL** - Understand deployment environments
2. **Review**: [Operations Directory](./operations/) - All operational guides
3. **Secrets**: [Doppler Setup](./operations/doppler-setup.md) - Secret management
4. **CI/CD**: [Doppler GitHub Integration](./operations/doppler-github-integration.md) - Pipeline configuration
5. **Database**: [Neon CI Setup](./operations/neon-ci-setup.md) - Test database configuration
6. **Reference**: [ADR-014: Infrastructure](./decisions/adr-014-infrastructure-and-deployment.md) - Infrastructure strategy

### For Architects

1. **Foundation**: [Architecture Overview](./architecture.md) - High-level design
2. **Decisions**: [ADR Index](./decisions/README.md) - All architectural decisions
3. **Patterns**: Event Sourcing, CQRS, DDD patterns documented in ADRs
4. **Evolution**: Check ADR change histories for architecture evolution

## Archive

Historical documents preserved for reference:

- **[ADR Review (Sept 2025)](./archive/adr-review-september-2025.md)** - Architectural review findings
- **[Node.js Foundation Setup](./archive/nodejs-foundation-setup-2025.md)** - Initial project setup
- **[Implementation Plan](./archive/implementation-plan-2025-10-06.md)** - Historical planning document
- **[Clarifying Questions](./archive/clarifying-questions-answered-2025-10-06.md)** - Design questions and answers

## Contributing

When making architectural decisions:

1. Create new ADR following the template in `decisions/`
2. Update this README if adding new topics
3. Follow [Markdown Standards](./markdown-standards.md)
4. Cross-reference related ADRs
5. Document change history in ADRs

## Project Structure

```
docs/
├── README.md (this file)
├── architecture.md
├── markdown-standards.md
├── decisions/          # All ADRs
├── operations/         # Operational guides
├── security-incidents/ # Security incident documentation
└── archive/           # Historical documents
```

---

**Last Updated**: October 6, 2025
