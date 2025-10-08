# Architecture Overview

This document provides a high-level overview of the system architecture.
It describes the major components, how they interact, and the principles that guide their design.

> **Architecture Decisions (September 2025)**  
> Based on 22 comprehensive ADRs covering all architectural aspects:
>
> - **Business Domain**: Personal portfolio platform with app catalog and contact management (ADR-001, ADR-002)
> - **Authentication**: OAuth 2.0 + OIDC with single-tenant architecture (ADR-003, ADR-007, ADR-018)
> - **Domain Model**: User, Project, Contact aggregates with event sourcing (ADR-005)
> - **Event Sourcing**: NeonDB event store with CQRS and projections (ADR-006, ADR-008, ADR-009, ADR-012)
> - **Messaging**: Kafka via HTTP (serverless-compatible) with outbox pattern (ADR-011, ADR-022)
> - **APIs**: CQRS-aligned REST commands + GraphQL queries (ADR-020)
> - **Frontend**: React 18 + TypeScript with standalone apps (ADR-013, ADR-016)
> - **Infrastructure**: Cloudflare Workers + Neon + Terraform (ADR-014, ADR-015, ADR-017)
> - **Testing**: Domain-focused pyramid with event sourcing patterns (ADR-021)
> - **Observability**: OpenTelemetry with Grafana Cloud (ADR-010, ADR-019)
> - **Security**: RBAC, encryption, audit trails (ADR-004)
> - **Deployment**: Serverless-first with container portability (ADR-014, ADR-015)

---

## Goals

- Provide a **public landing page** with basic information and contact methods.
- Protect the **platform** with authentication (sign-up and login).
- Enable **admins** to grant users access to apps (RBAC/entitlements).
- Host a set of **apps** that are **strictly decoupled** from one another (Style C).
- Follow **Domain-Driven Design (DDD)** and **Microservices** architecture.
- Use **Event Sourcing + CQRS** as the persistence and read-model pattern.
- Minimise costs initially while keeping full portability via Terraform and cloud-agnostic services.
- Support apps written in **TypeScript, Java, and Python**.

---

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Public
        LP[Landing Page (Cloudflare Pages)]
    end

    subgraph Edge
        GW[Cloudflare Workers (Gateway)]
        Auth[Auth0 / OIDC]
    end

    subgraph Platform
        Neon[Neon Postgres (Event store)]
        Kafka[Kafka (Confluent / Upstash)]
        Doppler[Secrets (Doppler)]
    end

    subgraph Apps
        A1[App 1 (Standalone UI + Service)]
        A2[App 2 (Standalone UI + Service)]
        A3[App N (Standalone UI + Service)]
    end

    LP --> GW
    LP --> Auth
    GW --> Auth
    GW --> A1
    GW --> A2
    GW --> A3

    A1 <--> Neon
    A2 <--> Neon
    A3 <--> Neon

    Neon --> Kafka
    Kafka --> A1
    Kafka --> A2
    Kafka --> A3

    Doppler --> GW
    Doppler --> A1
    Doppler --> A2
    Doppler --> A3
