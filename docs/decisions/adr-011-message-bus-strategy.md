# ADR-011: Message Bus Strategy (High-Level)

**Status**: Accepted  
**Date**: 2025-09-10  
**Authors**: AI Agent  
**Reviewers**: ***please check*** - needs review assignment  

## Context

Our event-driven architecture requires a comprehensive message bus strategy for inter-bounded-context communication. This high-level ADR defines the overall strategy and architectural principles, while specific implementation details are covered in related ADRs.

### Key Requirements

- Inter-bounded-context communication for event-sourced architecture
- Vendor independence to avoid lock-in
- Multi-language support for polyglot microservices
- Integration with event store (ADR-006) via outbox pattern
- Support for projection workers (ADR-012) and integration events
- Compliance with DDD principles and bounded context isolation

## Decision

We will implement a **layered message bus strategy** with clear separation between high-level strategy and implementation details:

### 1. High-Level Architecture Strategy

#### Separation of Concerns

- **Event Store**: Authoritative source within bounded contexts (ADR-006)
- **Message Bus**: Communication channel between bounded contexts
- **Outbox Pattern**: Reliable publishing from event store to message bus
- **Contract Management**: Centralized schema management (ADR-023)

#### Integration Boundaries

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Bounded Context │    │ Bounded Context │    │ Bounded Context │
│      (A)        │    │      (B)        │    │      (C)        │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Event Store  │ │    │ │Event Store  │ │    │ │Event Store  │ │
│ │(Domain      │ │    │ │(Domain      │ │    │ │(Domain      │ │
│ │ Events)     │ │    │ │ Events)     │ │    │ │ Events)     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│        │        │    │        │        │    │        │        │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Outbox       │ │    │ │Outbox       │ │    │ │Outbox       │ │
│ │Publisher    │ │    │ │Publisher    │ │    │ │Publisher    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └─────────────┬────────┴──────────────────────┘
                        │
          ┌─────────────▼─────────────┐
          │     Message Bus           │
          │  (Integration Events)     │
          │                          │
          │  - Kafka (primary)       │
          │  - Redis (alternative)   │
          │  - EventBridge (cloud)   │
          └─────────────┬──────────────┘
                        │
          ┌─────────────▼─────────────┐
          │   Projection Workers      │
          │                          │
          │  - User Profile Views    │
          │  - Project Catalogs      │
          │  - Analytics Models      │
          └──────────────────────────┘
