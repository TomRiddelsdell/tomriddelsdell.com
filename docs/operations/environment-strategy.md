# Environment Strategy

## Overview

This document clarifies the environment strategy for the TomRiddelsdell.com platform. The platform uses a **three-environment approach** with clear separation between local development and deployed environments.

## Environment Definitions

### Local (Dev) Environment

**Purpose**: Individual developer testing and rapid iteration

**Characteristics**:
- **NOT deployed** - runs only on developer's local machine
- Accessed via `http://localhost:3000` (or configured port)
- Uses local Cloudflare Workers development server (`wrangler dev`)
- Personal Neon dev branch per developer (e.g., `dev-john`, `dev-sarah`)
- Doppler config: `dev_personal`
- Full development tools and debugging enabled

**How to Run**:
```bash
# Start local development server
cd apps/landing-page
npm run dev

# Or with Doppler secrets
doppler run --config dev_personal -- npm run dev
```

**When to Use**:
- Feature development on feature branches
- Local testing and debugging
- Rapid iteration without deployment overhead
- Experimenting with changes before committing

### Staging Environment

**Purpose**: Shared pre-production environment for integration testing and feature validation

**Characteristics**:
- **Deployed automatically** when pushing to `develop` branch
- Accessed via `https://staging.tomriddelsdell.com`
- **Protected from public access** - requires authentication (see [Staging Environment Protection](./staging-environment-protection.md))
- Shared Neon staging branch
- Doppler config: `stg`
- Integration testing with production-like infrastructure
- Feature validation before production release

**Deployment**:
```bash
# Automatic deployment via GitHub Actions
git push origin develop

# Manual deployment (if needed)
make deploy ENV=staging
```

**When to Use**:
- Integration testing across multiple services
- Feature validation in production-like environment
- Stakeholder previews and demonstrations
- Pre-production smoke testing

### Production Environment

**Purpose**: Live production environment serving real users

**Characteristics**:
- **Deployed automatically** when pushing to `main` branch
- Accessed via `https://tomriddelsdell.com`
- Production Neon branch with backups and monitoring
- Doppler config: `prd`
- Full monitoring, alerting, and performance optimization
- Protected with deployment gates and quality checks

**Deployment**:
```bash
# Automatic deployment via GitHub Actions
git push origin main

# Manual deployment (emergency only)
make deploy ENV=production
```

**When to Use**:
- Stable, tested features ready for end users
- Production releases after successful staging validation
- Critical hotfixes (with proper testing)

## CI/CD Environment

**Purpose**: Automated testing in GitHub Actions

**Characteristics**:
- **NOT deployed** - testing only
- Ephemeral test databases on Neon ci-test branch
- Doppler config: `ci_tests`
- Runs on every pull request and push
- Quality gates must pass before deployment

**When Triggered**:
- Every pull request creation/update
- Every push to `develop` or `main` branches
- Manual workflow dispatch

## Environment Comparison

| Aspect | Local (Dev) | Staging | Production |
|--------|-------------|---------|------------|
| **Deployed** | ❌ No | ✅ Yes | ✅ Yes |
| **Git Branch** | Feature branches | `develop` | `main` |
| **URL** | `localhost:3000` | `staging.tomriddelsdell.com` | `tomriddelsdell.com` |
| **Database** | Neon dev branch (personal) | Neon staging branch | Neon production branch |
| **Doppler Config** | `dev_personal` | `stg` | `prd` |
| **Auto-Deploy** | N/A | ✅ On push to develop | ✅ On push to main |
| **Purpose** | Development & testing | Pre-production validation | Live production |
| **Monitoring** | Minimal | Enhanced | Full monitoring & alerting |
| **Debug Tools** | ✅ Enabled | ⚠️ Limited | ❌ Disabled |

## Development Workflow

