# Event Schemas (Source Definitions)

This directory contains the authoritative Avro schema definitions for all domain events in the portfolio platform. These schemas serve as the **single source of truth** for event structure and are used to generate TypeScript types in the `packages/event-contracts` package.

## Purpose

**Schema Definitions**: Human-authored Avro schemas that define the structure, validation rules, and evolution strategy for all domain events across bounded contexts.

## Design Principles

### 📋 **Schema-First Development**
- **Define First**: Schemas are created before implementation
- **Generate Code**: TypeScript types generated from these schemas
- **Validate Contracts**: All events must conform to schemas
- **Version Evolution**: Schema changes follow strict evolution rules

### 🎯 **Domain-Driven Organization**
- **Bounded Context Separation**: Each context has its own subdirectory
- **Aggregate Alignment**: Events grouped by aggregate they relate to
- **Business Language**: Schema names use ubiquitous language from domain

### 🔄 **Schema Evolution Strategy**
- **Semantic Versioning**: Schema files include version in filename
- **Backward Compatibility**: New versions maintain backward compatibility when possible
- **Breaking Changes**: Major version bumps for incompatible changes
- **Documentation**: Each schema includes comprehensive documentation

## Directory Structure

```
events/
├── accounts/                  # Account bounded context events
│   ├── UserRegistered.v1.0.0.avsc
│   ├── UserRegistered.v1.1.0.avsc    # Added optional fields
│   ├── UserProfileUpdated.v1.0.0.avsc
│   ├── UserRoleChanged.v1.0.0.avsc
│   └── README.md                      # Context-specific documentation
├── projects/                  # Project bounded context events
│   ├── ProjectCreated.v1.0.0.avsc
│   ├── ProjectUpdated.v1.0.0.avsc
│   ├── ProjectVisibilityChanged.v1.0.0.avsc
│   ├── ProjectDeleted.v1.0.0.avsc
│   └── README.md                      # Context-specific documentation
├── contact/                   # Contact bounded context events
│   ├── ContactRequestSubmitted.v1.0.0.avsc
│   ├── ContactRequestProcessed.v1.0.0.avsc
│   └── README.md                      # Context-specific documentation
├── shared/                    # Cross-context event structures
│   ├── EventEnvelope.avsc             # Common event wrapper
│   ├── EventMetadata.avsc             # Standard metadata structure
│   └── README.md                      # Shared schema documentation
├── schema-registry.json       # Schema registry metadata
├── compatibility-rules.md     # Evolution compatibility guidelines
└── README.md                  # This file
```

## Schema File Format

### File Naming Convention
```
{EventName}.v{MAJOR}.{MINOR}.{PATCH}.avsc
```

Examples:
- `UserRegistered.v1.0.0.avsc` - Initial version
- `UserRegistered.v1.1.0.avsc` - Added optional fields (backward compatible)
- `UserRegistered.v2.0.0.avsc` - Breaking changes (not backward compatible)

### Schema Structure
```json
{
  "type": "record",
  "name": "UserRegistered",
  "namespace": "portfolio.events.accounts",
  "version": "1.0.0",
  "doc": "Published when a new user registers for the portfolio platform",
  "fields": [
    {
      "name": "eventId",
      "type": "string",
      "doc": "Unique identifier for this event occurrence"
    },
    {
      "name": "aggregateId",
      "type": "string", 
      "doc": "User ID that this event relates to"
    },
    {
      "name": "aggregateVersion",
      "type": "long",
      "doc": "Version number of the user aggregate after this event"
    },
    {
      "name": "occurredAt",
      "type": "long",
      "logicalType": "timestamp-millis",
      "doc": "When this event occurred (milliseconds since epoch)"
    },
    {
      "name": "causedBy",
      "type": "string",
      "doc": "ID of the user or system that caused this event"
    },
    {
      "name": "userData",
      "type": {
        "type": "record",
        "name": "UserRegistrationData",
        "fields": [
          {
            "name": "userId",
            "type": "string",
            "doc": "The newly registered user's unique identifier"
          },
          {
            "name": "email",
            "type": "string",
            "doc": "User's email address"
          },
          {
            "name": "profile",
            "type": {
              "type": "record", 
              "name": "UserProfile",
              "fields": [
                {
                  "name": "displayName",
                  "type": "string",
                  "doc": "User's display name for the platform"
                },
                {
                  "name": "preferences",
                  "type": ["null", "UserPreferences"],
                  "default": null,
                  "doc": "Optional user preferences"
                }
              ]
            }
          }
        ]
      }
    }
  ]
}
```

## Schema Evolution Rules

### ✅ **Backward Compatible Changes** (Minor Version)
- **Add optional fields** with default values
- **Add new enum values** (at end of list)
- **Add documentation** or improve descriptions
- **Remove default values** from existing fields

