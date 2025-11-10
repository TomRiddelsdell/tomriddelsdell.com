# OTLP HTTP Proxy Worker

Cloudflare Worker that proxies OpenTelemetry Protocol (OTLP) HTTP requests from edge applications to Grafana Cloud.

## Purpose

Enables unified observability across all environments by acting as an Anti-Corruption Layer between applications and observability backends.

## Features

- ✅ **OTLP/HTTP Protocol**: Supports traces (/v1/traces), metrics (/v1/metrics), and logs (/v1/logs)
- ✅ **Authentication**: API key-based authentication for incoming requests
- ✅ **CORS Support**: Enables browser-based telemetry
- ✅ **Error Handling**: Graceful degradation with fallback logging
- ✅ **Zero Cost**: Runs on Cloudflare Workers free tier (100k requests/day)

## Architecture

```
Application (Edge Runtime)
         ↓ OTLP/HTTP + Bearer token
OTLP Proxy Worker (this)
         ↓ OTLP/HTTP + Basic auth
Grafana Cloud OTLP Gateway
```

## Configuration

### Environment Variables (Secrets)

Set via `wrangler secret put` or Doppler:

```bash
# Grafana Cloud OTLP endpoint
GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net/otlp

# Grafana Cloud API key (base64 encoded instanceID:token)
GRAFANA_CLOUD_API_KEY=<your-base64-encoded-key>

# API key for authenticating incoming requests
OTEL_PROXY_API_KEY=<generate-random-key>
```

### Routes

- **Production**: `otel.tomriddelsdell.com`
- **Staging**: `otel-staging.tomriddelsdell.com`

## Deployment

### Initial Setup

```bash
# Install dependencies
pnpm install

# Set secrets via wrangler
wrangler secret put GRAFANA_CLOUD_OTLP_ENDPOINT
wrangler secret put GRAFANA_CLOUD_API_KEY
wrangler secret put OTEL_PROXY_API_KEY

# Or set via Doppler (recommended)
doppler secrets set GRAFANA_CLOUD_OTLP_ENDPOINT --project tomriddelsdell-infra --config prd
doppler secrets set GRAFANA_CLOUD_API_KEY --project tomriddelsdell-infra --config prd
doppler secrets set OTEL_PROXY_API_KEY --project tomriddelsdell-infra --config prd
```

### Deploy

```bash
# Deploy to production
wrangler deploy

# Deploy to staging
wrangler deploy --env staging

# Local development
wrangler dev
```

## Usage

### From Application Code

```typescript
import { createOTLPExporterFromEnv } from '@platform/observability';

// Set environment variables
process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://otel.tomriddelsdell.com';
process.env.OTEL_EXPORTER_OTLP_HEADERS = 'Authorization=Bearer YOUR_API_KEY';

// Exporter will automatically use the proxy
const exporter = createOTLPExporterFromEnv();
```

### Test with curl

```bash
# Test traces endpoint
curl -X POST https://otel.tomriddelsdell.com/v1/traces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "resourceSpans": [{
      "resource": { "attributes": [] },
      "scopeSpans": [{
        "scope": { "name": "test" },
        "spans": []
      }]
    }]
  }'
```

## Monitoring

Check Worker metrics in Cloudflare Dashboard:

1. Go to **Workers & Pages** → **otel-proxy**
2. View **Analytics** for request counts, errors, CPU time
3. View **Logs** → **Real-time Logs** for debugging

## Security

- **API Key Authentication**: All incoming requests must include `Authorization: Bearer <API_KEY>`
- **HTTPS Only**: All traffic encrypted in transit
- **No Data Persistence**: Worker is stateless, no telemetry data stored
- **Rate Limiting**: Cloudflare Workers enforces 100k requests/day (free tier)

## Cost

- **Cloudflare Workers**: Free tier (100k requests/day)
- **Expected Usage**: ~1-10k requests/day for portfolio site
- **Cost**: $0/month

## Troubleshooting

### 401 Unauthorized

- Check `OTEL_PROXY_API_KEY` matches in both worker and application
- Verify `Authorization` header format: `Bearer <key>`

### 502 Bad Gateway

- Verify `GRAFANA_CLOUD_OTLP_ENDPOINT` is correct
- Check `GRAFANA_CLOUD_API_KEY` is valid and base64-encoded
- Check Grafana Cloud status: https://status.grafana.com/

### 400 Bad Request

- Verify request path is `/v1/traces`, `/v1/metrics`, or `/v1/logs`
- Check `Content-Type: application/json` header
- Validate OTLP payload format

## References

- **OTLP Specification**: https://opentelemetry.io/docs/specs/otlp/
- **Grafana Cloud OTLP**: https://grafana.com/docs/grafana-cloud/send-data/otlp/
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **ADR-023**: Unified Observability Architecture
