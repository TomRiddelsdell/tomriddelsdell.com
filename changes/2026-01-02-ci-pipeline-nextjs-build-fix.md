# CI Pipeline Next.js Build Fix - 2026-01-02

## Timestamp: 2026-01-02T08:38:00Z

## Problem Summary

The CI/CD pipeline was failing at the "Build for staging" step with esbuild module resolution errors when using @opennextjs/cloudflare. The build worked locally but failed in CI.

**Error Pattern:**
```
ERROR: Could not resolve "./node-environment"
ERROR: Could not resolve "./node-polyfill-crypto"
ERROR: Could not resolve "../shared/lib/utils"
(55-56 similar errors in Next.js internals)
```

## Root Cause

The GitHub Actions workflow was creating a root `.npmrc` file:
```yaml
- name: Create root .npmrc for OpenNext
  run: |
    echo "# CRITICAL: OpenNext Cloudflare requires REAL flat node_modules (no symlinks)" > ../../.npmrc
    echo "node-linker=hoisted" >> ../../.npmrc
```

This root `.npmrc` caused pnpm to treat the repository as a workspace (even without `pnpm-workspace.yaml`), which broke @opennextjs/cloudflare's esbuild bundler.

**Key Insight:** Local builds worked because there was no root `.npmrc` - only the app-level `.npmrc` at `apps/landing-page/.npmrc` with the required hoisting configuration.

## Solution

Removed the "Create root .npmrc for OpenNext" step from all workflow jobs:
- quality-gates
- deploy-staging  
- deploy-production

The app's own `.npmrc` already contains the required `node-linker=hoisted` configuration. Creating a root `.npmrc` was unnecessary and triggered workspace mode.

## Changes Made

### 1. Workflow Configuration (.github/workflows/deploy-landing-page.yml)
- Removed root .npmrc creation from all jobs
- Removed workspace coordination comments from cache configuration
- Each job now relies on the app's `.npmrc` only

### 2. Dependency Update (apps/landing-page/package.json)
- Updated @lhci/cli to latest version
- Resolved GHSA-6rw7-vpxm-498p (high severity DoS vulnerability in qs package)
- pnpm audit now passes with only 2 low severity issues (below moderate threshold)

## Validation

✅ All workflow jobs passing:
- Security Scan / Dependency Security Scan: 23s
- Security Scan / Secrets Detection: 7s
- Security Scan / CodeQL Analysis: 1m8s
- Security Scan / Infrastructure Security Scan: 44s
- Quality Gates: 36s
- Deploy to Staging: 1m55s ← **Previously failing, now working**
- Lighthouse CI Performance Testing: 1m32s
- Post-Deployment Verification: 27s

✅ Staging deployment successful: https://landing-page-preview.t-riddelsdell.workers.dev
✅ Health checks passing
✅ Lighthouse CI completing

## Historical Context

This aligns with the working configuration from commit ed1022f which used Next.js 15 without workspace configuration. The workspace structure was added later for CI cache coordination but introduced this critical build failure.

Per ADR-029, apps should be deployed independently without workspace-level coordination. This fix restores that architecture.

## Lessons Learned

1. **Don't override app configuration at root level** - If an app needs specific npm/pnpm configuration, set it at the app level only
2. **pnpm workspace mode is implicit** - A root .npmrc with node-linker settings can trigger workspace mode even without pnpm-workspace.yaml
3. **Test local vs CI differences** - When builds work locally but fail in CI, check for environmental differences like file creation in workflows
4. **Respect ADR boundaries** - ADR-029 specifies independent app deployment; the root .npmrc violated this principle

## Related Issues

- Next.js 16 compatibility (attempted upgrade failed, reverted to 15.5.9)
- Webpack vs Turbopack (Next.js 15 doesn't support --webpack flag)
- @opennextjs/cloudflare officially supports Next.js 14-15, not 16

## Next Steps

✅ Step 0.4 from IMPLEMENTATION_PLAN.md is now complete
- All security scans passing
- Quality gates passing
- Staging deployment successful
- Lighthouse CI completing
- Post-deployment verification passing

Ready to proceed with future implementation steps.
