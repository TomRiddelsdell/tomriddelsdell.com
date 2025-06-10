# Comprehensive Test Suite Documentation

## Overview

This document describes the comprehensive regression test suite implemented to prevent authentication and system regressions in both development and production environments.

## Test Structure

### 1. Unit Tests (`tests/unit/`)

**Purpose**: Test individual components and functions in isolation

**Files**:
- `auth.test.ts`: Authentication context and hooks testing
- `database.test.ts`: Database service unit tests
- `validation.test.ts`: Input validation and schema tests

**Test Coverage**:
- React component authentication states
- Auth context provider functionality
- Database service methods
- Form validation logic
- Error handling in components

### 2. Integration Tests (`tests/integration/`)

**Purpose**: Test API endpoints and service integration

**Files**:
- `api.test.ts`: Complete API endpoint testing

**Test Coverage**:
- Authentication endpoint integration
- Database operations through APIs
- Request/response validation
- Service layer integration

### 3. End-to-End Tests (`tests/e2e/`)

**Purpose**: Test complete user workflows in browser environment

**Files**:
- `auth-flow.spec.ts`: Complete authentication user flows
- `auth.spec.ts`: Additional authentication scenarios

**Test Coverage**:
- Sign in button display when unauthenticated
- Cognito redirect functionality
- Authentication callback handling
- User info display when authenticated
- Sign out flow with Cognito logout
- Protected route access control
- Session persistence across page reloads
- Network error handling
- Navigation for authenticated users

### 4. Authentication Regression Tests (`tests/auth-regression.test.ts`)

**Purpose**: Prevent authentication regressions in production

**Test Coverage**:
- Authentication API endpoints validation
- Protected route access control
- Public endpoint accessibility
- Error handling for invalid authentication

**Key Tests**:
- Unauthenticated requests return 401
- Auth callback handles valid/invalid codes
- Sign out provides proper Cognito logout URL
- Protected endpoints require authentication
- Contact form remains publicly accessible

### 5. Database Regression Tests (`tests/database-regression.test.ts`)

**Purpose**: Ensure database operations work correctly with Cognito integration

**Test Coverage**:
- User CRUD operations with Cognito ID support
- Workflow management
- Connected apps functionality
- Activity logging
- Dashboard statistics

**Key Tests**:
- Create user with Cognito ID
- Find user by Cognito ID and email
- Update user with Cognito information
- Workflow creation and management
- Connected app operations
- Activity log tracking
- Dashboard stats generation

### 6. Performance Regression Tests (`tests/performance-regression.test.ts`)

**Purpose**: Maintain application performance standards

**Test Coverage**:
- API response time validation
- Concurrent request handling
- Memory usage monitoring
- Error handling performance

**Performance Benchmarks**:
- Auth check: < 200ms
- Auth callback: < 2 seconds
- Contact form: < 1 second
- Sign out: < 100ms
- Concurrent requests: < 1 second for 10 requests

### 7. Complete Regression Suite (`tests/regression-suite.test.ts`)

**Purpose**: Comprehensive system validation

**Test Coverage**:
- Environment variable validation
- Critical authentication flows
- API data validation
- Security headers and CORS
- Error handling consistency
- Performance benchmarks
- Database connection health
- Session management
- Content type handling
- Rate limiting compliance

## Running the Tests

### Individual Test Suites

```bash
# Unit tests
npx vitest run tests/unit/

# Integration tests  
npx vitest run tests/integration/

# Authentication regression tests
npx vitest run tests/auth-regression.test.ts

# Database regression tests
npx vitest run tests/database-regression.test.ts

# Performance regression tests
npx vitest run tests/performance-regression.test.ts

# Complete regression suite
npx vitest run tests/regression-suite.test.ts

# End-to-end tests
npx playwright test tests/e2e/
```

### Test Categories

```bash
# Run all unit tests
npx vitest run tests/unit/

# Run all integration tests
npx vitest run tests/integration/

# Run all regression tests
npx vitest run tests/*-regression.test.ts

# Run all e2e tests
npx playwright test tests/e2e/

# Run all tests
npx vitest run tests/ && npx playwright test tests/e2e/
```

### Watch Mode

```bash
# Watch unit tests during development
npx vitest tests/unit/

# Watch integration tests
npx vitest tests/integration/

# Watch all vitest tests
npx vitest
```

## Environment Requirements

### Required Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `COGNITO_USER_POOL_ID`: AWS Cognito User Pool ID
- `COGNITO_CLIENT_ID`: AWS Cognito Client ID
- `COGNITO_REGION`: AWS region for Cognito

### Optional Environment Variables

- `SENDGRID_API_KEY`: For email functionality tests
- `CI`: Set to "true" in CI environments
- `RUN_E2E`: Set to "true" to force E2E tests

## Test Configuration

### Mock Server Setup (`tests/mocks/`)

**Purpose**: Provide controlled test environment for API responses

**Files**:
- `server.ts`: MSW (Mock Service Worker) server setup
- `handlers/`: Request handlers for different API endpoints
  - `auth.ts`: Authentication endpoint mocks
  - `workflows.ts`: Workflow API mocks
  - `users.ts`: User management mocks

**Features**:
- Intercepts HTTP requests during testing
- Provides consistent test data
- Simulates various response scenarios
- Enables testing without external dependencies

### Vitest Configuration

Tests use Vitest with the following setup:
- TypeScript support with path aliases
- Express app testing with Supertest
- Database testing with real PostgreSQL connection
- MSW integration for API mocking
- React Testing Library for component tests
- Timeout handling for network operations
- Setup file (`tests/setup.ts`) for global test configuration

