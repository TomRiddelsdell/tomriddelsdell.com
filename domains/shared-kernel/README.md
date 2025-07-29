# Shared Kernel

## Overview
The Shared Kernel contains common domain concepts, value objects, patterns, and infrastructure that are shared across all bounded contexts in the tomriddelsdell.com platform. It establishes the foundation for domain-driven design patterns and ensures consistency across domain boundaries while preventing code duplication.

## Purpose and Principles

### Shared Kernel Purpose
- **Common Language**: Establishing ubiquitous language elements used across domains
- **Consistency**: Ensuring consistent implementation of domain patterns
- **Reusability**: Providing reusable components without creating dependencies
- **Type Safety**: Strongly-typed value objects and identifiers
- **Event Infrastructure**: Domain event publishing and handling mechanisms

### Design Principles
- **Minimize Dependencies**: Only include truly cross-cutting concerns
- **Stability**: Changes must be coordinated across all consuming domains
- **Backward Compatibility**: Maintain API stability for dependent domains
- **Clear Contracts**: Well-defined interfaces and abstractions

## Core Components

## Value Objects

### UserId
Strongly-typed user identifier used across all domains:
```typescript
export class UserId {
    private constructor(private readonly value: number) {
        if (value <= 0) {
            throw new DomainException('UserId must be positive');
        }
    }
    
    static fromNumber(value: number): UserId {
        return new UserId(value);
    }
    
    static generate(): UserId {
        return new UserId(Math.floor(Math.random() * 1000000) + 1);
    }
    
    equals(other: UserId): boolean {
        return this.value === other.value;
    }
    
    toNumber(): number {
        return this.value;
    }
}
```

### Email
Validated email address value object:
```typescript
export class Email {
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    constructor(private readonly value: string) {
        if (!Email.EMAIL_REGEX.test(value)) {
            throw new DomainException('Invalid email format');
        }
    }
    
    toString(): string {
        return this.value;
    }
    
    equals(other: Email): boolean {
        return this.value.toLowerCase() === other.value.toLowerCase();
    }
    
    getDomain(): string {
        return this.value.split('@')[1];
    }
}
```

### CognitoId
External identity provider identifier:
```typescript
export class CognitoId {
    constructor(private readonly value: string) {
        if (!value || value.trim().length === 0) {
            throw new DomainException('CognitoId cannot be empty');
        }
    }
    
    toString(): string {
        return this.value;
    }
    
    equals(other: CognitoId): boolean {
        return this.value === other.value;
    }
}
```

## Domain Events

### Base DomainEvent Class
Foundation for all domain events across the platform:
```typescript
export abstract class DomainEvent {
    readonly occurredAt: Date;
    readonly eventId: string;

    constructor(
        readonly aggregateId: string,
        readonly eventType: string
    ) {
        this.occurredAt = new Date();
        this.eventId = `${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    abstract getPayload(): Record<string, any>;
}
```

### Cross-Domain Events
Events that span multiple domains:

### Cross-Domain Events
Events that span multiple domains:

#### UserRegisteredEvent

#### UserAuthenticatedEvent
```typescript
export class UserAuthenticatedEvent extends DomainEvent {
    constructor(
        userId: string,
        readonly email: string,
        readonly ipAddress?: string
    ) {
        super(userId, 'UserAuthenticated');
    }
    
    getPayload() {
        return {
            email: this.email,
            ipAddress: this.ipAddress
        };
    }
}
```

#### WorkflowCreatedEvent
```typescript
export class WorkflowCreatedEvent extends DomainEvent {
    constructor(
        workflowId: string,
        readonly userId: string,
        readonly workflowName: string
    ) {
        super(workflowId, 'WorkflowCreated');
    }
    
    getPayload() {
        return {
            userId: this.userId,
            workflowName: this.workflowName
        };
    }
}
```

## Domain Services

### DomainEventPublisher
Centralized event publishing mechanism:
```typescript
export class DomainEventPublisher {
    private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();
    private static instance: DomainEventPublisher;
    
    static getInstance(): DomainEventPublisher {
        if (!DomainEventPublisher.instance) {
            DomainEventPublisher.instance = new DomainEventPublisher();
        }
        return DomainEventPublisher.instance;
    }
    
    register(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType)!.push(handler);
    }
    
    async publish(event: DomainEvent): Promise<void> {
        const handlers = this.handlers.get(event.eventType) || [];
        
        await Promise.all(
            handlers.map(handler => handler(event).catch(error => {
                console.error(`Error handling event ${event.eventType}:`, error);
            }))
        );
    }
    
    async publishMany(events: DomainEvent[]): Promise<void> {
        await Promise.all(events.map(event => this.publish(event)));
    }
    
    clear(): void {
        this.handlers.clear();
    }
}
```

## Exception Handling

### DomainException
Base exception class for domain rule violations:
```typescript
export class DomainException extends Error {
    readonly code: string;
    readonly details?: Record<string, any>;
    
