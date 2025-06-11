import { DomainEvent } from '../events/DomainEvent';

/**
 * Domain Event Publisher - Shared Kernel Component
 * Provides consistent event publishing across all domains
 */
export interface IDomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
}

export class DomainEventPublisher implements IDomainEventPublisher {
  private static instance: DomainEventPublisher;
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();

  private constructor() {}

  static getInstance(): DomainEventPublisher {
    if (!DomainEventPublisher.instance) {
      DomainEventPublisher.instance = new DomainEventPublisher();
    }
    return DomainEventPublisher.instance;
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(
      handlers.map(handler => 
        handler(event).catch(error => 
          console.error(`Error handling domain event ${event.eventType}:`, error)
        )
      )
    );
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }

  clear(): void {
    this.handlers.clear();
  }
}