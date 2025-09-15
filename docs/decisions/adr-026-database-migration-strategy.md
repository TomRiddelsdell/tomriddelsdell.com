# ADR-026: Database Schema Evolution and Migration Strategy

## Status
Accepted

## Decision Drivers
- Event sourcing requires schema evolution strategy (referenced by ADR-006)
- Snapshot schema changes need migration approach (referenced by ADR-008)
- Zero-downtime deployment requirements for production
- Need to maintain backward compatibility during schema changes

## Context
The system uses event sourcing with snapshots, which creates unique challenges for schema evolution. Traditional database migration approaches don't work well with immutable event stores, and snapshot schemas may need to evolve over time.

## Decision
We will implement a multi-layered schema evolution strategy:

### 1. Event Store Schema Strategy
```typescript
// Events are immutable - no schema changes allowed
interface EventEnvelope {
  eventId: string;
  eventType: string;
  eventVersion: string; // Semantic versioning
  eventData: object; // Immutable once stored
  metadata: {
    aggregateId: string;
    aggregateVersion: number;
    timestamp: string;
    correlationId?: string;
  };
}

// Event upcasting for schema evolution
interface EventUpcaster<TOld, TNew> {
  fromVersion: string;
  toVersion: string;
  upcast(event: TOld): TNew;
}
```

### 2. Snapshot Schema Evolution
```typescript
interface SnapshotEnvelope<T> {
  snapshotId: string;
  aggregateId: string;
  aggregateVersion: number;
  snapshotVersion: string; // Schema version
  snapshotData: T;
  timestamp: string;
}

// Snapshot migration strategy
class SnapshotMigrator {
  async migrate(snapshot: SnapshotEnvelope<any>): Promise<SnapshotEnvelope<any>> {
    const migrationChain = this.getMigrationChain(
      snapshot.snapshotVersion,
      this.currentVersion
    );
    
    return migrationChain.reduce(
      async (acc, migration) => migration.apply(await acc),
      Promise.resolve(snapshot)
    );
  }
}
```

### 3. Projection Schema Evolution
```typescript
// Projections can be rebuilt from events
interface ProjectionMigration {
  version: string;
  description: string;
  migrate(connection: DatabaseConnection): Promise<void>;
  rollback(connection: DatabaseConnection): Promise<void>;
}

// Blue-green deployment for projections
class ProjectionDeployment {
  async deployNewVersion(projectionName: string): Promise<void> {
    // 1. Create new projection tables with version suffix
    // 2. Rebuild projections from event store
    // 3. Validate data consistency
    // 4. Switch traffic to new tables
    // 5. Drop old tables after grace period
  }
}
```

### 4. Migration Execution Strategy

#### For Event Store:
- **Never modify existing events** - Events are immutable historical facts
- **Use event upcasting** - Convert old event formats to new formats during replay
- **Version all event types** - Semantic versioning for event schemas
- **Support multiple versions** - System must handle multiple event versions simultaneously

#### For Snapshots:
- **Lazy migration** - Migrate snapshots when accessed if needed
- **Batch migration** - Offline migration for performance-critical scenarios  
- **Fallback to events** - If snapshot migration fails, rebuild from events
- **Version tracking** - Track snapshot schema versions for migration decisions

#### For Projections:
- **Blue-green deployment** - Build new projections alongside existing ones
- **Event replay** - Rebuild projections from events with new schema
- **Validation phase** - Compare old vs new projections before switch
- **Rollback capability** - Keep old projections for quick rollback

### 5. Migration Tools and Automation

```typescript
// Migration command interface
interface MigrationCommand {
  execute(): Promise<MigrationResult>;
  rollback(): Promise<RollbackResult>;
  validate(): Promise<ValidationResult>;
}

// Migration orchestrator
class MigrationOrchestrator {
  async executeMigration(migration: MigrationPlan): Promise<void> {
    try {
      await this.validateMigration(migration);
      await this.backupCriticalData(migration);
      await this.executeMigrationSteps(migration);
      await this.validateResults(migration);
    } catch (error) {
      await this.rollbackMigration(migration);
      throw error;
    }
  }
}
```

## Rationale
This approach addresses the unique challenges of event sourcing:

1. **Event Immutability**: Events are historical facts and cannot be changed
2. **Schema Evolution**: System must handle multiple schema versions simultaneously
3. **Zero Downtime**: Projections can be rebuilt without stopping the system
4. **Data Safety**: Multiple validation and rollback mechanisms
5. **Performance**: Lazy migration and batch processing options

## Implementation Guidance

### Phase 1: Foundation
1. Implement event versioning and upcasting infrastructure
2. Add snapshot schema version tracking
3. Create migration command interface and basic tools
4. Set up automated backup procedures

### Phase 2: Migration Tooling
1. Build migration orchestrator with validation and rollback
2. Create projection blue-green deployment automation
3. Add batch migration capabilities for snapshots
4. Implement migration status tracking and reporting

### Phase 3: Operational Procedures
1. Document migration procedures and runbooks
2. Set up migration testing in staging environments
3. Create monitoring and alerting for migration health
4. Train team on migration procedures and troubleshooting

### Phase 4: Advanced Features
1. Add automatic migration scheduling and execution
2. Implement migration performance optimization
3. Add data validation and consistency checking
4. Create migration audit trail and compliance reporting

## Consequences

### Positive
- Safe schema evolution without data loss
- Zero-downtime deployments for schema changes
- Backward compatibility maintained during transitions
- Rollback capability for failed migrations
- Event store remains immutable and consistent

### Negative
- Complex migration orchestration logic
- Additional storage overhead during blue-green deployments
- Performance impact during large projection rebuilds
- Increased operational complexity for schema changes
- Need for comprehensive migration testing procedures

## Alternatives Considered

### Alternative 1: Traditional Database Migrations
- **Approach**: Use standard SQL migration tools
- **Rejected**: Doesn't work with immutable event stores

### Alternative 2: Schema-on-Read
- **Approach**: Handle all schema differences in application code
- **Rejected**: Increases complexity and reduces performance

### Alternative 3: Event Store Versioning
- **Approach**: Create new event store versions for schema changes
- **Rejected**: Would fragment historical data and increase complexity

## Related ADRs
- **Depends on**: ADR-006 (Event Sourcing) - Event store structure and patterns
- **Depends on**: ADR-008 (Snapshots) - Snapshot schema evolution
- **Supports**: ADR-015 (Deployment Strategy) - Zero-downtime deployment requirements
- **Supports**: ADR-021 (Testing Strategy) - Migration testing procedures

## AI Agent Guidance

### Implementation Priority
**Medium** - Implement after core event sourcing infrastructure is stable.

### Prerequisites
- Event sourcing infrastructure in place (ADR-006)
- Snapshot mechanism implemented (ADR-008)
- Projection infrastructure established (ADR-012)
- Database backup and recovery procedures

### Implementation Steps
1. Add version tracking to all event types and snapshots
2. Implement event upcasting infrastructure
3. Create projection blue-green deployment automation
4. Build migration orchestrator with validation and rollback
5. Create migration testing procedures and documentation
6. Set up monitoring and alerting for migration health

### Common Pitfalls
- Attempting to modify immutable events in the event store
- Not validating data consistency after migrations
- Skipping rollback capability implementation
- Not testing migration procedures in staging environment
- Forgetting to handle concurrent access during migrations

### Success Criteria
- Schema changes can be deployed without system downtime
- All migrations have tested rollback procedures
- Event store immutability is maintained through all changes
- Projection consistency is validated before traffic switching
- Migration procedures are documented and automated

---
*Created: September 15, 2025*
*Status: Proposed - Pending implementation*
