# Doppler + GitHub Actions Integration Strategy

**Date**: October 6, 2025  
**Topic**: Why Use Doppler Instead of GitHub Secrets  
**Status**: ✅ **RECOMMENDED APPROACH**

---

## 🎯 TL;DR

**You're absolutely right!** Since you already use Doppler for centralized secrets management, you should integrate Doppler with GitHub Actions instead of duplicating secrets in GitHub Secrets. This provides:

- ✅ **Single source of truth** for all secrets
- ✅ **Centralized management** across all environments
- ✅ **Audit logging** and access control
- ✅ **Automatic rotation** capabilities
- ✅ **Reduced duplication** and sync issues

---

## 🏗️ Architecture Comparison

### ❌ **BEFORE: Duplicated Secrets (Wrong Approach)**

```
┌─────────────────┐         ┌──────────────────┐
│   Doppler       │         │  GitHub Secrets  │
│   (Main Store)  │    ✗    │  (Duplicate)     │
├─────────────────┤         ├──────────────────┤
│ AWS_ACCESS_KEY  │         │ AWS_ACCESS_KEY   │
│ DATABASE_URL    │         │ DATABASE_URL     │
│ API_KEYS        │         │ API_KEYS         │
└─────────────────┘         └──────────────────┘
         ↓                           ↓
    Local Dev                   CI/CD (GitHub)
```

**Problems:**
- 🔴 Secrets stored in **two places**
- 🔴 Manual **synchronization** required
- 🔴 **Drift** between environments
- 🔴 **Double maintenance** burden
- 🔴 Inconsistent **audit trails**

### ✅ **AFTER: Doppler Integration (Correct Approach)**

```
                ┌─────────────────┐
                │   Doppler       │
                │ (Single Source) │
                ├─────────────────┤
                │ AWS_ACCESS_KEY  │
                │ DATABASE_URL    │
                │ API_KEYS        │
                │ POSTGRES_PWD    │
                └────────┬────────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
    Local Dev       CI/CD (GitHub)   Production
    (doppler run)   (doppler run)    (doppler run)
```

**Benefits:**
- ✅ **One source** of truth
- ✅ **Automatic sync** everywhere
- ✅ **Consistent** across all environments
- ✅ **Single place** to rotate secrets
- ✅ **Unified** audit logging

---

## 🔧 Implementation: GitHub Actions with Doppler

### Current Workflow Structure

```yaml
# .github/workflows/test.yml
integration-tests:
  steps:
    - name: Install Doppler CLI
      uses: dopplerhq/cli-action@v3
    
    - name: Run integration tests
      run: doppler run -- npm run test:integration
      env:
        DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN_CI }}
```

### What This Does

1. **Installs Doppler CLI** in GitHub Actions runner
2. **Authenticates** using `DOPPLER_TOKEN_CI` (stored in GitHub Secrets)
3. **Fetches ALL secrets** from Doppler automatically
4. **Injects secrets** into the test environment
5. **No manual secret duplication** needed

---

## 🔑 GitHub Secrets You SHOULD Use (Minimal)

### Required: DOPPLER_TOKEN_CI Only

You only need **1 GitHub Secret**:

**DOPPLER_TOKEN_CI**: Service token for Doppler CLI to fetch CI secrets

```bash
# Create in Doppler dashboard
# Project → ci config → Access → Service Tokens → Generate
```

**Add to GitHub**:
- Settings → Secrets and variables → Actions → New repository secret
- Name: `DOPPLER_TOKEN_CI`
- Value: `dp.st.ci.xxxxx`

**Why only one?**: All other secrets (DATABASE_URL, API keys, etc.) are automatically fetched from Doppler when you run `doppler run -- npm run test:integration`

---

## 🗄️ Database Strategy: Neon Test Branches (Not PostgreSQL Service)

### Architecture Alignment

Per your ADRs (ADR-006, ADR-014, ADR-017):
- **Production**: Neon Postgres (serverless)
- **Development**: Neon dev branches
- **CI/CD**: Should also use Neon test branches

### ❌ **REMOVED: PostgreSQL Service Container**

```yaml
# DON'T DO THIS - Not aligned with architecture
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: ${{ secrets.TEST_POSTGRES_PASSWORD }}
```

**Why removed:**
- Not representative of production (Neon vs vanilla PostgreSQL)
- Creates architectural drift
- Requires extra secret (TEST_POSTGRES_PASSWORD)
- Doesn't test Neon-specific features (connection pooling, branching, etc.)

### ✅ **USE: Neon Test Branch via Doppler**

```yaml
# Store in Doppler CI config
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/test_db

# GitHub Actions automatically gets it via Doppler
steps:
  - name: Run integration tests
    run: doppler run -- npm run test:integration
    env:
      DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN_CI }}
      # DATABASE_URL injected automatically from Doppler
```

**Benefits:**
- ✅ Tests against **actual Neon** infrastructure
- ✅ Validates **serverless connection** patterns
- ✅ Tests **Neon-specific features** (connection pooling, branching)
- ✅ **Matches production** architecture exactly
- ✅ **No extra GitHub Secrets** needed

