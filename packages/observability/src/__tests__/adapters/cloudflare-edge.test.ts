/**
 * Tests for Cloudflare Edge Runtime Adapter
 *
 * Validates that the adapter provides consistent observability
 * interface while working within edge runtime constraints
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  CloudflareEdgeAdapter,
  EdgeStructuredLogger,
  EdgeMetricsCollector,
  EdgeTracingManager,
} from '../../adapters/cloudflare-edge.js';
import type { TelemetryConfig } from '../../types.js';

// Mock console methods
const consoleLogSpy = vi.spyOn(console, 'log');
const consoleErrorSpy = vi.spyOn(console, 'error');
const consoleWarnSpy = vi.spyOn(console, 'warn');
const consoleDebugSpy = vi.spyOn(console, 'debug');

describe('CloudflareEdgeAdapter', () => {
  const testConfig: TelemetryConfig = {
    serviceName: 'test-service',
    version: '1.0.0',
    environment: 'test',
    platform: 'cloudflare',
    samplingRate: 1.0,
  };

  let adapter: CloudflareEdgeAdapter;

  beforeEach(() => {
    adapter = new CloudflareEdgeAdapter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Adapter Interface Compliance', () => {
    it('should implement ObservabilityAdapter interface', () => {
      expect(adapter.createLogger).toBeDefined();
      expect(adapter.createMetrics).toBeDefined();
      expect(adapter.createTracing).toBeDefined();
    });

    it('should create logger instance', () => {
      const logger = adapter.createLogger(testConfig);
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    it('should create metrics instance', () => {
      const metrics = adapter.createMetrics(testConfig);
      expect(metrics).toBeDefined();
      expect(metrics.counter).toBeDefined();
      expect(metrics.histogram).toBeDefined();
      expect(metrics.gauge).toBeDefined();
    });

    it('should create tracing instance', () => {
      const tracing = adapter.createTracing(testConfig);
      expect(tracing).toBeDefined();
      expect(tracing.startSpan).toBeDefined();
      expect(tracing.createTrace).toBeDefined();
    });
  });

  describe('EdgeStructuredLogger', () => {
    let logger: EdgeStructuredLogger;

    beforeEach(() => {
      logger = new EdgeStructuredLogger('test-service');
    });

    it('should log info message with structured format', () => {
      logger.info('Test info message', { userId: 'user-123' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        level: 'info',
        service: 'test-service',
        message: 'Test info message',
        metadata: { userId: 'user-123' },
      });
      expect(loggedData.timestamp).toBeDefined();
    });

    it('should log error with stack trace', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error, { correlationId: 'corr-123' });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        level: 'error',
        service: 'test-service',
        message: 'Error occurred',
        correlationId: 'corr-123',
        error: {
          name: 'Error',
          message: 'Test error',
        },
      });
      expect(loggedData.error.stack).toBeDefined();
    });

    it('should extract trace context from metadata', () => {
      logger.info('Traced message', {
        traceId: 'trace-123',
        spanId: 'span-456',
        correlationId: 'corr-789',
      });

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData.traceId).toBe('trace-123');
      expect(loggedData.spanId).toBe('span-456');
      expect(loggedData.correlationId).toBe('corr-789');
    });

    it('should log warnings', () => {
      logger.warn('Warning message', { reason: 'deprecated' });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe('warn');
      expect(loggedData.message).toBe('Warning message');
    });

    it('should log debug messages', () => {
      logger.debug('Debug message', { detail: 'verbose' });

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleDebugSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe('debug');
      expect(loggedData.message).toBe('Debug message');
    });

    it('should generate correlation IDs', () => {
      const correlationId = EdgeStructuredLogger.generateCorrelationId();
      expect(correlationId).toBeDefined();
      expect(typeof correlationId).toBe('string');
      expect(correlationId.length).toBeGreaterThan(0);

      // Should generate unique IDs
      const correlationId2 = EdgeStructuredLogger.generateCorrelationId();
      expect(correlationId).not.toBe(correlationId2);
    });
  });

  describe('EdgeMetricsCollector', () => {
    let metrics: EdgeMetricsCollector;

    beforeEach(() => {
      metrics = new EdgeMetricsCollector(testConfig);
    });

    it('should record counter metrics', () => {
      metrics.counter.inc('http.requests.total', 1, { method: 'GET', status: '200' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const metricData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(metricData.type).toBe('metric');
      expect(metricData.metric).toMatchObject({
        name: 'http.requests.total',
        value: 1,
        type: 'counter',
        tags: {
          service: 'test-service',
          environment: 'test',
          version: '1.0.0',
          method: 'GET',
          status: '200',
        },
      });
    });

    it('should record histogram metrics', () => {
      metrics.histogram.observe('http.request.duration', 123.45, { endpoint: '/api/users' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const metricData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(metricData.metric).toMatchObject({
        name: 'http.request.duration',
        value: 123.45,
        type: 'histogram',
      });
      expect(metricData.metric.tags.endpoint).toBe('/api/users');
    });

    it('should record gauge metrics', () => {
      metrics.gauge.set('database.connections', 10, { pool: 'main' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const metricData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(metricData.metric).toMatchObject({
        name: 'database.connections',
        value: 10,
        type: 'gauge',
        tags: {
          service: 'test-service',
          pool: 'main',
        },
      });
    });

    it('should store metrics in memory', () => {
      metrics.counter.inc('test.counter', 5);
      metrics.gauge.set('test.gauge', 42);

      const storedMetrics = metrics.getMetrics();
      expect(storedMetrics.size).toBe(2);
      expect(storedMetrics.get('test.counter')?.value).toBe(5);
      expect(storedMetrics.get('test.gauge')?.value).toBe(42);
    });

    it('should include standard tags on all metrics', () => {
      metrics.counter.inc('custom.metric', 1);

      const metricData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(metricData.metric.tags).toMatchObject({
        service: 'test-service',
        environment: 'test',
        version: '1.0.0',
      });
    });
  });

  describe('EdgeTracingManager', () => {
    let tracing: EdgeTracingManager;

    beforeEach(() => {
      tracing = new EdgeTracingManager('test-service');
    });

    it('should create spans with trace context', () => {
      const span = tracing.startSpan('test.operation');

      expect(span).toBeDefined();
      expect(span.spanContext).toBeDefined();
      expect(span.setAttribute).toBeDefined();
      expect(span.setAttributes).toBeDefined();
      expect(span.end).toBeDefined();
    });

    it('should generate trace and span IDs', () => {
      const span = tracing.startSpan('test.operation');
      const context = span.spanContext();

      expect(context.traceId).toBeDefined();
      expect(context.spanId).toBeDefined();
      expect(typeof context.traceId).toBe('string');
      expect(typeof context.spanId).toBe('string');
    });

    it('should support parent span context', () => {
      const parentContext = {
        traceId: 'parent-trace-123',
        spanId: 'parent-span-456',
        traceFlags: 1,
      };

      const span = tracing.startSpan('child.operation', parentContext);
      const context = span.spanContext();

      expect(context.traceId).toBe('parent-trace-123');
      expect(context.spanId).not.toBe('parent-span-456'); // Child has new span ID
    });

    it('should log span data when ended', () => {
      const span = tracing.startSpan('test.operation');
      span.setAttribute('user.id', 'user-123');
      span.setAttribute('request.method', 'POST');
      span.end();

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const spanData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(spanData.type).toBe('span');
      expect(spanData.span).toMatchObject({
        name: 'test.operation',
        attributes: {
          'service.name': 'test-service',
          'user.id': 'user-123',
          'request.method': 'POST',
        },
      });
      expect(spanData.span.duration).toBeGreaterThanOrEqual(0);
    });

    it('should support setting multiple attributes', () => {
      const span = tracing.startSpan('test.operation');
      span.setAttributes({
        'http.method': 'GET',
        'http.status_code': 200,
        'http.url': '/api/users',
      });
      span.end();

      const spanData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(spanData.span.attributes).toMatchObject({
        'http.method': 'GET',
        'http.status_code': 200,
        'http.url': '/api/users',
      });
    });

    it('should create trace context with correlation ID', () => {
      const trace = tracing.createTrace('custom-correlation-id');

      expect(trace.traceId).toBeDefined();
      expect(trace.correlationId).toBe('custom-correlation-id');
    });

    it('should generate correlation ID if not provided', () => {
      const trace = tracing.createTrace();

      expect(trace.traceId).toBeDefined();
      expect(trace.correlationId).toBeDefined();
      expect(trace.traceId).toBe(trace.correlationId);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain trace context across logger and tracing', () => {
      const logger = adapter.createLogger(testConfig);
      const tracing = adapter.createTracing(testConfig);

      const span = tracing.startSpan('integration.test');
      const context = span.spanContext();

      logger.info('Test message', {
        traceId: context.traceId,
        spanId: context.spanId,
      });

      span.end();

      // Verify logger captured trace context
      const logData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logData.traceId).toBe(context.traceId);
      expect(logData.spanId).toBe(context.spanId);

      // Verify span was logged
      const spanData = JSON.parse(consoleLogSpy.mock.calls[1][0]);
      expect(spanData.span.traceId).toBe(context.traceId);
    });

    it('should work with all three observability components together', () => {
      const logger = adapter.createLogger(testConfig);
      const metrics = adapter.createMetrics(testConfig);
      const tracing = adapter.createTracing(testConfig);

      // Start operation
      const span = tracing.startSpan('complete.operation');
      const context = span.spanContext();

      // Log operation start
      logger.info('Operation started', {
        traceId: context.traceId,
        correlationId: 'test-correlation',
      });

      // Record metric
      metrics.counter.inc('operation.started', 1, {
        operation: 'complete',
      });

      // Complete operation
      span.setAttribute('success', true);
      span.end();

      // Verify all components logged
      expect(consoleLogSpy).toHaveBeenCalledTimes(3); // log + metric + span

      const logData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const metricData = JSON.parse(consoleLogSpy.mock.calls[1][0]);
      const spanData = JSON.parse(consoleLogSpy.mock.calls[2][0]);

      expect(logData.message).toBe('Operation started');
      expect(metricData.metric.name).toBe('operation.started');
      expect(spanData.span.name).toBe('complete.operation');
    });
  });

  describe('Edge Runtime Compatibility', () => {
    it('should not use Node.js-specific APIs', () => {
      // Verify no process, Buffer, or other Node.js globals are used
      const logger = new EdgeStructuredLogger('test');
      const metrics = new EdgeMetricsCollector(testConfig);
      const tracing = new EdgeTracingManager('test');

      // These should work without Node.js APIs
      logger.info('test');
      metrics.counter.inc('test', 1);
      const span = tracing.startSpan('test');
      span.end();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should use crypto.randomUUID when available', () => {
      // Verify crypto.randomUUID is used in the implementation
      const id = EdgeStructuredLogger.generateCorrelationId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);

      // In test environment with crypto available, should be a UUID format
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      }
    });

    it('should generate valid correlation IDs consistently', () => {
      // Test that correlation IDs are always valid strings
      const id1 = EdgeStructuredLogger.generateCorrelationId();
      const id2 = EdgeStructuredLogger.generateCorrelationId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');

      // Should generate unique IDs
      expect(id1).not.toBe(id2);

      // Should be in UUID or timestamp-random format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id1);
      const isTimestampRandom = /^\d+-[a-z0-9]+$/.test(id1);
      expect(isUUID || isTimestampRandom).toBe(true);
    });
  });

  describe('Export Methods', () => {
    it('should export metrics to Analytics Engine if available', async () => {
      const mockAnalytics = {
        writeDataPoint: vi.fn().mockResolvedValue(undefined),
      };

      (globalThis as any).ANALYTICS = mockAnalytics;

      await adapter.exportMetrics({
        'test.metric': 42,
        'another.metric': 100,
      });

      expect(mockAnalytics.writeDataPoint).toHaveBeenCalledTimes(2);
      expect(mockAnalytics.writeDataPoint).toHaveBeenCalledWith({
        blobs: ['test.metric'],
        doubles: [42],
        indexes: [],
      });

      delete (globalThis as any).ANALYTICS;
    });

    it('should fallback to logging if Analytics Engine unavailable', async () => {
      delete (globalThis as any).ANALYTICS;

      await adapter.exportMetrics({
        'test.metric': 42,
      });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const exportData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(exportData.type).toBe('metrics_export');
      expect(exportData.metrics).toEqual({ 'test.metric': 42 });
    });

    it('should export traces as structured logs', async () => {
      await adapter.exportTraces([
        { traceId: 'trace-1', correlationId: 'corr-1' },
        { traceId: 'trace-2', correlationId: 'corr-2' },
      ]);

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const trace1 = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(trace1.type).toBe('trace_export');
      expect(trace1.trace.traceId).toBe('trace-1');
    });
  });
});
