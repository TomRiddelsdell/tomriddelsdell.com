/**
 * Distributed tracing implementation with OpenTelemetry
 */

import { trace, context as otContext, SpanStatusCode, type Span as OTSpan } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import type { Span, SpanContext, TraceContext, Tracing } from './types.js';
import { StructuredLogger } from './logging.js';

export class TracingManager implements Tracing {
  private tracer: ReturnType<typeof trace.getTracer>;

  constructor(serviceName: string) {
    this.tracer = trace.getTracer('@platform/observability', '1.0.0');
  }

  /**
   * Wrapper for OpenTelemetry Span
   */
  private wrapSpan(otSpan: OTSpan): Span {
    return {
      spanContext: () => {
        const ctx = otSpan.spanContext();
        return {
          traceId: ctx.traceId,
          spanId: ctx.spanId,
          traceFlags: ctx.traceFlags,
        };
      },
      setAttribute: (key: string, value: string | number | boolean) => {
        otSpan.setAttribute(key, value);
      },
      setAttributes: (attributes: Record<string, string | number | boolean>) => {
        otSpan.setAttributes(attributes);
      },
      end: () => {
        otSpan.end();
      },
    };
  }

  startSpan(name: string, parentContext?: SpanContext): Span {
    let ctx = otContext.active();
    
    // If parent context provided, use it
    if (parentContext) {
      // Create a new context with the parent span
      ctx = trace.setSpanContext(ctx, {
        traceId: parentContext.traceId,
        spanId: parentContext.spanId,
        traceFlags: parentContext.traceFlags,
        isRemote: true,
      });
    }

    const otSpan = this.tracer.startSpan(name, {}, ctx);
    return this.wrapSpan(otSpan);
  }

  createTrace(correlationId?: string): TraceContext {
    const id = correlationId || StructuredLogger.generateCorrelationId();
    
    // Start a new span to get a trace ID
    const span = this.tracer.startSpan('trace.root');
    const spanContext = span.spanContext();
    span.end();

    return {
      traceId: spanContext.traceId,
      correlationId: id,
    };
  }
}

/**
 * Semantic attributes for common span types (from ADR-010)
 */
export const SpanAttributes = {
  // Event sourcing attributes
  EVENT_TYPE: 'event.type',
  EVENT_ID: 'event.id',
  AGGREGATE_ID: 'aggregate.id',
  AGGREGATE_TYPE: 'aggregate.type',
  
  // User attributes
  USER_ID: 'user.id',
  USER_EMAIL: 'user.email',
  
  // Database attributes
  DB_QUERY: SemanticAttributes.DB_STATEMENT,
  DB_OPERATION: SemanticAttributes.DB_OPERATION,
  
  // HTTP attributes
  HTTP_METHOD: SemanticAttributes.HTTP_METHOD,
  HTTP_URL: SemanticAttributes.HTTP_URL,
  HTTP_STATUS_CODE: SemanticAttributes.HTTP_STATUS_CODE,
  
  // Error attributes
  ERROR_TYPE: 'error.type',
  ERROR_MESSAGE: 'error.message',
} as const;

/**
 * Helper to create instrumented spans for common operations
 */
export class SpanHelper {
  /**
   * Create a span for event publishing
   */
  static eventPublished(tracing: Tracing, eventType: string, aggregateId: string): Span {
    const span = tracing.startSpan('event.published');
    span.setAttributes({
      [SpanAttributes.EVENT_TYPE]: eventType,
      [SpanAttributes.AGGREGATE_ID]: aggregateId,
    });
    return span;
  }

  /**
   * Create a span for projection updates
   */
  static projectionUpdated(tracing: Tracing, projectionName: string, aggregateId: string): Span {
    const span = tracing.startSpan('projection.updated');
    span.setAttributes({
      'projection.name': projectionName,
      [SpanAttributes.AGGREGATE_ID]: aggregateId,
    });
    return span;
  }

  /**
   * Create a span for user authentication
   */
  static userAuthentication(tracing: Tracing, userId: string): Span {
    const span = tracing.startSpan('user.authentication');
    span.setAttribute(SpanAttributes.USER_ID, userId);
    return span;
  }

  /**
   * Create a span for database queries
   */
  static databaseQuery(tracing: Tracing, operation: string, query?: string): Span {
    const span = tracing.startSpan('database.query');
    span.setAttributes({
      [SpanAttributes.DB_OPERATION]: operation,
      ...(query && { [SpanAttributes.DB_QUERY]: query }),
    });
    return span;
  }

  /**
   * Create a span for external API calls
   */
  static externalApiCall(tracing: Tracing, method: string, url: string): Span {
    const span = tracing.startSpan('external.api.call');
    span.setAttributes({
      [SpanAttributes.HTTP_METHOD]: method,
      [SpanAttributes.HTTP_URL]: url,
    });
    return span;
  }
}
