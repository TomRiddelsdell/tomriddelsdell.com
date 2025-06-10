#!/bin/bash

# Comprehensive Pre-deployment Test Suite
# Runs ALL tests before deployment - no shortcuts or timeouts

set -e

echo "🚀 Comprehensive Pre-deployment Test Suite"
echo "=========================================="
echo "Running all tests - this may take several minutes..."
echo ""

# Check environment variables
echo "📋 Checking environment configuration..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
  echo "❌ SESSION_SECRET is not set"
  exit 1
fi

if [ -z "$VITE_AWS_COGNITO_USER_POOL_ID" ] && [ -z "$COGNITO_USER_POOL_ID" ]; then
  echo "❌ Cognito User Pool ID not found"
  exit 1
fi

if [ -z "$VITE_AWS_COGNITO_CLIENT_ID" ] && [ -z "$COGNITO_CLIENT_ID" ]; then
  echo "❌ Cognito Client ID not found"
  exit 1
fi

if [ -z "$VITE_AWS_COGNITO_REGION" ] && [ -z "$COGNITO_REGION" ]; then
  echo "❌ Cognito Region not found"
  exit 1
fi

echo "✅ Environment configuration verified"
echo ""

# Run TypeScript compilation check
echo "📝 Running TypeScript compilation check..."
npm run check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed. Deployment blocked."
  exit 1
fi
echo "✅ TypeScript compilation passed"
echo ""

# Run unit tests
echo "🧪 Running unit tests..."
npx vitest run tests/unit/ --reporter=verbose
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed. Deployment blocked."
  exit 1
fi
echo "✅ Unit tests passed"
echo ""

# Run integration tests
echo "🔗 Running integration tests..."
npx vitest run tests/integration/ --reporter=verbose
if [ $? -ne 0 ]; then
  echo "❌ Integration tests failed. Deployment blocked."
  exit 1
fi
echo "✅ Integration tests passed"
echo ""

# Run authentication regression tests
echo "🔐 Running authentication regression tests..."
npx vitest run tests/auth-regression.test.ts --reporter=verbose
if [ $? -ne 0 ]; then
  echo "❌ Authentication regression tests failed. Deployment blocked."
  exit 1
fi
echo "✅ Authentication regression tests passed"
echo ""

# Run database regression tests
echo "💾 Running database regression tests..."
npx vitest run tests/database-regression.test.ts --reporter=verbose
if [ $? -ne 0 ]; then
  echo "❌ Database regression tests failed. Deployment blocked."
  exit 1
fi
echo "✅ Database regression tests passed"
echo ""

# Run performance regression tests
echo "⚡ Running performance regression tests..."
npx vitest run tests/performance-regression.test.ts --reporter=verbose
if [ $? -ne 0 ]; then
  echo "❌ Performance regression tests failed. Deployment blocked."
  exit 1
fi
echo "✅ Performance regression tests passed"
echo ""

# Run complete regression suite
echo "🎯 Running complete regression suite..."
npx vitest run tests/regression-suite.test.ts --reporter=verbose
if [ $? -ne 0 ]; then
  echo "❌ Complete regression suite failed. Deployment blocked."
  exit 1
fi
echo "✅ Complete regression suite passed"
echo ""

# Run end-to-end tests if available
if [ -d "tests/e2e" ]; then
  echo "🌐 Running end-to-end tests..."
  npx playwright test tests/e2e/ --reporter=line
  if [ $? -ne 0 ]; then
    echo "❌ End-to-end tests failed. Deployment blocked."
    exit 1
  fi
  echo "✅ End-to-end tests passed"
  echo ""
fi

# Security audit
echo "🔒 Running security audit..."
npm audit --audit-level high
if [ $? -ne 0 ]; then
  echo "⚠️ Security vulnerabilities found. Review recommended but not blocking deployment."
fi
echo ""

# Build verification
echo "🏗️ Running build verification..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Deployment blocked."
  exit 1
fi
echo "✅ Build verification passed"
echo ""

# Final validation
echo "🧹 Running final deployment validation..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/auth/me)
if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ Server responding correctly"
else
  echo "❌ Server not responding correctly (HTTP $HTTP_STATUS)"
  exit 1
fi

echo ""
echo "🎉 ALL PRE-DEPLOYMENT TESTS PASSED!"
echo "✅ Application is verified and ready for deployment"
echo "🚀 You can now safely deploy to production"
echo ""

exit 0