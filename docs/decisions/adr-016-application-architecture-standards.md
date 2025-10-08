# ADR-016: Application Architecture Standards

## Status
Proposed

## Context
We need to establish coding standards, app structure conventions, technology choices, and development patterns that will be consistent across all applications on the platform.

## Decision

### Technology Stack Standards
- **Frontend**: React 18+ with TypeScript
- **Backend**: TypeScript on Cloudflare Workers
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for complex state, React Context for simple cases
- **Build Tools**: Vite for frontend, Wrangler for Workers
- **Package Management**: pnpm with workspace support

### Application Structure

**Decentralized App-Centric Architecture:**

```text
apps/
├── landing-page/               # Next.js + Cloudflare Pages
│   ├── Makefile               # Deployment automation
│   ├── package.json           # Node.js dependencies
│   ├── wrangler.toml          # Cloudflare configuration
│   └── src/                   # Application source code
├── qis-data-management/        # Python + AWS deployment
│   ├── Makefile               # Deployment automation
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Container configuration
│   └── deploy/
│       ├── aws.mk             # AWS-specific deployment
│       └── terraform/         # Infrastructure as code
└── admin-dashboard/            # React + Cloudflare Workers
    ├── Makefile               # Deployment automation
    ├── package.json           # Node.js dependencies
    └── wrangler.toml          # Cloudflare configuration

services/
├── accounts/                   # User management service
│   ├── Makefile               # Deployment automation
│   ├── package.json           # Node.js dependencies
│   └── wrangler.toml          # Cloudflare Worker config
├── admin/                     # Admin operations service
│   ├── Makefile
│   ├── package.json
│   └── wrangler.toml
└── app-catalog/               # Project portfolio service
    ├── Makefile
    ├── package.json
    └── wrangler.toml

packages/
├── shared-domain/             # Domain models and types
├── ui-components/             # Reusable React components
├── event-contracts/           # Event schemas (Avro)
└── testing-utils/             # Testing utilities

deploy/
├── shared.mk                  # Common deployment functions
├── cloudflare.mk              # Cloudflare deployment logic
├── aws.mk                     # AWS deployment logic
└── doppler.mk                 # Secret management integration
```

### Deployment Architecture

**Universal Makefile Interface:**

- **Consistent Commands**: All apps support `make deploy`, `make test`, `make build`
- **Environment Aware**: `make deploy ENV=development|production`
- **Technology Agnostic**: Each app chooses its tech stack and deployment target
- **Platform Integration**: Makefiles integrate with Cloudflare, AWS, or other platforms

**Root Orchestration:**

```makefile
# Root Makefile provides global commands
make deploy-all ENV=development     # Deploy all applications
make deploy-app APP=apps/landing-page ENV=production  # Deploy specific app
make test-all                       # Test all applications
make health-check-all               # Validate all deployments
```

### Coding Standards
- **ESLint + Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Absolute imports** with path mapping
- **Domain-driven folder structure** within each app

### Inter-App Communication
- **Event-driven**: Primary communication via domain events
- **Synchronous APIs**: Only for real-time user interactions
- **Shared types**: Domain models in shared packages
- **No direct database access**: Each service owns its projections

## Questions for Confirmation

**Monorepo Structure:**
```
/workspaces/
├── apps/                   # Individual applications
├── packages/              # Shared libraries
├── infrastructure/        # Terraform and deployment
├── contracts/            # API and event schemas
└── docs/                 # Documentation
```

**Shared Component Library:**
- Should we implement a full design system from the start?
- What's your preference for component testing? (Storybook, Testing Library?)
- Should we version shared packages independently?

**State Management:**
- Use Zustand for global app state?
- React Query/TanStack Query for server state?
- Local state for component-specific needs?

**Questions for you:**
1. Should we enforce strict TypeScript mode across all apps?
2. What's your preference for form handling? (React Hook Form, Formik?)
3. Should we implement micro-frontend architecture or keep it simple?
4. Do you want automated code quality gates (coverage thresholds, complexity limits)?

## Testing Strategy
- **Unit Tests**: Jest + Testing Library (80%+ coverage goal)
- **Integration Tests**: Playwright for critical user flows
- **Contract Tests**: For event schemas and APIs
- **Visual Regression**: Chromatic for UI components

## Performance Standards
- **Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle Size**: Max 250KB initial JS bundle
- **Worker Response**: 95th percentile < 100ms
- **Lighthouse Score**: 95+ for performance and accessibility

## Alternatives Considered
1. **Next.js**: Great framework but adds complexity for our Worker-first approach
2. **Vue.js**: Good choice but team has more React experience
3. **Module Federation**: Overkill for current team size
4. **Redux**: More boilerplate than Zustand for our use cases

## Consequences
- Consistent development experience across all apps
- Shared component library reduces duplication
- Clear patterns for new app development
- Performance budgets ensure good user experience

## Trade-offs
**Benefits:**
- Consistent codebase quality
- Faster development with shared patterns
- Better maintainability
- Clear performance expectations

**Drawbacks:**
- Learning curve for new patterns
- Potential over-engineering for simple apps
- Lock-in to specific technology choices
```
