# Testing Framework

This project includes a comprehensive testing framework with unit tests, integration tests, and end-to-end tests.

## Test Structure

```
tests/
├── unit/          # Unit tests for individual components and functions
├── integration/   # Integration tests for API endpoints
├── e2e/           # End-to-end tests using Playwright
├── mocks/         # Mock data and handlers for MSW
└── setup.ts       # Test setup and configuration
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Integration Tests
Integration tests are included in the unit test suite and test API endpoints using Supertest.

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e-ui

# Install Playwright browsers (first time only)
npx playwright install
```

### All Tests
```bash
# Run all tests (unit, integration, and E2E)
npm run test:all
```

## Test Coverage

The testing framework covers:

- **Authentication flows** - Sign in, sign up, sign out
- **API endpoints** - All REST endpoints with validation
- **Database operations** - CRUD operations and data integrity
- **Input validation** - Zod schema validation
- **User interface** - Component rendering and interactions
- **End-to-end workflows** - Complete user journeys

## Mock Service Worker (MSW)

MSW is used to mock HTTP requests during testing. Mock handlers are defined in `tests/mocks/handlers/` and cover:

- Authentication endpoints
- Workflow management
- User dashboard data
- Connected apps

## Test Configuration

- **Vitest** - Fast unit test runner with TypeScript support
- **Playwright** - End-to-end testing across multiple browsers
- **Testing Library** - React component testing utilities
- **Supertest** - HTTP integration testing
- **MSW** - API mocking for reliable tests

## Writing Tests

### Unit Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('should behave correctly', () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
import request from 'supertest';

describe('API Endpoint', () => {
  it('should return expected data', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toMatchObject({});
  });
});
```

### E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('user flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

## CI/CD Integration

The testing framework is designed to integrate with CI/CD pipelines:

- Tests run in headless mode by default in CI environments
- Coverage reports are generated for monitoring
- Playwright tests run across multiple browsers
- Environment-specific configurations are supported