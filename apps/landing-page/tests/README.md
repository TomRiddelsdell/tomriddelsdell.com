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

### 5. Performance Tests (Lighthouse CI)

**Purpose**: Monitor Core Web Vitals and overall performance metrics to prevent performance regressions.

**What it tests**:

- ✅ Performance score ≥ 90
- ✅ First Contentful Paint (FCP) < 1.8s
- ✅ Largest Contentful Paint (LCP) < 2.5s
- ✅ Cumulative Layout Shift (CLS) < 0.1
- ✅ Total Blocking Time (TBT) < 200ms
- ✅ JavaScript bundle < 200KB
- ✅ CSS bundle < 50KB
- ✅ Total page weight < 1MB

**Run locally against dev server**:

```bash
# Start dev server first
pnpm run dev

# In another terminal
pnpm run lighthouse:local
```

**Run against staging deployment**:

```bash
pnpm run lighthouse:staging
```

**View Lighthouse reports**:

Reports are saved to `.lighthouseci/` directory and can be viewed in the browser.

**CI/CD Integration**:

Lighthouse CI runs automatically on PRs and pushes to `develop`/`main`. Results are:
- Posted as PR comments
- Uploaded as workflow artifacts
- Cause build failure if thresholds are not met

### 6. SEO Tests (`seo.spec.ts`)

**Purpose**: Ensure the landing page follows SEO best practices for search engine optimization and social media sharing.

**What it tests**:

**Basic SEO Meta Tags**:
- ✅ Page title (10-60 characters, contains "Tom Riddelsdell")
- ✅ Meta description (50-160 characters)
- ✅ Meta keywords
- ✅ Author meta tag
- ✅ Viewport meta tag for mobile
- ✅ Canonical URL
- ✅ Robots directives (allow indexing)

**Open Graph Tags** (for Facebook, LinkedIn, etc.):
- ✅ og:title (required)
- ✅ og:type (required, set to "website")
- ✅ og:image (required, accessible)
- ✅ og:url (required, valid URL)
- ✅ og:description (recommended)
- ✅ og:site_name (recommended)
- ✅ og:locale (recommended, e.g., "en_US")

**Twitter Card Tags**:
- ✅ twitter:card ("summary_large_image")
- ✅ twitter:title
- ✅ twitter:description
- ✅ twitter:image (accessible)
- ✅ twitter:creator (@handle)
- ✅ twitter:site (@handle)

**Structured Data (JSON-LD)**:
- ✅ Valid schema.org Person type
- ✅ Required fields: name, url, description
- ✅ Professional details: jobTitle, knowsAbout
- ✅ Social media links (sameAs array)
- ✅ All URLs are valid

**robots.txt and sitemap.xml**:
- ✅ robots.txt is accessible (HTTP 200)
- ✅ robots.txt allows crawling
- ✅ robots.txt references sitemap
- ✅ sitemap.xml is accessible (HTTP 200)
- ✅ sitemap.xml is valid XML
- ✅ sitemap.xml contains homepage URL
- ✅ sitemap.xml has lastmod dates

**SEO Best Practices**:
- ✅ HTML lang attribute is set
- ✅ Exactly one h1 tag per page
- ✅ All images have alt attributes
- ✅ No duplicate meta tags
- ✅ Page loads quickly (< 3 seconds)

**Run locally**:

```bash
pnpm exec playwright test tests/e2e/seo.spec.ts
```

**Utility Functions** (`tests/utils/seo-helpers.ts`):

Reusable helper functions for SEO testing:
- `getPageTitle()` - Get page title
- `getMetaContent()` - Get meta tag by name
- `getMetaProperty()` - Get meta tag by property (Open Graph)
- `getOpenGraphData()` - Get all Open Graph metadata
- `getTwitterCardData()` - Get all Twitter Card metadata
- `getStructuredData()` - Get JSON-LD structured data
- `getCanonicalUrl()` - Get canonical URL
- `isValidUrl()` - Validate URL format
- `validateStructuredDataType()` - Validate schema.org type

**Social Media Preview Testing**:

To test how your page appears when shared on social media:

- **Facebook Sharing Debugger**: <https://developers.facebook.com/tools/debug/>
- **Twitter Card Validator**: <https://cards-dev.twitter.com/validator>
- **LinkedIn Post Inspector**: <https://www.linkedin.com/post-inspector/>
- **Google Rich Results Test**: <https://search.google.com/test/rich-results>

Enter your URL (`https://tomriddelsdell.com`) to see how the preview cards render.

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
   - Performance tests (Lighthouse CI)

3. **Performance Monitoring** (on PRs and commits):
   - Lighthouse CI performance testing
   - Core Web Vitals monitoring
   - Resource budget validation
   - PR comments with performance impact

4. **Deployment Health Checks**:
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
| Performance | ✅ High | Lighthouse CI |
| SEO | ✅ High | `seo.spec.ts` |
| Unit Tests | ⚠️ Low | `__tests__/page.test.tsx` |

## Roadmap

Future test additions:

- [x] Performance tests (Core Web Vitals) - **Implemented via Lighthouse CI**
- [x] SEO tests (meta tags, Open Graph, Twitter Cards, structured data) - **Implemented**
- [ ] Form submission tests (when contact form is implemented)
- [ ] Navigation tests (multi-page when added)
- [ ] Cross-browser testing (Firefox, Safari)
- [ ] Mobile device emulation tests
- [ ] Bundle size monitoring

## Performance Budgets

The following performance budgets are enforced via Lighthouse CI:

### Core Web Vitals

| Metric | Threshold | Severity |
|--------|-----------|----------|
| First Contentful Paint (FCP) | < 1.8s | Error |
| Largest Contentful Paint (LCP) | < 2.5s | Error |
| Cumulative Layout Shift (CLS) | < 0.1 | Error |
| Total Blocking Time (TBT) | < 200ms | Error |
| Speed Index | < 3s | Warning |
| Time to Interactive (TTI) | < 3.8s | Warning |

### Resource Budgets

| Resource Type | Budget | Severity |
|---------------|--------|----------|
| JavaScript | < 200KB | Warning |
| CSS | < 50KB | Warning |
| Images | < 500KB | Warning |
| Total Page Weight | < 1MB | Warning |
| Script Count | < 10 files | Warning |
| Stylesheet Count | < 3 files | Warning |

### Score Thresholds

| Category | Minimum Score | Severity |
|----------|---------------|----------|
| Performance | 90 | Error |
| Accessibility | 95 | Warning |
| Best Practices | 90 | Warning |
| SEO | 90 | Warning |

**Note**: These budgets are configured in `lighthouserc.js` and `lighthouserc.staging.js`.

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Core Web Vitals](https://web.dev/vitals/)
- [Testing Best Practices](../../docs/decisions/adr-021-testing-strategy.md)
- [CI/CD Workflow](../../.github/workflows/deploy-landing-page.yml)
- [Deployment Guide](../README.md)
