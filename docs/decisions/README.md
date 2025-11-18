# Architectural Decision Records (ADRs)# Architectural Decision Records (ADRs)# Architecture Decision Records Summary



This directory contains all architectural decisions for the tomriddelsdell.com platform. Each ADR documents a significant architectural decision, its context, and consequences.



## ADR FormatThis directory contains all architectural decisions for the tomriddelsdell.com platform. Each ADR documents a significant architectural decision, its context, and consequences.This document provides an index of all architectural decisions made for the tomriddelsdell.com platform.



All ADRs follow a consistent format:



- **Status**: Proposed, Accepted, Deprecated, Superseded## ADR Format## ADR Index

- **Context**: Background and problem statement

- **Decision**: The architectural decision and rationale

- **Consequences**: Benefits, drawbacks, and implications

- **Alternatives Considered**: Other options and why they were rejectedAll ADRs follow a consistent format:### Core Platform Decisions

- **Implementation Guidance**: How to implement the decision



## Complete ADR Index

- **Status**: Proposed, Accepted, Deprecated, Superseded1. **[Business Domain and Platform Purpose](./adr-business-domain.md)** - Defines the platform as a personal portfolio for quantitative finance

### Domain & Business Logic

- **Context**: Background and problem statement2. **[Single-Tenant Architecture Strategy](./adr-tenant-architecture.md)** - Each user is their own tenant with complete data isolation

| ADR | Title | Status | Date |

|-----|-------|--------|------|- **Decision**: The architectural decision and rationale3. **[Authentication Strategy - AWS Cognito](./adr-authentication-strategy.md)** - Continue using existing AWS Cognito User Pool for authentication

| [ADR-001](./adr-001-business-domain.md) | Business Domain | Accepted | 2025-09-10 |

| [ADR-005](./adr-005-domain-model-and-aggregates.md) | Domain Model and Aggregates | Accepted | 2025-09-10 |- **Consequences**: Benefits, drawbacks, and implications4. **[Security and Compliance Strategy](./adr-security-compliance.md)** - GDPR-compliant security approach appropriate for personal portfolio scale



### Event Sourcing & CQRS- **Alternatives Considered**: Other options and why they were rejected



| ADR | Title | Status | Date |- **Implementation Guidance**: How to implement the decision### Technology Stack Decisions

|-----|-------|--------|------|

| [ADR-006](./adr-006-event-sourcing-implementation.md) | Event Sourcing Implementation | Accepted | 2025-09-10 |

| [ADR-007](./adr-007-event-versioning.md) | Event Versioning and Schema Evolution | Accepted | 2025-09-10 |

| [ADR-008](./adr-008-snapshots.md) | Snapshot Strategy | Accepted | 2025-09-10 |## Complete ADR Index5. **[Frontend Framework Choice](./adr-frontend-framework.md)** - Standardize on Next.js for all frontend applications

| [ADR-009](./adr-009-replay-strategy.md) | Event Replay Strategy | Accepted | 2025-09-10 |

| [ADR-012](./adr-012-projection-strategy.md) | Projection Strategy and Read Models | Accepted | 2025-09-10 |6. **[Observability](./adr-observability.md)** - Monitoring and observability strategy



### Security & Authentication### Domain & Business Logic7. **[Event Versioning](./adr-event-versioning.md)** - Event sourcing versioning approach



| ADR | Title | Status | Date |8. **[Snapshots](./adr-snapshots.md)** - Snapshot strategy for event sourcing

|-----|-------|--------|------|

| [ADR-002](./adr-002-tenant-architecture.md) | Tenant Architecture | Accepted | 2025-09-10 || ADR | Title | Status | Date |

| [ADR-003](./adr-003-authentication-strategy.md) | Authentication Strategy | Accepted | 2025-09-10 |

| [ADR-004](./adr-004-security-compliance.md) | Security and Compliance | Accepted | 2025-09-10 ||-----|-------|--------|------|## Decision Status Summary

| [ADR-018](./adr-018-oauth-and-authorization.md) | OAuth and Authorization | Accepted | 2025-09-10 |

