# Workflow Domain

## Overview
The Workflow Domain represents the core business logic of the FlowCreate platform. It handles the complete lifecycle of automated workflows, from creation and configuration to execution and monitoring. This domain implements sophisticated business rules around workflow automation while maintaining clean separation of concerns.

## Domain Responsibilities

### Primary Responsibilities
- **Workflow Definition**: Creation and configuration of automated workflows
- **Business Rule Enforcement**: Validation of workflow constraints and limits
- **Execution Orchestration**: Workflow state management and execution flow
- **Action Management**: Individual workflow step definitions and validation
- **Trigger Configuration**: Event-based workflow initiation
- **Lifecycle Management**: Workflow activation, deactivation, and deletion

### Business Invariants
- Workflows must have at least one action to be executable
- Maximum of 10 actions per workflow (performance constraint)
- Action order must be unique within a workflow
- Users can only modify their own workflows
- Active workflows cannot be deleted without deactivation

## Domain Model

### Aggregate Roots
- **WorkflowAggregate**: Complete workflow entity with full business logic, domain events, and consistency boundaries

### Entities
- **Workflow**: Core workflow entity containing configuration, actions, and business methods

### Value Objects
- **WorkflowId**: Strongly-typed workflow identifier ensuring type safety
- **WorkflowAction**: Individual workflow steps with type-safe configuration
- **TriggerType**: Workflow initiation conditions (MANUAL, SCHEDULED, WEBHOOK, EMAIL)
- **WorkflowStatus**: Execution state (DRAFT, ACTIVE, PAUSED, ERROR)

### Domain Events
- **WorkflowCreatedEvent**: Published when new workflows are created
- **WorkflowExecutedEvent**: Published on workflow execution
- **WorkflowStatusChangedEvent**: Published on status transitions
- **WorkflowDeletedEvent**: Published when workflows are removed

### Repository Interfaces
- **IWorkflowRepository**: Domain-defined contract for workflow persistence

### Domain Services
- **WorkflowValidationService**: Complex validation logic for workflow configurations
- **WorkflowExecutionService**: Orchestration of workflow execution

## Business Rules

### Workflow Creation Rules
```typescript
// Action limit validation
if (actions.length > MAX_ACTIONS_PER_WORKFLOW) {
    throw new DomainException('Workflow exceeds maximum action limit of 10');
}

// Unique action order validation
const orders = actions.map(action => action.order);
if (new Set(orders).size !== orders.length) {
    throw new DomainException('Action orders must be unique');
}
```

### Workflow Execution Rules
```typescript
// Status transition validation
if (currentStatus === WorkflowStatus.ACTIVE && newStatus === WorkflowStatus.DRAFT) {
    throw new DomainException('Cannot transition active workflow to draft');
}

// Execution prerequisites
if (status !== WorkflowStatus.ACTIVE) {
    throw new DomainException('Only active workflows can be executed');
}
```

### Action Configuration Rules
- **Email Actions**: Must have valid recipient and template
- **Webhook Actions**: Must have valid URL and authentication
- **Delay Actions**: Must have positive duration values
- **Condition Actions**: Must have valid comparison operators

## Workflow Action Types

### Email Action
```typescript
{
    type: 'email',
    config: {
        to: 'recipient@example.com',
        subject: 'Workflow Notification',
        template: 'notification-template'
    }
}
```

### Webhook Action
```typescript
{
    type: 'webhook',
    config: {
        url: 'https://api.example.com/webhook',
        method: 'POST',
        headers: { 'Authorization': 'Bearer token' },
        body: '{{ workflow.data }}'
    }
}
```

### Delay Action
```typescript
{
    type: 'delay',
    config: {
        duration: 300,  // seconds
        unit: 'seconds'
    }
}
```

### Condition Action
```typescript
{
    type: 'condition',
    config: {
        field: 'status',
        operator: 'equals',
        value: 'completed'
    }
}
```

## Domain Events Flow

```
Workflow Creation:
1. WorkflowCreatedEvent → Analytics Domain (usage metrics)
2. WorkflowCreatedEvent → Notification Domain (creation confirmation)

Workflow Execution:
1. WorkflowExecutedEvent → Analytics Domain (performance metrics)
2. WorkflowExecutedEvent → Integration Domain (trigger external APIs)
3. WorkflowExecutedEvent → Notification Domain (execution status)

Status Changes:
1. WorkflowStatusChangedEvent → Analytics Domain (status tracking)
2. WorkflowStatusChangedEvent → Notification Domain (status alerts)
```

## Execution Model

### Workflow Lifecycle States
1. **DRAFT**: Workflow being configured, not executable
2. **ACTIVE**: Workflow ready for execution
3. **PAUSED**: Workflow temporarily suspended
4. **ERROR**: Workflow encountered execution errors

### State Transitions
```
DRAFT → ACTIVE (activation with valid configuration)
ACTIVE → PAUSED (manual pause)
ACTIVE → ERROR (execution failure)
PAUSED → ACTIVE (manual resume)
ERROR → ACTIVE (manual reset after fix)
ANY → DRAFT (reset to draft state)
```

## Integration Patterns

### Repository Pattern
```typescript
interface IWorkflowRepository {
    save(workflow: Workflow): Promise<void>;
    findById(id: WorkflowId): Promise<Workflow | null>;
    findByUserId(userId: UserId): Promise<Workflow[]>;
    delete(id: WorkflowId): Promise<void>;
}
```

### Domain Event Publishing
```typescript
// Events are automatically published when domain operations occur
workflow.activate(); // Publishes WorkflowStatusChangedEvent
workflow.execute(); // Publishes WorkflowExecutedEvent
```

## Implementation Status

### ✅ Completed Features
- Workflow aggregate with comprehensive business logic
- Action configuration and validation
- Status lifecycle management
- Domain event publishing
- Repository pattern implementation
- Comprehensive unit tests (21/21 passing)

### 🔄 Ongoing Development
- Advanced trigger types
- Workflow templates
- Version control for workflows
- Performance optimization
- Advanced action types

## Testing Strategy

The domain includes comprehensive tests covering:
- **Business Rule Validation**: All workflow constraints tested
- **Entity Behavior**: Workflow lifecycle and state transitions
- **Action Validation**: All action types and configurations
- **Domain Event Publishing**: Event creation and publishing
- **Repository Contracts**: Interface compliance testing

## Usage Examples

### Creating a Workflow
```typescript
const workflow = Workflow.create(
    WorkflowId.fromNumber(1),
    UserId.fromNumber(123),
    'Email Notification Workflow',
    'Sends email when conditions are met'
);

workflow.addAction({
    type: 'email',
    order: 1,
    config: {
        to: 'user@example.com',
        subject: 'Alert',
        template: 'alert-template'
    }
});

await workflowRepository.save(workflow);
```

### Executing a Workflow
```typescript
const workflow = await workflowRepository.findById(workflowId);
if (workflow.canExecute()) {
    workflow.execute();
    await workflowRepository.save(workflow);
}
```

### Status Management
```typescript
workflow.activate(); // DRAFT → ACTIVE
workflow.pause();    // ACTIVE → PAUSED
workflow.resume();   // PAUSED → ACTIVE
```

This domain serves as the heart of the FlowCreate platform, providing robust, scalable, and maintainable workflow automation capabilities with strong business rule enforcement and comprehensive event-driven architecture.