```

### 2. Core Principles

#### Vendor Independence

- **Abstract Interface**: All message bus implementations conform to common interface
- **Adapter Pattern**: Infrastructure adapters for different brokers (Kafka, Redis, EventBridge)
- **Configuration-Driven**: Runtime selection of message bus implementation
- **Migration Support**: Tooling to migrate between different message bus providers

#### Event Classification

- **Domain Events**: Internal to bounded context, stored in event store
- **Integration Events**: Cross-context communication, published via message bus
- **Transformation**: Domain events → Integration events via outbox pattern
- **Schema Management**: Centralized contract management for integration events

#### Multi-Language Support

- **Contract-First**: JSON Schema definitions for all integration events
- **Code Generation**: Generate types/classes for multiple languages
- **Consistent API**: Similar message bus interface across language bindings
- **Runtime Validation**: Schema validation in all language implementations

### 3. Implementation Layers

This high-level strategy is implemented through multiple focused ADRs:

#### Infrastructure Layer (ADR-022: Message Bus Architecture)

- Concrete message bus implementations (Kafka, Redis, EventBridge)
- Outbox pattern implementation
- Performance optimization and monitoring
- Infrastructure-specific configurations

#### Contract Layer (ADR-023: Contract Management)

- JSON Schema-based contract definitions
- Multi-language code generation
- Contract evolution and versioning
- Runtime validation and compatibility checking

#### Integration Layer (Future ADRs)

- Event routing and filtering strategies
- Dead letter queue handling  
- Batch processing and performance optimization
- Cross-service transaction patterns

### 4. Strategic Decisions

#### Message Bus Selection Strategy

- **Primary**: Kafka for high-throughput production workloads
- **Development**: Redis for local development and testing
- **Cloud**: EventBridge for cloud-native deployments
- **Selection Criteria**: Throughput, reliability, operational complexity, cost

#### Event Publishing Strategy

- **Reliability**: Outbox pattern ensures no lost events
- **Performance**: Batch publishing for high-volume scenarios
- **Ordering**: Partition keys for maintaining event order within aggregates
- **Deduplication**: Idempotent consumers handle duplicate events

#### Consumer Strategy

- **Consumer Groups**: Parallel processing with load balancing
- **Error Handling**: Retry policies with exponential backoff
- **Dead Letter Queues**: Capture permanently failed messages
- **Monitoring**: Track consumer lag and processing rates

## Consequences Overview

### Positive

- **Architectural Clarity**: Clear separation between strategy and implementation
- **Flexibility**: Can switch message bus providers without application changes
- **Scalability**: Support for high-throughput event processing
- **Reliability**: Outbox pattern ensures reliable event delivery
- **Multi-Language**: Consistent patterns across different technology stacks

### Negative

- **Complexity**: Multiple layers add architectural complexity
- **Operational Overhead**: Need to manage outbox processing and message bus infrastructure
- **Latency**: Small delay introduced by outbox pattern
- **Storage Requirements**: Events stored in both event store and message topics

### Risks

- **Implementation Complexity**: Risk of over-engineering the abstraction layers
- **Performance Impact**: Abstraction layers may introduce performance overhead
- **Operational Burden**: Multiple message bus implementations to maintain

## Related ADRs

### Implementation ADRs

- **ADR-022**: Message Bus Architecture - Infrastructure implementation details
- **ADR-023**: Contract Management - Schema management and multi-language support

### Integration ADRs  

- **ADR-006**: Event Sourcing Implementation - Source of domain events
- **ADR-012**: Projection Strategy - Consumer of integration events
- **ADR-007**: Event Versioning - Event evolution patterns

### Supporting ADRs

- **ADR-005**: Domain Model - Defines aggregates that produce events
- **ADR-020**: API Design Standards - Alignment with CQRS patterns
- **ADR-021**: Testing Strategy - Contract testing and integration testing

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- Implement basic message bus interface and Kafka adapter (ADR-022)
- Set up outbox pattern for reliable publishing (ADR-022)
- Create initial integration event contracts (ADR-023)

### Phase 2: Multi-Language Support (Weeks 3-4)

- Implement contract management system (ADR-023)
- Generate TypeScript and Java bindings
- Add runtime validation for contracts

### Phase 3: Alternative Providers (Weeks 5-6)

- Implement Redis adapter for development environments
- Add EventBridge adapter for cloud deployments
- Create migration tooling between providers

### Phase 4: Advanced Features (Weeks 7-8)

- Performance optimization and monitoring
- Advanced routing and filtering capabilities
- Production hardening and operational tooling

## Success Criteria

### Technical Metrics

- [ ] Message processing latency < 100ms (p95)
- [ ] Event delivery reliability > 99.9%
- [ ] Consumer lag < 1 second under normal load
- [ ] Contract validation success rate > 99.5%

### Operational Metrics

- [ ] Zero-downtime message bus provider migration capability
- [ ] Mean time to detection < 5 minutes for message bus issues
- [ ] Automated recovery for 90% of transient failures
- [ ] Complete audit trail for all published events

### Development Metrics

- [ ] Contract generation working for 3+ languages
- [ ] Integration event handlers can be added without message bus changes
- [ ] Development environment setup time < 10 minutes
- [ ] Contract breaking changes detected automatically in CI/CD

## AI Agent Guidance

### For Message Bus Integration

- Always use the abstract MessageBus interface, never directly use Kafka/Redis clients
- Implement outbox pattern for any service that publishes events
- Validate integration events against contracts before publishing
- Use consumer groups for scaling event processing

### For Adding New Integration Events

1. Define contract in ADR-023 contract management system
2. Generate types for all supported languages
3. Add outbox publisher configuration for new event types
4. Implement consumer handlers in receiving services
5. Add monitoring for new event flows

### Common Patterns

```typescript
// Publishing integration events
await this.outboxPublisher.publishIntegrationEvent(domainEvent);

// Consuming integration events  
await this.messageBus.subscribe('EventType', this.handleEvent.bind(this));

// Contract validation
const validation = await this.contractValidator.validate(eventType, payload);
```

---

**Status**: Accepted  
**Next Review**: 2025-10-10  
**Implementation Tracking**: See implementation-status.md

## Relationship to Other ADRs

### Integration with ADR-006 (Event Sourcing)

- **Event Structure**: IntegrationEvent extends DomainEvent from ADR-006
- **Encryption**: Reuses encryption strategy for sensitive fields
- **Upcasting**: Compatible with eager upcasting approach
- **Outbox Pattern**: Ensures reliable publishing from event store

### Integration with ADR-007 (Projection Strategy)

- **Worker Communication**: Message bus feeds projection workers
- **Checkpoint Management**: Aligned checkpoint tracking
- **Error Handling**: Compatible retry and DLQ strategies

### Integration with ADR-005 (Domain Model)

- **Aggregate Alignment**: Topic naming reflects aggregate boundaries
- **Event Types**: Published events correspond to domain events from aggregates

## Implementation Details

### Event Store to Message Bus Flow

```typescript
// src/infrastructure/messaging/EventStoreMessageBusIntegration.ts
class EventStoreMessageBusIntegration {
  constructor(
    private eventStore: EventStore,
    private messageBus: MessageBus,
    private outboxProcessor: OutboxProcessor
  ) {}

