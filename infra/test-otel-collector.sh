#!/bin/bash
# Test script to send a sample trace to the local OTel Collector
# This verifies that the collector is receiving data and forwarding to Grafana Cloud

OTEL_ENDPOINT="http://localhost:4318"

echo "📡 Sending test trace to OTel Collector..."

curl -X POST "${OTEL_ENDPOINT}/v1/traces" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceSpans": [{
      "resource": {
        "attributes": [
          {"key": "service.name", "value": {"stringValue": "test-service"}},
          {"key": "service.version", "value": {"stringValue": "1.0.0"}},
          {"key": "deployment.environment", "value": {"stringValue": "development"}}
        ]
      },
      "scopeSpans": [{
        "scope": {"name": "test-scope", "version": "1.0.0"},
        "spans": [{
          "traceId": "5b8aa5a2d2c872e8321cf37308d69df2",
          "spanId": "051581bf3cb55c13",
          "name": "test-operation",
          "kind": 1,
          "startTimeUnixNano": "'$(date +%s%N)'",
          "endTimeUnixNano": "'$(($(date +%s%N) + 1000000000))'",
          "attributes": [
            {"key": "http.method", "value": {"stringValue": "GET"}},
            {"key": "http.url", "value": {"stringValue": "/api/test"}},
            {"key": "http.status_code", "value": {"intValue": "200"}}
          ],
          "status": {"code": 0}
        }]
      }]
    }]
  }'

echo ""
echo "✅ Test trace sent!"
echo ""
echo "🔍 Verify in Jaeger UI:"
echo "   http://localhost:16686"
echo "   Service: test-service"
echo ""
echo "🌐 Verify in Grafana Cloud:"
echo "   Navigate to Explore → Tempo"
echo "   Filter: deployment.environment=\"development\""
echo "   Service: test-service"
echo ""