| [ADR-001](./adr-001-business-domain.md) | Business Domain | Accepted | 2025-09-10 |

### Infrastructure & Deployment

| [ADR-005](./adr-005-domain-model-and-aggregates.md) | Domain Model and Aggregates | Accepted | 2025-09-10 || ADR                     | Status      | Date       | Impact                                      |

| ADR | Title | Status | Date |

|-----|-------|--------|------|| ----------------------- | ----------- | ---------- | ------------------------------------------- |

| [ADR-014](./adr-014-infrastructure-and-deployment.md) | Infrastructure and Deployment | Accepted | 2025-09-10 |

| [ADR-015](./adr-015-deployment-strategy.md) | Deployment Strategy | Accepted | 2025-09-10 |### Event Sourcing & CQRS| Business Domain         | ✅ Accepted | 2025-09-09 | High - Defines entire platform purpose      |

| [ADR-017](./adr-017-environment-management.md) | Environment Management | Accepted | 2025-10-06 |

| [ADR-026](./adr-026-database-migration-strategy.md) | Database Schema Evolution | Accepted | 2025-09-10 || Tenant Architecture     | ✅ Accepted | 2025-09-09 | High - Affects all data and security design |



### Monitoring & Observability| ADR | Title | Status | Date || Authentication Strategy | ✅ Accepted | 2025-09-09 | High - Core security and user management    |



| ADR | Title | Status | Date ||-----|-------|--------|------|| Security & Compliance   | ✅ Accepted | 2025-09-09 | High - Legal and security requirements      |

|-----|-------|--------|------|

| [ADR-010](./adr-010-observability-requirements.md) | Observability Requirements | Accepted | 2025-09-10 || [ADR-006](./adr-006-event-sourcing-implementation.md) | Event Sourcing Implementation | Accepted | 2025-09-10 || Frontend Framework      | ✅ Accepted | Previous   | Medium - Development consistency            |



### Integration & APIs| [ADR-007](./adr-007-event-versioning.md) | Event Versioning and Schema Evolution | Accepted | 2025-09-10 || Observability           | Status TBD  | Previous   | Medium - Operations and monitoring          |



| ADR | Title | Status | Date || [ADR-008](./adr-008-snapshots.md) | Snapshot Strategy | Accepted | 2025-09-10 || Event Versioning        | Status TBD  | Previous   | Medium - Event sourcing implementation      |

|-----|-------|--------|------|

| [ADR-011](./adr-011-message-bus-strategy.md) | Message Bus Strategy | Accepted | 2025-09-10 || [ADR-009](./adr-009-replay-strategy.md) | Event Replay Strategy | Accepted | 2025-09-10 || Snapshots               | Status TBD  | Previous   | Low - Performance optimization              |

| [ADR-020](./adr-020-api-design-standards.md) | API Design Standards | Accepted | 2025-09-10 |

| [ADR-022](./adr-022-message-bus-architecture.md) | Message Bus Architecture and Integration | Proposed | 2025-09-10 || [ADR-012](./adr-012-projection-strategy.md) | Projection Strategy and Read Models | Accepted | 2025-09-10 |



### Frontend & UI## Key Architectural Principles



| ADR | Title | Status | Date |### Security & Authentication

|-----|-------|--------|------|

| [ADR-013](./adr-013-frontend-framework.md) | Frontend Framework Selection | Accepted | 2025-09-10 |Based on the accepted ADRs, the platform follows these core principles:



### Application Architecture| ADR | Title | Status | Date |



| ADR | Title | Status | Date ||-----|-------|--------|------|### 1. **Personal Portfolio First**

|-----|-------|--------|------|

| [ADR-016](./adr-016-application-architecture-standards.md) | Application Architecture Standards | Accepted | 2025-09-10 || [ADR-002](./adr-002-tenant-architecture.md) | Tenant Architecture | Accepted | 2025-09-10 |

| [ADR-021](./adr-021-testing-strategy.md) | Testing Strategy | Proposed | 2025-10-06 |

| [ADR-023](./adr-023-contract-management.md) | Contract Management and Testing | Accepted | 2025-09-10 || [ADR-003](./adr-003-authentication-strategy.md) | Authentication Strategy | Accepted | 2025-09-10 |- Designed for Tom Riddelsdell's quantitative finance portfolio

