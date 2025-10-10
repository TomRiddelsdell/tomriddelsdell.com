# Distributed Tracing with Jaeger

Complete guide for distributed tracing implementation using Jaeger and OpenTelemetry.

## Overview

The platform uses **Jaeger** for distributed tracing, integrated via **OpenTelemetry**. This enables end-to-end request tracking across all services, helping developers debug performance issues and understand system behavior.

## Quick Start

### 1. Start Jaeger

```bash
# Start Jaeger infrastructure
/workspaces/infra/scripts/jaeger.sh start

# Check status
/workspaces/infra/scripts/jaeger.sh status

# View logs
/workspaces/infra/scripts/jaeger.sh logs

# Stop Jaeger
/workspaces/infra/scripts/jaeger.sh stop
```

### 2. Access Jaeger UI

Open your browser to: **http://localhost:16686**

### 3. Generate Traces

Run your application with observability enabled:

```typescript
import { createObservability } from '@platform/observability';

const observability = createObservability({
  serviceName: 'my-service',
  version: '1.0.0',
  environment: 'development',
  platform: 'node',
  samplingRate: 1.0, // 100% sampling in development
});

// Start SDK (sends traces to Jaeger)
await observability.start();

// Create spans
const span = observability.tracing.startSpan('my-operation');
span.setAttribute('user.id', 'user-123');
// ... do work ...
span.end();
```

## Architecture

### Trace Export Flow

```
Application → OpenTelemetry SDK → OTLP Exporter → Jaeger Collector → Jaeger Storage → Jaeger UI
```

### Components

1. **OpenTelemetry SDK** - Instruments application code
2. **OTLP Exporter** - Exports traces in OTLP format
3. **Jaeger Collector** - Receives traces via HTTP/gRPC
4. **Jaeger Storage** - In-memory (dev) or Elasticsearch (prod)
5. **Jaeger UI** - Web interface for viewing traces

## Configuration

### Environment Variables

```bash
# Jaeger endpoint (automatically configured)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces  # Development
JAEGER_ENDPOINT=https://jaeger.example.com/api/traces        # Production

# Authentication (optional, for Jaeger Cloud)
JAEGER_AUTH_TOKEN=your-token-here

# Sampling rate (0.0 to 1.0)
# Configured via TelemetryConfig.samplingRate
```

### Sampling Strategies

**Development (100% sampling):**
```typescript
const observability = createObservability({
  serviceName: 'landing-page',
  environment: 'development',
  samplingRate: 1.0, // Capture all traces
});
```

**Production (10% sampling):**
```typescript
const observability = createObservability({
  serviceName: 'landing-page',
  environment: 'production',
  samplingRate: 0.1, // Capture 10% of traces
});
```

**Per-Service Configuration** (`infra/jaeger-sampling.json`):
```json
{
  "service_strategies": [
    {
      "service": "landing-page",
      "type": "probabilistic",
      "param": 1.0,
      "operation_strategies": [
        {
          "operation": "/api/health",
          "type": "probabilistic",
          "param": 0.1
        }
      ]
    }
  ],
  "default_strategy": {
    "type": "probabilistic",
    "param": 0.1
  }
}
```

### Export Configuration

**Development:**
- Export interval: 5 seconds
- Batch size: 512 spans
- Max queue: 1000 spans
- Timeout: 30 seconds

**Production:**
- Export interval: 30 seconds
- Batch size: 512 spans
- Max queue: 1000 spans
- Timeout: 30 seconds

## Using Jaeger UI

### 1. Finding Traces

**Search by Service:**
1. Select service from dropdown (e.g., "landing-page")
2. Click "Find Traces"
3. View list of recent traces

**Search by Operation:**
1. Select service
2. Select operation (e.g., "GET /api/health")
3. Apply filters (duration, tags)

**Search by Tags:**
```
user.id=user-123
http.method=POST
error=true
```

### 2. Viewing Trace Details

Click on a trace to see:
- **Timeline** - Visual span hierarchy
- **Span Details** - Duration, tags, logs
- **Service Architecture** - Service dependencies

### 3. Analyzing Performance

**Identify Slow Operations:**
- Look for long span durations
- Check P95/P99 latencies
- Find bottlenecks in trace timeline

