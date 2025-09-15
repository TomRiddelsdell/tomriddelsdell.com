# Shared Domain Package

This package contains common domain types, value objects, and domain primitives that are shared across multiple bounded contexts in the portfolio platform. It maintains pure domain logic with no external dependencies.

## Purpose

**Domain Primitives & Value Objects**: Strongly-typed identifiers and value objects that represent core business concepts across the entire platform.

## Contents

### 🆔 **Entity Identifiers**
Strongly-typed IDs that prevent mixing different entity types:
```typescript
// Exported types
export class UserId extends EntityId<'User'> {}
export class ProjectId extends EntityId<'Project'> {}
export class ContactRequestId extends EntityId<'ContactRequest'> {}
```

### 💎 **Value Objects**
Immutable value objects representing domain concepts:
```typescript
// Email address with validation
export class EmailAddress {
  private constructor(private readonly value: string) {}
  static create(email: string): Result<EmailAddress, ValidationError>
}

// Project visibility with business rules
export enum ProjectVisibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC', 
  SHARED = 'SHARED'
}
```

### 📏 **Domain Primitives**
Basic building blocks for domain modeling:
```typescript
// Base classes for entities and value objects
export abstract class Entity<TId> {
  protected constructor(public readonly id: TId) {}
  equals(other: Entity<TId>): boolean
}

export abstract class ValueObject {
  abstract equals(other: ValueObject): boolean
}
```

### 🔄 **Common Domain Events**
Base event structure shared across all bounded contexts:
```typescript
export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly version: number;
  readonly timestamp: Date;
  readonly causationId?: string;
  readonly correlationId?: string;
}
```

## Package Structure

```
src/
├── entities/
│   ├── EntityId.ts           # Base entity identifier
│   └── Entity.ts             # Base entity class
├── value-objects/
│   ├── EmailAddress.ts       # Email value object with validation
│   ├── ProjectVisibility.ts  # Project visibility enum
│   └── UserRole.ts           # User role value object
├── events/
│   ├── DomainEvent.ts        # Base domain event interface
│   └── EventMetadata.ts      # Common event metadata
├── primitives/
│   ├── ValueObject.ts        # Base value object class
│   ├── Result.ts             # Result type for error handling
│   └── ValidationError.ts    # Domain validation errors
├── types/
│   ├── UserId.ts            # User identifier
│   ├── ProjectId.ts         # Project identifier
│   └── ContactRequestId.ts  # Contact request identifier
└── index.ts                 # Public API exports
```

## Design Principles

### 🎯 **Pure Domain Logic**
- **No External Dependencies**: Only depends on TypeScript standard library
- **Framework Agnostic**: Can be used in any TypeScript environment
- **Infrastructure Free**: No database, HTTP, or other infrastructure concerns

### 🛡️ **Type Safety**
- **Strongly Typed IDs**: Prevent mixing different entity identifiers
- **Validation**: Value objects validate their invariants
- **Immutability**: All value objects are immutable

### ⚖️ **Business Rule Enforcement**
- **Domain Validation**: Value objects enforce business rules
- **Fail Fast**: Invalid objects cannot be created
- **Clear Error Messages**: Validation errors provide clear feedback

## Usage Examples

### Creating Strongly-Typed Identifiers
```typescript
import { UserId, ProjectId } from '@portfolio/shared-domain';

// Type-safe identifier creation
const userId = UserId.generate(); // Creates new UUID-based ID
const projectId = ProjectId.from('existing-uuid'); // From existing string

// Prevents mixing different ID types
function assignProject(userId: UserId, projectId: ProjectId) {
  // TypeScript prevents passing wrong ID types
}

assignProject(userId, projectId); // ✅ Correct
assignProject(projectId, userId); // ❌ TypeScript error
```

