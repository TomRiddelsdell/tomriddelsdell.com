# CI/CD Database Architecture Decision

**Date**: October 6, 2025  
**Status**: ✅ **Implemented**  
**Related ADRs**: ADR-017 (Environment Management), ADR-021 (Testing Strategy)

---

## Decision Summary

**All test environments (local, CI, development, production) use Neon (serverless Postgres)** to ensure architectural consistency and eliminate drift.

---

## Problem Statement

The initial GitHub Actions workflow used a generic PostgreSQL container for integration tests:

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: postgres  # Hardcoded credential
```

**Issues**:
1. ❌ **Architectural mismatch**: Production uses Neon, CI used vanilla PostgreSQL
2. ❌ **Security flaw**: Hardcoded credentials (GitGuardian Alert #21358380)
3. ❌ **Missing validation**: Didn't test Neon-specific features
4. ❌ **Extra complexity**: Required additional GitHub Secrets
5. ❌ **Environment drift**: CI behaved differently than production

---

## Decision

### Use Neon Test Branches for All Test Environments

**Environment Database Strategy**:

| Environment | Database | Purpose |
|------------|----------|---------|
| Local | Neon dev branch per developer | Fast iteration |
| CI/CD | Neon ci-test branch | Automated testing |
| Development | Neon dev branch (shared) | Integration testing |
| Production | Neon production branch | Live service |

**Key Principle**: **"Test infrastructure should mirror production infrastructure"**

---

## Implementation

### Neon Setup

```bash
# Create CI test branch
neonctl branches create ci-test --project-id restless-wind-52255642

# Get connection string
neonctl connection-string ci-test
# Output: postgresql://neondb_owner:npg_...@ep-lively-cherry-ab7qgjwf.eu-west-2.aws.neon.tech/neondb
```

### Doppler Configuration

```bash
# Create CI environment and config
doppler environments create "CI-CD" ci --project tomriddelsdell-infra
doppler configs create ci_tests --environment ci --project tomriddelsdell-infra

# Add DATABASE_URL secret
doppler secrets set DATABASE_URL "postgresql://..." \
  --project tomriddelsdell-infra --config ci_tests

# Create service token for GitHub Actions
doppler configs tokens create "GitHub Actions CI" \
  --config ci_tests --project tomriddelsdell-infra --plain
# Output: dp.st.ci_tests.***REDACTED*** (store this as DOPPLER_TOKEN_CI in GitHub Secrets)
```

### GitHub Actions Integration

```yaml
# .github/workflows/test.yml
integration-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - uses: dopplerhq/cli-action@v3
    
    - name: Run integration tests
      run: doppler run -- npm run test:integration
      env:
        DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN_CI }}
```

**What changed**:
- ✅ Removed PostgreSQL service container
- ✅ DATABASE_URL automatically injected by Doppler
- ✅ Only 1 GitHub Secret needed (DOPPLER_TOKEN_CI)

---

## Benefits

### Architectural Consistency

**Before**:
```
Production:  Neon (serverless) ─┐
Development: Neon branches      │ Different!
CI/CD:       PostgreSQL 15      ┘
```

**After**:
```
Production:  Neon (serverless) ─┐
Development: Neon branches      │ Consistent!
CI/CD:       Neon ci-test       ┘
```

### Security Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Credentials | Hardcoded in YAML | Centralized in Doppler |
| GitHub Secrets | 2 required | 1 required |
| Secret Management | Manual sync | Automatic via Doppler |
| Audit Trail | Limited | Full in Doppler |
| Rotation | Manual | Can be automated |

### Testing Quality

**Now tests validate**:
- ✅ Neon serverless connection patterns
- ✅ Connection pooling behavior
- ✅ Cold start handling
- ✅ Production-like latency
- ✅ Neon-specific features (branching, PITR)

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         GitHub Actions Workflow         │
│                                         │
│  1. Checkout code                       │
│  2. Install Doppler CLI                 │
│  3. Run: doppler run -- test:integration│
└─────────────────┬───────────────────────┘
                  │
                  ↓ DOPPLER_TOKEN_CI
┌─────────────────────────────────────────┐
│         Doppler (ci_tests config)       │
│                                         │
│  Secrets:                               │
│  - DATABASE_URL                         │
│  - API_KEYS                             │
│  - Other test configs                   │
└─────────────────┬───────────────────────┘
                  │
                  ↓ Inject as env vars
┌─────────────────────────────────────────┐
│         Integration Tests               │
│                                         │
│  Uses DATABASE_URL to connect to:       │
└─────────────────┬───────────────────────┘
                  │
                  ↓ TCP/SSL Connection
┌─────────────────────────────────────────┐
│    Neon ci-test Branch (Serverless)     │
│                                         │
│  Branch: br-morning-night-abfc8jz0      │
│  Region: aws-eu-west-2                  │
│  Endpoint: ep-lively-cherry-ab7qgjwf    │
└─────────────────────────────────────────┘
```

---

## Configuration Reference

### Neon Resources

**Project**: `restless-wind-52255642` (tomriddelsdell.com)
**CI Branch**: `ci-test` (`br-morning-night-abfc8jz0`)
**Endpoint**: `ep-lively-cherry-ab7qgjwf`
**Region**: `aws-eu-west-2`

### Doppler Resources

**Project**: `tomriddelsdell-infra`
**Environment**: `ci` (CI-CD)
**Config**: `ci_tests`
**Service Token**: `GitHub Actions CI Backup`

### GitHub Resources

**Repository**: `TomRiddelsdell/tomriddelsdell.com`
**Secret**: `DOPPLER_TOKEN_CI`
**Workflow**: `.github/workflows/test.yml`

