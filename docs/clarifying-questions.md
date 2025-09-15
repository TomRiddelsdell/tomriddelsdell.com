# Clarifying Questions

This document contains questions that need to be answered to fill gaps in our design and enhance our ability to build the application effectively. These questions are organized by category to help establish clear requirements and best practices.

## Domain & Business Logic

### Core Domain Understanding
4. **What are the critical business rules and invariants** that must be enforced at the domain level?

**Answer (from ADR-005):**
- **User Aggregate**: Email uniqueness, profile completeness, privacy settings
- **Project Aggregate**: Visibility rules (public/private), metadata validation, access control
- **Contact Aggregate**: Message validation, spam prevention, processing workflows
- **Cross-aggregate**: Eventual consistency via domain events, no synchronous cross-aggregate transactions

### Bounded Contexts & Aggregates  
9. **How do we handle cross-aggregate consistency?** What eventual consistency scenarios are acceptable?

**Answer (from ADR-005, ADR-006, ADR-012):**
- **Primary**: Domain events via Kafka for eventual consistency
- **Projections**: Read models updated asynchronously from event streams
- **Acceptable delays**: User profile changes (seconds), project visibility (minutes), contact processing (minutes)
- **Compensation**: Saga patterns for complex workflows, manual reconciliation for edge cases

## Application Architecture

### Development Best Practices
61. **What is our definition of done** for features? Code, tests, docs, deployment?

**Answer (from ADR-021, ADR-016):**
- **Code**: Domain logic + adapters with hexagonal architecture separation
- **Tests**: 75% unit tests (domain), 20% integration (adapters), 5% e2e (scenarios)  
- **Docs**: ADR for architectural changes, change log for features
- **Deployment**: Terraform changes, environment validation, monitoring alerts

62. **How should we handle technical debt?** Regular refactoring cycles, debt tracking?

**Answer (from ADR-016):**
- **Documentation**: Record in `docs/Bugs.md` with unit tests for reproduction
- **Cycles**: Monthly refactoring sprints, quarterly architecture reviews
- **Tracking**: GitHub issues with 'tech-debt' label, dependency updates via Dependabot
- **Prioritization**: DDD violations and hexagonal boundary breaks get highest priority

63. **What code review practices should we establish?** Review checklist, approval requirements?

**Answer (from ADR-016):**
- **Requirements**: Single approval for features, architecture team for ADR changes
- **Checklist**: Domain logic separation, test coverage, hexagonal boundaries, conventional commits
- **AI Review**: Copilot pre-review for code patterns, human verification for business logic

64. **How should we manage dependencies?** Update policies, security scanning, license compliance?

**Answer (from ADR-016):**
- **Package Manager**: pnpm with workspace support for monorepo
- **Updates**: Automated minor/patch via Dependabot, manual major versions
- **Security**: GitHub security scanning, manual audit for domain dependencies
- **Licenses**: Permissive licenses only (MIT, Apache 2.0), avoid copyleft

65. **What performance benchmarks should we establish?** Load testing, performance budgets?

**Answer (from ADR-010, ADR-021):**
- **API Response**: P95 < 200ms for commands, P99 < 500ms for queries
- **Projection Lag**: < 30 seconds for user events, < 5 minutes for analytics
- **Worker Cold Start**: < 100ms initialization time
- **Bundle Size**: < 100KB initial JS bundle per app, < 50KB per route split

## AI Assistant & Development Workflow

### Copilot Integration
56. **What context should always be provided to Copilot?** Architecture docs, domain glossary, coding standards?
57. **How should we structure prompts** for consistent code generation? Templates, examples?
58. **What file patterns should Copilot follow** when creating new services, apps, or components?
59. **How should we handle AI-generated code review?** What human verification is needed?
60. **What documentation should Copilot maintain?** ADRs, change logs, bug reports?

### Development Best Practices
61. **What is our definition of done** for features? Code, tests, docs, deployment?
62. **How should we handle technical debt?** Regular refactoring cycles, debt tracking?
63. **What code review practices should we establish?** Review checklist, approval requirements?
64. **How should we manage dependencies?** Update policies, security scanning, license compliance?
65. **What performance benchmarks should we establish?** Load testing, performance budgets?

### AI Assistance Guidelines
66. **When should developers use AI assistance vs manual coding?** Boilerplate, complex logic, testing?
67. **How should we validate AI-generated architecture decisions?** Human review checkpoints?
68. **What prompting strategies work best** for our domain and tech stack?
69. **How should we handle AI-generated test coverage?** What types of tests should AI focus on?
70. **What documentation should AI assistants help maintain?** Auto-generated docs, decision records?

