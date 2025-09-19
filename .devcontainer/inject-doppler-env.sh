#!/bin/bash
# Doppler Environment Variables Injection Script
# Run this to inject all Doppler secrets as environment variables

echo "🔐 Injecting Doppler secrets as environment variables..."

# Export all Doppler secrets to current shell
eval "$(doppler run --project tomriddelsdell-dev --config dev --command env | grep -E "^(CONFLUENT_CLOUD_|CLOUDFLARE_|NEON_|AWS_|GITHUB_TOKEN)" | sed "s/^/export /")"

echo "✅ Doppler secrets injected!"
echo ""
echo "Now available as environment variables:"
echo "CONFLUENT_CLOUD_API_KEY: '${CONFLUENT_CLOUD_API_KEY:0:10}...'"
echo "CONFLUENT_CLOUD_API_SECRET: '${CONFLUENT_CLOUD_API_SECRET:0:10}...'"
echo "CLOUDFLARE_API_KEY: '${CLOUDFLARE_API_KEY:0:10}...'"
echo "NEON_API_KEY: '${NEON_API_KEY:0:10}...'"

# Test Confluent login with injected environment variables
echo ""
echo "🧪 Testing Confluent CLI with injected secrets..."
if confluent environment list > /dev/null 2>&1; then
    echo "✅ Confluent CLI working with environment variables!"
else
    echo "❌ Confluent CLI still needs configuration"
    echo "Try running: confluent login"
fi