---

## Migration from PostgreSQL Container

### What Was Removed

```yaml
# ❌ REMOVED: PostgreSQL service container
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: ${{ secrets.TEST_POSTGRES_PASSWORD }}
      POSTGRES_DB: test_db
    ports:
      - 5432:5432
```

### What Was Changed

```yaml
# ❌ BEFORE: Manual DATABASE_URL construction
env:
  DATABASE_URL: postgres://postgres:${{ secrets.TEST_POSTGRES_PASSWORD }}@localhost:5432/test_db

# ✅ AFTER: Automatic injection from Doppler
env:
  DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN_CI }}
  # DATABASE_URL injected automatically
```

### GitHub Secrets Cleanup

**Before**:
- `DOPPLER_TOKEN_CI` (Doppler access)
- `TEST_POSTGRES_PASSWORD` (PostgreSQL container)

**After**:
- `DOPPLER_TOKEN_CI` (Doppler access - provides all secrets)

---

## Validation

### Verify Neon Branch

```bash
# List branches
neonctl branches list --project-id restless-wind-52255642

# Check connection
psql "$(neonctl connection-string ci-test --project-id restless-wind-52255642)" -c "SELECT version();"
```

### Verify Doppler Config

```bash
# List secrets in CI config
doppler secrets --project tomriddelsdell-infra --config ci_tests

# Test secret retrieval (use your actual service token)
DOPPLER_TOKEN=dp.st.ci_tests.***REDACTED*** \
  doppler secrets get DATABASE_URL --plain
```

### Verify GitHub Integration

```bash
# List GitHub secrets
gh secret list --repo TomRiddelsdell/tomriddelsdell.com

# Expected output:
# DOPPLER_TOKEN_CI (only 1 secret needed)
```

---

## Operational Procedures

### Rotate Neon Credentials

```bash
# Method 1: Rotate via branch recreation
neonctl branches delete ci-test --project-id restless-wind-52255642
neonctl branches create ci-test --project-id restless-wind-52255642

# Method 2: Reset password (if Neon supports)
neonctl branches reset-password ci-test --project-id restless-wind-52255642

# Update Doppler with new connection string
doppler secrets set DATABASE_URL "new-connection-string" \
  --project tomriddelsdell-infra --config ci_tests
```

### Rotate Doppler Service Token

```bash
# Create new token
NEW_TOKEN=$(doppler configs tokens create "GitHub Actions CI New" \
  --config ci_tests --project tomriddelsdell-infra --plain)

# Update GitHub secret
gh secret set DOPPLER_TOKEN_CI --body "$NEW_TOKEN" \
  --repo TomRiddelsdell/tomriddelsdell.com

# Revoke old token (after verifying new one works)
doppler configs tokens revoke <old-token-slug> \
  --config ci_tests --project tomriddelsdell-infra
```

### Clean Up Test Data

```bash
# Connect to CI branch
psql "$(neonctl connection-string ci-test --project-id restless-wind-52255642)"

# Truncate test data
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE projections CASCADE;

# Or reset entire branch
neonctl branches reset ci-test --project-id restless-wind-52255642
```

---

## Cost Considerations

### Neon Pricing

- **Free Tier**: 3 branches included
- **Branch Storage**: Minimal for test data
- **Compute**: Pay per active second (CI tests only run minutes)
- **Estimated Cost**: <$5/month for CI branch

### Cost Optimization

1. **Keep test data minimal**: Only fixtures needed for tests
2. **Suspend when idle**: Neon auto-suspends after inactivity
3. **Share branch**: All CI runs use same branch
4. **Reset periodically**: Truncate data weekly to reduce storage

---

## Troubleshooting

### Connection Failures

```bash
# Test connection directly
psql "$(neonctl connection-string ci-test --project-id restless-wind-52255642)" \
  -c "SELECT 1;"

# Check Doppler secret
doppler secrets get DATABASE_URL --project tomriddelsdell-infra --config ci_tests

# Verify GitHub secret exists
gh secret list --repo TomRiddelsdell/tomriddelsdell.com | grep DOPPLER_TOKEN_CI
```

### Token Issues

```bash
# Test Doppler token
DOPPLER_TOKEN=dp.st.ci_tests.xxx doppler secrets

# Check token permissions
doppler configs tokens get <token-slug> \
  --config ci_tests --project tomriddelsdell-infra
```

### CI Test Failures

1. Check GitHub Actions logs for connection errors
2. Verify Neon branch is not suspended (wake with query)
3. Confirm DATABASE_URL format is correct
4. Check Neon branch has required schema (migrations)

---

## References

### Documentation

- **ADR-017**: Environment Management Strategy (updated with CI environment)
- **ADR-021**: Testing Strategy (updated with Neon test branch approach)
- **GitGuardian Fix**: `docs/GITGUARDIAN-FIX-ARCHITECTURAL-CORRECTION.md`
- **Setup Guide**: `docs/SETUP-COMPLETED-CI-NEON.md`

### External Resources

- [Neon Branching Guide](https://neon.tech/docs/guides/branching)
- [Doppler GitHub Actions](https://docs.doppler.com/docs/github-actions)
- [GitHub Actions Services](https://docs.github.com/en/actions/using-containerized-services)

---

## Success Metrics

✅ **Achieved**:
1. Zero architectural drift between CI and production
2. Reduced GitHub Secrets from 2 to 1
3. Eliminated hardcoded credentials
4. Tests validate production-like Neon behavior
5. Centralized secret management in Doppler
6. GitGuardian Alert #21358380 resolved

---

**Status**: Production-ready, documented in ADRs, ready for team adoption
