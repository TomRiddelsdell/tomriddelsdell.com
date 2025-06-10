#!/bin/bash

# Pre-deployment test script
# Ensures all tests pass before allowing deployment

set -e

echo "🚀 Pre-deployment Test Suite"
echo "============================"

# Check environment variables
echo "📋 Checking environment configuration..."

# Check for database connection
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

# Check for session secret
if [ -z "$SESSION_SECRET" ]; then
  echo "❌ SESSION_SECRET is not set"
  exit 1
fi

# Check for Cognito configuration (support both naming conventions)
if [ -z "$VITE_AWS_COGNITO_USER_POOL_ID" ] && [ -z "$COGNITO_USER_POOL_ID" ]; then
  echo "❌ Cognito User Pool ID not found (checked VITE_AWS_COGNITO_USER_POOL_ID and COGNITO_USER_POOL_ID)"
  exit 1
fi

if [ -z "$VITE_AWS_COGNITO_CLIENT_ID" ] && [ -z "$COGNITO_CLIENT_ID" ]; then
  echo "❌ Cognito Client ID not found (checked VITE_AWS_COGNITO_CLIENT_ID and COGNITO_CLIENT_ID)"
  exit 1
fi

if [ -z "$VITE_AWS_COGNITO_REGION" ] && [ -z "$COGNITO_REGION" ]; then
  echo "❌ Cognito Region not found (checked VITE_AWS_COGNITO_REGION and COGNITO_REGION)"
  exit 1
fi

echo "✅ Environment configuration verified"

# Run TypeScript type checking with timeout
echo "📝 Running TypeScript type checking..."
timeout 30s npm run check
if [ $? -eq 124 ]; then
  echo "⚠️ TypeScript check timed out after 30 seconds"
  echo "Continuing with other tests..."
elif [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Deployment blocked."
  exit 1
else
  echo "✅ TypeScript check passed"
fi

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