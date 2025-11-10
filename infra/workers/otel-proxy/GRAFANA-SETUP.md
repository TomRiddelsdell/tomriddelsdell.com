# Grafana Cloud Setup for OTLP Ingestion

This guide explains how to set up Grafana Cloud credentials for the OTLP proxy worker.

## Background

Per Grafana Cloud support:

> For writing logs and telemetry data from your website to Grafana, you typically don't need a Grafana service account. Instead, you need data source access tokens (Loki for logs, Prometheus/Mimir for metrics, Tempo for traces). These are managed separately from Grafana itself.

**Key Insight**: Write permissions are controlled by the data source configuration, not the Grafana role. For OTLP ingestion, you only need an Access Policy or API Key with minimal permissions.

## Setup Instructions

### Step 1: Sign Up for Grafana Cloud

1. Go to https://grafana.com/auth/sign-up/create-user
2. Create a free account (no credit card required)
3. Complete email verification
4. Note your stack details:
   - **Stack Name**: e.g., `tomriddelsdell`
   - **Stack URL**: e.g., `https://tomriddelsdell.grafana.net`
   - **Region**: e.g., `prod-us-east-0`

### Step 2: Create Access Policy or API Key

Choose **one** of the following options:

#### Option A: Access Policy (Recommended)

Access policies are the modern, granular approach to Grafana Cloud authentication.

1. Navigate to: **Administration** → **Access Policies**
2. Click **Create access policy**
3. Configure:
   - **Name**: `otel-proxy-writer`
   - **Display name**: OTLP Proxy Writer
   - **Scopes** (select these three):
     - ✅ **metrics:write** - Write metrics to Prometheus/Mimir
     - ✅ **logs:write** - Write logs to Loki
     - ✅ **traces:write** - Write traces to Tempo
4. Click **Create**
5. Generate a token:
   - Click **Add token**
   - **Name**: `otel-proxy-production`
   - **Expiration**: Choose appropriate duration (e.g., 1 year)
   - Click **Create**
6. **IMPORTANT**: Copy the token immediately (format: `glc_...`)
   - You won't be able to see it again
   - Save it securely in a password manager

#### Option B: API Key (Legacy, Still Supported)

API keys are the older authentication method but still fully supported.

1. Navigate to: **Administration** → **API Keys**
2. Click **Add API key**
3. Configure:
   - **Name**: `otel-proxy-writer`
   - **Role**: **Viewer** (sufficient for data source writes)
   - **Expiration**: Choose appropriate duration (e.g., 1 year)
4. Click **Add**
5. **IMPORTANT**: Copy the key immediately (format: `glsa_...`)
   - You won't be able to see it again
   - Save it securely in a password manager

### Step 3: Get OTLP Endpoint

1. Navigate to: **Connections** → **Add new connection**
2. Search for "OpenTelemetry"
3. Click on **OpenTelemetry** (OTLP)
4. Copy the **OTLP/HTTP endpoint URL**:
   - Format: `https://otlp-gateway-{region}.grafana.net/otlp`
   - Example: `https://otlp-gateway-prod-us-east-0.grafana.net/otlp`

### Step 4: Get Instance ID

1. Navigate to: **Administration** → **General Settings**
2. Find **Instance ID** (or **Stack ID**)
   - Format: 6-digit number (e.g., `123456`)
   - This is NOT the same as your stack name

### Step 5: Prepare Credentials

Grafana Cloud OTLP authentication requires Basic Auth with the format `<instanceID>:<token>`, base64-encoded.

```bash
# Format: <instanceID>:<token>
# Example: 123456:glc_eyJrIjoiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoiLCJuIjoib3RlbC1wcm94eS1wcm9kdWN0aW9uIiwiaWQiOjEyMzQ1Nn0=

# Base64 encode the credentials
echo -n "YOUR_INSTANCE_ID:YOUR_TOKEN" | base64

# Example output:
# MTIzNDU2OmdsY19leUp.yIjoiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoiLCJuIjoib3RlbC1wcm94eS1wcm9kdWN0aW9uIiwiaWQiOjEyMzQ1Nn0=
```

### Step 6: Store in Doppler

Store the credentials in Doppler secrets manager:

```bash
# Production environment
doppler secrets set GRAFANA_CLOUD_OTLP_ENDPOINT "https://otlp-gateway-prod-us-east-0.grafana.net/otlp" \
  --project tomriddelsdell-infra \
  --config prd

doppler secrets set GRAFANA_CLOUD_API_KEY "YOUR_BASE64_ENCODED_KEY" \
  --project tomriddelsdell-infra \
  --config prd

# Generate a random API key for the proxy (used by applications to authenticate to the worker)
doppler secrets set OTEL_PROXY_API_KEY "$(openssl rand -hex 32)" \
  --project tomriddelsdell-infra \
  --config prd

# Staging environment (same Grafana Cloud credentials, different proxy API key)
doppler secrets set GRAFANA_CLOUD_OTLP_ENDPOINT "https://otlp-gateway-prod-us-east-0.grafana.net/otlp" \
  --project tomriddelsdell-infra \
  --config stg

doppler secrets set GRAFANA_CLOUD_API_KEY "YOUR_BASE64_ENCODED_KEY" \
  --project tomriddelsdell-infra \
  --config stg

doppler secrets set OTEL_PROXY_API_KEY "$(openssl rand -hex 32)" \
  --project tomriddelsdell-infra \
  --config stg
```

## Verification

### Test the OTLP Endpoint Directly

```bash
# Get your credentials
INSTANCE_ID="123456"
TOKEN="glc_..."
BASE64_CREDS=$(echo -n "${INSTANCE_ID}:${TOKEN}" | base64)

# Test with a sample trace
curl -X POST "https://otlp-gateway-prod-us-east-0.grafana.net/otlp/v1/traces" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic ${BASE64_CREDS}" \
  -d '{
    "resourceSpans": [{
      "resource": {
        "attributes": [
          {"key": "service.name", "value": {"stringValue": "test-service"}},
          {"key": "deployment.environment", "value": {"stringValue": "development"}}
        ]
      },
      "scopeSpans": [{
        "scope": {"name": "test"},
        "spans": [{
          "traceId": "00000000000000000000000000000001",
          "spanId": "0000000000000001",
          "name": "test-span",
          "kind": 1,
          "startTimeUnixNano": "1634567890000000000",
          "endTimeUnixNano": "1634567891000000000"
        }]
      }]
    }]
  }'
```

Expected response: `200 OK` or `202 Accepted`

### Verify in Grafana Cloud

1. Go to **Explore** → **Tempo**
2. Search for traces from `test-service`
3. Verify the test span appears

## Security Notes

### Principle of Least Privilege

- ✅ **Access Policy with write scopes** - Only grants ability to write telemetry data
- ✅ **API Key with Viewer role** - Sufficient for data source writes, no dashboard access
- ❌ **DO NOT use Editor or Admin roles** - Unnecessary elevated permissions

### Token Management

- **Rotation**: Rotate tokens annually or when compromised
- **Storage**: Store only in Doppler (encrypted secrets manager)
- **Usage**: Never commit tokens to version control or logs
- **Monitoring**: Monitor token usage in Grafana Cloud audit logs

### Access Control

The OTLP proxy worker adds an additional authentication layer:
- **Applications** → Authenticate to proxy with `OTEL_PROXY_API_KEY`
- **Proxy** → Authenticates to Grafana Cloud with `GRAFANA_CLOUD_API_KEY`

This ensures:
1. Grafana Cloud credentials never exposed to browser/edge environments
2. Applications can't bypass proxy and write arbitrary data
3. Centralized authentication management

## Troubleshooting

### 401 Unauthorized from Grafana Cloud

- Verify Instance ID is correct (6-digit number)
- Verify token hasn't expired
- Check base64 encoding: `echo "YOUR_BASE64" | base64 -d` should show `instanceID:token`
- Ensure token has correct scopes (metrics:write, logs:write, traces:write) or Viewer role

### 403 Forbidden from Grafana Cloud

- Access policy missing required scopes
- API key role insufficient (must be at least Viewer)
- Token may be revoked - check Grafana Cloud admin panel

### 404 Not Found

- OTLP endpoint URL incorrect
- Verify region matches your stack (e.g., `prod-us-east-0`)
- Check path includes `/otlp` suffix

## References

- **Grafana Cloud OTLP Documentation**: https://grafana.com/docs/grafana-cloud/send-data/otlp/
- **Access Policies Guide**: https://grafana.com/docs/grafana-cloud/account-management/authentication-and-permissions/access-policies/
- **OTLP Specification**: https://opentelemetry.io/docs/specs/otlp/
- **ADR-023**: Unified Observability Architecture

## Next Steps

After completing this setup:

1. Deploy the OTLP proxy worker (see main README.md)
2. Configure applications to use the proxy endpoint
3. Import OpenTelemetry dashboards to Grafana Cloud
4. Set up alerts for service health

---

**Questions?** Refer to Grafana Cloud support chat or check the Grafana Community forums.
