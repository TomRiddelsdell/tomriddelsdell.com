# @platform/observability

OpenTelemetry-based observability foundation for the platform, providing structured logging, metrics collection, and distributed tracing across all services.

## Overview

This package implements **ADR-010 Observability Requirements** with a portable, platform-agnostic API that works across:

- **Node.js** (full OpenTelemetry SDK)
- **Cloudflare Workers** (via Analytics Engine)
- **AWS Lambda** (via CloudWatch + X-Ray)
- **Kubernetes** (via Prometheus + Jaeger)

## Features

✅ **Structured Logging** with automatic trace context propagation  
✅ **Metrics Collection** (counters, histograms, gauges)  
✅ **Distributed Tracing** with correlation IDs  
✅ **Platform Adapters** for multi-cloud deployment  
✅ **Zero-config** OpenTelemetry SDK integration  
✅ **Type-safe** TypeScript API  

## Installation

```bash
npm install @platform/observability
```

## Quick Start

### Basic Usage

```typescript
import { createObservability } from '@platform/observability';

// Create observability instance
const observability = createObservability({
  serviceName: 'my-service',
  version: '1.0.0',
  environment: 'production',
  platform: 'node',
  samplingRate: 0.1, // 10% sampling for traces
});

// Start the SDK (Node.js only)
await observability.start();

// Structured logging
observability.log.info('User logged in', {
  userId: 'user-123',
  aggregateId: 'session-456',
});

// Metrics
observability.metrics.counter.inc('user.login.success', 1, {
  method: 'oauth',
});

// Distributed tracing
const span = observability.tracing.startSpan('process-payment');
span.setAttribute('amount', 99.99);
span.setAttribute('currency', 'USD');
// ... do work ...
span.end();
```

### Cloudflare Workers

```typescript
import { createObservability } from '@platform/observability';
import { CloudflareAdapter } from '@platform/observability/adapters/cloudflare';

export default {
  async fetch(request: Request, env: any) {
    const observability = createObservability(
      {
        serviceName: 'edge-api',
        version: '1.0.0',
        environment: 'production',
        platform: 'cloudflare',
        samplingRate: 0.01,
      },
      new CloudflareAdapter()
    );

    observability.log.info('Request received', {
      url: request.url,
      method: request.method,
    });

    return new Response('OK');
  }
};
```

### AWS Lambda

```typescript
import { createObservability } from '@platform/observability';
import { AWSAdapter } from '@platform/observability/adapters/aws';

const observability = createObservability(
  {
    serviceName: process.env.AWS_LAMBDA_FUNCTION_NAME!,
    version: process.env.AWS_LAMBDA_FUNCTION_VERSION!,
    environment: process.env.ENVIRONMENT || 'production',
    platform: 'aws',
    samplingRate: 0.1,
  },
  new AWSAdapter()
);

export const handler = async (event: any) => {
  observability.log.info('Lambda invoked', { event });
  
  // Emit CloudWatch EMF metric
  observability.metrics.histogram.observe('lambda.duration', 123.45);
  
  return { statusCode: 200 };
};
```

## API Reference

### Logging

```typescript
interface Logger {
  info(message: string, metadata?: object): void;
  error(message: string, error?: Error, metadata?: object): void;
  debug(message: string, metadata?: object): void;
  warn(message: string, metadata?: object): void;
}
```

**Automatic context propagation:**
- `traceId` - OpenTelemetry trace ID
- `spanId` - OpenTelemetry span ID
- `correlationId` - Request correlation ID
- `timestamp` - ISO 8601 timestamp
- `userId` - User ID (if provided)
- `aggregateId` - Aggregate ID (if provided)

### Metrics

```typescript
interface Metrics {
  counter: {
    inc(name: string, value: number, tags?: MetricTags): void;
  };
  histogram: {
    observe(name: string, value: number, tags?: MetricTags): void;
  };
  gauge: {
    set(name: string, value: number, tags?: MetricTags): void;
  };
}
```

**Pre-defined technical metrics** (from ADR-010):