  async setup(): Promise<void> {
    // Set up periodic outbox processing
    setInterval(async () => {
      await this.outboxProcessor.publishPendingEvents();
    }, 5000); // Every 5 seconds

    // Set up event store change notification
    this.eventStore.onEventsAppended(async (events) => {
      // Immediate attempt to publish for low latency
      await this.outboxProcessor.publishEvents(events);
    });
  }
}
```

### Testing Strategy

```typescript
// tests/integration/MessageBusTest.ts
describe('MessageBus Contract Tests', () => {
  // Test that all adapter implementations conform to interface
  const adapters = [
    new KafkaMessageBusAdapter(kafkaConfig),
    new RedisMessageBusAdapter(redisConfig),
    new InMemoryMessageBusAdapter() // For testing
  ];
  
  adapters.forEach(adapter => {
    describe(`${adapter.constructor.name}`, () => {
      it('should publish and consume events correctly', async () => {
        // Contract test implementation
      });
    });
  });
});
```

## Alternatives Considered

**Direct Kafka Integration (Rejected):**

- Would create tight coupling to Kafka
- Difficult to migrate to other brokers
- Language-specific Kafka clients reduce flexibility

**Cloud-Specific Solutions (Considered):**

- AWS EventBridge: Good for AWS ecosystem but vendor lock-in
- Google Cloud Pub/Sub: Excellent features but GCP dependency
- Azure Service Bus: Microsoft ecosystem integration

**Message Queue Alternatives:**

- RabbitMQ: Good features but different operational model
- Redis Streams: Simple but limited enterprise features
- NATS: High performance but smaller ecosystem

## Consequences

**Benefits:**

- **Aligned Architecture**: Consistent with event sourcing and projection strategies
- **Reliable Publishing**: Outbox pattern ensures no lost events
- **Encryption Support**: Compatible with ADR-006 encryption requirements
- **Projection Integration**: Seamless feeding of projection workers
- **Vendor Independence**: Easy migration between message brokers
- **Multi-Language Support**: Consistent API across technology stacks

**Drawbacks:**

- **Additional Complexity**: Outbox pattern adds operational complexity
- **Latency**: Small delay between event store and message bus publishing
- **Dual Storage**: Events stored in both event store and message topics

## Trade-offs

**Consistency vs. Performance:**

- Outbox pattern ensures consistency but adds slight latency
- Accepting eventual consistency for reliable cross-context communication

**Simplicity vs. Reliability:**

- Additional complexity for guaranteed delivery semantics
- Investment in reliability patterns pays off in production

## Migration Strategy

### Phase 1: Kafka Foundation (MVP)

- Implement Kafka adapter with core functionality
- Establish event contracts and schema registry
- Set up basic topic structure and consumer groups

### Phase 2: Multi-Language Support

- Generate contracts for additional languages
- Implement C# and Go adapters
- Create language-specific message bus libraries

### Phase 3: Alternative Brokers

- Implement Redis and EventBridge adapters
- Create migration tooling and validation
- Performance testing across different brokers

### Phase 4: Advanced Features

- Implement event sourcing replay capabilities
- Add advanced routing and filtering
- Optimize for high-throughput scenarios

## Security Considerations

**Event Security:**

- **Encryption**: TLS for transport, optional field-level encryption
- **Authentication**: SASL authentication for Kafka, IAM for cloud services
- **Authorization**: Topic-level permissions and consumer group restrictions
- **Audit**: All event publishing and consumption logged

**Multi-Tenant Isolation:**

- **Topic Isolation**: Separate topics per tenant where required
- **Consumer Groups**: Tenant-specific consumer group naming
- **Schema Validation**: Prevent cross-tenant data leakage

## Next Steps

1. **Implement the abstract MessageBus interface** to decouple application logic from specific message bus technologies
2. **Develop the OutboxPublisher** to ensure reliable, atomic event publishing from the event store to the message bus
3. **Provision and configure Kafka infrastructure** with a schema registry for contract enforcement and event validation
4. **Integrate encryption-compatible serialization** as specified in ADR-006 to secure sensitive event data
5. **Connect projection workers** (per ADR-007) to consume integration events for read model and analytics updates
6. **Define and register integration event contracts** using the contract management system (ADR-023)
7. **Establish monitoring and alerting** for outbox processing, message bus health, and event delivery metrics
8. **Document event publishing and consumption patterns** to guide future development and onboarding

---

**This approach ensures the message bus strategy is fully aligned with our event sourcing implementation while maintaining vendor independence and DDD principles.**
3. **Create event contracts** for core domain events
4. **Generate multi-language bindings** for TypeScript and C#
5. **Implement event handlers** for each bounded context
6. **Set up monitoring and alerting** for message bus health
7. **Document event schemas** and handler patterns

---

**This approach ensures vendor independence while leveraging Kafka's capabilities, supporting multi-language implementations, and maintaining strict DDD principles.**