    constructor(message: string, code?: string, details?: Record<string, any>) {
        super(message);
        this.name = 'DomainException';
        this.code = code || 'DOMAIN_RULE_VIOLATION';
        this.details = details;
    }
    
    static businessRuleViolation(message: string, details?: Record<string, any>): DomainException {
        return new DomainException(message, 'BUSINESS_RULE_VIOLATION', details);
    }
    
    static validationError(message: string, field?: string): DomainException {
        return new DomainException(message, 'VALIDATION_ERROR', { field });
    }
    
    static notFound(entityType: string, id: string): DomainException {
        return new DomainException(
            `${entityType} with id ${id} not found`,
            'NOT_FOUND',
            { entityType, id }
        );
    }
}
```

## Validation Patterns

### Common Validation Schema
Shared validation rules using Zod:
```typescript
export const paginationSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
});

export const idParamSchema = z.object({
    id: z.string().uuid().or(z.string().regex(/^\d+$/))
});

export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);
export const usernameSchema = z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/);
```

## Specification Pattern

### Base Specification
Generic specification pattern for business rules:
```typescript
export abstract class Specification<T> {
    abstract isSatisfiedBy(entity: T): boolean;
    
    and(other: Specification<T>): AndSpecification<T> {
        return new AndSpecification(this, other);
    }
    
    or(other: Specification<T>): OrSpecification<T> {
        return new OrSpecification(this, other);
    }
    
    not(): NotSpecification<T> {
        return new NotSpecification(this);
    }
}

export class AndSpecification<T> extends Specification<T> {
    constructor(
        private readonly left: Specification<T>,
        private readonly right: Specification<T>
    ) {
        super();
    }
    
    isSatisfiedBy(entity: T): boolean {
        return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity);
    }
}
```

## Repository Patterns

### Base Repository Interface
Common repository contract:
```typescript
export interface IRepository<T, TId> {
    save(entity: T): Promise<void>;
    findById(id: TId): Promise<T | null>;
    delete(id: TId): Promise<void>;
    exists(id: TId): Promise<boolean>;
}

export interface IPagedRepository<T, TId> extends IRepository<T, TId> {
    findPaged(page: number, limit: number): Promise<PagedResult<T>>;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
```

## Common Types and Enums

### User Roles
```typescript
export enum UserRole {
    USER = 'user',
    EDITOR = 'editor',
    ADMIN = 'admin'
}
```

### Authentication Providers
```typescript
export enum AuthProvider {
    COGNITO = 'cognito',
    LOCAL = 'local',
    GOOGLE = 'google',
    GITHUB = 'github'
}
```

## Implementation Guidelines

### When to Add to Shared Kernel
Only add concepts that are:
- **Truly Universal**: Used by multiple domains without modification
- **Stable**: Unlikely to change frequently
- **Core to Business**: Fundamental business concepts
- **No Side Effects**: Pure value objects or simple services

### When NOT to Add to Shared Kernel
Avoid adding:
- Domain-specific business logic
- Frequently changing concepts
- Implementation details
- Framework-specific code

### Modification Process
Changes to the Shared Kernel require:
1. **Impact Analysis**: Review all consuming domains
2. **Backward Compatibility**: Ensure existing code continues to work
3. **Migration Strategy**: Plan for breaking changes if necessary
4. **Team Coordination**: Communicate changes across domain teams

## Testing Strategy

### Comprehensive Test Coverage
```typescript
describe('Shared Kernel Components', () => {
    describe('Value Objects', () => {
        it('should enforce business rules', () => {
            expect(() => new UserId(-1)).toThrow('UserId must be positive');
            expect(() => new Email('invalid')).toThrow('Invalid email format');
        });
    });
    
    describe('Domain Events', () => {
        it('should publish events correctly', async () => {
            const publisher = DomainEventPublisher.getInstance();
            const event = new UserRegisteredEvent('123', 'test@example.com', 'cognito-123');
            
            await publisher.publish(event);
            // Verify event was handled
        });
    });
});
```

## Dependencies

The Shared Kernel has minimal external dependencies:
- **Zod**: For validation schemas
- **Node.js Built-ins**: For basic functionality
- **No Framework Dependencies**: Maintains independence from specific frameworks

## Usage Across Domains

### Identity Domain
```typescript
import { UserId, Email, CognitoId, DomainException } from '../shared-kernel';

export class User {
    constructor(
        private readonly id: UserId,
        private readonly email: Email,
        private readonly cognitoId: CognitoId
    ) {}
}
```

This Shared Kernel provides the foundational elements needed for a consistent, well-structured domain-driven design implementation across the entire tomriddelsdell.com platform.