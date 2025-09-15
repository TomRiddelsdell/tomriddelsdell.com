# Shared Packages

This directory contains shared libraries and utilities used across multiple services and applications in the portfolio platform. Each package follows Domain-Driven Design principles and maintains clear boundaries between domain, application, and infrastructure concerns.

## Package Structure

```
packages/
├── shared-domain/          # Common domain types and value objects
├── shared-infra/           # Infrastructure utilities and adapters
├── event-contracts/        # Generated types from Avro schemas
└── testing-utils/          # Common testing utilities and patterns
```

## Design Principles

### 📦 **Package Independence**
- Each package can be versioned and published independently
- Minimal dependencies between packages to avoid circular references
- Clear APIs with well-defined boundaries

### 🎯 **Domain-Driven Design Alignment**
- **shared-domain**: Contains only pure domain logic with no external dependencies
- **shared-infra**: Infrastructure concerns isolated from domain logic
- **event-contracts**: Generated artifacts maintain schema-first development
- **testing-utils**: Support testing patterns across all architectural layers

### 🔄 **Versioning Strategy**
- **Semantic Versioning**: All packages follow semver (MAJOR.MINOR.PATCH)
- **Breaking Changes**: Major version bumps for incompatible API changes
- **Contract Evolution**: Event contracts version independently from schemas

## Usage Patterns

### Service Dependencies
```typescript
// services/accounts/package.json
{
  "dependencies": {
    "@portfolio/shared-domain": "^1.0.0",
    "@portfolio/event-contracts": "^2.1.0",
    "@portfolio/shared-infra": "^1.2.0"
  },
  "devDependencies": {
    "@portfolio/testing-utils": "^1.0.0"
  }
}
```

### Import Patterns
```typescript
// Clean imports with path mapping
import { UserId, ProjectId } from '@portfolio/shared-domain';
import { EventStore, MessageBus } from '@portfolio/shared-infra';
import { UserRegistered, ProjectCreated } from '@portfolio/event-contracts';
import { createMockEventStore } from '@portfolio/testing-utils';
```

## Development Workflow

### 1. Package Development
```bash
# Navigate to specific package
cd packages/shared-domain

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build package
pnpm build
```

### 2. Publishing Packages
```bash
# Version and publish (automated in CI/CD)
pnpm changeset version
pnpm changeset publish
```

### 3. Consuming in Services
```bash
# Add package dependency
cd services/accounts
pnpm add @portfolio/shared-domain@latest
```

## Quality Standards

### 📋 **All Packages Must Include**
- `package.json` with proper metadata
- `tsconfig.json` for TypeScript configuration  
- `README.md` with usage documentation
- `src/index.ts` as the main entry point
- Comprehensive unit tests (80%+ coverage)

### 🛡️ **Security & Compliance**
- No secrets or environment-specific configuration
- All dependencies regularly updated and audited
- Security scanning integrated in CI/CD pipeline

### 📈 **Performance Considerations**
- Tree-shaking friendly exports
- Minimal runtime dependencies
- Optimized build outputs for different environments

## Monorepo Integration

### Build System
- **Nx/Rush**: Manages package dependencies and build orchestration
- **TypeScript Project References**: Enables incremental compilation
- **Shared Tooling**: ESLint, Prettier, Jest configurations inherited

### CI/CD Integration
- **Incremental Builds**: Only rebuild changed packages
- **Parallel Testing**: Run package tests in parallel
- **Automated Publishing**: Publish packages on version changes

## Architecture Compliance

### Event Sourcing Integration
- **event-contracts**: Provides type-safe event handling
- **shared-infra**: Contains event store and message bus abstractions
- **testing-utils**: Includes event sourcing test patterns

### Domain-Driven Design
- **shared-domain**: Contains ubiquitous language types
- **Bounded Context Respect**: Packages don't contain context-specific logic
- **Anti-Corruption Layers**: Infrastructure packages prevent domain pollution

## Package Ownership

| Package | Primary Maintainer | Review Required |
|---------|-------------------|-----------------|
| shared-domain | Platform Team | Architecture Review |
| shared-infra | DevOps Team | Infrastructure Review |
| event-contracts | Generated | Schema Review |
| testing-utils | QA Team | Testing Standards Review |

## Evolution Strategy

### Adding New Packages
1. Create package directory with standard structure
2. Add to workspace configuration
3. Implement with comprehensive tests
4. Document API and usage patterns
5. Integrate with CI/CD pipeline

### Deprecating Packages
1. Mark as deprecated in package.json
2. Provide migration guide in README
3. Support for 2 major versions
4. Remove after migration period

---

**Last Updated**: September 14, 2025  
**Maintained By**: Platform Team  
**Architecture Compliance**: DDD, Event Sourcing, CQRS
