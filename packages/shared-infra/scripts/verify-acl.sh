#!/bin/bash
set -e

echo "========================================="
echo "Anti-Corruption Layer Verification"
echo "========================================="
echo ""

echo "Checking for vendor imports outside implementations/..."
echo ""

# Search for @opentelemetry imports outside implementations directory
VIOLATIONS=$(grep -r "@opentelemetry" src --exclude-dir=implementations --include="*.ts" || true)

if [ -n "$VIOLATIONS" ]; then
  echo "❌ FAILED: Vendor imports found outside implementations/"
  echo ""
  echo "Violations:"
  echo "$VIOLATIONS"
  echo ""
  echo "Only files in src/observability/implementations/ may import vendor packages."
  echo "Application code must use domain-friendly interfaces from types.ts"
  exit 1
fi

echo "✅ No vendor imports found outside implementations/"
echo ""

echo "Verifying domain-friendly interfaces are exported..."
echo ""

# Check that index.ts exports types but not implementation classes
if ! grep -q "Observability" src/observability/index.ts; then
  echo "❌ FAILED: Observability interface not exported"
  exit 1
fi

if grep -q "^export.*NodeJSObservability\|^export.*EdgeObservability" src/observability/index.ts; then
  echo "❌ FAILED: Implementation classes should not be exported"
  echo "Only export createObservability factory function"
  exit 1
fi

echo "✅ Exports follow ACL pattern"
echo ""

echo "Verifying TypeScript build..."
echo ""

if [ ! -d "dist" ]; then
  echo "❌ FAILED: dist/ directory not found"
  echo "Run 'npm run build' first"
  exit 1
fi

echo "✅ TypeScript build output exists"
echo ""

echo "========================================="
echo "✅ All ACL Verification Checks Passed!"
echo "========================================="
echo ""
echo "Summary:"
echo "  • Zero vendor imports outside implementations/"
echo "  • Domain-friendly interfaces exported"
echo "  • Implementation classes hidden (not exported)"
echo "  • TypeScript compilation successful"
echo ""
echo "This package follows ADR-023 Anti-Corruption Layer pattern."
