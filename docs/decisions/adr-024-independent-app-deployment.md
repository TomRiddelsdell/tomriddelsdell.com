# ADR-024: Independent App Deployment Architecture

## Status
Accepted and Implemented

## Context

The platform was initially structured as a pnpm monorepo with:
- Shared `pnpm-workspace.yaml` at root
- Shared `.npmrc` with `node-linker=hoisted` creating single `node_modules` at root
- Single `pnpm-lock.yaml` for all apps and services
- Shared packages referenced via `file:../../packages/*` protocol
- Build-time coupling where apps had `prebuild` scripts to build shared packages

This structure violated DDD principles for independent bounded contexts:
1. **Dependency Version Lock-in**: All apps forced to use same dependency versions
2. **Build Coupling**: Apps couldn't build without building shared dependencies first
3. **Deployment Dependencies**: Apps couldn't be deployed independently
4. **Version Conflicts**: Couldn't have `landing-page` on Next.js 14 while another app uses Next.js 16

Example of coupling:
```json
// apps/landing-page/package.json (OLD)
{
  "scripts": {
    "prebuild": "cd ../../packages/observability-edge && npm install && npm run build"
  },
  "dependencies": {
    "@platform/observability-edge": "file:../../packages/observability-edge"
  }
}
```

## Decision

**Restructure to truly independent applications following polyrepo principles within a monorepo structure.**

### Key Changes

#### 1. Remove Shared Workspace Configuration
- ❌ Delete root `pnpm-workspace.yaml`
- ❌ Delete root `.npmrc`
- ❌ Delete root `pnpm-lock.yaml`
- ✅ Each app manages its own pnpm configuration

#### 2. Per-App Dependency Management
- ✅ Each app has its own `.npmrc` (if needed for special requirements like OpenNext)
- ✅ Each app has its own `pnpm-lock.yaml` committed to git
- ✅ Each app has its own `node_modules` directory (gitignored)
- ✅ Apps install dependencies independently: `cd apps/landing-page && pnpm install`

#### 3. Eliminate Build-Time Coupling
- ❌ Remove `prebuild` scripts that reach into other directories
- ❌ Remove `file:../../packages/*` dependency references
- ✅ **Option A**: Inline small shared code directly into apps (chosen for landing-page)
- ✅ **Option B**: Publish shared packages to npm registry and use versioned dependencies

#### 4. Landing Page Implementation (Proof of Concept)

**Changes Made**:
```bash
# Structure
apps/landing-page/
├── .npmrc                           # NEW: App-specific pnpm config
├── pnpm-lock.yaml                   # NEW: App-specific lockfile
├── node_modules/                    # NEW: App-specific dependencies
├── package.json                     # MODIFIED: No file: references
└── src/
    └── lib/
        └── observability-edge/      # NEW: Inlined from packages/
            ├── index.ts
            └── types.ts
```

**package.json Changes**:
```json
{
  "scripts": {
    "dev": "next dev",
    // "prebuild": "..." REMOVED
    "build": "NODE_ENV=production next build",
    "build:cloudflare": "opennextjs-cloudflare build"
  },
  "dependencies": {
    // "@platform/observability-edge": "file:../../packages/observability-edge" REMOVED
    "next": "latest",  // Now resolves independently!
    "react": "latest",
    "react-dom": "latest",
    "zustand": "latest"
  }
}
```

**Import Changes**:
```typescript
// OLD:
import { createEdgeObservability } from '@platform/observability-edge'

// NEW:
import { createEdgeObservability } from './observability-edge/index'
```

### Benefits

**DDD Compliance**:
- ✅ Each app is a truly independent bounded context
- ✅ Apps can evolve dependency versions independently
- ✅ No build-time coupling between contexts
- ✅ Clear ownership and boundaries

**Deployment Independence**:
- ✅ `landing-page` can deploy on Next.js 14.2.18 while other apps use Next.js 16.0.1
- ✅ Each app builds and deploys without requiring other apps
- ✅ Dependency updates in one app don't force updates in others
- ✅ CI/CD pipelines are fully independent per app

**Development Velocity**:
- ✅ Developers can work on one app without impacting others
- ✅ Faster builds (only install dependencies for app being developed)
- ✅ Clearer dependency trees per app
- ✅ Easier to reason about what each app requires

### Drawbacks

**Code Duplication**:
- ⚠️ Small shared code (like observability-edge) duplicated across apps
- **Mitigation**: Acceptable trade-off for 700 lines of code vs. coupling
- **Alternative**: Publish truly shared packages to npm registry

**Initial Migration Effort**:
- ⚠️ Each app needs migration from workspace to independent structure
- **Mitigation**: Incremental migration, starting with landing-page as proof-of-concept

**Shared Package Management**:
- ⚠️ If packages/ are still needed, they must be published to npm
- **Mitigation**: Use GitHub Packages or private npm registry for genuinely shared libraries

## Alternatives Considered

### Alternative 1: Keep Monorepo with Published Packages
```json
{
  "dependencies": {
    "@platform/observability-edge": "^1.0.0"  // Published to npm
  }
}
```
**Rejected because**: Adds npm publishing complexity for small code libraries

### Alternative 2: True Polyrepo (Separate Git Repos)
**Rejected because**: Loses benefits of unified tooling, CI/CD orchestration, and shared deploy/ scripts

### Alternative 3: Nx/Turborepo Monorepo Tools
**Rejected because**: Adds complexity and still couples dependency versions

## Implementation Plan

### Phase 1: Landing Page (✅ COMPLETED)
- [x] Remove root workspace configuration
- [x] Create `apps/landing-page/.npmrc`
- [x] Install landing-page dependencies independently
- [x] Inline observability-edge source code
- [x] Update imports to use local paths
- [x] Verify build succeeds
- [x] Commit changes

### Phase 2: Other Apps (Future Work)
For each app in `apps/`:
1. Create app-specific `.npmrc` (if needed)
2. Evaluate shared dependencies - inline or publish
3. Run `pnpm install` to create app-specific lockfile
4. Test build and deployment
5. Update CI/CD workflows if needed

### Phase 3: Services (Future Work)
Same process for `services/` directory

## Success Criteria

- [x] landing-page builds successfully with own dependencies
- [x] landing-page has own pnpm-lock.yaml
- [x] No file: references in package.json
- [x] No prebuild scripts crossing directory boundaries
- [ ] Other apps migrated to independent structure
- [ ] CI/CD pipelines verified working for each app

## Consequences

**Positive**:
- True microservices independence
- Faster development iteration per app
- Clear separation of concerns
- Easier to scale team (different teams own different apps)
- Deployment flexibility and safety

**Negative**:
- Some code duplication (acceptable for < 1000 lines)
- Need to manage shared code differently (publish to npm if truly shared)
- Migration effort for existing apps

**Neutral**:
- Shifts from "monorepo with shared deps" to "polyrepo-style monorepo"
- Maintains benefits of unified repo (shared CI/CD, infrastructure, documentation)

## Related ADRs

- **ADR-015**: Deployment Strategy - Updated to reflect per-app independence
- **ADR-013**: Frontend Framework - Landing page now independently versioned
- **ADR-016**: Application Architecture Standards - Reinforces DDD boundaries

## Notes

**November 10, 2025**: Initial implementation completed for landing-page.
- Successfully removed workspace coupling
- Verified OpenNext Cloudflare build works with independent dependencies
- Next.js version: 16.0.1 (latest) vs. previous 14.2.18 (demonstrates version independence)

---

**Decision Date**: November 10, 2025  
**Implemented**: November 10, 2025  
**Authors**: Platform Team  
**Reviewers**: Architecture Team
