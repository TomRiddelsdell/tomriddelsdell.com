#!/bin/bash
#
# Quality Gates Script
# Shared between local pre-push hook and GitHub Actions CI
#
# Usage:
#   ./scripts/quality-gates.sh [app-dir]
#
# Example:
#   ./scripts/quality-gates.sh apps/landing-page
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$WORKSPACE_ROOT/${1:-.}"
CHECKS_PASSED=true

# Function to print section headers
print_section() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${BLUE}$1${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to run a check
run_check() {
  local check_name="$1"
  local check_command="$2"
  
  echo ""
  echo -e "${BLUE}▶ $check_name${NC}"
  
  if eval "$check_command" > /tmp/quality-gate-output.log 2>&1; then
    echo -e "${GREEN}✅ $check_name passed${NC}"
    return 0
  else
    echo -e "${RED}❌ $check_name failed${NC}"
    echo ""
    echo "Error output:"
    cat /tmp/quality-gate-output.log | tail -30
    echo ""
    CHECKS_PASSED=false
    return 1
  fi
}

# Change to app directory
cd "$APP_DIR"
APP_NAME=$(basename "$APP_DIR")

print_section "🏗️  Quality Gates: $APP_NAME"

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo -e "${YELLOW}⚠️  No package.json found in $APP_DIR${NC}"
  exit 0
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📥 Installing dependencies...${NC}"
  pnpm install --frozen-lockfile > /dev/null 2>&1 || {
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
  }
fi

# Run TypeScript type check
if grep -q '"type-check"' package.json; then
  run_check "TypeScript type-check" "pnpm run type-check"
fi

# Run ESLint
if grep -q '"lint"' package.json; then
  run_check "ESLint" "pnpm run lint"
fi

# Run unit tests (skip e2e/playwright/cypress)
if grep -q '"test"' package.json; then
  if ! grep -q '"test":.*e2e\|playwright\|cypress' package.json; then
    run_check "Unit tests" "pnpm run test"
  else
    echo -e "${YELLOW}ℹ Skipping e2e/integration tests${NC}"
  fi
fi

# Run build test (if in CI or explicitly requested)
if [ "$CI" = "true" ] || [ "$RUN_BUILD_TEST" = "true" ]; then
  if grep -q '"build:cloudflare"' package.json; then
    run_check "Build test (OpenNext)" "pnpm run build:cloudflare"
  elif grep -q '"build"' package.json; then
    run_check "Build test" "pnpm run build"
  fi
fi

# Final result
print_section "📊 Results"

if [ "$CHECKS_PASSED" = true ]; then
  echo -e "${GREEN}✅ All quality gates passed!${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Some quality gates failed${NC}"
  echo ""
  echo "Please fix the issues above before pushing."
  echo ""
  exit 1
fi