## Platform-Specific Questions

### Database Performance & Operations  
75. **What connection pooling strategy should we use?** Connection limits, pool sizing for Neon?

**Answer (from ADR-014, ADR-015):**
- **Neon Strategy**: Use Neon's built-in connection pooling with serverless-optimized settings
- **Pool Sizing**: 5-10 connections per Worker instance, auto-scaling with demand
- **Timeout**: 30-second connection timeout, 5-second query timeout
- **Monitoring**: Connection utilization metrics in observability dashboard

76. **How should we handle database branching** for development and testing workflows?

**Answer (from ADR-015, ADR-017):**
- **Feature Branches**: Neon branch per feature for isolated testing
- **Testing**: Automated branch creation for integration test suites
- **Staging**: Shared staging branch with production data snapshots
- **Cleanup**: Automatic branch deletion after feature merge

77. **What backup and point-in-time recovery strategy** do we need beyond Neon's built-in features?

**Answer (from ADR-014):**
- **Primary**: Rely on Neon's automatic daily backups and point-in-time recovery
- **Secondary**: Weekly event stream exports to R2 for disaster recovery
- **Testing**: Monthly restore testing to verify backup integrity
- **Retention**: 30 days Neon backup, 1 year archived event streams

78. **How should we monitor database performance?** Query optimization, index strategies, projection lag?

**Answer (from ADR-010, ADR-012):**
- **Query Monitoring**: P95/P99 query latencies, slow query identification
- **Projection Lag**: Event processing delays tracked per aggregate type
- **Index Strategy**: Automatic index suggestions from Neon, manual tuning for complex queries
- **Alerts**: Lag > 1 minute triggers alerts, query time > 1 second logged

## Business & Operational Questions

### Scaling & Growth
83. **What are the expected load patterns?** Traffic spikes, seasonal variations?
84. **What is our capacity planning strategy?** Auto-scaling, resource monitoring?
85. **How should we handle feature flags** and gradual rollouts?
86. **What is our approach to A/B testing** and experimentation?

### Cost Management
87. **What are our cost optimization strategies?** Resource right-sizing, usage monitoring?
88. **How should we implement cost allocation** across teams or tenants?
89. **What cost alerting and budgeting** should we implement?

### Compliance & Legal
90. **What data privacy regulations apply?** GDPR, CCPA, regional requirements?
91. **How should we handle data subject requests?** Data export, deletion, rectification?
92. **What terms of service and privacy policies** need to be implemented?

---

## Next Steps

Once these questions are answered, we should:

1. **Update the architecture documentation** with specific decisions ✅
2. **Create ADRs** for major architectural choices ✅
   - [ADR-001: Business Domain and Platform Purpose](./decisions/adr-001-business-domain.md)
   - [ADR-002: Single-Tenant Architecture Strategy](./decisions/adr-002-tenant-architecture.md)  
   - [ADR-003: Authentication Strategy](./decisions/adr-003-authentication-strategy.md)
   - [ADR-004: Security and Compliance Strategy](./decisions/adr-004-security-compliance.md)
   - [ADR-005: Domain Model and Aggregates](./decisions/adr-005-domain-model-and-aggregates.md)
   - [ADR-006: Event Sourcing Implementation Strategy](./decisions/adr-006-event-sourcing-implementation.md)
   - [ADR-007: Event Versioning Strategy](./decisions/adr-007-event-versioning.md)
   - [ADR-008: Snapshots Strategy](./decisions/adr-008-snapshots.md)
   - [ADR-009: Replay Strategy](./decisions/adr-009-replay-strategy.md)
   - [ADR-010: Observability Requirements and Strategy](./decisions/adr-010-observability-requirements.md)
   - [ADR-011: Message Bus Strategy](./decisions/adr-011-message-bus-strategy.md)
   - [ADR-012: Projection Strategy](./decisions/adr-012-projection-strategy.md)  
   - [ADR-013: Frontend Framework Strategy](./decisions/adr-013-frontend-framework.md)
   - [ADR-014: Infrastructure and Deployment](./decisions/adr-014-infrastructure-and-deployment.md)
   - [ADR-015: Deployment Strategy](./decisions/adr-015-deployment-strategy.md)
   - [ADR-016: Application Architecture Standards](./decisions/adr-016-application-architecture-standards.md)
   - [ADR-017: Environment Management](./decisions/adr-017-environment-management.md)
   - [ADR-018: OAuth and Authorization](./decisions/adr-018-oauth-and-authorization.md)
   - [ADR-019: Observability Implementation](./decisions/adr-019-observability.md)
   - [ADR-020: API Design Standards](./decisions/adr-020-api-design-standards.md)
   - [ADR-021: Testing Strategy](./decisions/adr-021-testing-strategy.md)
   - [ADR-022: Message Bus Architecture](./decisions/adr-022-message-bus-architecture.md)

