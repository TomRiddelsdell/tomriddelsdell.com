# ADR-007: Event Versioning and Schema Evolution

## Status
Accepted

## Decision Drivers
- Event sourcing immutability requirements from ADR-006
- Long-term maintainability of event streams 
- Need to evolve domain model while preserving historical events
- Support for event replay and projection rebuilding
- Minimize downtime during schema changes

## Context
The platform uses **Event Sourcing** with NeonDB (Postgres) as the event store and Kafka as the streaming bus per ADR-006 and ADR-011. Events are the source of truth and must be immutable. Over time, domain models evolve, requiring schema changes.

We need a consistent, provider-agnostic strategy for event versioning and schema evolution that preserves replayability and minimizes consumer breakage.

**Key Challenges:**
- Historical events cannot be modified (immutability principle)
- New code must handle old event formats during replay
- Projection rebuilds must work across all event versions
- Schema changes should not break existing consumers
- Evolution strategy must work across different deployment environments

## Decision

### Versioning Strategy: Hybrid Approach

We will use a **hybrid versioning strategy** that combines:
1. **Schema versioning** with semantic versioning (v1.0.0, v1.1.0, v2.0.0)
2. **Weak schema evolution** for backward-compatible changes  
3. **Strong schema evolution** for breaking changes with explicit upcasting

### Event Schema Structure

```typescript
interface VersionedDomainEvent {
  // Required versioning fields
  eventId: string;
  eventType: string;
  schemaVersion: string; // Semantic version (e.g., "1.2.0")
  
  // Event sourcing fields (from ADR-006)
  aggregateId: string;
  aggregateType: string;
  aggregateVersion: number;
  timestamp: Date;
  
  // Metadata for evolution tracking
  metadata: {
    schemaEvolution?: {
      originalVersion: string;
      migrationPath?: string[];
    };
    // Other metadata from ADR-006
  };
  
  // Event data
  data: Record<string, any>;
}
```

### Evolution Rules and Compatibility

#### Backward Compatible Changes (Patch/Minor Versions)
**Allowed operations:**
- Adding optional fields to event data
- Adding new event types
- Adding metadata fields
- Expanding value object properties (optional)

```typescript
// v1.0.0 → v1.1.0 (Minor: Add optional field)
interface UserRegisteredV1_0_0 {
  userId: string;
  email: string;
  registrationSource: string;
}

interface UserRegisteredV1_1_0 {
  userId: string;
  email: string;
  registrationSource: string;
  referralCode?: string; // New optional field
}
```

#### Breaking Changes (Major Versions)
**Operations requiring major version bump:**
- Removing fields from event data
- Changing field types
- Making optional fields required
- Renaming fields or event types
- Changing semantic meaning of existing fields

```typescript
// v1.x.x → v2.0.0 (Major: Field type change)
interface ProjectCreatedV1 {
  projectId: string;
  tags: string; // Comma-separated string
}

interface ProjectCreatedV2 {
  projectId: string;
  tags: string[]; // Array of strings
}
```

### Upcasting Strategy

#### Lazy Upcasting Implementation
```typescript
interface EventUpcaster {
  canUpcast(eventType: string, fromVersion: string, toVersion: string): boolean;
  upcast(event: VersionedDomainEvent): VersionedDomainEvent;
}

class ProjectCreatedUpcaster implements EventUpcaster {
  canUpcast(eventType: string, fromVersion: string, toVersion: string): boolean {
    return eventType === 'ProjectCreated' && 
           fromVersion.startsWith('1.') && 
           toVersion.startsWith('2.');
  }
  
  upcast(event: VersionedDomainEvent): VersionedDomainEvent {
    const v1Data = event.data as ProjectCreatedV1;
    const v2Data: ProjectCreatedV2 = {
      ...v1Data,
      tags: v1Data.tags.split(',').map(tag => tag.trim())
    };
    
    return {
      ...event,
      schemaVersion: '2.0.0',
      data: v2Data,
      metadata: {
        ...event.metadata,
        schemaEvolution: {
          originalVersion: event.schemaVersion,
          migrationPath: ['1.x.x→2.0.0']
        }
      }
    };
  }
}
```

#### Event Store Integration
```typescript
class VersionedEventStore {
  private upcasters: Map<string, EventUpcaster[]> = new Map();
  
  async loadEvents(aggregateId: string, targetVersion?: string): Promise<VersionedDomainEvent[]> {
    const rawEvents = await this.eventStore.loadEvents(aggregateId);
    
    return rawEvents.map(event => {
      if (targetVersion && event.schemaVersion !== targetVersion) {
        return this.upcastEvent(event, targetVersion);
      }
      return event;
    });
  }
  
  private upcastEvent(event: VersionedDomainEvent, targetVersion: string): VersionedDomainEvent {
    const upcasters = this.upcasters.get(event.eventType) || [];
    
    for (const upcaster of upcasters) {
      if (upcaster.canUpcast(event.eventType, event.schemaVersion, targetVersion)) {
        return upcaster.upcast(event);
      }
    }
    
    // No upcaster found - ***please check*** fallback behavior
    throw new Error(`No upcaster found for ${event.eventType} ${event.schemaVersion} → ${targetVersion}`);
  }
}
```