### Playwright Configuration

E2E tests use Playwright with:
- Chromium browser testing
- Request mocking for authentication flows
- URL navigation validation
- Element visibility testing
- Screenshot capture on failures
- Multiple browser support (configurable)
- Parallel test execution

## Authentication Flow Testing

### Sign In Flow

1. User clicks "Sign In" button
2. Redirect to AWS Cognito hosted UI
3. User authenticates with Cognito
4. Callback to `/auth/callback` with authorization code
5. Server exchanges code for user info
6. User stored/updated in database
7. Session established
8. Redirect to dashboard

### Sign Out Flow

1. User clicks "Sign Out" button
2. Server destroys local session
3. Response includes Cognito logout URL
4. Client redirects to Cognito logout
5. Cognito clears authentication
6. Redirect back to application home

## Database Testing Strategy

### User Management

- Test Cognito ID integration
- Validate user creation and updates
- Ensure existing user handling
- Verify email and username lookups

### Data Integrity

- Test all CRUD operations
- Validate foreign key relationships
- Ensure proper data cleanup
- Test concurrent operations

## Performance Monitoring

### Response Time Limits

- Fast endpoints (auth check): 200ms
- Medium endpoints (callbacks): 2 seconds
- Slow operations (contact form): 1 second
- Quick operations (sign out): 100ms

### Concurrent Load

- Handle 10+ concurrent requests
- Maintain response times under load
- No memory leaks during testing
- Proper error handling under stress

## Security Testing

### Authentication Security

- All protected routes require authentication
- Proper 401 responses for unauthorized access
- Session management security
- CSRF protection validation

### Input Validation

- JSON parsing error handling
- Request size limit enforcement
- Content type validation
- Malformed request handling

## Error Handling Validation

### Network Errors

- Graceful handling of connection failures
- Proper error responses
- Consistent error message format
- Timeout handling

### Authentication Errors

- Invalid code handling in callbacks
- Expired session management
- Missing credentials response
- Malformed authentication data

## Continuous Integration

### Pre-deployment Checks

1. Run all authentication tests
2. Validate database operations
3. Check performance benchmarks
4. Verify security compliance
5. Test error handling

### Production Readiness

Tests ensure:
- All authentication flows work
- Database operations are stable
- Performance meets standards
- Security measures are active
- Error handling is comprehensive

## Maintenance

### Adding New Tests

1. Identify new functionality
2. Add appropriate test cases
3. Update this documentation
4. Verify test coverage
5. Include in CI pipeline

### Updating Tests

1. Review test failures
2. Update test expectations
3. Validate against requirements
4. Document changes
5. Communicate updates

## Test File Organization

### Directory Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── auth.test.ts        # Auth context and hooks
│   ├── database.test.ts    # Database service methods
│   └── validation.test.ts  # Input validation
├── integration/            # API and service integration tests
│   └── api.test.ts        # Complete API endpoint testing
├── e2e/                   # End-to-end browser tests
│   ├── auth-flow.spec.ts  # Authentication user flows
│   └── auth.spec.ts       # Additional auth scenarios
├── mocks/                 # Mock server and test data
│   ├── server.ts          # MSW server setup
│   └── handlers/          # API response handlers
├── setup.ts               # Global test configuration
├── auth-regression.test.ts     # Auth regression prevention
├── database-regression.test.ts # DB regression prevention
├── performance-regression.test.ts # Performance monitoring
└── regression-suite.test.ts    # Complete system validation
```

### Test Naming Conventions

- **Unit tests**: `*.test.ts` in `unit/` directory
- **Integration tests**: `*.test.ts` in `integration/` directory  
- **E2E tests**: `*.spec.ts` in `e2e/` directory
- **Regression tests**: `*-regression.test.ts` in root `tests/` directory

### Test Data Management

- Mock data defined in `tests/mocks/handlers/`
- Database test data created and cleaned up in test lifecycle
- Authentication test scenarios use controlled mock responses
- Performance benchmarks defined as constants in test files

## Troubleshooting

### Common Issues

**Test Timeouts**: 
- Increase timeout values for network operations
- Check database connection speed
- Verify mock server responses are configured

**Database Errors**: 
- Verify DATABASE_URL environment variable
- Check PostgreSQL connection and permissions
- Ensure test database is accessible
- Review migration status

**Authentication Failures**: 
- Verify Cognito configuration variables
- Check COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID
- Validate SESSION_SECRET is set
- Review auth callback URL configuration

**Performance Issues**: 
- Review response time expectations in tests
- Check system resources during test execution
- Verify network latency to external services
- Monitor memory usage during concurrent tests

**Mock Server Issues**:
- Ensure MSW handlers are properly configured
- Check request/response matching patterns
- Verify mock data structure matches API contracts
- Review console output for unhandled requests

### Debug Mode

Run tests with verbose output:
```bash
npx vitest run --reporter=verbose
```

Run specific test with debug logging:
```bash
DEBUG=* npx vitest run tests/auth-regression.test.ts
```

Run Playwright tests with debug mode:
```bash
npx playwright test --debug tests/e2e/
```

Enable debug logging in tests by setting environment variables:
```bash
NODE_ENV=test DEBUG=app:* npx vitest run
```

## Conclusion

This comprehensive test suite ensures the authentication system and overall application stability in both development and production environments. Regular execution of these tests prevents regressions and maintains system reliability.