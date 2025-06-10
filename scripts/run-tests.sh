#!/bin/bash

# Test runner script for the project
# Usage: bash run-tests.sh [test-type]

set -e

case "${1:-all}" in
  "all"|"")
    echo "Running all tests..."
    NODE_ENV=test npx vitest run
    ;;
  "watch")
    echo "Running tests in watch mode..."
    NODE_ENV=test npx vitest
    ;;
  "ui")
    echo "Running tests with UI..."
    NODE_ENV=test npx vitest --ui
    ;;
  "regression")
    echo "Running regression tests..."
    NODE_ENV=test npx vitest run tests/regression-suite.test.ts
    ;;
  "auth")
    echo "Running authentication tests..."
    NODE_ENV=test npx vitest run tests/auth-regression.test.ts
    ;;
  "db")
    echo "Running database tests..."
    NODE_ENV=test npx vitest run tests/database-regression.test.ts
    ;;
  "performance")
    echo "Running performance tests..."
    NODE_ENV=test npx vitest run tests/performance-regression.test.ts
    ;;
  "e2e")
    echo "Running end-to-end tests..."
    npx playwright test
    ;;
  *)
    echo "Usage: bash run-tests.sh [all|watch|ui|regression|auth|db|performance|e2e]"
    echo ""
    echo "Examples:"
    echo "  bash run-tests.sh           # Run all tests"
    echo "  bash run-tests.sh watch     # Run tests in watch mode"
    echo "  bash run-tests.sh regression # Run only regression tests"
    exit 1
    ;;
esac