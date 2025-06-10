# Pre-Deployment Testing Strategy

## Overview

This document outlines how to ensure all tests run before each deployment, preventing regressions from reaching production.

## Quick Setup

### 1. Manual Pre-Deployment Testing

Before deploying, run the comprehensive test script:

```bash
# Make script executable (first time only)
chmod +x pre-deploy.sh

# Run pre-deployment tests
./pre-deploy.sh
```

### 2. Automated Testing with Git Hooks

Create a pre-push Git hook to run tests automatically:

```bash
# Create pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
echo "Running pre-deployment tests..."
./pre-deploy.sh
if [ $? -ne 0 ]; then
    echo "Tests failed. Push cancelled."
    exit 1
fi
EOF

# Make executable
chmod +x .git/hooks/pre-push
```

### 3. Replit Deployment Integration

For Replit deployments, modify your start command to include testing:

```bash
# In your deployment settings, use this command:
bash pre-deploy.sh && npm run start
```

## Deployment Strategies

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Test and Deploy

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_USER: test_user
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - run: ./pre-deploy.sh
      env:
        DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
        SESSION_SECRET: ${{ secrets.SESSION_SECRET }}
        COGNITO_USER_POOL_ID: ${{ secrets.COGNITO_USER_POOL_ID }}
        COGNITO_CLIENT_ID: ${{ secrets.COGNITO_CLIENT_ID }}
        COGNITO_REGION: ${{ secrets.COGNITO_REGION }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: echo "Deploy to your production environment"
```

### Option 2: Replit Deployment with Testing

Configure Replit deployment to run tests first:

1. Open Replit deployment settings
2. Set deployment command to: `bash pre-deploy.sh && npm run start`
3. Ensure all environment variables are configured
4. Deploy will only succeed if tests pass

### Option 3: Manual Testing Checklist

For manual deployments, follow this checklist:

- [ ] Run `./pre-deploy.sh` successfully
- [ ] Verify all environment variables are set
- [ ] Check TypeScript compilation
- [ ] Confirm all tests pass
- [ ] Validate build output
- [ ] Review security audit results
- [ ] Deploy to production

## Test Categories Included

The pre-deployment script runs:

1. **Environment Validation**: Ensures required variables are set
2. **TypeScript Check**: Validates code compilation
3. **Unit Tests**: Component and function testing
4. **Integration Tests**: API endpoint validation
5. **Authentication Tests**: Auth flow regression prevention
6. **Database Tests**: Database operation validation
7. **Performance Tests**: Response time verification
8. **Regression Suite**: Complete system validation
9. **Security Audit**: Dependency vulnerability check
10. **Build Verification**: Production build validation

## Environment Variables Required

Ensure these are set in your deployment environment:

```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=your-session-secret
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=your-region
SENDGRID_API_KEY=your-sendgrid-key (optional)
```

## Deployment Blocking Conditions

Deployment will be blocked if:

- Environment variables are missing
- TypeScript compilation fails
- Any test suite fails
- Build process fails
- Critical security vulnerabilities found

## Performance Thresholds

Tests enforce these performance requirements:

- Authentication check: < 200ms
- Authentication callback: < 2 seconds
- Contact form submission: < 1 second
- Sign out operation: < 100ms
- Concurrent requests (10): < 1 second total

## Monitoring and Alerts

### Success Indicators

- All test suites pass with green checkmarks
- Build completes without errors
- Performance thresholds are met
- No critical security issues found

### Failure Handling

When tests fail:

1. Review test output for specific failures
2. Fix issues in development environment
3. Re-run tests locally before pushing
4. Only deploy after all tests pass

## Customization

### Adding New Tests

To include additional pre-deployment checks:

1. Add test files to appropriate `tests/` directory
2. Update `pre-deploy.sh` to include new test commands
3. Document any new environment requirements
4. Test the updated deployment process

### Modifying Performance Thresholds

Update performance expectations in:

- `tests/performance-regression.test.ts`
- `tests/regression-suite.test.ts`
- This documentation

### Environment-Specific Testing

For different environments (staging, production):

```bash
# Run with environment-specific settings
NODE_ENV=production ./pre-deploy.sh

# Skip E2E tests for faster deployment
SKIP_E2E=true ./pre-deploy.sh
```

## Troubleshooting

### Common Issues

**Tests timeout**: Increase timeout values or check database connectivity

**Environment variables missing**: Verify all required secrets are configured

**Build failures**: Check for TypeScript errors or dependency issues

**Performance failures**: Review system resources and optimize slow operations

### Emergency Deployment

For urgent hotfixes, you can bypass tests (not recommended):

```bash
# Emergency deployment without tests
EMERGENCY_DEPLOY=true npm run start
```

Document emergency deployments and run full test suite afterward.

## Best Practices

1. **Never skip tests** for regular deployments
2. **Run tests locally** before pushing to reduce CI failures
3. **Keep tests fast** to avoid deployment delays
4. **Monitor test results** and address failures promptly
5. **Update tests** when adding new features
6. **Review performance** metrics regularly
7. **Document deployment** processes and changes

## Integration with Development Workflow

### Local Development

```bash
# Before committing changes
npm run check
npx vitest run tests/unit/
npx vitest run tests/integration/

# Before pushing to main branch
./pre-deploy.sh
```

### Code Review Process

1. Ensure all tests pass in feature branches
2. Review test coverage for new features
3. Validate performance impact of changes
4. Confirm deployment readiness before merging

### Continuous Integration

The pre-deployment testing strategy integrates with:

- Git hooks for automatic test execution
- GitHub Actions for comprehensive CI/CD
- Replit deployment for seamless hosting
- Manual processes for emergency situations

This comprehensive approach ensures your authentication system and application remain stable and performant across all deployments.