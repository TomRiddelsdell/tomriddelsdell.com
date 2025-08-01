import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DomainEventPublisher } from '../../src/domain-services/DomainEventPublisher';
import { DomainEvent, UserRegisteredEvent, NotificationSentEvent } from '../../src/events/DomainEvent';

describe('Domain Event Publisher - Shared Kernel', () => {
  let publisher: DomainEventPublisher;
  let mockHandler: any;
  let notificationHandler: any;

  beforeEach(() => {
    publisher = DomainEventPublisher.getInstance();
    mockHandler = vi.fn().mockResolvedValue(undefined);
    notificationHandler = vi.fn().mockResolvedValue(undefined);
    
    // Clear any existing handlers
    publisher.clear();
  });

  it('should be a singleton', () => {
    const publisher1 = DomainEventPublisher.getInstance();
    const publisher2 = DomainEventPublisher.getInstance();
    
    expect(publisher1).toBe(publisher2);
  });

  it('should subscribe and publish events correctly', async () => {
    publisher.subscribe('UserRegistered', mockHandler);

    const event = new UserRegisteredEvent('123', 'test@example.com', 'cognito-123');
    await publisher.publish(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(event);
  });

  it('should handle multiple subscribers for same event type', async () => {
    const mockHandler2 = vi.fn().mockResolvedValue(undefined);
    
    publisher.subscribe('UserRegistered', mockHandler);
    publisher.subscribe('UserRegistered', mockHandler2);

    const event = new UserRegisteredEvent('123', 'test@example.com', 'cognito-123');
    await publisher.publish(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
  });

  it('should handle different event types separately', async () => {
    const notificationHandler = vi.fn().mockResolvedValue(undefined);
    
    publisher.subscribe('UserRegistered', mockHandler);
    publisher.subscribe('NotificationSent', notificationHandler);

    const eventA = new UserRegisteredEvent('123', 'test@example.com', 'cognito-123');
    const eventB = new NotificationSentEvent('456', '123', 'email', 'sent');

    await publisher.publish(eventA);
    await publisher.publish(eventB);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(eventA);
    
    expect(notificationHandler).toHaveBeenCalledTimes(1);
    expect(notificationHandler).toHaveBeenCalledWith(eventB);
  });

  it('should publish multiple events at once', async () => {
    publisher.subscribe('UserRegistered', mockHandler);
    publisher.subscribe('NotificationSent', mockHandler);

    const events = [
      new UserRegisteredEvent('123', 'test@example.com', 'cognito-123'),
      new NotificationSentEvent('456', '123', 'email', 'sent')
    ];

    await publisher.publishMany(events);

    expect(mockHandler).toHaveBeenCalledTimes(2);
  });

  it('should handle handler errors gracefully', async () => {
    const failingHandler = vi.fn().mockRejectedValue(new Error('Handler failed'));
    const successHandler = vi.fn().mockResolvedValue(undefined);
    
    publisher.subscribe('UserRegistered', failingHandler);
    publisher.subscribe('UserRegistered', successHandler);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const event = new UserRegisteredEvent('123', 'test@example.com', 'cognito-123');
    await publisher.publish(event);

    expect(failingHandler).toHaveBeenCalledTimes(1);
    expect(successHandler).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error handling domain event UserRegistered:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should not publish events for unsubscribed types', async () => {
    publisher.subscribe('UserRegistered', mockHandler);

    const notificationEvent = new NotificationSentEvent('456', '123', 'email', 'sent');
    await publisher.publish(notificationEvent);

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should handle async handlers correctly', async () => {
    const asyncHandler = vi.fn().mockImplementation(async (event) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return `Processed ${event.eventType}`;
    });

    publisher.subscribe('UserRegistered', asyncHandler);

    const event = new UserRegisteredEvent('123', 'test@example.com', 'cognito-123');
    await publisher.publish(event);

    expect(asyncHandler).toHaveBeenCalledTimes(1);
    expect(asyncHandler).toHaveBeenCalledWith(event);
  });

  it('should handle multiple event publications concurrently', async () => {
    const delayedHandler = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    publisher.subscribe('UserRegistered', delayedHandler);
    publisher.subscribe('NotificationSent', delayedHandler);

    const events = [
      new UserRegisteredEvent('123', 'test@example.com', 'cognito-123'),
      new NotificationSentEvent('456', '123', 'email', 'sent'),
      new UserRegisteredEvent('124', 'test2@example.com', 'cognito-124')
    ];

    const startTime = Date.now();
    await publisher.publishMany(events);
    const endTime = Date.now();

    expect(delayedHandler).toHaveBeenCalledTimes(3);
    // Should be concurrent, not sequential (less than 25ms total vs 30ms if sequential)
    // Allow for some timing variance in test environment
    expect(endTime - startTime).toBeLessThan(25);
  });

  it('should maintain event data integrity', async () => {
    let capturedEvent: DomainEvent;
    
    publisher.subscribe('UserRegistered', async (event) => {
      capturedEvent = event;
    });

    const originalEvent = new UserRegisteredEvent('123', 'test@example.com', 'cognito-123');
    await publisher.publish(originalEvent);

    expect(capturedEvent!).toBe(originalEvent);
    expect(capturedEvent!.eventType).toBe('UserRegistered');
    expect(capturedEvent!.occurredAt).toBeInstanceOf(Date);
    expect((capturedEvent! as UserRegisteredEvent).userId).toBe('123');
    expect((capturedEvent! as UserRegisteredEvent).email).toBe('test@example.com');
  });
});