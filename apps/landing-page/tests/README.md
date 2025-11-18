# Landing Page Tests

## Overview

This directory contains comprehensive tests for the landing page application to ensure reliability, performance, and visual consistency across deployments.

## Test Structure

```
tests/
├── e2e/                          # End-to-end tests (Playwright)
│   ├── static-assets.spec.ts    # Static asset loading verification
│   ├── api-health.spec.ts       # API endpoint health checks
│   ├── visual-regression.spec.ts # Visual regression testing
│   └── homepage.spec.ts          # General homepage tests
├── integration/                  # Integration tests
└── __tests__/                    # Unit tests (Jest)
    └── page.test.tsx
```

## Test Categories

### 1. Static Assets Tests (`static-assets.spec.ts`)

**Purpose**: Prevent issues like the CSS 404 error that occurred on 2025-11-18.

**What it tests**:
- ✅ All CSS files load successfully (HTTP 200)
- ✅ CSS is actually applied to the page
- ✅ All images load successfully
- ✅ Background images render correctly
- ✅ JavaScript chunks load without errors
- ✅ No 404 errors occur during page load

**Why it's critical**:
This test suite would have caught the missing `[assets]` configuration in `wrangler.toml` that caused all static assets to return 404.

**Run locally**:
```bash
pnpm exec playwright test tests/e2e/static-assets.spec.ts
```

### 2. API Health Tests (`api-health.spec.ts`)

**Purpose**: Ensure observability endpoints are functional.

**What it tests**:
- ✅ `/api/health` returns valid JSON
- ✅ `/api/metrics` returns performance data
- ✅ Health checks complete within 500ms
- ✅ Endpoints include expected metadata

**Run locally**:
```bash
pnpm exec playwright test tests/e2e/api-health.spec.ts
```

### 3. Visual Regression Tests (`visual-regression.spec.ts`)

**Purpose**: Detect unintended visual changes.

**What it tests**:
- ✅ Homepage visual snapshot (desktop, tablet, mobile)
- ✅ Hero section styling
- ✅ Navigation styling
- ✅ CSS application verification
- ✅ Image dimensions and positioning
- ✅ Text readability (font sizes)
- ✅ Color application

**First run** (create baselines):
```bash
pnpm exec playwright test tests/e2e/visual-regression.spec.ts --update-snapshots
```

**Subsequent runs** (compare against baselines):
```bash
pnpm exec playwright test tests/e2e/visual-regression.spec.ts
```

### 4. General E2E Tests (`homepage.spec.ts`)

**Purpose**: Basic functionality and accessibility.

**What it tests**:
- ✅ Page loads correctly
- ✅ Responsive design
- ✅ Accessibility standards (alt text, heading structure)

**Run locally**:
```bash
pnpm exec playwright test tests/e2e/homepage.spec.ts
```

## Running Tests

### Run all E2E tests
```bash
pnpm exec playwright test
```

### Run specific test file
```bash
pnpm exec playwright test tests/e2e/static-assets.spec.ts
```

### Run tests in headed mode (see browser)
```bash
pnpm exec playwright test --headed
```

### Run tests in debug mode
```bash
pnpm exec playwright test --debug
```

### Run tests against deployed staging
```bash
PLAYWRIGHT_TEST_BASE_URL=https://landing-page-preview.t-riddelsdell.workers.dev pnpm exec playwright test
```

### Run tests against deployed production
```bash
PLAYWRIGHT_TEST_BASE_URL=https://landing-page-prod.t-riddelsdell.workers.dev pnpm exec playwright test
```

## CI/CD Integration

### GitHub Actions

Tests run automatically in the CI/CD pipeline:

1. **Quality Gates** (pre-deployment):
   - Unit tests
   - Linting
   - Type checking

2. **Post-Deployment Verification** (after staging deployment):
   - Static assets tests
   - API health tests
   - (Visual regression tests can be added)

3. **Deployment Health Checks**:
   - Homepage accessibility (HTTP 200)
   - CSS file availability (HTTP 200)
   - Image asset availability (HTTP 200)
   - Health endpoint validation
   - Metrics endpoint validation

### Preventing the CSS 404 Issue

The deployment health checks in `.github/workflows/deploy-landing-page.yml` now include:

```bash
# Extract CSS file from HTML and verify it loads
CSS_FILE=$(curl -s https://landing-page-preview.t-riddelsdell.workers.dev | grep -o '/_next/static/css/[^"]*\.css' | head -1)
CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://landing-page-preview.t-riddelsdell.workers.dev$CSS_FILE")

if [ "$CSS_STATUS" != "200" ]; then
  echo "❌ CSS file returned HTTP $CSS_STATUS (expected 200)"
  echo "⚠️ This indicates the assets directory may not be configured in wrangler.toml"
  exit 1
fi
```

This prevents deployments with broken static assets from passing verification.

## Test Reports

### Playwright Reports

After running tests, view the HTML report:

```bash
pnpm exec playwright show-report
```

On CI/CD, failed test reports are uploaded as artifacts:
- Artifact name: `playwright-report-staging` or `playwright-report-production`
- Retention: 7 days
- Access: Via GitHub Actions run summary

## Writing New Tests

### Adding a new E2E test

1. Create a new file in `tests/e2e/`:
   ```typescript
   import { test, expect } from '@playwright/test'
   
   test.describe('Feature Name', () => {
     test('should do something', async ({ page }) => {
       await page.goto('/')
       // Your test code
     })
   })
   ```

2. Run the test:
   ```bash
   pnpm exec playwright test tests/e2e/your-new-test.spec.ts
   ```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` and `afterEach` for setup/teardown
3. **Waiting**: Always wait for elements to be visible before asserting
4. **Descriptive names**: Use clear, descriptive test names
5. **Assertions**: Include meaningful error messages
6. **Selectors**: Prefer semantic selectors (roles, labels) over CSS selectors

## Troubleshooting

### Tests fail locally but pass in CI

- Check Node.js version matches CI (v22)
- Ensure dependencies are up to date: `pnpm install`
- Clear Playwright cache: `pnpm exec playwright install --force`

### Visual regression tests fail unexpectedly

- Fonts may render differently on different OSes
- Use `maxDiffPixels` to allow small differences
- Update snapshots if changes are intentional: `--update-snapshots`

### Network timeouts

- Increase timeout in `playwright.config.ts`
- Check if development server is running
- Verify network connectivity to deployed environments

## Coverage

Current test coverage:

| Category | Coverage | Files |
|----------|----------|-------|
| Static Assets | ✅ High | `static-assets.spec.ts` |
| API Endpoints | ✅ High | `api-health.spec.ts` |
| Visual Regression | ✅ Medium | `visual-regression.spec.ts` |
| Accessibility | ✅ Medium | `homepage.spec.ts` |
| Responsiveness | ✅ High | `homepage.spec.ts`, `visual-regression.spec.ts` |
| Unit Tests | ⚠️ Low | `__tests__/page.test.tsx` |

## Roadmap

Future test additions:

- [ ] Performance tests (Core Web Vitals)
- [ ] SEO tests (meta tags, schema.org)
- [ ] Form submission tests (when contact form is implemented)
- [ ] Navigation tests (multi-page when added)
- [ ] Cross-browser testing (Firefox, Safari)
- [ ] Mobile device emulation tests
- [ ] Lighthouse CI integration
- [ ] Bundle size monitoring

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](../../docs/decisions/adr-021-testing-strategy.md)
- [CI/CD Workflow](../../.github/workflows/deploy-landing-page.yml)
- [Deployment Guide](../README.md)
