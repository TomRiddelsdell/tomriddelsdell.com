#!/bin/bash

# Pre-deployment test script
# Ensures all tests pass before allowing deployment

set -e

echo "🚀 Pre-deployment Test Suite"
echo "============================"

# Check environment variables
echo "📋 Checking environment configuration..."
REQUIRED_VARS=("DATABASE_URL" "SESSION_SECRET" "COGNITO_USER_POOL_ID" "COGNITO_CLIENT_ID" "COGNITO_REGION")

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Required environment variable $var is not set"
    exit 1
  fi
done

echo "✅ Environment configuration verified"

# Run TypeScript type checking
echo "📝 Running TypeScript type checking..."
npm run check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Deployment blocked."
  exit 1
fi
echo "✅ TypeScript check passed"

# Run unit tests
echo "🧪 Running unit tests..."
npx vitest run tests/unit/ --reporter=basic
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed. Deployment blocked."
  exit 1
fi
echo "✅ Unit tests passed"

# Run integration tests
echo "🔗 Running integration tests..."
npx vitest run tests/integration/ --reporter=basic
if [ $? -ne 0 ]; then
  echo "❌ Integration tests failed. Deployment blocked."
  exit 1
fi
echo "✅ Integration tests passed"

# Run authentication regression tests
echo "🔐 Running authentication regression tests..."
npx vitest run tests/auth-regression.test.ts --reporter=basic
if [ $? -ne 0 ]; then
  echo "❌ Authentication regression tests failed. Deployment blocked."
  exit 1
fi
echo "✅ Authentication regression tests passed"

# Run database regression tests
echo "💾 Running database regression tests..."
npx vitest run tests/database-regression.test.ts --reporter=basic
if [ $? -ne 0 ]; then
  echo "❌ Database regression tests failed. Deployment blocked."
  exit 1
fi
echo "✅ Database regression tests passed"

# Run performance regression tests
echo "⚡ Running performance regression tests..."
npx vitest run tests/performance-regression.test.ts --reporter=basic
if [ $? -ne 0 ]; then
  echo "❌ Performance regression tests failed. Deployment blocked."
  exit 1
fi
echo "✅ Performance regression tests passed"

# Run complete regression suite
echo "🎯 Running complete regression suite..."
npx vitest run tests/regression-suite.test.ts --reporter=basic
if [ $? -ne 0 ]; then
  echo "❌ Complete regression suite failed. Deployment blocked."
  exit 1
fi
echo "✅ Complete regression suite passed"

# Security checks
echo "🔒 Running security audit..."
npm audit --audit-level high
if [ $? -ne 0 ]; then
  echo "⚠️ Security vulnerabilities found. Review before deployment."
  # Note: Not blocking deployment for audit issues as they may be false positives
fi

# Build verification
echo "🏗️ Running build verification..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Deployment blocked."
  exit 1
fi
echo "✅ Build verification passed"

echo ""
echo "🎉 All pre-deployment tests passed!"
echo "✅ Application is ready for deployment"
echo ""

# Optional: Run E2E tests in CI environment
if [ "$CI" = "true" ] || [ "$RUN_E2E" = "true" ]; then
  echo "🌐 Running end-to-end tests..."
  npx playwright test tests/e2e/ --reporter=line
  if [ $? -ne 0 ]; then
    echo "❌ End-to-end tests failed. Deployment blocked."
    exit 1
  fi
  echo "✅ End-to-end tests passed"
fi

exit 0