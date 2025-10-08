# Testing Utils Package

This package provides common testing utilities, patterns, and infrastructure for testing across all services in the portfolio platform. It supports unit testing, integration testing, and contract testing with a focus on event-sourced and microservices architectures.

## Purpose

**Consistent Testing Patterns**: Provides reusable testing utilities that ensure consistent testing approaches across all services while supporting DDD, Event Sourcing, and CQRS patterns.

## Contents

### 🧪 **Test Doubles & Mocks**

In-memory implementations and test doubles for infrastructure dependencies:

```typescript
// Event Store test double
export class InMemoryEventStore implements EventStore {
  getStoredEvents(streamId: string): DomainEvent[];
  clear(): void;
  getEventsByType<T>(eventType: string): T[];
}

// Message Bus test double
export class TestMessageBus implements MessageBus {
  getPublishedEvents(): IntegrationEvent[];
  clearPublishedEvents(): void;
  simulateEventDelivery(event: IntegrationEvent): void;
}
```

### 🏗️ **Test Data Builders**

Fluent builders for creating test data with sensible defaults:

```typescript
// Domain entity builders
export class UserTestBuilder {
  withId(id: string): this;
  withEmail(email: string): this;
  withRole(role: UserRole): this;
  build(): User;
}

// Event builders
export class UserRegisteredEventBuilder {
  withUserId(userId: string): this;
  withEmail(email: string): this;
  occurringAt(timestamp: Date): this;
  build(): UserRegistered;
}
```

### 📋 **Test Scenarios**

Common test scenarios and patterns for event-sourced systems:

```typescript
// Aggregate testing patterns
export class AggregateTestHarness<T extends AggregateRoot> {
  given(events: DomainEvent[]): this;
  when(command: any): this;
  then(): AggregateAssertions<T>;
}

// Event sourcing test patterns
export class EventStoreTestHarness {
  givenEvents(streamId: string, events: DomainEvent[]): this;
  whenLoading(streamId: string): this;
  thenEventsShouldBe(expectedEvents: DomainEvent[]): void;
}
```

### 🎭 **Test Fixtures**

Predefined test data and scenarios for common use cases:

```typescript
// Common test data
export const TestFixtures = {
  users: {
    validUser: () => UserTestBuilder.default().build(),
    adminUser: () => UserTestBuilder.withRole(UserRole.ADMIN).build(),
  },
  projects: {
    publicProject: () =>
      ProjectTestBuilder.withVisibility(ProjectVisibility.PUBLIC).build(),
    privateProject: () =>
      ProjectTestBuilder.withVisibility(ProjectVisibility.PRIVATE).build(),
  },
};
```

## Package Structure

```
src/
├── builders/                  # Test data builders
│   ├── domain/
│   │   ├── UserTestBuilder.ts     # User entity builder
│   │   ├── ProjectTestBuilder.ts  # Project entity builder
│   │   └── ContactTestBuilder.ts  # Contact entity builder
│   ├── events/
│   │   ├── UserEventBuilders.ts   # User-related event builders
│   │   ├── ProjectEventBuilders.ts # Project-related event builders
│   │   └── ContactEventBuilders.ts # Contact-related event builders
│   └── commands/
│       ├── UserCommandBuilders.ts # User command builders
│       └── ProjectCommandBuilders.ts # Project command builders
├── doubles/                   # Test doubles and mocks
│   ├── InMemoryEventStore.ts      # Event store test double
│   ├── TestMessageBus.ts          # Message bus test double
│   ├── MockProjectionStore.ts     # Projection store mock
│   └── FakeHealthCheck.ts         # Health check fake
├── harnesses/                 # Test harnesses and patterns
│   ├── AggregateTestHarness.ts    # Aggregate testing framework
│   ├── EventStoreTestHarness.ts   # Event store testing patterns
│   ├── ProjectionTestHarness.ts   # Projection testing framework
│   └── IntegrationTestHarness.ts  # Integration test patterns
├── fixtures/                  # Predefined test data
│   ├── UserFixtures.ts            # Common user test data
│   ├── ProjectFixtures.ts         # Common project test data
│   ├── EventFixtures.ts           # Common event test data
│   └── ScenarioFixtures.ts        # End-to-end test scenarios
├── matchers/                  # Custom Jest matchers
│   ├── EventMatchers.ts           # Event-specific matchers
│   ├── AggregateMatchers.ts       # Aggregate assertion matchers
│   └── ContractMatchers.ts        # Contract validation matchers
├── utilities/                 # Testing utilities
│   ├── TestDatabase.ts            # Test database management
│   ├── TestServer.ts              # Test server utilities
│   ├── AsyncTestHelpers.ts        # Async testing helpers
│   └── MockTimeProvider.ts        # Time mocking utilities
├── assertions/                # Custom assertions
│   ├── EventAssertions.ts         # Event-specific assertions
│   ├── DomainAssertions.ts        # Domain model assertions
│   └── IntegrationAssertions.ts   # Integration test assertions
└── index.ts                   # Public API exports
```