**Investigate Errors:**
- Filter by `error=true` tag
- View error stack traces in span logs
- Trace error propagation across services

## Instrumentation Patterns

### HTTP Requests (Automatic)

HTTP requests are automatically instrumented via `HttpInstrumentation`:

```typescript
// Automatic span created for outbound requests
const response = await fetch('https://api.example.com/data');
// Span includes: http.method, http.url, http.status_code
```

### Manual Span Creation

```typescript
const span = observability.tracing.startSpan('process-payment');
span.setAttribute('payment.amount', 99.99);
span.setAttribute('payment.currency', 'USD');
span.setAttribute('user.id', 'user-123');

try {
  // ... process payment ...
  span.setAttribute('payment.status', 'success');
} catch (error) {
  span.setAttribute('error', true);
  span.setAttribute('error.message', error.message);
  throw error;
} finally {
  span.end();
}
```

### Span Helpers (Recommended)

Use pre-defined helpers for common operations:

```typescript
import { SpanHelper } from '@platform/observability';

// Event published span
const span = SpanHelper.eventPublished(
  observability.tracing,
  'UserRegistered',
  'user-123'
);
span.end();

// Database query span
const span = SpanHelper.databaseQuery(
  observability.tracing,
  'SELECT',
  'SELECT * FROM users WHERE id = $1'
);
span.end();

// External API call span
const span = SpanHelper.externalApiCall(
  observability.tracing,
  'GET',
  'https://api.stripe.com/v1/charges'
);
span.end();
```

### Parent-Child Spans

```typescript
// Parent span
const parentSpan = observability.tracing.startSpan('handle-request');

// Child span (uses parent context automatically)
const childSpan = observability.tracing.startSpan('database-query');
childSpan.end();

parentSpan.end();
```

### Cross-Service Propagation

Trace context is automatically propagated via W3C Trace Context headers:

```
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
```

**Client (outbound):**
```typescript
// Trace context automatically injected
const response = await fetch('http://other-service/api', {
  headers: {
    // traceparent header added automatically by OpenTelemetry
  }
});
```

**Server (inbound):**
```typescript
// Trace context automatically extracted from headers
// New span becomes child of parent trace
```

## Trace-to-Log Correlation

### Automatic Correlation

All logs automatically include `traceId` and `spanId`:

```json
{
  "timestamp": "2025-01-09T21:00:00.000Z",
  "level": "info",
  "service": "landing-page",
  "message": "User logged in",
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "spanId": "b7ad6b7169203331",
  "userId": "user-123"
}
```

### Finding Logs from Traces

1. Copy `traceId` from Jaeger UI
2. Search logs: `jq '.traceId == "0af7651916cd43dd8448eb211c80319c"' logs.json`
3. Or use log aggregation tool (Loki, Elasticsearch) with trace ID filter

### Finding Traces from Logs

1. Copy `traceId` from log entry
2. Open Jaeger UI: http://localhost:16686
3. Search by Trace ID
4. View full request flow

## Debugging Workflows

### Workflow 1: Investigate Slow Request

1. **Find Slow Traces** in Jaeger UI
   - Set min duration filter (e.g., > 1s)
   - Sort by duration descending

2. **Analyze Timeline**
   - Click on trace
   - Identify longest spans
   - Check for sequential vs parallel execution

3. **Check Logs**
   - Copy trace ID
   - Search logs for detailed context
   - Look for errors or warnings

4. **Optimize**
   - Add caching
   - Parallelize operations
   - Optimize database queries

### Workflow 2: Debug Production Error

1. **Search for Error Traces**
   - Filter by tag: `error=true`
   - Select recent time range

2. **View Error Details**
   - Click on error trace
   - Check error span for stack trace
   - Identify which service failed

3. **Find Root Cause**
   - Trace back through parent spans
   - Check logs for each span ID
   - Identify failing operation

4. **Verify Fix**
   - Deploy fix
   - Monitor for error rate decrease
   - Check traces for successful executions

### Workflow 3: Analyze Service Dependencies

1. **View System Architecture**
   - Jaeger UI → System Architecture tab
   - See service dependency graph

2. **Identify Bottlenecks**
   - Check latency between services
   - Find high-traffic paths
   - Identify single points of failure