| [ADR-024](./adr-024-performance-requirements.md) | Performance Requirements and SLA Definitions | Accepted | 2025-10-06 |

| [ADR-025](./adr-025-error-handling-strategy.md) | Error Handling and Exception Management | Accepted | 2025-09-10 || [ADR-004](./adr-004-security-compliance.md) | Security and Compliance | Accepted | 2025-09-10 |- Focus on showcasing technical expertise and professional work

| [ADR-027](./adr-027-development-container-architecture.md) | Development Container Architecture | Accepted | 2025-09-22 |

| [ADR-028](./adr-028-unified-observability-architecture.md) | Unified Observability Architecture | Accepted | 2025-10-19 |

| [ADR-029](./adr-029-independent-app-deployment.md) | Independent App Deployment Architecture | Accepted | 2025-11-18 |

| [ADR-018](./adr-018-oauth-and-authorization.md) | OAuth and Authorization | Accepted | 2025-09-10 |- Open-source friendly with collaboration capabilities

## FAQ → ADR Quick Reference



### Domain & Business Logic

### Infrastructure & Deployment### 2. **Simplicity Over Enterprise Complexity**

**Q: What are the critical business rules and invariants?**  

→ [ADR-005: Domain Model and Aggregates](./adr-005-domain-model-and-aggregates.md)



**Q: How do we handle cross-aggregate consistency?**  | ADR | Title | Status | Date |- Single-tenant architecture (user = tenant)

→ [ADR-006: Event Sourcing Implementation](./adr-006-event-sourcing-implementation.md)  

→ [ADR-012: Projection Strategy](./adr-012-projection-strategy.md)|-----|-------|--------|------|- Appropriate scale solutions, not enterprise-grade complexity



**Q: What is the business domain and bounded contexts?**  | [ADR-014](./adr-014-infrastructure-and-deployment.md) | Infrastructure and Deployment | Accepted | 2025-09-10 |- Cost-effective technology choices

→ [ADR-001: Business Domain](./adr-001-business-domain.md)

| [ADR-015](./adr-015-deployment-strategy.md) | Deployment Strategy | Accepted | 2025-09-10 |

### Event Sourcing & CQRS

| [ADR-017](./adr-017-environment-management.md) | Environment Management | Accepted | 2025-10-06 |### 3. **Security and Privacy by Design**

**Q: How do we implement event sourcing?**  

→ [ADR-006: Event Sourcing Implementation](./adr-006-event-sourcing-implementation.md)| [ADR-026](./adr-026-database-migration-strategy.md) | Database Schema Evolution | Accepted | 2025-09-10 |



**Q: How do we handle event schema evolution?**  - GDPR-compliant data handling

→ [ADR-007: Event Versioning](./adr-007-event-versioning.md)

### Monitoring & Observability- Strong authentication with AWS Cognito

**Q: When and how do we use snapshots?**  

→ [ADR-008: Snapshot Strategy](./adr-008-snapshots.md)- Complete user data isolation



**Q: How do we replay events and rebuild projections?**  | ADR | Title | Status | Date |- Professional security standards without enterprise overhead

→ [ADR-009: Event Replay Strategy](./adr-009-replay-strategy.md)

|-----|-------|--------|------|

**Q: How do we design read models and projections?**  

→ [ADR-012: Projection Strategy](./adr-012-projection-strategy.md)| [ADR-010](./adr-010-observability-requirements.md) | Observability Requirements | Accepted | 2025-09-10 |### 4. **Modern Technology Demonstration**



### Infrastructure & Deployment



**Q: What database do we use for CI/CD tests?**  ### Integration & APIs- Technology choices that showcase best practices

→ [ADR-017: Environment Management](./adr-017-environment-management.md)  

→ [ADR-021: Testing Strategy](./adr-021-testing-strategy.md)  - Event sourcing and CQRS for complex applications

→ [Operations Guide: CI/CD Database Architecture](../operations/ci-cd-database-architecture.md)