## Test Double Implementations

### 🗄️ **In-Memory Event Store**

Full-featured event store for testing without database dependencies:

```typescript
export class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();
  private globalEvents: DomainEvent[] = [];

  async append(streamId: string, events: DomainEvent[]): Promise<void> {
    const existingEvents = this.events.get(streamId) || [];
    const newEvents = [...existingEvents, ...events];
    this.events.set(streamId, newEvents);
    this.globalEvents.push(...events);
  }

  async load(streamId: string): Promise<DomainEvent[]> {
    return this.events.get(streamId) || [];
  }

  async loadFromVersion(
    streamId: string,
    version: number
  ): Promise<DomainEvent[]> {
    const events = this.events.get(streamId) || [];
    return events.filter(e => e.version >= version);
  }

  // Test-specific methods
  getStoredEvents(streamId: string): DomainEvent[] {
    return this.events.get(streamId) || [];
  }

  getAllEvents(): DomainEvent[] {
    return [...this.globalEvents];
  }

  getEventsByType<T extends DomainEvent>(eventType: string): T[] {
    return this.globalEvents.filter(e => e.eventType === eventType) as T[];
  }

  clear(): void {
    this.events.clear();
    this.globalEvents.length = 0;
  }
}
```

### 📨 **Test Message Bus**

Synchronous message bus for testing integration patterns:

```typescript
export class TestMessageBus implements MessageBus {
  private publishedEvents: IntegrationEvent[] = [];
  private subscriptions: Map<string, EventHandler[]> = new Map();

  async publish<T extends IntegrationEvent>(event: T): Promise<void> {
    this.publishedEvents.push(event);

    // Synchronously deliver to subscribers (for testing)
    const handlers = this.subscriptions.get(event.eventType) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }

  async subscribe<T extends IntegrationEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): Promise<void> {
    const handlers = this.subscriptions.get(eventType) || [];
    handlers.push(handler);
    this.subscriptions.set(eventType, handlers);
  }

  // Test-specific methods
  getPublishedEvents(): IntegrationEvent[] {
    return [...this.publishedEvents];
  }

  getPublishedEventsOfType<T extends IntegrationEvent>(eventType: string): T[] {
    return this.publishedEvents.filter(e => e.eventType === eventType) as T[];
  }

  clearPublishedEvents(): void {
    this.publishedEvents.length = 0;
  }

  simulateEventDelivery(event: IntegrationEvent): void {
    this.publishedEvents.push(event);
  }
}
```

## Test Data Builders

### 👤 **User Test Builder**

Fluent builder for creating user test data:

```typescript
export class UserTestBuilder {
  private userId: UserId = UserId.generate();
  private email: EmailAddress = EmailAddress.create('test@example.com').value!;
  private role: UserRole = UserRole.USER;
  private profile: UserProfile = {
    displayName: 'Test User',
    preferences: { theme: 'light', notifications: true },
  };

  static default(): UserTestBuilder {
    return new UserTestBuilder();
  }

  withId(id: string | UserId): this {
    this.userId = typeof id === 'string' ? UserId.from(id) : id;
    return this;
  }

  withEmail(email: string): this {
    this.email = EmailAddress.create(email).value!;
    return this;
  }

  withRole(role: UserRole): this {
    this.role = role;
    return this;
  }

  withProfile(profile: Partial<UserProfile>): this {
    this.profile = { ...this.profile, ...profile };
    return this;
  }

  build(): User {
    return User.create(this.userId, this.email, this.role, this.profile).value!;
  }
}
```