### Schema Registry Integration

```typescript
interface EventSchema {
  eventType: string;
  version: string;
  schema: JSONSchema;
  compatibilityLevel: 'BACKWARD' | 'FORWARD' | 'FULL' | 'NONE';
  deprecated?: boolean;
  supersededBy?: string;
}

class EventSchemaRegistry {
  async validateEvent(event: VersionedDomainEvent): Promise<boolean> {
    const schema = await this.getSchema(event.eventType, event.schemaVersion);
    return this.validator.validate(event.data, schema.schema);
  }
  
  async getLatestVersion(eventType: string): Promise<string> {
    const schemas = await this.getSchemasForType(eventType);
    return schemas
      .filter(s => !s.deprecated)
      .sort((a, b) => semver.compare(b.version, a.version))[0]?.version;
  }
}
```

## Rationale

### Why Hybrid Approach
- **Lazy upcasting** minimizes storage overhead and performance impact
- **Schema versioning** provides clear evolution tracking
- **Backward compatibility** reduces deployment complexity
- **Explicit major versions** ensure safe breaking changes

### Why Semantic Versioning
- Industry standard that developers understand
- Clear rules for compatibility levels
- Supports automated tooling for version management
- Integrates well with package management systems

## Implementation Guidance

### Prerequisites
- ADR-006 (Event Sourcing) must be implemented
- Event store must support metadata fields
- Development team must understand semantic versioning

### Implementation Steps
1. **Add versioning to existing events**: Retrofit current events with version 1.0.0
2. **Implement schema registry**: Create centralized schema storage and validation
3. **Create upcasting framework**: Build the upcaster interface and registry
4. **Add version validation**: Ensure all new events include valid schema versions
5. **Implement monitoring**: Track version distribution and upcasting performance

### Validation Criteria
- All events include valid schema versions
- Upcasting works correctly for test scenarios
- Projection rebuilds succeed across version changes
- Schema registry correctly validates events
- Version migration path is documented and tested

## Consequences

### Positive
- Safe evolution of event schemas over time
- Preserves ability to replay all historical events
- Clear versioning strategy for development teams
- Supports both gradual and breaking changes
- Maintains event sourcing immutability principle

### Negative
- Additional complexity in event handling code
- Performance overhead for upcasting during replay
- Need to maintain multiple event versions
- Additional testing required for version compatibility
- Schema registry adds operational complexity

### Neutral
- Event payloads slightly larger due to versioning metadata
- Development process includes schema design considerations

## Alternatives Considered

### Alternative 1: Copy-and-Transform Strategy
- **Description**: Create new events when schemas change, copy old data
- **Pros**: Simple implementation, no upcasting complexity
- **Cons**: Loses historical accuracy, violates event sourcing principles
- **Why rejected**: Breaks immutability and audit trail requirements

### Alternative 2: Additive-Only Evolution
- **Description**: Never remove or change fields, only add new ones
- **Pros**: No breaking changes, simple compatibility
- **Cons**: Event schemas grow indefinitely, semantic drift over time
- **Why rejected**: Technical debt accumulates, unclear semantics

### Alternative 3: Database Schema Migration Approach
- **Description**: Migrate events in-place like database schema changes
- **Pros**: Clean current state, no version complexity
- **Cons**: Violates event sourcing immutability, loses historical context
- **Why rejected**: Fundamentally incompatible with event sourcing

## Related ADRs

### Dependencies
- **Requires**: ADR-006 (Event Sourcing) - Defines event structure and storage
- **Requires**: ADR-005 (Domain Model) - Defines events that need versioning

### Influences
- **Influences**: ADR-008 (Snapshots) - Snapshots must handle version evolution
- **Influences**: ADR-009 (Replay Strategy) - Replay must work across versions
- **Influences**: ADR-011 (Message Bus) - Integration events need versioning
- **Influences**: ADR-012 (Projection Strategy) - Projections must handle multiple versions

### Conflicts
- **None identified** - Strategy designed to complement other ADRs

## AI Agent Guidance

### Implementation Priority
**High** - Required before any significant domain model changes

### Code Generation Patterns
```typescript
// Always include version in new events
const newEvent: VersionedDomainEvent = {
  eventId: generateId(),
  eventType: 'UserRegistered',
  schemaVersion: '1.0.0', // Current version
  // ... other required fields
};

// Always implement upcasters for breaking changes
class MyEventUpcaster implements EventUpcaster {
  // Implementation pattern shown above
}
```

