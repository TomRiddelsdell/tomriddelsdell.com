/**
 * Unit tests for distributed tracing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TracingManager, SpanAttributes } from '../src/tracing';

describe('TracingManager', () => {
  let tracing: TracingManager;

  beforeEach(() => {
    tracing = new TracingManager('test-service');
  });

  it('should start a span', () => {
    const span = tracing.startSpan('test-operation');
    
    expect(span).toBeDefined();
    expect(span.spanContext).toBeDefined();
    expect(span.setAttribute).toBeDefined();
    expect(span.end).toBeDefined();
  });

  it('should create a trace with correlation ID', () => {
    const trace = tracing.createTrace('custom-correlation-id');
    
    expect(trace).toBeDefined();
    expect(trace.traceId).toBeDefined();
    expect(trace.correlationId).toBe('custom-correlation-id');
  });

  it('should auto-generate correlation ID if not provided', () => {
    const trace = tracing.createTrace();
    
    expect(trace.correlationId).toBeDefined();
    expect(typeof trace.correlationId).toBe('string');
  });

  it('should set span attributes', () => {
    const span = tracing.startSpan('test-operation');
    
    expect(() => {
      span.setAttribute('user.id', 'user-123');
      span.setAttributes({
        'event.type': 'UserRegistered',
        'aggregate.id': 'agg-456',
      });
    }).not.toThrow();
    
    span.end();
  });

  it('should have predefined span attributes', () => {
    expect(SpanAttributes.EVENT_TYPE).toBe('event.type');
    expect(SpanAttributes.EVENT_ID).toBe('event.id');
    expect(SpanAttributes.AGGREGATE_ID).toBe('aggregate.id');
    expect(SpanAttributes.USER_ID).toBe('user.id');
  });
});