### 📝 **Event Builders**

Builders for creating domain events:

```typescript
export class UserRegisteredEventBuilder {
  private eventId: string = crypto.randomUUID();
  private userId: string = UserId.generate().value;
  private email: string = 'test@example.com';
  private occurredAt: Date = new Date();
  private version: number = 1;

  static default(): UserRegisteredEventBuilder {
    return new UserRegisteredEventBuilder();
  }

  withUserId(userId: string | UserId): this {
    this.userId = typeof userId === 'string' ? userId : userId.value;
    return this;
  }

  withEmail(email: string): this {
    this.email = email;
    return this;
  }

  occurringAt(timestamp: Date): this {
    this.occurredAt = timestamp;
    return this;
  }

  withVersion(version: number): this {
    this.version = version;
    return this;
  }

  build(): UserRegistered {
    return {
      eventId: this.eventId,
      eventType: 'UserRegistered',
      aggregateId: this.userId,
      aggregateType: 'User',
      version: this.version,
      timestamp: this.occurredAt,
      data: {
        userId: this.userId,
        email: this.email,
      },
    };
  }
}
```

## Test Harnesses

### 🎯 **Aggregate Test Harness**

BDD-style testing for aggregates using Given-When-Then:

```typescript
export class AggregateTestHarness<T extends AggregateRoot> {
  private givenEvents: DomainEvent[] = [];
  private aggregate: T | null = null;
  private thrownError: Error | null = null;

  constructor(private createAggregate: () => T) {}

  given(events: DomainEvent[]): this {
    this.givenEvents = events;
    return this;
  }

  when(action: (aggregate: T) => void): this {
    try {
      this.aggregate = this.createAggregate();

      // Apply given events to get aggregate to initial state
      for (const event of this.givenEvents) {
        this.aggregate.applyEvent(event);
      }

      this.aggregate.markEventsAsCommitted();

      // Execute the action
      action(this.aggregate);
    } catch (error) {
      this.thrownError = error as Error;
    }
    return this;
  }

  then(): AggregateAssertions<T> {
    return new AggregateAssertions(
      this.aggregate,
      this.thrownError,
      this.givenEvents
    );
  }
}

export class AggregateAssertions<T extends AggregateRoot> {
  constructor(
    private aggregate: T | null,
    private thrownError: Error | null,
    private givenEvents: DomainEvent[]
  ) {}

  shouldEmitEvent<TEvent extends DomainEvent>(
    eventType: string,
    eventMatcher?: (event: TEvent) => boolean
  ): this {
    if (!this.aggregate) {
      throw new Error('No aggregate available for assertion');
    }

    const newEvents = this.aggregate.getUncommittedEvents();
    const matchingEvents = newEvents.filter(e => e.eventType === eventType);

    expect(matchingEvents.length).toBeGreaterThan(0);

    if (eventMatcher) {
      const matchingEvent = matchingEvents.find(eventMatcher);
      expect(matchingEvent).toBeDefined();
    }

    return this;
  }

  shouldNotEmitAnyEvents(): this {
    if (!this.aggregate) {
      throw new Error('No aggregate available for assertion');
    }

    const newEvents = this.aggregate.getUncommittedEvents();
    expect(newEvents).toHaveLength(0);
    return this;
  }

  shouldThrow(expectedError?: string | RegExp): this {
    expect(this.thrownError).toBeTruthy();

    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(this.thrownError!.message).toContain(expectedError);
      } else {
        expect(this.thrownError!.message).toMatch(expectedError);
      }
    }

    return this;
  }
}
```

## Custom Jest Matchers

### 🔍 **Event Matchers**

Custom Jest matchers for event-specific assertions:

```typescript
declare global {
  namespace jest {
    interface Matchers<R> {
      toContainEvent(eventType: string): R;
      toContainEventWithData(eventType: string, expectedData: any): R;
      toHaveEventCount(expectedCount: number): R;
      toBeValidEvent(): R;
    }
  }
}

export const eventMatchers = {
  toContainEvent(received: DomainEvent[], eventType: string) {
    const matchingEvents = received.filter(e => e.eventType === eventType);
    const pass = matchingEvents.length > 0;

    return {
      message: () =>
        pass
          ? `Expected events not to contain ${eventType}`
          : `Expected events to contain ${eventType}`,
      pass,
    };
  },

  toContainEventWithData(
    received: DomainEvent[],
    eventType: string,
    expectedData: any
  ) {
    const matchingEvents = received.filter(
      e =>
        e.eventType === eventType &&
        JSON.stringify(e.data) === JSON.stringify(expectedData)
    );
    const pass = matchingEvents.length > 0;

    return {
      message: () =>
        pass
          ? `Expected events not to contain ${eventType} with specific data`
          : `Expected events to contain ${eventType} with data ${JSON.stringify(expectedData)}`,
      pass,
    };
  },
};

// Register matchers
expect.extend(eventMatchers);
```

## Usage Examples

### Unit Testing Aggregates

```typescript
import {
  AggregateTestHarness,
  UserTestBuilder,
  UserRegisteredEventBuilder,
} from '@portfolio/testing-utils';

describe('User Aggregate', () => {
  it('should emit UserRegistered event when creating new user', () => {
    const harness = new AggregateTestHarness(() => new User());

    harness
      .given([])
      .when(user => user.register('test@example.com', 'Test User'))
      .then()
      .shouldEmitEvent(
        'UserRegistered',
        event => event.data.email === 'test@example.com'
      );
  });

  it('should not allow duplicate registration', () => {
    const existingUser = UserRegisteredEventBuilder.default().build();

    const harness = new AggregateTestHarness(() => new User());

    harness
      .given([existingUser])
      .when(user => user.register('test@example.com', 'Test User'))
      .then()
      .shouldThrow('User already registered');
  });
});
```

### Integration Testing with Test Doubles

```typescript
import {
  InMemoryEventStore,
  TestMessageBus,
  UserTestBuilder,
} from '@portfolio/testing-utils';

describe('User Registration Service Integration', () => {
  let eventStore: InMemoryEventStore;
  let messageBus: TestMessageBus;
  let userService: UserService;

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    messageBus = new TestMessageBus();
    userService = new UserService(eventStore, messageBus);
  });

  it('should register user and publish integration event', async () => {
    const command = new RegisterUserCommand('test@example.com', 'Test User');

    await userService.handle(command);

    // Check event store
    const events = eventStore.getAllEvents();
    expect(events).toContainEvent('UserRegistered');

    // Check message bus
    const publishedEvents = messageBus.getPublishedEvents();
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0].eventType).toBe('UserRegistered');
  });
});
```

### Contract Testing

```typescript
import { TestFixtures, contractMatchers } from '@portfolio/testing-utils';

describe('Event Contracts', () => {
  it('should validate UserRegistered event structure', () => {
    const event = TestFixtures.events.userRegistered();

    expect(event).toMatchContract('UserRegistered', '1.0.0');
    expect(event).toBeValidAvroEvent();
  });
});
```

## Quality Standards

### ✅ **Testing Standards**

- **100% Test Coverage**: All testing utilities have comprehensive tests
- **Type Safety**: All builders and doubles are fully typed
- **Fast Execution**: In-memory implementations for speed
- **Isolated Tests**: Test doubles prevent external dependencies

### 🔄 **Consistency Standards**

- **Uniform API**: All builders follow same fluent interface pattern
- **Sensible Defaults**: All builders provide reasonable default values
- **Clear Naming**: Test utilities have descriptive, intention-revealing names

## Architecture Integration

### Event Sourcing Support

- **Aggregate Testing**: Harnesses for testing event-sourced aggregates
- **Event Store Doubles**: In-memory event store for isolation
- **Event Assertions**: Custom matchers for event-specific testing

### CQRS Testing

- **Command Testing**: Builders for commands and command handlers
- **Query Testing**: Utilities for testing read models and projections
- **Integration Testing**: End-to-end testing across command and query sides

### Domain-Driven Design

- **Domain Testing**: Builders for domain entities and value objects
- **Bounded Context Testing**: Isolation between different domain contexts
- **Ubiquitous Language**: Test naming follows domain terminology

---

**Package Version**: 1.0.0  
**Maintained By**: QA Team  
**Dependencies**: `@portfolio/shared-domain`, `@portfolio/event-contracts`  
**Last Updated**: September 14, 2025