### Common Pitfalls
- **Forgetting version fields**: All events must include schemaVersion
- **Breaking compatibility**: Minor version changes should be backward compatible
- **Missing upcasters**: Breaking changes require upcaster implementation
- **Version validation**: Always validate event structure against schema

### Integration Points
- Must integrate with event store from ADR-006
- Schema registry should connect to ADR-011 message bus
- Upcasting must work with ADR-012 projection rebuilds

## Technical Debt Introduced
- **Upcaster maintenance**: Old upcasters need ongoing maintenance and testing
- **Schema registry operations**: Additional operational complexity for schema management
- **Version testing**: Must test compatibility across multiple event versions

## Evolution Path
- **Review trigger**: When event volume makes upcasting performance critical
- **Evolution options**: 
  - Migrate to eager upcasting for high-volume events
  - Implement schema registry clustering for high availability
  - Add automated schema compatibility testing
- **Migration strategy**: Event versioning supports its own evolution through meta-versioning

---
*Last Updated: September 10, 2025*Event Versioning and Schema Evolution

## Status
Accepted

## Context
The platform uses **Event Sourcing** with NeonDB (Postgres) as the event store and Kafka as the streaming bus.  
Events are the source of truth and must be immutable. Over time, domain models evolve, requiring schema changes.  
We need a consistent, provider-agnostic strategy for event versioning and schema evolution that preserves replayability and minimizes consumer breakage.

## Decision
- **Event schemas will be defined in Avro**.  
- Each bounded context will have its own **schema registry**, versioned in source control under `/contracts/events/<bounded-context>`.  
- CI/CD will validate that new event schemas are backward-compatible with existing ones.  
- Events will be wrapped in a **common envelope** including metadata.  
- Breaking changes will be introduced as new event types.

### Event Envelope
Every event is wrapped in a standard envelope:

```json
{
  "event_id": "uuid",
  "stream_id": "aggregate-123",
  "type": "UserRegistered",
  "version": 1,
  "occurred_at": "2025-09-08T12:34:56Z",
  "actor": "admin-456",
  "tenant_id": "tenant-abc",
  "metadata": {},
  "payload": { ... }
}
```

- `type` + `version` uniquely identifies an Avro schema in the bounded context registry.
- `payload` must conform to the registered Avro schema.

### Schema Evolution Rules
- **Additive changes (backward-compatible):**
  - Add new optional fields with defaults.
  - Add metadata fields.
  - Consumers that do not recognize a field must ignore it.

- **Breaking changes (incompatible):**
  - Removing required fields.
  - Changing field type or meaning.
  - Renaming event types.

Breaking changes require a **new event type** (e.g., `UserRegisteredV2`).  
Older events remain valid in the store and can still be replayed by consumers that support their version.

### Schema Registry per Bounded Context
- Each bounded context maintains its own registry under `/contracts/events/<context>`.  
- Example:
  ```
  /contracts/events/accounts/UserRegistered.avsc
  /contracts/events/accounts/UserRegisteredV2.avsc
  /contracts/events/entitlements/AppAccessGranted.avsc
  ```
- This enforces domain isolation and makes evolution decisions local to each bounded context.

### Replay & Projections
- Projections must tolerate multiple versions of the same event type.  
- Translation/adapters may be used to upgrade old events to the latest version during replay.  
- Consumers must be idempotent and able to skip unknown fields.

## Rationale
- **Avro** provides compact binary encoding, strong typing, and built-in schema evolution rules.  
- **Per-context registry in source control** avoids vendor lock-in and keeps schema history auditable.  
- This strategy supports **backward compatibility** while allowing breaking changes via new event types.  
- Enforcing a shared envelope ensures consistency across all contexts and simplifies observability.

## Consequences
- Developers must define and evolve event schemas in Avro, committed to `/contracts/events`.  
- CI/CD must validate schema compatibility (using Avro tools).  
- Projection logic must support multiple event versions until migration is complete.  
- Replay may require **upgrade adapters** for older event versions.

## Alternatives Considered
- **JSON Schema only**: easier to read, but less efficient and weaker type guarantees.  
- **Centralized schema registry (e.g., Confluent)**: convenient, but introduces vendor coupling and operational dependency.  
- **Manual migration of stored events**: breaks immutability principle, adds complexity.

## Next Steps
1. Scaffold `/contracts/events/<context>` directories with initial Avro schemas.  
2. Add CI checks for Avro schema backward compatibility.  
3. Document schema evolution rules in `/docs/conventions.md`.  
4. Implement event envelope contract in `/contracts/events/envelope.avsc`.  
5. Update projections to support multi-version event handling.