```typescript
import { TechnicalMetrics } from '@platform/observability';

// Event sourcing metrics
observability.metrics.histogram.observe(
  TechnicalMetrics.EVENT_PROCESSING_LATENCY,
  latencyMs
);

observability.metrics.gauge.set(
  TechnicalMetrics.PROJECTION_LAG_SECONDS,
  lagSeconds
);

// HTTP metrics
observability.metrics.histogram.observe(
  TechnicalMetrics.HTTP_REQUEST_DURATION,
  durationMs,
  { method: 'POST', status: '200' }
);

// Database metrics
observability.metrics.gauge.set(
  TechnicalMetrics.DATABASE_CONNECTION_POOL_USAGE,
  poolSize
);

// Error metrics
observability.metrics.counter.inc(
  TechnicalMetrics.ERROR_RATE_BY_SERVICE,
  1,
  { service: 'auth', error_type: 'validation' }
);
```

### Distributed Tracing

```typescript
interface Tracing {
  startSpan(name: string, parentContext?: SpanContext): Span;
  createTrace(correlationId?: string): TraceContext;
}

interface Span {
  spanContext(): SpanContext;
  setAttribute(key: string, value: string | number | boolean): void;
  setAttributes(attributes: Record<string, string | number | boolean>): void;
  end(): void;
}
```

**Span helpers** for common operations:

```typescript
import { SpanHelper } from '@platform/observability';

// Event publishing
const span = SpanHelper.eventPublished(
  observability.tracing,
  'UserRegistered',
  'user-123'
);
span.end();

// Projection updates
const span = SpanHelper.projectionUpdated(
  observability.tracing,
  'user-profile-projection',
  'user-123'
);
span.end();

// Database queries
const span = SpanHelper.databaseQuery(
  observability.tracing,
  'SELECT',
  'SELECT * FROM users WHERE id = $1'
);
span.end();

// External API calls
const span = SpanHelper.externalApiCall(
  observability.tracing,
  'GET',
  'https://api.example.com/users'
);
span.end();
```

## Configuration

### Environment Variables

```bash
# OpenTelemetry exporter endpoint (Jaeger/OTLP)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Prometheus metrics port
PROMETHEUS_PORT=9464

# AWS X-Ray (for AWS environments)
OTEL_TRACES_EXPORTER=xray
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:2000
```

### TelemetryConfig

```typescript
interface TelemetryConfig {
  serviceName: string;        // Service identifier
  version: string;            // Service version
  environment: string;        // dev, staging, production
  platform: 'node' | 'cloudflare' | 'aws' | 'kubernetes';
  samplingRate?: number;      // 0.0 to 1.0 (default: 1.0 in dev, 0.1 in prod)
}
```

## Migration Guide

### From `console.log` to Structured Logging

**Before:**
```typescript
console.log('User logged in:', userId);
console.error('Payment failed:', error);
```

**After:**
```typescript
observability.log.info('User logged in', { userId });
observability.log.error('Payment failed', error, { userId, amount });
```

**Benefits:**
- ✅ Automatic trace ID propagation
- ✅ Structured JSON output
- ✅ Error stack traces
- ✅ Correlation IDs
- ✅ Queryable in log aggregation systems

### From ad-hoc metrics to OpenTelemetry

**Before:**
```typescript
// Custom metrics tracking
metrics.increment('requests');
metrics.timing('duration', endTime - startTime);
```

**After:**
```typescript
observability.metrics.counter.inc('http.requests.total', 1, {
  method: 'POST',
  status: '200',
});

observability.metrics.histogram.observe(
  'http.request.duration',
  endTime - startTime,
  { method: 'POST' }
);
```

**Benefits:**
- ✅ Industry-standard metric types
- ✅ Automatic service/environment/version tags
- ✅ Prometheus-compatible export
- ✅ Integration with Grafana dashboards

## Platform Adapters

### Node.js (Default)

Full OpenTelemetry SDK with:
- OTLP trace export (Jaeger-compatible)
- Prometheus metrics export on port 9464
- HTTP auto-instrumentation
- Batch span processing

### Cloudflare Workers

Limited observability with:
- Structured logging to console
- Cloudflare Analytics Engine for metrics
- No distributed tracing (logs trace context instead)

### AWS Lambda