| ADR | Title | Status | Date |- Cloud-native deployment on Cloudflare/AWS

**Q: How do we manage secrets and environment configuration?**  

→ [ADR-017: Environment Management](./adr-017-environment-management.md)  |-----|-------|--------|------|- TypeScript-first development

→ [Operations Guide: Doppler Setup](../operations/doppler-setup.md)

| [ADR-011](./adr-011-message-bus-strategy.md) | Message Bus Strategy | Accepted | 2025-09-10 |

**Q: What cloud infrastructure do we use?**  

→ [ADR-014: Infrastructure and Deployment](./adr-014-infrastructure-and-deployment.md)| [ADR-020](./adr-020-api-design-standards.md) | API Design Standards | Accepted | 2025-09-10 |### 5. **Professional Quality Standards**



**Q: How do we deploy and manage releases?**  | [ADR-022](./adr-022-kafka-rest-proxy.md) | Kafka REST Proxy for Serverless | Accepted | 2025-09-10 |

→ [ADR-015: Deployment Strategy](./adr-015-deployment-strategy.md)

- All work should meet professional presentation standards

**Q: How do we handle database schema migrations?**  

→ [ADR-026: Database Migration Strategy](./adr-026-database-migration-strategy.md)### Frontend & UI- Comprehensive documentation and decision tracking



### Security & Authentication- Proper testing and quality assurance



**Q: How do users authenticate?**  | ADR | Title | Status | Date |- Educational value for the community

→ [ADR-003: Authentication Strategy](./adr-003-authentication-strategy.md)

|-----|-------|--------|------|

**Q: How do we handle authorization and permissions?**  

→ [ADR-018: OAuth and Authorization](./adr-018-oauth-and-authorization.md)| [ADR-013](./adr-013-frontend-framework.md) | Frontend Framework Selection | Accepted | 2025-09-10 |## Implementation Roadmap



**Q: What are our security requirements?**  

→ [ADR-004: Security and Compliance](./adr-004-security-compliance.md)

### Application ArchitectureBased on the ADRs, the implementation should proceed in this order:

**Q: How do we handle multi-tenancy?**  

→ [ADR-002: Tenant Architecture](./adr-002-tenant-architecture.md)



### Application Development| ADR | Title | Status | Date |1. **Infrastructure Setup** - Terraform for AWS Cognito and base infrastructure



**Q: What is our definition of done?**  |-----|-------|--------|------|2. **Authentication Integration** - Implement Cognito auth flows in applications

→ [ADR-021: Testing Strategy](./adr-021-testing-strategy.md)  

→ [ADR-016: Application Architecture Standards](./adr-016-application-architecture-standards.md)| [ADR-016](./adr-016-application-architecture-standards.md) | Application Architecture Standards | Accepted | 2025-09-10 |3. **Core Platform Services** - User management, app catalog, and entitlements



**Q: How should we structure application code?**  | [ADR-021](./adr-021-testing-strategy.md) | Testing Strategy | Proposed | 2025-10-06 |4. **Frontend Applications** - Landing page and platform management interfaces

→ [ADR-016: Application Architecture Standards](./adr-016-application-architecture-standards.md)

5. **Quantitative Finance Apps** - Domain-specific applications showcasing expertise

**Q: What testing strategy should we follow?**  

→ [ADR-021: Testing Strategy](./adr-021-testing-strategy.md)## FAQ → ADR Quick Reference6. **Observability and Monitoring** - Comprehensive logging and monitoring



**Q: How do we handle technical debt?**  7. **Security Hardening** - GDPR compliance features and security enhancements

→ [ADR-016: Application Architecture Standards](./adr-016-application-architecture-standards.md)

### Domain & Business Logic

**Q: How do we handle errors and exceptions?**  

→ [ADR-025: Error Handling and Exception Management](./adr-025-error-handling-strategy.md)## ADR Governance



**Q: What are the performance requirements and SLAs?**  **Q: What are the critical business rules and invariants?**  

→ [ADR-024: Performance Requirements and SLA Definitions](./adr-024-performance-requirements.md)

→ [ADR-005: Domain Model and Aggregates](./adr-005-domain-model-and-aggregates.md)### When to Create an ADR

