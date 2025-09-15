# ADR-019: Observability and Centralized Logging

## Status
Accepted

## Context
The platform requires a consistent approach to observability and centralized logging across:
- The public landing page.
- All platform services.
- All apps (independently developed or within the monorepo).

Key requirements:
- Consistent developer-facing interface for logs, metrics, and traces.
- Follows best practices (structured logs, correlation IDs, distributed tracing).
- Avoids lock-in to any specific provider or cloud platform.
- Supports portability and low cost initially, with ability to evolve.

## Decision
We will standardize on **OpenTelemetry (OTel)** as the instrumentation API for logs, metrics, and traces across all services and apps.

- All codebases (TypeScript, Java, Python) will depend only on the **OTel API**, never directly on vendor-specific SDKs.
- A thin internal library (`@platform/observability`) will wrap OTel APIs to provide:
  - Logging (`log.info`, `log.error`, etc.) with JSON structured output.
  - Metrics (`counter.inc`, `histogram.observe`).
  - Tracing (`span.start`, `span.end`).
- This wrapper ensures consistent usage and conventions across all projects.

Telemetry will be exported via the **OpenTelemetry Protocol (OTLP)** to an **OpenTelemetry Collector**.  
The Collector is the only component aware of the destination backend.

For aggregation and visualization, we will initially use **Grafana Cloud (free tier)** with Loki (logs), Tempo (traces), and Prometheus (metrics).  
This can be replaced with self-hosted Grafana, Elastic Stack, or commercial vendors (Datadog, Honeycomb, New Relic) in the future without code changes.

## Rationale
- **OpenTelemetry is vendor-neutral** and has first-class SDKs for our supported languages.
- **Wrapper library enforces consistency** in structured logging, correlation IDs, and metric naming.
- **OTel Collector decouples apps from providers** — changing provider requires only Collector reconfiguration.
- **Grafana Cloud free tier** provides a cost-effective starting point while keeping an easy migration path.

## Consequences
- Developers must instrument code using the shared `@platform/observability` library, not raw logging libraries.
- Some additional complexity: running an OTel Collector for local/dev/test environments.
- Direct vendor SDK features (e.g., Datadog APM extras) will not be available unless wrapped by OTel.
- Logs, metrics, and traces will have consistent fields: `timestamp`, `service`, `env`, `correlation_id`, `tenant_id`, `actor`, `event_id`.

## Alternatives Considered
- **Direct vendor SDKs** (Datadog, New Relic, etc.): rejected due to vendor lock-in.
- **Structured logging only (no OTel)**: simpler but would fragment metrics/tracing solutions.
- **Custom logging library**: unnecessary, since OTel already provides standard APIs.

## Next Steps
1. Create `/contracts/observability` or `@platform/observability` library to wrap OTel APIs.  
2. Define logging conventions (JSON fields, log levels) and add to `/docs/conventions.md`.  
3. Add Terraform/infra module for deploying an OTel Collector.  
4. Configure Collector to forward telemetry to Grafana Cloud free tier initially.  
5. Ensure all services and apps depend only on the shared wrapper for observability.