### Value Object Creation and Validation
```typescript
import { EmailAddress } from '@portfolio/shared-domain';

// Safe email creation with validation
const emailResult = EmailAddress.create('user@example.com');

if (emailResult.isSuccess) {
  const email = emailResult.value;
  console.log(email.toString()); // "user@example.com"
} else {
  console.error(emailResult.error.message); // Validation error
}
```

### Domain Event Structure
```typescript
import { DomainEvent } from '@portfolio/shared-domain';

interface UserRegistered extends DomainEvent {
  eventType: 'UserRegistered';
  aggregateType: 'User';
  data: {
    email: string;
    role: UserRole;
  };
}
```

## Integration with Services

### Service Dependencies
Services import domain types for business logic:
```typescript
// services/accounts/domain/User.ts
import { UserId, EmailAddress, UserRole } from '@portfolio/shared-domain';

export class User extends Entity<UserId> {
  private constructor(
    id: UserId,
    private email: EmailAddress,
    private role: UserRole
  ) {
    super(id);
  }

  static create(email: string, role: string): Result<User, ValidationError> {
    const emailResult = EmailAddress.create(email);
    const roleResult = UserRole.create(role);
    
    if (emailResult.isFailure) return emailResult;
    if (roleResult.isFailure) return roleResult;
    
    return Result.ok(new User(
      UserId.generate(),
      emailResult.value,
      roleResult.value
    ));
  }
}
```

### Event Contracts Integration
Generated event types extend domain event structure:
```typescript
// packages/event-contracts/src/accounts/UserRegistered.ts
import { DomainEvent } from '@portfolio/shared-domain';

export interface UserRegistered extends DomainEvent {
  eventType: 'UserRegistered';
  aggregateType: 'User';
  // Additional event-specific properties
}
```

## Testing Support

### Test Utilities
```typescript
// Testing support included in package
export class TestDataBuilder {
  static createUserId(): UserId {
    return UserId.generate();
  }
  
  static createValidEmail(): EmailAddress {
    return EmailAddress.create('test@example.com').value!;
  }
}
```

## Quality Standards

### ✅ **Required Standards**
- **100% Test Coverage**: All domain logic fully tested
- **No Side Effects**: All functions are pure
- **Immutable Data**: Value objects cannot be modified after creation
- **Validation**: All inputs validated with clear error messages

### 🔒 **Security Considerations**
- **Input Validation**: All value objects validate inputs
- **No Secrets**: No sensitive data or configuration
- **Safe Serialization**: All types can be safely serialized to JSON

## API Guidelines

### Public API
- **Stable Interface**: Breaking changes require major version bump
- **Clear Naming**: Names reflect ubiquitous language from domain model
- **Consistent Patterns**: All similar operations follow same patterns

### Export Strategy
```typescript
// index.ts - Clean public API
export * from './entities/EntityId';
export * from './value-objects/EmailAddress';
export * from './types/UserId';
export * from './types/ProjectId';
export * from './events/DomainEvent';
// Internal implementation details not exported
```

## Evolution Guidelines

### Adding New Types
1. **Domain Justification**: Must represent true business concept
2. **Cross-Context Usage**: Should be used by multiple bounded contexts
3. **Pure Domain Logic**: No infrastructure dependencies
4. **Comprehensive Tests**: Full test coverage required

### Deprecation Process
1. **Mark as Deprecated**: Add `@deprecated` JSDoc comments
2. **Provide Alternatives**: Document replacement patterns
3. **Grace Period**: Support for 2 major versions
4. **Migration Guide**: Clear migration documentation

## Architecture Compliance

### DDD Alignment
- **Ubiquitous Language**: All types use business terminology
- **Domain Purity**: No infrastructure or application concerns
- **Bounded Context Neutral**: Suitable for multiple contexts

### Event Sourcing Support
- **Event Structure**: Base event interface for all domain events
- **Immutability**: Event data structures are immutable
- **Serialization**: Safe JSON serialization support

---

**Package Version**: 1.0.0  
**Maintained By**: Platform Team  
**Dependencies**: None (TypeScript standard library only)  
**Last Updated**: September 14, 2025