### APIs & Integration



**Q: How do we design REST APIs?**  

→ [ADR-020: API Design Standards](./adr-020-api-design-standards.md)**Q: How do we handle cross-aggregate consistency?**  - Any architectural decision that affects multiple services or applications



**Q: How do we integrate with Kafka from serverless functions?**  → [ADR-006: Event Sourcing Implementation](./adr-006-event-sourcing-implementation.md)  - Technology stack choices and changes

→ [ADR-022: Message Bus Architecture](./adr-022-message-bus-architecture.md)

→ [ADR-012: Projection Strategy](./adr-012-projection-strategy.md)- Security and compliance decisions

**Q: What message bus do we use?**  

→ [ADR-011: Message Bus Strategy](./adr-011-message-bus-strategy.md)- Scalability and performance trade-offs



**Q: How do we manage API contracts?**  **Q: What is the business domain and bounded contexts?**  - Decisions that will be difficult to reverse

→ [ADR-023: Contract Management and Testing](./adr-023-contract-management.md)

→ [ADR-001: Business Domain](./adr-001-business-domain.md)

### Monitoring & Operations

### ADR Review Process

**Q: How do we monitor the system?**  

→ [ADR-010: Observability Requirements](./adr-010-observability-requirements.md)### Event Sourcing & CQRS



**Q: What metrics and logs do we collect?**  1. Draft ADR with context, decision, and rationale

→ [ADR-010: Observability Requirements](./adr-010-observability-requirements.md)

**Q: How do we implement event sourcing?**  2. Review with relevant stakeholders (in this case, Tom Riddelsdell)

### Frontend Development

→ [ADR-006: Event Sourcing Implementation](./adr-006-event-sourcing-implementation.md)3. Consider alternatives and consequences

**Q: What frontend framework do we use?**  

→ [ADR-013: Frontend Framework Selection](./adr-013-frontend-framework.md)4. Accept, reject, or defer the decision



### Development Environment**Q: How do we handle event schema evolution?**  5. Implement and monitor outcomes



**Q: How is the development container configured?**  → [ADR-007: Event Versioning](./adr-007-event-versioning.md)

→ [ADR-027: Development Container Architecture](./adr-027-development-container-architecture.md)

### Updating ADRs

## Contributing

**Q: When and how do we use snapshots?**  

### Creating a New ADR

→ [ADR-008: Snapshot Strategy](./adr-008-snapshots.md)- ADRs should be updated when decisions change

1. Copy the template from an existing ADR

2. Use the next available number (ADR-0XX)- Mark superseded ADRs as "Superseded by [new ADR]"

3. Follow the standard format

4. Include all required sections**Q: How do we replay events and rebuild projections?**  - Maintain historical record of decision evolution

5. Update this index with the new ADR

6. Cross-reference related ADRs→ [ADR-009: Event Replay Strategy](./adr-009-replay-strategy.md)- Document lessons learned from implemented decisions

7. Add to the FAQ section if appropriate



### Updating an Existing ADR

**Q: How do we design read models and projections?**  ## Related Documentation

1. Add entry to "Change History" section

2. Update "Last Updated" date→ [ADR-012: Projection Strategy](./adr-012-projection-strategy.md)

3. If superseding an ADR, update both ADRs' status

4. Update cross-references if needed- [Clarifying Questions](../clarifying-questions.md) - Source of many architectural decisions



## Related Documentation### Infrastructure & Deployment- [Architecture Overview](../architecture.md) - High-level system architecture



- **[Main Documentation Index](../README.md)** - Overview of all documentation- [Infrastructure Documentation](../../infra/README.md) - Implementation details

- **[Architecture Overview](../architecture.md)** - High-level system architecture

- **[Operations Guides](../operations/)** - Practical implementation guides**Q: What database do we use for CI/CD tests?**  

- **[Markdown Standards](../markdown-standards.md)** - Documentation style guide→ [ADR-017: Environment Management](./adr-017-environment-management.md)  

→ [ADR-021: Testing Strategy](./adr-021-testing-strategy.md)  

