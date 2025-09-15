# Shared Infrastructure Package

This package provides common infrastructure utilities, adapters, and cross-cutting concerns used across multiple services in the portfolio platform. It implements the infrastructure layer of hexagonal architecture while maintaining technology independence.

## Purpose

**Infrastructure Abstractions**: Port interfaces and common adapter implementations that enable services to interact with external systems without coupling to specific technologies.

## Contents

### 🔌 **Port Interfaces** (Abstractions)
Technology-agnostic interfaces that define contracts for infrastructure concerns:

```typescript
// Event Store abstraction
export interface EventStore {
  append(streamId: string, events: DomainEvent[]): Promise<void>;
  load(streamId: string): Promise<DomainEvent[]>;
  loadFromVersion(streamId: string, version: number): Promise<DomainEvent[]>;
}

// Message Bus abstraction  
export interface MessageBus {
  publish<T extends IntegrationEvent>(event: T): Promise<void>;
  subscribe<T extends IntegrationEvent>(eventType: string, handler: EventHandler<T>): Promise<void>;
}
```

### 🔧 **Common Adapters** (Implementations)
Concrete implementations of port interfaces for specific technologies:

```typescript
// Neon PostgreSQL Event Store
export class NeonEventStore implements EventStore {
  // Implementation for Neon database
}

// Kafka Message Bus
export class KafkaMessageBus implements MessageBus {
  // Implementation for Apache Kafka
}

// Redis Message Bus (alternative)
export class RedisMessageBus implements MessageBus {
  // Implementation for Redis Streams
}
```

### 🛠️ **Infrastructure Utilities**
Common utilities for infrastructure concerns:

```typescript
// Connection management
export class ConnectionManager {
  // Database connection pooling and management
}

// Health checks
export class HealthCheckRegistry {
  // Service health monitoring
}
```

## Package Structure

```
src/
├── ports/
│   ├── EventStore.ts          # Event store port interface
│   ├── MessageBus.ts          # Message bus port interface
│   ├── ProjectionStore.ts     # Projection store port interface
│   ├── SchemaRegistry.ts      # Schema registry port interface
│   └── HealthCheck.ts         # Health check port interface
├── adapters/
│   ├── neon/
│   │   ├── NeonEventStore.ts      # Neon database event store
│   │   ├── NeonProjectionStore.ts # Neon projection storage
│   │   └── NeonHealthCheck.ts     # Neon health monitoring
│   ├── kafka/
│   │   ├── KafkaMessageBus.ts     # Kafka message bus implementation
│   │   └── KafkaHealthCheck.ts    # Kafka health monitoring
│   ├── redis/
│   │   ├── RedisMessageBus.ts     # Redis Streams message bus
│   │   └── RedisHealthCheck.ts    # Redis health monitoring
│   └── cloudflare/
│       ├── CloudflareKV.ts       # Cloudflare KV storage
│       └── CloudflareQueue.ts    # Cloudflare Queues
├── utilities/
│   ├── ConnectionManager.ts       # Database connection management
│   ├── RetryPolicy.ts            # Configurable retry logic
│   ├── CircuitBreaker.ts         # Circuit breaker pattern
│   └── HealthCheckRegistry.ts    # Health check coordination
├── middleware/
│   ├── LoggingMiddleware.ts      # Request/response logging
│   ├── MetricsMiddleware.ts      # Performance metrics
│   └── ErrorHandlingMiddleware.ts # Global error handling
├── configuration/
│   ├── ConfigurationManager.ts   # Environment configuration
│   └── SecretManager.ts          # Secret management abstraction
└── index.ts                      # Public API exports
```

## Design Principles

### 🎯 **Hexagonal Architecture**
- **Ports & Adapters**: Clean separation between abstraction and implementation
- **Technology Independence**: Services depend only on port interfaces
- **Pluggable Implementation**: Easy to swap adapter implementations

### 🔄 **Adapter Pattern**
- **Interface Segregation**: Small, focused port interfaces
- **Multiple Implementations**: Support for different technology stacks
- **Configuration-Driven**: Adapter selection via configuration

### 🛡️ **Resilience Patterns**
- **Circuit Breaker**: Prevent cascading failures
- **Retry Logic**: Configurable retry with exponential backoff
- **Health Checks**: Monitor external system health

## Usage Examples

### Event Store Integration
```typescript
// Service configuration
import { EventStore, NeonEventStore } from '@portfolio/shared-infra';

// Dependency injection in service
export class AccountService {
  constructor(private eventStore: EventStore) {}
  
  async handleCommand(command: RegisterUserCommand): Promise<void> {
    const events = this.processCommand(command);
    await this.eventStore.append(command.userId, events);
  }
}

// Configuration/bootstrap
const eventStore = new NeonEventStore({
  connectionString: process.env.DATABASE_URL,
  poolSize: 10
});

const accountService = new AccountService(eventStore);
```

### Message Bus Integration
```typescript
import { MessageBus, KafkaMessageBus, RedisMessageBus } from '@portfolio/shared-infra';

// Factory pattern for adapter selection
export class MessageBusFactory {
  static create(config: MessageBusConfig): MessageBus {
    switch (config.provider) {
      case 'kafka':
        return new KafkaMessageBus(config.kafka);
      case 'redis': 
        return new RedisMessageBus(config.redis);
      default:
        throw new Error(`Unsupported message bus: ${config.provider}`);
    }
  }
}

// Usage in service
const messageBus = MessageBusFactory.create(config);
await messageBus.publish(new UserRegisteredEvent(userId));
```

