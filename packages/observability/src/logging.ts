/**
 * Structured logging implementation with OpenTelemetry trace context
 */

import { trace, context as otContext } from '@opentelemetry/api';
import type { LogEntry, Logger } from './types.js';

export class StructuredLogger implements Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Generate a correlation ID for request tracing
   */
  static generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current trace context from OpenTelemetry
   */
  private getTraceContext(): { traceId?: string; spanId?: string } {
    const span = trace.getSpan(otContext.active());
    if (span) {
      const spanContext = span.spanContext();
      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
      };
    }
    return {};
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const { traceId, spanId } = this.getTraceContext();

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...(traceId && { traceId }),
      ...(spanId && { spanId }),
      ...(context && { metadata: context }),
    };

    // Add error details if present
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Extract common fields from context
    if (context) {
      if (context.correlationId) entry.correlationId = String(context.correlationId);
      if (context.userId) entry.userId = String(context.userId);
      if (context.aggregateId) entry.aggregateId = String(context.aggregateId);
    }

    return entry;
  }

  /**
   * Output log entry as JSON to stdout
   */
  private output(entry: LogEntry): void {
    const json = JSON.stringify(entry);
    
    // Use console methods for proper stream routing
    if (entry.level === 'error') {
      console.error(json);
    } else if (entry.level === 'warn') {
      console.warn(json);
    } else if (entry.level === 'debug') {
      console.debug(json);
    } else {
      console.log(json);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('info', message, context);
    this.output(entry);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('error', message, context, error);
    this.output(entry);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('debug', message, context);
    this.output(entry);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('warn', message, context);
    this.output(entry);
  }
}
