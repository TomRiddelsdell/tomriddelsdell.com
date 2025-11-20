/**
 * Unit tests for TracingManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TracingManager, SpanAttributes, SpanHelper } from '../tracing';

describe('TracingManager', () => {
  let tracingManager: TracingManager;

  beforeEach(() => {
    tracingManager = new TracingManager('test-service');
  });

  describe('startSpan', () => {
    it('should create a span', () => {
      const span = tracingManager.startSpan('test-operation');

      expect(span).toBeDefined();
      expect(span.setAttribute).toBeDefined();
      expect(span.end).toBeDefined();
    });

    it('should allow setting attributes', () => {
      const span = tracingManager.startSpan('test-operation');

      expect(() => {
        span.setAttribute('user.id', 'user-123');
        span.setAttribute('operation.count', 42);
        span.setAttribute('success', true);
      }).not.toThrow();

      span.end();
    });

    it('should support span hierarchy', () => {
      const parentSpan = tracingManager.startSpan('parent-operation');
      parentSpan.setAttribute('level', 'parent');

      const childSpan = tracingManager.startSpan('child-operation');
      childSpan.setAttribute('level', 'child');

      expect(() => {
        childSpan.end();
        parentSpan.end();
      }).not.toThrow();
    });
  });

  describe('createTrace', () => {
    it('should create trace context with correlation ID', () => {
      const traceContext = tracingManager.createTrace('test-correlation-123');

      expect(traceContext).toBeDefined();
      expect(traceContext.correlationId).toBe('test-correlation-123');
    });

    it('should generate correlation ID if not provided', () => {
      const traceContext = tracingManager.createTrace();

      expect(traceContext).toBeDefined();
      expect(traceContext.correlationId).toBeDefined();
      expect(traceContext.correlationId.length).toBeGreaterThan(0);
    });
  });
});

describe('SpanAttributes', () => {
  it('should define standard HTTP attributes', () => {
    expect(SpanAttributes.HTTP_METHOD).toBe('http.method');
    expect(SpanAttributes.HTTP_URL).toBe('http.url');
    expect(SpanAttributes.HTTP_STATUS_CODE).toBe('http.status_code');
  });

  it('should define database attributes', () => {
    expect(SpanAttributes.DB_QUERY).toBeDefined();
    expect(SpanAttributes.DB_OPERATION).toBeDefined();
  });

  it('should define event sourcing attributes', () => {
    expect(SpanAttributes.EVENT_TYPE).toBe('event.type');
    expect(SpanAttributes.AGGREGATE_ID).toBe('aggregate.id');
    expect(SpanAttributes.EVENT_ID).toBe('event.id');
    expect(SpanAttributes.AGGREGATE_TYPE).toBe('aggregate.type');
  });
});

describe('SpanHelper', () => {
  let tracingManager: TracingManager;

  beforeEach(() => {
    tracingManager = new TracingManager('test-service');
  });

  describe('eventPublished', () => {
    it('should create span for event publication', () => {
      const span = SpanHelper.eventPublished(
        tracingManager,
        'UserCreated',
        'user-123'
      );

      expect(span).toBeDefined();
      span.end();
    });
  });

  describe('projectionUpdated', () => {
    it('should create span for projection update', () => {
      const span = SpanHelper.projectionUpdated(
        tracingManager,
        'UserProjection'
      );

      expect(span).toBeDefined();
      span.end();
    });
  });

  describe('userAuthentication', () => {
    it('should create span for authentication', () => {
      const span = SpanHelper.userAuthentication(tracingManager, 'user-456');

      expect(span).toBeDefined();
      span.end();
    });
  });

  describe('databaseQuery', () => {
    it('should create span for database query', () => {
      const span = SpanHelper.databaseQuery(
        tracingManager,
        'SELECT',
        'SELECT * FROM users WHERE id = $1'
      );

      expect(span).toBeDefined();
      span.end();
    });
  });

  describe('externalApiCall', () => {
    it('should create span for external API call', () => {
      const span = SpanHelper.externalApiCall(
        tracingManager,
        'POST',
        'https://api.example.com/v1/users'
      );

      expect(span).toBeDefined();
      span.end();
    });
  });
});