```
┌─────────────────┐
│  Local (Dev)    │  Developer works on feature branch
│  localhost:3000 │  Tests locally with npm run dev
│  NOT DEPLOYED   │
└────────┬────────┘
         │ git push origin feature/xyz
         │ Open Pull Request
         ▼
┌─────────────────┐
│   CI/CD Tests   │  GitHub Actions runs tests
│   NOT DEPLOYED  │  Quality gates must pass
└────────┬────────┘
         │ Merge to develop
         │ Auto-deploy triggers
         ▼
┌─────────────────┐
│    Staging      │  Deployed from develop branch
│ staging.tomr... │  Integration testing & validation
│   ✅ DEPLOYED   │
└────────┬────────┘
         │ Merge to main (after validation)
         │ Auto-deploy triggers
         ▼
┌─────────────────┐
│   Production    │  Deployed from main branch
│ tomriddelsdell  │  Live production environment
│   ✅ DEPLOYED   │
└─────────────────┘
```

## Configuration Management

### Environment Variables

Each environment uses different configuration values:

```typescript
// apps/landing-page/src/lib/config.ts
export type Environment = 'local' | 'staging' | 'production'

function getApiBaseUrl(): string {
  switch (process.env.NEXT_PUBLIC_ENV) {
    case 'local':
      return 'http://localhost:8787' // Local Cloudflare Worker
    case 'staging':
      return 'https://staging-api.tomriddelsdell.com'
    case 'production':
      return 'https://api.tomriddelsdell.com'
  }
}
```

### Build Commands

Different build commands for each environment:

```json
{
  "scripts": {
    "dev": "next dev",                                          // Local development
    "build:local": "NEXT_PUBLIC_ENV=local next build",         // Local build (testing)
    "build:staging": "NEXT_PUBLIC_ENV=staging next build",     // Staging build
    "build:production": "NEXT_PUBLIC_ENV=production next build" // Production build
  }
}
```

### Doppler Secrets

Each environment has its own Doppler configuration:

```yaml
# Doppler project: tomriddelsdell-infra
configs:
  dev_personal:  # Local development (personal secrets)
    DATABASE_URL: postgres://...dev-john...
    API_KEY: test_key_local
    
  stg:           # Staging environment
    DATABASE_URL: postgres://...staging...
    API_KEY: staging_key_xxx
    
  prd:           # Production environment
    DATABASE_URL: postgres://...production...
    API_KEY: prod_key_xxx
```

## Common Misconceptions

### ❌ Misconception: "Dev environment is deployed to dev.tomriddelsdell.com"

**✅ Reality**: There is NO deployed "dev" environment. The term "dev" refers to LOCAL development only. The first deployed environment is **staging** (from the `develop` branch).

### ❌ Misconception: "I need to deploy to test my changes"

**✅ Reality**: Most testing happens locally with `npm run dev`. Only push to `develop` when you need integration testing in a shared environment.

### ❌ Misconception: "Staging and development are the same thing"

**✅ Reality**: 
- **Local development (dev)**: Your local machine, not deployed
- **Staging**: Deployed pre-production environment from `develop` branch

## Quick Reference

### Run Locally (Not Deployed)
```bash
npm run dev                    # Start local dev server
doppler run -- npm run dev     # With secrets
```

### Deploy to Staging
```bash
git push origin develop        # Auto-deploys to staging.tomriddelsdell.com
make deploy ENV=staging        # Manual deployment (if needed)
```

### Deploy to Production
```bash
git push origin main           # Auto-deploys to tomriddelsdell.com
make deploy ENV=production     # Manual deployment (emergency only)
```

## Related Documentation

- [ADR-017: Environment Management Strategy](../decisions/adr-017-environment-management.md)
- [ADR-015: Deployment Strategy](../decisions/adr-015-deployment-strategy.md)
- [Staging Environment Protection](./staging-environment-protection.md) - **Important**: How to secure staging from public access
- [Doppler Setup Guide](./doppler-setup.md)
- [CI/CD Database Architecture](./ci-cd-database-architecture.md)

---

**Last Updated**: October 6, 2025  
**Status**: Active - This is the authoritative environment strategy document