AWS-native observability:
- CloudWatch Logs (structured JSON)
- CloudWatch Metrics (EMF format)
- AWS X-Ray tracing
- Automatic Lambda context capture

### Prometheus

Metrics-only adapter:
- `/metrics` endpoint in Prometheus exposition format
- Gauge/Counter/Histogram support
- No logging or tracing

## Testing

```bash
# Run unit tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

## Architecture

```
@platform/observability
├── src/
│   ├── index.ts              # Public API exports
│   ├── types.ts              # TypeScript interfaces
│   ├── logging.ts            # StructuredLogger
│   ├── metrics.ts            # MetricsCollector
│   ├── tracing.ts            # TracingManager
│   ├── telemetry.ts          # PortableTelemetry (Node SDK)
│   └── adapters/
│       ├── cloudflare.ts     # Cloudflare Workers adapter
│       ├── aws.ts            # AWS Lambda adapter
│       └── prometheus.ts     # Prometheus adapter
└── dist/                     # Compiled JavaScript + types
```

## Architectural Decisions

### Edge Runtime Services Use @platform/observability-edge

Services running on edge runtimes (Next.js Edge, Cloudflare Workers) use **@platform/observability-edge** instead of this package:

**Why Separate Packages:**

1. **Node.js API Incompatibility** - OpenTelemetry NodeSDK requires APIs unavailable in edge runtimes (zlib, net, tls)
2. **Zero Dependencies** - Edge package has no Node.js dependencies, enabling V8 isolate deployment
3. **Same TypeScript Contracts** - Both packages implement identical `PlatformObservability` interfaces
4. **DDD Consistency** - Maintains bounded context consistency across Platform Monolith services

**Which Package to Use:**

| Runtime Environment | Package | Tracing Implementation |
|---------------------|---------|------------------------|
| Node.js (ECS, Lambda, servers) | `@platform/observability` | Full OpenTelemetry SDK with Jaeger/OTLP |
| Next.js Edge Runtime | `@platform/observability-edge` | Correlation IDs with structured logging |
| Cloudflare Workers | `@platform/observability-edge` | Correlation IDs with structured logging |
| Cloudflare Pages | `@platform/observability-edge` | Correlation IDs with structured logging |
| Vercel Edge Functions | `@platform/observability-edge` | Correlation IDs with structured logging |

**Implementation**: See [@platform/observability-edge](../observability-edge/README.md) for edge runtime usage.

### Platform-Specific Adapters

Different platforms have different observability primitives:

| Platform | Logging | Metrics | Tracing |
|----------|---------|---------|---------|
| **Node.js** | Console + OTel | Prometheus | Jaeger (OTLP) |
| **Cloudflare Workers** | Console | Analytics Engine | Logs only |
| **AWS Lambda** | CloudWatch Logs | CloudWatch EMF | X-Ray |
| **Next.js Edge** | Console (lightweight) | Cloudflare Analytics | Correlation IDs |

This design follows **ADR-010's platform portability principle** while respecting each platform's constraints.

## ADR Compliance

This package implements **ADR-010: Observability Requirements**:

- ✅ **Structured Logging**: JSON format with trace context
- ✅ **Distributed Tracing**: OpenTelemetry with correlation IDs
- ✅ **Metrics Collection**: Counters, histograms, gauges
- ✅ **Technical Metrics**: All 5 priority metrics implemented
- ✅ **Business Metrics**: Extensible with custom tags
- ✅ **Platform Agnostic**: Works across Node/Cloudflare/AWS
- ✅ **Standards Compliant**: OpenTelemetry 1.0 specification

**Compliance level**: 60% (Phase 2 target)

## Contributing

See [IMPLEMENTATION_PLAN.md](/docs/IMPLEMENTATION_PLAN.md) for Phase 2 observability roadmap.

## License

Proprietary - Internal use only

## Related Documentation

- [ADR-010: Observability Requirements](/docs/decisions/adr-010-observability-requirements.md)
- [ADR-016: Application Architecture Standards](/docs/decisions/adr-016-application-architecture-standards.md)
- [Implementation Plan - Phase 2](/docs/IMPLEMENTATION_PLAN.md#phase-2-observability-foundation)