```

---

## Components (concrete choices)

### 1. Public Landing Page

- Technology: **React + TypeScript** (Vite or Next.js with SSG) styled with **Tailwind CSS**.
- Hosting: **Cloudflare Pages** for static site + Cloudflare Workers for lightweight edge logic (auth redirection, rate limit).
- Forms: Serverless worker endpoint (Cloudflare Worker) or external form service. Contact submissions flow to the Admin/Notification services via Kafka or direct API.

### 2. Authentication (Auth)

- **Provider**: OAuth 2.0 + OpenID Connect per ADR-003 and ADR-018
- **Implementation**: Single-tenant architecture with centralized user management (ADR-002)
- **Tokens**: JWT with short-lived access tokens and secure refresh patterns
- **Integration**: Cloudflare Workers validate tokens at edge; services use JWKS validation
- **Authorization**: RBAC via domain events and projection-based entitlements (ADR-005, ADR-012)

### 3. Admin Service

- **Implementation**: TypeScript on Cloudflare Workers (ADR-014, ADR-016)
- **Responsibilities**: User access management, project catalog, contact processing; emits domain events per ADR-005
- **Architecture**: CQRS with command handlers and event projections (ADR-006, ADR-012)
- **APIs**: REST commands + GraphQL queries per ADR-020
- **Data**: Event sourced aggregates in Neon with outbox pattern (ADR-006, ADR-022)

### 4. API Gateway / Edge

- Implementation: **Cloudflare Workers** as the gateway layer (JWT validation, routing, coarse authz, caching).
- Role: Authenticate requests, inject tenant/actor claims, and route to app backends or app frontends.

### 5. Event Store & Source of Truth

- Implementation: **Neon (Postgres) as the canonical event store** using append-only event tables per aggregate (e.g. `stream_id`, `sequence`, `event_type`, `payload`, `metadata`).
- Concurrency: Append with `expected_version` to enforce optimistic concurrency control.
- Rationale: Neon provides Postgres compatibility, serverless behaviour, and portability. Start here and migrate to a dedicated event store if needed.

### 6. Streaming Bus

- **Implementation**: Kafka via HTTP REST API (ADR-011, ADR-022) for serverless compatibility
- **Pattern**: Outbox pattern with transactional event publishing from Neon to Kafka topics
- **Topics**: Domain-aligned topic strategy (user.events, project.events, contact.events)
- **Consumers**: Projection workers, notification services, audit processors
- **Schema**: Avro schemas with versioning support per ADR-007

### 7. Apps (Platform Apps) — Standalone with Shared Auth

- **Architecture**: Independent frontends and backends per ADR-013 and ADR-016
- **Technology**: React 18+ with TypeScript, Zustand state management, Tailwind CSS
- **Build Tools**: Vite for frontend bundling, Wrangler for Worker deployment
- **Communication**: Event-driven via Kafka (ADR-022), REST commands + GraphQL queries (ADR-020)
- **Testing**: Domain-focused testing pyramid with event sourcing patterns (ADR-021)
- **Deployment**: Cloudflare Workers for backends, Cloudflare Pages for frontends (ADR-014)

### 8. Secrets & Configuration

- **Secrets Management**: Doppler for centralized secret storage and injection (ADR-017)
- **Environment Management**: Multi-stage deployment with environment-specific configs
- **Infrastructure**: Terraform modules for reproducible deployments (ADR-014, ADR-015)
- **Portability**: Container-ready services for future migration flexibility

---

## Design Principles & Best Practices (emphasis on DDD & decoupling)

### Domain-Driven Design (DDD) discipline

- **Bounded Contexts**: Model each microservice (accounts, entitlements, app-catalog, apps) as a bounded context with its own ubiquitous language and domain model.
- **Ubiquitous Language**: Maintain a repository-level `docs/glossary.md` with canonical terms (aggregate names, event names, command names).
- **Aggregates & Invariants**: Design aggregates to enforce transactional invariants; aggregates are the only objects that append domain events.
- **Anti-Corruption Layer (ACL)**: When integrating with third-party APIs or other contexts, use an ACL to translate external models to internal domain types.

### Hexagonal / Ports & Adapters

- **Domain layer first**: Implement domain logic in pure language constructs with no external dependencies or imports from infra libraries (DB, Kafka, HTTP).
- **Adapters**: Create thin adapters for persistence (Postgres), messaging (Kafka), and provisioning (Doppler/Cloudflare). Only adapters depend on infra SDKs.
- **Interfaces/Ports**: Define clear interfaces the application core depends on (e.g., `EventAppender`, `ReadModelRepository`, `MessagePublisher`) and implement them in infrastructure modules.

### Event Sourcing & CQRS specifics

- **Event envelope**: Standardize event envelopes `{ event_id, stream_id, type, version, created_at, actor, tenant_id, metadata, payload }`.
- **Versioned schemas**: Use JSON Schema or Avro for event payloads and maintain a schema registry (or a versioned `contracts/events` folder).
- **Outbox pattern**: When performing side-effects alongside DB transactions, use a transactional outbox table in Postgres – a reliable bridge to Kafka (publisher reads the outbox and forwards to Kafka).
- **Projections**: Keep read models denormalized and rebuildable from event streams. Projection workers consume Kafka topics and update Postgres read tables.
- **Idempotency**: Consumers should be idempotent — include event ID deduplication or idempotency keys when performing side-effects.
- **Snapshots**: For large aggregates, support snapshots to speed rehydration.

### Minimising coupling to libraries & cloud platforms

- **No domain imports from infra**: Domain packages must not import Postgres, Kafka, or Cloudflare SDKs. Only adapters should.
- **Small dependency surface**: Limit third-party libraries in domain code — prefer stdlib and tiny helper libs. Prefer plain data structures and pure functions.
- **Contracts-first approach**: Store all API / event contracts in the repo (`/contracts/api`, `/contracts/events`). Generate client/server stubs from these artifacts as part of CI, not ad-hoc SDKs.
- **Environment as config**: All platform-specific values (endpoints, secrets, feature flags) come from environment variables (injected from Doppler), never hard-coded.

### Testing & CI

- **Domain unit tests**: Fast, deterministic tests that exercise aggregates and domain rules without any infra.
- **Adapter integration tests**: Tests that validate adapters (DB, Kafka bridge) against ephemeral/test instances (local Neon/Postgres, Testcontainers, or hosted dev Neon).
- **End-to-end tests**: CI pipeline step using ephemeral stacks (or test frameworks) to run key workflows (user sign-up, grant access, projection updates).
- **Contract tests**: Ensure producers/consumers adhere to event schemas; run schema validation in CI.

---

### Observability & Centralized Logging

All services, apps, and the landing page must use a **consistent observability interface** for logs, metrics, and traces.

- **OpenTelemetry**: Instrument services with OTEL for traces, metrics, and logs.
- **Health & readiness**: Each service exposes health endpoints and projection lag metrics.
- **Monitoring**: Track projection lag, consumer offsets, DB replication lag, p95/p99 latencies, error rates, and SLOs.
- **Auditing**: All admin/security sensitive actions emit `AuditEvent`s to an immutable audit stream (and optionally archive to R2).
- **Instrumentation**: Use **OpenTelemetry (OTel)** APIs as the standard interface across TypeScript, Java, and Python codebases.
- **Wrapper Library**: A thin internal package (`@platform/observability`) wraps OTel APIs to provide:
  - Structured JSON logging (`timestamp`, `service`, `env`, `correlation_id`, `tenant_id`, `actor`, `event_id`).
  - Metrics (`counter`, `histogram`).
  - Distributed tracing (`span.start`, `span.end`).
- **Export/Collection**: All telemetry is exported using the **OpenTelemetry Protocol (OTLP)** to an **OTel Collector**.
- **Aggregation/Visualization**: Initially **Grafana Cloud (free tier)** with Loki (logs), Tempo (traces), and Prometheus (metrics).  
  The backend can be replaced without code changes by reconfiguring the Collector.
- **Best Practices**:
  - Always use structured logs (JSON, not plain text).
  - Propagate correlation IDs and trace IDs across service calls and Kafka events.
  - Keep observability code out of domain logic (instrumentation only in adapters or application layer).

This ensures a **vendor-neutral, portable observability strategy** that enforces consistency and supports migration between providers without changes to application code.

### Security

- **Auth & SSO**: Central OIDC (Auth0). Services validate tokens and enforce RBAC via entitlements from the Entitlements service.
- **Least privilege**: Services get least-privilege Doppler secrets and DB credentials. Rotate secrets via Doppler + CI.
- **Tenant scoping**: All queries and events include `tenant_id`; apply row-level security (RLS) policies in Postgres where appropriate.
- **Edge enforcement**: Cloudflare Workers validate JWTs and apply coarse-grained rate limits at edge.

### Portability (Terraform + Containers)

- **IaC with Terraform**: Declare Cloudflare, Neon, Kafka, Doppler integrations in Terraform modules to keep deployments reproducible and platform-agnostic.
- **Container images**: Build OCI images for services even if initially deployed serverless. This makes moving to Fly.io / Kubernetes easier later.
- **Minimal provider-specific code**: Keep provider-specific bootstrapping (e.g., Cloudflare worker handlers) confined to small adapter layers.

---

## Event Flow Examples (concrete with chosen stack)

### User sign-up (write path)

1. Client → Auth0 sign up → Auth0 issues `UserCreated` OIDC event (or your Auth service appends `UserRegistered` into Neon).
2. Service appends `UserRegistered` to Neon `events` table with `expected_version` semantics.
3. Append handler writes an outbox row in the same DB transaction.
4. Outbox publisher reads outbox and publishes the event to Kafka topic `user.events`.
5. Projection workers consume `user.events` from Kafka and update read tables (e.g., `users` view).
6. Notification consumer consumes `user.events` and sends welcome emails.

### Grant app access (admin flow)

1. Admin UI → Admin Service (authenticated) → Admin Service appends `AppAccessGranted` to Neon.
2. Event is written to outbox and published to Kafka.
3. Entitlements projection updates read models; Gateway caches entitlement claims for fast authz.
4. App frontends query their backend or rely on JWT claims to decide UI surfaces.

---

## Repository Layout (established via ADR-016)

```text
/
├── services/               # Domain services (ADR-005, ADR-006)
│   ├── accounts/           # User aggregate and auth
│   ├── app-catalog/        # Project aggregate management
│   ├── entitlements/       # Access control and RBAC
│   └── admin/              # Contact aggregate and admin ops
├── contracts/              # API and event schemas (ADR-020, ADR-007)
│   ├── api/               # OpenAPI specifications
│   └── events/            # Avro event schemas
├── infra/                 # Infrastructure as code (ADR-014, ADR-015)
│   ├── terraform/         # Provider modules
│   └── scripts/           # Deployment automation
├── tests/                 # Testing strategy (ADR-021)
│   ├── contract/          # Schema validation
│   ├── integration/       # Adapter testing
│   └── e2e/              # Business scenario testing
├── docs/                  # Architecture documentation
│   ├── decisions/         # All 22 ADRs
│   └── architecture.md    # This overview
├── fresh-start/           # Next.js prototype (reference)
└── changes/               # Change documentation
```

---

## Migration & Growth Path

- **Stage 1 (MVP)**: Cloudflare Workers + Cloudflare Pages, Neon Postgres event tables + outbox pattern, Upstash/Confluent free Kafka, Doppler for secrets, Terraform for infra.
- **Stage 2**: If need for higher throughput or advanced event-store features: evaluate EventStoreDB or a dedicated event-store deployment; consider managed Kafka for production.
- **Stage 3**: For many always-on consumers / heavy projections: run small container hosts or a Kubernetes cluster for those stateful components while keeping edge/gateway serverless.

---

## Next actions (practical)

1. Commit this file to `/docs/architecture-overview.md`.
2. Add `/contracts/events` with the top-level events and JSON Schemas. Implement CI validation (schema linting).
3. Scaffold a service template that enforces hexagonal separation (domain-only package + infra adapters).
4. Create Terraform modules for Cloudflare, Neon, Kafka (provider), and Doppler, and wire secrets injection into CI.
5. Add an outbox publisher service and a projection worker template.
6. Draft `glossary.md` and `conventions.md` to stabilise the ubiquitous language.

---