### Health Check Registration
```typescript
import { HealthCheckRegistry } from '@portfolio/shared-infra';

// Register health checks for external dependencies
const healthRegistry = new HealthCheckRegistry();

healthRegistry.register('database', new NeonHealthCheck(connectionString));
healthRegistry.register('message-bus', new KafkaHealthCheck(kafkaConfig));
healthRegistry.register('cache', new RedisHealthCheck(redisConfig));

// Check overall system health
const healthStatus = await healthRegistry.checkAll();
```

## Adapter Implementations

### Neon Database Adapters
```typescript
// Event Store implementation
export class NeonEventStore implements EventStore {
  constructor(private config: NeonConfig) {}
  
  async append(streamId: string, events: DomainEvent[]): Promise<void> {
    // PostgreSQL-specific event storage
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const event of events) {
        await client.query(
          'INSERT INTO events (stream_id, event_type, event_data, version) VALUES ($1, $2, $3, $4)',
          [streamId, event.eventType, JSON.stringify(event), event.version]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

### Kafka Message Bus
```typescript
export class KafkaMessageBus implements MessageBus {
  constructor(private config: KafkaConfig) {
    this.producer = kafka.producer();
    this.consumer = kafka.consumer({ groupId: config.consumerGroup });
  }
  
  async publish<T extends IntegrationEvent>(event: T): Promise<void> {
    await this.producer.send({
      topic: this.getTopicName(event.eventType),
      messages: [{
        key: event.aggregateId,
        value: JSON.stringify(event)
      }]
    });
  }
}
```

## Configuration Management

### Environment-Based Configuration
```typescript
export interface InfrastructureConfig {
  eventStore: {
    provider: 'neon' | 'postgres';
    connectionString: string;
    poolSize: number;
  };
  messageBus: {
    provider: 'kafka' | 'redis';
    brokers?: string[];       // Kafka
    connectionString?: string; // Redis
  };
  healthChecks: {
    interval: number;
    timeout: number;
    retries: number;
  };
}

export class ConfigurationManager {
  static load(): InfrastructureConfig {
    return {
      eventStore: {
        provider: process.env.EVENT_STORE_PROVIDER as 'neon',
        connectionString: process.env.DATABASE_URL!,
        poolSize: parseInt(process.env.DB_POOL_SIZE || '10')
      },
      messageBus: {
        provider: process.env.MESSAGE_BUS_PROVIDER as 'kafka',
        brokers: process.env.KAFKA_BROKERS?.split(',')
      }
    };
  }
}
```

## Testing Support

### Test Doubles
```typescript
// In-memory implementations for testing
export class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();
  
  async append(streamId: string, events: DomainEvent[]): Promise<void> {
    const existingEvents = this.events.get(streamId) || [];
    this.events.set(streamId, [...existingEvents, ...events]);
  }
}

export class InMemoryMessageBus implements MessageBus {
  private publishedEvents: IntegrationEvent[] = [];
  
  async publish<T extends IntegrationEvent>(event: T): Promise<void> {
    this.publishedEvents.push(event);
  }
  
  getPublishedEvents(): IntegrationEvent[] {
    return [...this.publishedEvents];
  }
}
```

## Quality Standards

### ✅ **Required Standards**
- **Port/Adapter Compliance**: All adapters must implement port interfaces completely
- **Error Handling**: Proper exception handling with meaningful error messages
- **Connection Management**: Efficient resource management and cleanup
- **Health Monitoring**: All adapters provide health check implementations

### 🔒 **Security Standards**
- **Secret Management**: No hardcoded credentials or secrets
- **Connection Security**: Encrypted connections where supported
- **Access Control**: Least privilege principle for all external connections

### 📊 **Performance Standards**
- **Connection Pooling**: Efficient connection management
- **Resource Cleanup**: Proper disposal of resources
- **Circuit Breaking**: Fail-fast for unhealthy dependencies
- **Metrics Collection**: Performance metrics for monitoring

## Integration with Services

### Dependency Injection Pattern
```typescript
// Service constructor injection
export class UserService {
  constructor(
    private eventStore: EventStore,
    private messageBus: MessageBus,
    private healthCheck: HealthCheck
  ) {}
}

// Bootstrap/container configuration
const container = {
  eventStore: new NeonEventStore(config.eventStore),
  messageBus: new KafkaMessageBus(config.messageBus),
  healthCheck: new HealthCheckRegistry()
};
```

### Service Registration
```typescript
// services/accounts/bootstrap.ts
import { NeonEventStore, KafkaMessageBus } from '@portfolio/shared-infra';

export function bootstrap(config: InfrastructureConfig) {
  const eventStore = new NeonEventStore(config.eventStore);
  const messageBus = new KafkaMessageBus(config.messageBus);
  
  return {
    accountService: new AccountService(eventStore, messageBus),
    healthCheck: new HealthCheckRegistry()
  };
}
```

## Architecture Compliance

### Event Sourcing Support
- **Event Store Abstraction**: Technology-agnostic event persistence
- **Event Serialization**: Consistent event serialization across adapters
- **Event Ordering**: Maintains event order within aggregates

### CQRS Support
- **Command Side**: Event store integration for command handling
- **Query Side**: Projection store abstraction for read models
- **Event Publishing**: Message bus for command/query separation

### Domain-Driven Design
- **Anti-Corruption Layer**: Adapters prevent external concerns from leaking into domain
- **Bounded Context Independence**: Infrastructure shared without coupling contexts
- **Technology Independence**: Domain layer isolated from infrastructure choices

---

**Package Version**: 1.0.0  
**Maintained By**: DevOps Team  
**Architecture Layer**: Infrastructure  
**Last Updated**: September 14, 2025
