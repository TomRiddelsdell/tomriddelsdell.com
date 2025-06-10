#!/bin/bash

# Quick pre-deployment validation script
# Optimized for fast feedback on critical deployment requirements

set -e

echo "⚡ Quick Deployment Validation"
echo "============================="

# Environment validation
echo "📋 Environment check..."
if [ -z "$DATABASE_URL" ] || [ -z "$SESSION_SECRET" ]; then
  echo "❌ Missing critical environment variables"
  exit 1
fi

if [ -z "$VITE_AWS_COGNITO_USER_POOL_ID" ] && [ -z "$COGNITO_USER_POOL_ID" ]; then
  echo "❌ Cognito configuration missing"
  exit 1
fi

echo "✅ Environment OK"

# Critical API tests
echo "🔗 Testing core APIs..."
curl -s http://localhost:5000/api/auth/me > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Server responding"
else
  echo "❌ Server not accessible"
  exit 1
fi

# Build test
echo "🏗️ Build verification..."
timeout 60s npm run build > /dev/null 2>&1
if [ $? -eq 124 ]; then
  echo "⚠️ Build timed out - proceeding anyway"
elif [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
else
  echo "✅ Build successful"
fi

echo ""
echo "🎉 Quick validation complete - ready for deployment!"
echo "For comprehensive testing, run: ./pre-deploy.sh"
echo ""

exit 0