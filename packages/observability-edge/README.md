# @platform/observability-edge

Edge runtime observability package for the platform. Provides structured logging, metrics collection, and distributed tracing that works in:

- **Cloudflare Workers**
- **Cloudflare Pages Functions**
- **Next.js Edge Runtime**
- **Vercel Edge Functions**

## Why a Separate Package?

This package exists to maintain **DDD consistency** while addressing **technical runtime constraints**:

### DDD Alignment

The landing page is part of the **Platform Monolith bounded context** (alongside Identity, Notifications, and Service Discovery). All components in this bounded context should use the same observability contracts.

### Technical Reality

Edge runtimes (Cloudflare Workers, Next.js Edge) do not support Node.js APIs required by the full OpenTelemetry SDK (`@opentelemetry/sdk-node`). Attempting to import `@platform/observability` in edge runtime causes build failures due to Node.js dependencies (`zlib`, `net`, `tls`, etc.).

###Solution

`@platform/observability-edge` provides the **same observability interface** with **degraded implementation** that works in edge runtimes:

- ✅ Same TypeScript interfaces as `@platform/observability`
- ✅ Structured logging with trace context propagation
- ✅ Metrics collection (logged as structured data)
- ✅ Distributed tracing via correlation IDs
- ❌ No Node.js dependencies
- ❌ No full OpenTelemetry SDK features

## Installation

```bash
npm install @platform/observability-edge
```

## Quick Start

```typescript
import { createEdgeObservability } from '@platform/observability-edge';

// Create observability instance
const observability = createEdgeObservability({
  serviceName: 'platform-modular-monolith',
  version: '1.0.0',
  environment: 'production',
  platform: 'cloudflare',
  samplingRate: 0.1,
});

// Structured logging
observability.log.info('User logged in', {
  userId: 'user-123',
  correlationId: 'corr-456',
});

// Metrics
observability.metrics.counter.inc('user.login.success', 1, {
  method: 'oauth',
});

// Distributed tracing
const span = observability.tracing.startSpan('process-payment');
span.setAttribute('amount', 99.99);
span.setAttribute('currency', 'USD');
span.end();
```

## Next.js Edge Runtime

```typescript
// app/api/example/route.ts
import { createEdgeObservability } from '@platform/observability-edge';

export const runtime = 'edge'; // Important: edge runtime

const observability = createEdgeObservability({
  serviceName: 'platform-modular-monolith',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  platform: 'cloudflare',
});

export async function GET(request: Request) {
  const span = observability.tracing.startSpan('api.request');
  const context = span.spanContext();

  observability.log.info('Request received', {
    traceId: context.traceId,
    spanId: context.spanId,
    url: request.url,
  });

  // ... handle request ...

  span.end();
  return Response.json({ status: 'ok' });
}
```

## Cloudflare Workers

```typescript
import { createEdgeObservability } from '@platform/observability-edge';

const observability = createEdgeObservability({
  serviceName: 'platform-modular-monolith',
  version: '1.0.0',
  environment: 'production',
  platform: 'cloudflare',
});

export default {
  async fetch(request: Request, env: any) {
    observability.log.info('Worker invoked', {
      url: request.url,
      method: request.method,
    });

    return new Response('OK');
  },
};
```

## API Reference

### createEdgeObservability(config)

Creates an observability instance with logging, metrics, and tracing.

**Parameters:**
- `config.serviceName` (string): Service identifier
- `config.version` (string): Service version
- `config.environment` (string): Environment (dev, staging, production)
- `config.platform` ('cloudflare' | 'edge'): Runtime platform
- `config.samplingRate` (number, optional): Trace sampling rate (0.0-1.0)

**Returns:** `PlatformObservability`

### Logger

```typescript
interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
}
```

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

### Tracing

```typescript
interface Tracing {
  startSpan(name: string, context?: SpanContext): Span;
  createTrace(correlationId?: string): TraceContext;
}
```

## Differences from @platform/observability

| Feature | @platform/observability | @platform/observability-edge |
|---------|------------------------|------------------------------|
| **Runtime** | Node.js | Edge (Cloudflare, Next.js Edge) |
| **OpenTelemetry SDK** | Full SDK | No SDK (manual implementation) |
| **Logging** | Structured JSON | Structured JSON |
| **Metrics** | OpenTelemetry Metrics API | Logged as structured data |
| **Tracing** | Full distributed tracing | Correlation IDs + log spans |
| **Exporters** | Jaeger, Prometheus, OTLP | Console output (captured by platform) |
| **Node.js Dependencies** | Yes (`zlib`, `net`, `tls`) | No |

## DDD Principles

This package maintains **bounded context consistency**:

1. **Same Interface**: Exports identical TypeScript types as `@platform/observability`
2. **Contract Compliance**: Implements the same logging, metrics, and tracing contracts
3. **Trace Propagation**: Maintains correlation IDs across Platform Monolith components
4. **Bounded Context Alignment**: Used by all Platform Monolith services in edge runtime

The technical limitation (edge runtime constraints) does not change the domain architecture. The landing page, identity service, notifications, and service discovery all belong to the same bounded context and use the same observability contracts.

## Testing

```bash
npm test          # Run tests
npm run build     # Build package
npm run type-check # TypeScript validation
```

## Related Packages

- [@platform/observability](/workspaces/packages/observability) - Full observability for Node.js runtimes

## ADR Compliance

Implements **ADR-010: Observability Requirements** with platform-specific adaptations for edge runtimes while maintaining bounded context consistency per DDD principles.

## License

Proprietary - Internal use only