---→ [Operations Guide: CI/CD Database Architecture](../operations/ci-cd-database-architecture.md)



**Last Updated**: October 6, 2025**Q: How do we manage secrets and environment configuration?**  

→ [ADR-017: Environment Management](./adr-017-environment-management.md)  
→ [Operations Guide: Doppler Setup](../operations/doppler-setup.md)

**Q: What cloud infrastructure do we use?**  
→ [ADR-014: Infrastructure and Deployment](./adr-014-infrastructure-and-deployment.md)

**Q: How do we deploy and manage releases?**  
→ [ADR-015: Deployment Strategy](./adr-015-deployment-strategy.md)

**Q: How do we handle database schema migrations?**  
→ [ADR-026: Database Migration Strategy](./adr-026-database-migration-strategy.md)

### Security & Authentication

**Q: How do users authenticate?**  
→ [ADR-003: Authentication Strategy](./adr-003-authentication-strategy.md)

**Q: How do we handle authorization and permissions?**  
→ [ADR-018: OAuth and Authorization](./adr-018-oauth-and-authorization.md)

**Q: What are our security requirements?**  
→ [ADR-004: Security and Compliance](./adr-004-security-compliance.md)

**Q: How do we handle multi-tenancy?**  
→ [ADR-002: Tenant Architecture](./adr-002-tenant-architecture.md)

### Application Development

**Q: What is our definition of done?**  
→ [ADR-021: Testing Strategy](./adr-021-testing-strategy.md)  
→ [ADR-016: Application Architecture Standards](./adr-016-application-architecture-standards.md)

**Q: How should we structure application code?**  
→ [ADR-016: Application Architecture Standards](./adr-016-application-architecture-standards.md)

**Q: What testing strategy should we follow?**  
→ [ADR-021: Testing Strategy](./adr-021-testing-strategy.md)

**Q: How do we handle technical debt?**  
→ [ADR-016: Application Architecture Standards](./adr-016-application-architecture-standards.md)

### APIs & Integration

**Q: How do we design REST APIs?**  
→ [ADR-020: API Design Standards](./adr-020-api-design-standards.md)

**Q: How do we integrate with Kafka from serverless functions?**  
→ [ADR-022: Kafka REST Proxy](./adr-022-kafka-rest-proxy.md)

**Q: What message bus do we use?**  
→ [ADR-011: Message Bus Strategy](./adr-011-message-bus-strategy.md)

### Monitoring & Operations

**Q: How do we monitor the system?**  
→ [ADR-010: Observability Requirements](./adr-010-observability-requirements.md)

**Q: What metrics and logs do we collect?**  
→ [ADR-010: Observability Requirements](./adr-010-observability-requirements.md)

### Frontend Development

**Q: What frontend framework do we use?**  
→ [ADR-013: Frontend Framework Selection](./adr-013-frontend-framework.md)

## Missing ADRs (To Be Created)

Based on architectural review, these ADRs are recommended:

- **ADR-024: Performance Requirements and SLA Definitions** (Priority: High)
  - Expected load patterns
  - Performance budgets and SLAs
  - Scaling trigger points
  - Capacity planning methodology

- **ADR-025: Error Handling and Exception Management** (Priority: Medium)
  - Standardized error handling patterns
  - Exception propagation in event sourcing
  - Error recovery strategies
  - Monitoring and alerting for errors

## Contributing

### Creating a New ADR

1. Copy the template from an existing ADR
2. Use the next available number (ADR-0XX)
3. Follow the standard format
4. Include all required sections
5. Update this index with the new ADR
6. Cross-reference related ADRs
7. Add to the FAQ section if appropriate

### Updating an Existing ADR

1. Add entry to "Change History" section
2. Update "Last Updated" date
3. If superseding an ADR, update both ADRs' status
4. Update cross-references if needed

## Related Documentation

- **[Main Documentation Index](../README.md)** - Overview of all documentation
- **[Architecture Overview](../architecture.md)** - High-level system architecture
- **[Operations Guides](../operations/)** - Practical implementation guides
- **[Markdown Standards](../markdown-standards.md)** - Documentation style guide

---

**Last Updated**: October 6, 2025