### ❌ **Breaking Changes** (Major Version)
- **Remove required fields** or change field types
- **Remove enum values** or change their order
- **Change field names** or namespaces
- **Add required fields** without defaults
- **Change semantic meaning** of existing fields

### 🔄 **Schema Migration Process**
1. **Create new schema version** in same directory
2. **Update schema-registry.json** with new version metadata
3. **Add migration notes** in version comments
4. **Generate new TypeScript types** from updated schemas
5. **Update consuming services** to handle both versions during transition
6. **Deprecate old version** after migration period

## Integration with Code Generation

### Build Process
```bash
# Validate all schemas
avro-tools validate contracts/events/**/*.avsc

# Generate TypeScript types
avro-codegen 
  --input contracts/events 
  --output packages/event-contracts/src 
  --language typescript

# Build and publish generated package
cd packages/event-contracts && npm run build
```

### Schema Registry Integration
```json
// schema-registry.json
{
  "registry": {
    "accounts": {
      "UserRegistered": {
        "latest": "1.1.0",
        "versions": {
          "1.0.0": {
            "file": "accounts/UserRegistered.v1.0.0.avsc",
            "compatibility": "backward"
          },
          "1.1.0": {
            "file": "accounts/UserRegistered.v1.1.0.avsc", 
            "compatibility": "backward",
            "supersedes": "1.0.0"
          }
        }
      }
    }
  }
}
```

## Quality Assurance

### ✅ **Schema Validation**
- **Syntax Validation**: All schemas must be valid Avro syntax
- **Semantic Validation**: Schemas must follow domain business rules
- **Compatibility Check**: New versions checked for compatibility with previous versions
- **Documentation Quality**: All fields must have meaningful documentation

### 🔒 **Change Management**
- **Review Process**: All schema changes require architectural review
- **Version Control**: All changes tracked in git with detailed commit messages
- **Impact Analysis**: Breaking changes analyzed for impact on consuming services
- **Migration Planning**: Breaking changes include migration strategy

### 📊 **Monitoring**
- **Schema Usage**: Track which versions are actively used
- **Compatibility Issues**: Monitor for schema validation failures
- **Evolution Metrics**: Track frequency and types of schema changes

## Development Workflow

### Adding New Event Schema
1. **Identify Event**: Determine event name and bounded context
2. **Design Schema**: Create Avro schema with comprehensive documentation  
3. **Validate Schema**: Use `avro-tools validate` to check syntax
4. **Review Schema**: Get architectural review for domain alignment
5. **Generate Code**: Run code generation to create TypeScript types
6. **Update Registry**: Add schema metadata to registry
7. **Test Integration**: Verify generated types work with event handlers

### Evolving Existing Schema
1. **Analyze Change**: Determine if change is backward compatible
2. **Version Appropriately**: Increment version according to compatibility
3. **Update Schema**: Modify existing schema file or create new version
4. **Check Compatibility**: Validate compatibility with existing versions
5. **Update Documentation**: Document changes and migration notes
6. **Generate New Types**: Create updated TypeScript interfaces
7. **Plan Migration**: For breaking changes, plan service migration strategy

## Architecture Integration

### Event Sourcing Alignment
- **Event Store Compatibility**: Schemas designed for JSON serialization in event store
- **Event Replay**: Historical events can be deserialized using versioned schemas
- **Projection Building**: Schema structure optimized for projection consumption

### CQRS Integration
- **Command Events**: Schemas for events resulting from command processing
- **Integration Events**: Schemas for cross-bounded-context communication
- **Query Optimization**: Event structure supports efficient query model updates

### Bounded Context Separation
- **Context Independence**: Each context manages its own event schemas
- **Shared Structures**: Common elements defined in shared directory
- **Contract Management**: Clear contracts for cross-context event publishing

## Troubleshooting

### Common Issues
- **Schema Validation Errors**: Check Avro syntax and field definitions
- **Compatibility Breaks**: Verify evolution rules followed correctly
- **Code Generation Failures**: Ensure schema syntax is valid before generation
- **Version Conflicts**: Check for proper semantic versioning

### Tools and Commands
```bash
# Validate single schema
avro-tools validate UserRegistered.v1.0.0.avsc

# Check compatibility between versions
avro-tools compatibility-check UserRegistered.v1.0.0.avsc UserRegistered.v1.1.0.avsc

# Pretty print schema
avro-tools tojson UserRegistered.v1.0.0.avsc

# Generate sample data
avro-tools random --schema-file UserRegistered.v1.0.0.avsc --count 5
```

---

**Schema Format**: Apache Avro  
**Code Generation Target**: TypeScript (`packages/event-contracts`)  
**Maintained By**: Platform Team & Domain Experts  
**Review Required**: Architecture Review for all changes  
**Last Updated**: September 14, 2025