### Setting Up Neon Test Branch

```bash
# Create dedicated test branch for CI
neonctl branches create ci-test --project-id your-project

# Get connection string
neonctl connection-string ci-test

# Add to Doppler CI config
doppler secrets set DATABASE_URL "postgres://..." --config ci
```

---

Even with Doppler, you still need **exactly 2 GitHub Secrets**:

### 1. `DOPPLER_TOKEN_CI` (Required)
**Purpose**: Authenticate GitHub Actions to Doppler

```bash
# Generate in Doppler Dashboard
# Navigate to: Project → Config → Service Tokens
# Create token with read-only access for CI/CD config

# Add to GitHub
# Repository → Settings → Secrets → Actions
# Name: DOPPLER_TOKEN_CI
# Value: dp.st.ci.xxxxxxxxxxxxx
```

**Why in GitHub Secrets?**
- Bootstrap authentication to Doppler
- Cannot be in Doppler (chicken-and-egg problem)
- Read-only, scoped to CI config

### 2. `TEST_POSTGRES_PASSWORD` (Service-Specific)
**Purpose**: PostgreSQL service password (can't use Doppler)

**Why separate?**
- GitHub Actions **services** start BEFORE steps run
- Doppler CLI isn't available yet when services initialize
- PostgreSQL container needs password at startup
- Scoped to ephemeral test database only

```yaml
services:
  postgres:
    env:
      # This runs BEFORE Doppler CLI is installed
      POSTGRES_PASSWORD: ${{ secrets.TEST_POSTGRES_PASSWORD }}
```

**Alternative Approaches:**
1. Use a fixed, documented test password (e.g., `test_db_password`)
2. Generate password dynamically in setup step
3. Use Doppler with a pre-step (more complex)

---

## 📊 Secrets Management Matrix

| Secret Type | Store In | Why |
|-------------|----------|-----|
| **Application Secrets** | Doppler | Single source of truth |
| **AWS Credentials** | Doppler | Centralized rotation |
| **API Keys** | Doppler | Audit logging |
| **Database URLs** | Doppler | Environment-specific |
| **Doppler Token** | GitHub Secret | Bootstrap auth |
| **Test DB Password** | GitHub Secret | Service initialization |

---

## 🚀 Migration Path: From GitHub Secrets → Doppler

### Phase 1: Audit Current Secrets

```bash
# List all GitHub Secrets
gh secret list

# Document which ones are needed
# Examples to migrate:
# - AWS_ACCESS_KEY_ID → Move to Doppler
# - AWS_SECRET_ACCESS_KEY → Move to Doppler
# - NEON_API_KEY → Move to Doppler
# - CLOUDFLARE_API_TOKEN → Move to Doppler
```

### Phase 2: Move to Doppler

```bash
# Add secrets to Doppler (via CLI or Dashboard)
doppler secrets set AWS_ACCESS_KEY_ID="AKIA..." --config ci
doppler secrets set AWS_SECRET_ACCESS_KEY="..." --config ci
doppler secrets set NEON_API_KEY="..." --config ci

# Verify
doppler secrets --config ci
```

### Phase 3: Update Workflows

```yaml
# BEFORE (Direct GitHub Secrets)
- name: Deploy
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  run: npm run deploy

# AFTER (Doppler Integration)
- name: Deploy
  env:
    DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN_CI }}
  run: doppler run -- npm run deploy
```

### Phase 4: Clean Up GitHub Secrets

```bash
# Remove migrated secrets from GitHub
gh secret delete AWS_ACCESS_KEY_ID
gh secret delete AWS_SECRET_ACCESS_KEY
gh secret delete NEON_API_KEY

# Keep only:
# - DOPPLER_TOKEN_CI (bootstrap)
# - TEST_POSTGRES_PASSWORD (service-specific)
```

---

## 🎯 Recommended Doppler Configuration

### Project Structure

```
tomriddelsdell.com (Project)
├── dev (Config)
│   ├── All development secrets
│   └── Local development use
├── staging (Config)
│   ├── Staging environment secrets
│   └── Preview deployments
├── prod (Config)
│   ├── Production secrets
│   └── Live environment
└── ci (Config) ← USE THIS FOR GITHUB ACTIONS
    ├── AWS credentials (read-only)
    ├── API keys (test/sandbox)
    ├── Database URLs (test)
    └── Service tokens
```

### Service Token Setup

```bash
# Create CI/CD service token
# Dashboard → ci config → Access → Service Tokens
# Token name: "GitHub Actions CI"
# Access: Read-only
# Scope: ci config only

# Result: dp.st.ci.xxxxxxxxxxxxx
# Add this to GitHub: DOPPLER_TOKEN_CI
```

---

## 🔒 Security Benefits

### With Doppler Integration

1. **Centralized Rotation**
   ```bash
   # Rotate AWS credentials in one place
   doppler secrets set AWS_ACCESS_KEY_ID="NEW_KEY" --config ci
   # Automatically available in:
   # - Local development
   # - GitHub Actions
   # - Production deployments
   ```

2. **Audit Trail**
   - Who accessed which secrets when
   - Track all secret changes
   - Identify security incidents

3. **Access Control**
   - Role-based permissions
   - Service token scoping
   - Environment isolation

4. **Secret Versioning**
   - Rollback to previous values
   - Track secret history
   - Disaster recovery

---

## 📝 Updated GitHub Actions Best Practices

### ✅ DO: Use Doppler for Application Secrets

```yaml
- name: Deploy Application
  run: doppler run -- npm run deploy
  env:
    DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN_CI }}
```

### ✅ DO: Keep Minimal Bootstrap Secrets in GitHub

```yaml
secrets:
  - DOPPLER_TOKEN_CI (bootstrap)
  - TEST_POSTGRES_PASSWORD (service-specific)
```

### ❌ DON'T: Duplicate Secrets

```yaml
# BAD: Don't do this
env:
  AWS_ACCESS_KEY: ${{ secrets.AWS_ACCESS_KEY }}  # ← In GitHub
  AWS_ACCESS_KEY: (also in Doppler)               # ← Duplicated!
```

### ❌ DON'T: Hardcode Secrets

```yaml
# BAD: Never do this
env:
  POSTGRES_PASSWORD: postgres  # ← GitGuardian caught this!
```

---

## 🛠️ Quick Setup Guide

### Step 1: Create Doppler CI Config

```bash
# Login to Doppler
doppler login

# Create ci config (if not exists)
doppler configs create ci --project tomriddelsdell.com

# Add secrets
doppler secrets set --config ci <<EOF
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
NEON_API_KEY=...
CLOUDFLARE_API_TOKEN=...
EOF
```

### Step 2: Generate Service Token

```bash
# Generate token for GitHub Actions
doppler service-tokens create "GitHub Actions" --config ci

# Copy the token: dp.st.ci.xxxxxxxxxxxxx
```

### Step 3: Add to GitHub

```bash
# Add Doppler token to GitHub Secrets
gh secret set DOPPLER_TOKEN_CI

# When prompted, paste: dp.st.ci.xxxxxxxxxxxxx
```

### Step 4: Update Workflows

```yaml
# Add to all workflows that need secrets
- name: Install Doppler
  uses: dopplerhq/cli-action@v3

- name: Run with secrets
  run: doppler run -- <your-command>
  env:
    DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN_CI }}
```

### Step 5: Test

```bash
# Push changes
git push origin develop

# Monitor workflow
# https://github.com/TomRiddelsdell/tomriddelsdell.com/actions

# Verify secrets are injected
# Check workflow logs (secrets will be masked)
```

---

## 💡 Common Questions

### Q: Why can't Doppler handle the PostgreSQL service password?

**A**: GitHub Actions `services` start before workflow `steps` run. The Doppler CLI is installed in a step, so it's not available when the PostgreSQL service initializes. You need the password available at service startup time.

**Solutions:**
1. Use GitHub Secret (current approach)
2. Use a well-documented fixed password for tests
3. Start PostgreSQL in a step instead of a service (more complex)

### Q: Do I need different Doppler tokens for each workflow?

**A**: No. Use one `DOPPLER_TOKEN_CI` that has read-only access to your CI config. All workflows can share this token.

### Q: What about production deployments?

**A**: Use a separate Doppler token with access to the `prod` config:
- `DOPPLER_TOKEN_PROD` for production deployments
- Scoped to production config only
- More restrictive permissions

### Q: How do I rotate the Doppler token?

**A**:
```bash
# Generate new token
doppler service-tokens create "GitHub Actions (Rotated)" --config ci

# Update GitHub Secret
gh secret set DOPPLER_TOKEN_CI

# Revoke old token
doppler service-tokens revoke <old-token-slug>
```

---

## 📚 References

- [Doppler GitHub Actions Integration](https://docs.doppler.com/docs/github-actions)
- [Doppler CLI Action](https://github.com/marketplace/actions/doppler-secrets)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides)
- [Service Tokens Best Practices](https://docs.doppler.com/docs/service-tokens)

---

## ✅ Summary

**Your instinct was correct!** You should:

1. ✅ Use **Doppler** as your single source of truth
2. ✅ Keep only **2 secrets** in GitHub:
   - `DOPPLER_TOKEN_CI` (bootstrap authentication)
   - `TEST_POSTGRES_PASSWORD` (service initialization)
3. ✅ Let Doppler **inject all other secrets** automatically
4. ✅ Enjoy **centralized management** and rotation

**Next Steps:**
1. Create Doppler `ci` config if not exists
2. Generate `DOPPLER_TOKEN_CI` service token
3. Add token to GitHub Secrets
4. Update workflows to use `doppler run`
5. Remove duplicate secrets from GitHub

**You'll end up with a much cleaner, more maintainable secrets management system!** 🚀