3. **Optimize Architecture**
   - Add caching layers
   - Implement circuit breakers
   - Scale bottleneck services

## Production Deployment

### Elasticsearch Storage (Recommended)

For production, use Elasticsearch for persistent trace storage:

1. **Enable Elasticsearch** in `docker-compose.jaeger.yml`:
   ```yaml
   elasticsearch:
     image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
     # ... configuration ...

   jaeger:
     environment:
       - SPAN_STORAGE_TYPE=elasticsearch
       - ES_SERVER_URLS=http://elasticsearch:9200
   ```

2. **Set Retention Policy**:
   ```bash
   # Keep traces for 7 days
   ES_INDEX_MAX_AGE=168h
   ```

### Jaeger Cloud (Alternative)

Use managed Jaeger service for production:

1. Sign up for Jaeger Cloud or equivalent OTLP service
2. Get OTLP endpoint and authentication token
3. Configure in Doppler:
   ```bash
   JAEGER_ENDPOINT=https://your-tenant.jaeger.cloud/api/traces
   JAEGER_AUTH_TOKEN=your-token-here
   ```

## Troubleshooting

### Traces Not Appearing in Jaeger

**Check 1: Jaeger is Running**
```bash
/workspaces/infra/scripts/jaeger.sh status
# Should show: ✓ Jaeger is healthy
```

**Check 2: Application Connected**
```bash
# Check application logs for:
# "OpenTelemetry SDK started"
# jaegerEndpoint: "http://localhost:4318/v1/traces"
```

**Check 3: Sampling Rate**
```typescript
// Ensure sampling is enabled
samplingRate: 1.0  // 100% in development
```

**Check 4: Network Connectivity**
```bash
curl -v http://localhost:4318/v1/traces
# Should return 405 Method Not Allowed (POST required)
```

### High Latency in Trace Export

**Solution 1: Increase Export Interval**
```typescript
// In telemetry.ts
scheduledDelayMillis: 60000  // Export every 60s instead of 30s
```

**Solution 2: Increase Batch Size**
```typescript
maxExportBatchSize: 1024  // Export 1024 spans at once
```

**Solution 3: Increase Queue Size**
```typescript
maxQueueSize: 2000  // Queue up to 2000 spans
```

### Missing Span Attributes

**Check 1: Attributes Set Before End**
```typescript
span.setAttribute('user.id', userId);  // ✅ Before end()
span.end();
```

**Check 2: Valid Attribute Types**
```typescript
// Supported types: string, number, boolean
span.setAttribute('count', 42);        // ✅ number
span.setAttribute('active', true);     // ✅ boolean
span.setAttribute('user', userObject); // ❌ objects not supported
```

### Trace Context Not Propagating

**Check 1: HTTP Instrumentation Enabled**
```typescript
instrumentations: [
  new HttpInstrumentation(),  // ✅ Enabled
]
```

**Check 2: Headers Preserved**
```typescript
// Ensure traceparent header is forwarded
const response = await fetch(url, {
  headers: {
    ...existingHeaders,  // Include traceparent
  }
});
```

## Performance Impact

### Expected Overhead

- **CPU**: < 1% additional CPU usage
- **Memory**: ~50MB for trace buffers
- **Latency**: < 1ms per span creation
- **Network**: ~1KB per span exported

### Optimization Tips

1. **Use Sampling** in production (10% default)
2. **Ignore Health Checks** (already configured)
3. **Batch Exports** (already configured)
4. **Async Processing** (spans don't block requests)

## References

- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Tracing](https://opentelemetry.io/docs/instrumentation/js/instrumentation/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [ADR-010: Observability Requirements](/docs/decisions/adr-010-observability-requirements.md)

## Next Steps

- [ ] Implement sampling strategies per service
- [ ] Add custom span attributes for business metrics
- [ ] Create Grafana dashboards with trace analytics
- [ ] Set up alerts for high latency traces
- [ ] Integrate with log aggregation (Loki)

---

**Quick Commands:**

```bash
# Start Jaeger
/workspaces/infra/scripts/jaeger.sh start

# View UI
open http://localhost:16686

# Check health
curl http://localhost:14269/

# View logs
/workspaces/infra/scripts/jaeger.sh logs

# Stop Jaeger
/workspaces/infra/scripts/jaeger.sh stop
```