3. **Populate the glossary** with domain-specific terminology
4. **Establish coding conventions** and development standards
5. **Create templates and scaffolding** for consistent development
6. **Set up the initial infrastructure** using Terraform
7. **Implement the first service** as a reference implementation

## Questions Answered by Existing ADRs

The following questions have been addressed in our comprehensive 22 ADRs:

**Domain & Business Logic:**
- Questions 1-3, 5-8, 10: Covered by ADR-001 (Business Domain), ADR-002 (Tenant Architecture), ADR-005 (Domain Model), ADR-012 (Projection Strategy)

**Authentication & Authorization:**
- Questions 11-20: Covered by ADR-003 (Authentication Strategy), ADR-007 (OAuth Authorization), ADR-018 (OAuth Implementation)

**Event Sourcing Implementation:**
- Questions 21-30: Covered by ADR-006 (Event Sourcing), ADR-008 (Snapshots), ADR-009 (Replay Strategy), ADR-011 (Message Bus), ADR-022 (Message Bus Architecture)

**Infrastructure & DevOps:**
- Questions 31-45: Covered by ADR-014 (Infrastructure), ADR-015 (Deployment Strategy), ADR-017 (Environment Management), ADR-010 (Observability), ADR-019 (Observability Implementation)

**Platform-Specific Questions:**
- Questions 71-82: Covered by ADR-011 (Message Bus Strategy), ADR-014 (Infrastructure), ADR-016 (Application Architecture)

**API Design & Testing:**
- API Standards: Covered by ADR-020 (API Design Standards) - CQRS REST + GraphQL
- Testing Strategy: Covered by ADR-021 (Testing Strategy) - Event sourcing testing pyramid

### Recently Answered Questions

**Technology Choices (Questions 51-55):**
- **Q51 - Frameworks**: React 18+ with TypeScript, Cloudflare Workers (ADR-016)
- **Q52 - State Management**: Zustand for complex state, React Context for simple cases (ADR-016)  
- **Q53 - Build Tools**: Vite for frontend, Wrangler for Workers (ADR-016)
- **Q54 - Styling**: Tailwind CSS with custom design system (ADR-016)
- **Q55 - Package Management**: pnpm with workspace support (ADR-016)

**App Development Standards (Questions 46-50):**
- **Q46 - Coding Standards**: ESLint + Prettier, Conventional Commits (ADR-016)
- **Q47 - App Structure**: Domain-driven folder structure with bounded contexts (ADR-016)
- **Q48 - Shared Libraries**: UI components, domain types, auth utilities (ADR-016)
- **Q49 - App Communication**: Event-driven primary, synchronous APIs for real-time only (ADR-016, ADR-022)
- **Q50 - Testing Strategies**: Domain-focused pyramid: 75% unit, 20% integration, 5% e2e (ADR-021)

## Question Prioritization

**High Priority (MVP blockers):**
- Questions 4, 9 (Domain understanding) - ✅ **ANSWERED** via ADR-005, ADR-006
- Questions 56-65 (AI assistance setup) - ✅ **ANSWERED** via ADR-016, ADR-021

**Medium Priority (Early development):**
- Questions 66-70 (AI assistance guidelines) - **ACTIVE**
- Questions 75-78 (Database operations) - ✅ **ANSWERED** via ADR-014, ADR-015, ADR-010

**Lower Priority (Post-MVP):**
- Questions 83-92 (Scaling and compliance) - **DEFERRED**

### Remaining Open Questions (6 total)

**AI Assistance Guidelines (Medium Priority):**
- Q66: When should developers use AI assistance vs manual coding?
- Q67: How should we validate AI-generated architecture decisions?  
- Q68: What prompting strategies work best for our domain and tech stack?
- Q69: How should we handle AI-generated test coverage?
- Q70: What documentation should AI assistants help maintain?

**Business & Operational (Lower Priority):**
- Q83-92: Scaling, cost management, compliance questions for post-MVP consideration
This prioritization helps focus initial development effort on the most critical architectural decisions while providing a roadmap for future enhancements.

---

## Summary

**Architecture Status**: 22 comprehensive ADRs completed covering all major architectural concerns
**Questions Resolved**: 80+ questions answered through systematic architectural decision process
**Implementation Ready**: Domain model, technology stack, deployment strategy, and development standards established
**Remaining Work**: 6 AI assistance questions + post-MVP scaling/compliance considerations
