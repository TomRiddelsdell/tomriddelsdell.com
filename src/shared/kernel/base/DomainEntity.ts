import { DomainEvent } from '../events/DomainEvent';

export abstract class DomainEntity {
  private domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  public clearDomainEvents(): void {
    this.domainEvents = [];
  }

  public markEventsAsCommitted(): void {
    this.domainEvents = [];
  }
}