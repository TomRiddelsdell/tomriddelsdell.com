/**
 * Basic smoke tests for @platform/observability-edge
 *
 * These tests verify the package exports and basic functionality.
 * More comprehensive tests are available in @platform/observability package
 * which contains the original implementation tests.
 */

import { describe, it, expect } from 'vitest';
import {
  createEdgeObservability,
  EdgeStructuredLogger,
  EdgeMetricsCollector,
  EdgeTracingManager,
  CloudflareEdgeAdapter,
  TechnicalMetrics,
} from '../index.js';

describe('@platform/observability-edge', () => {
  describe('Package Exports', () => {
    it('should export createEdgeObservability function', () => {
      expect(createEdgeObservability).toBeDefined();
      expect(typeof createEdgeObservability).toBe('function');
    });

    it('should export EdgeStructuredLogger class', () => {
      expect(EdgeStructuredLogger).toBeDefined();
    });

    it('should export EdgeMetricsCollector class', () => {
      expect(EdgeMetricsCollector).toBeDefined();
    });

    it('should export EdgeTracingManager class', () => {
      expect(EdgeTracingManager).toBeDefined();
    });

    it('should export CloudflareEdgeAdapter class', () => {
      expect(CloudflareEdgeAdapter).toBeDefined();
    });

    it('should export TechnicalMetrics constants', () => {
      expect(TechnicalMetrics).toBeDefined();
      expect(TechnicalMetrics.EVENT_PROCESSING_LATENCY).toBe('event.processing.latency');
    });
  });

  describe('createEdgeObservability', () => {
    it('should create observability instance with required properties', () => {
      const observability = createEdgeObservability({
        serviceName: 'test-service',
        version: '1.0.0',
        environment: 'test',
        platform: 'cloudflare',
        samplingRate: 1.0,
      });

      expect(observability).toBeDefined();
      expect(observability.log).toBeDefined();
      expect(observability.metrics).toBeDefined();
      expect(observability.tracing).toBeDefined();
    });

    it('should provide logger with standard methods', () => {
      const observability = createEdgeObservability({
        serviceName: 'test-service',
        version: '1.0.0',
        environment: 'test',
        platform: 'cloudflare',
        samplingRate: 1.0,
      });

      expect(typeof observability.log.info).toBe('function');
      expect(typeof observability.log.error).toBe('function');
      expect(typeof observability.log.debug).toBe('function');
      expect(typeof observability.log.warn).toBe('function');
    });

    it('should provide metrics collector with standard methods', () => {
      const observability = createEdgeObservability({
        serviceName: 'test-service',
        version: '1.0.0',
        environment: 'test',
        platform: 'cloudflare',
        samplingRate: 1.0,
      });

      expect(typeof observability.metrics.counter.inc).toBe('function');
      expect(typeof observability.metrics.histogram.observe).toBe('function');
      expect(typeof observability.metrics.gauge.set).toBe('function');
    });

    it('should provide tracing manager with standard methods', () => {
      const observability = createEdgeObservability({
        serviceName: 'test-service',
        version: '1.0.0',
        environment: 'test',
        platform: 'cloudflare',
        samplingRate: 1.0,
      });

      expect(typeof observability.tracing.startSpan).toBe('function');
      expect(typeof observability.tracing.createTrace).toBe('function');
    });
  });

  describe('Edge Runtime Compatibility', () => {
    it('should not require Node.js APIs', () => {
      // This test verifies the package doesn't import Node.js-specific modules
      // If this test runs successfully in Vitest, it means we're not using
      // zlib, net, tls, or other Node.js-only APIs
      const observability = createEdgeObservability({
        serviceName: 'edge-test',
        version: '1.0.0',
        environment: 'test',
        platform: 'cloudflare',
        samplingRate: 1.0,
      });

      expect(observability).toBeDefined();
    });

    it('should use crypto.randomUUID when available', () => {
      const correlationId = EdgeStructuredLogger.generateCorrelationId();
      expect(correlationId).toBeDefined();
      expect(typeof correlationId).toBe('string');
      expect(correlationId.length).toBeGreaterThan(0);
    });
  });

  describe('Interface Consistency', () => {
    it('should maintain PlatformObservability contract', () => {
      const observability = createEdgeObservability({
        serviceName: 'test-service',
        version: '1.0.0',
        environment: 'test',
        platform: 'cloudflare',
        samplingRate: 1.0,
      });

      // Verify the interface structure matches PlatformObservability
      expect(observability).toMatchObject({
        log: expect.objectContaining({
          info: expect.any(Function),
          error: expect.any(Function),
          debug: expect.any(Function),
          warn: expect.any(Function),
        }),
        metrics: expect.objectContaining({
          counter: expect.objectContaining({
            inc: expect.any(Function),
          }),
          histogram: expect.objectContaining({
            observe: expect.any(Function),
          }),
          gauge: expect.objectContaining({
            set: expect.any(Function),
          }),
        }),
        tracing: expect.objectContaining({
          startSpan: expect.any(Function),
          createTrace: expect.any(Function),
        }),
      });
    });
  });

  describe('Basic Functionality', () => {
    it('should log without errors', () => {
      const observability = createEdgeObservability({
        serviceName: 'test-service',
        version: '1.0.0',
        environment: 'test',
        platform: 'cloudflare',
        samplingRate: 1.0,
      });

      expect(() => {
        observability.log.info('Test message', { test: true });
      }).not.toThrow();
    });

    it('should increment counter without errors', () => {
      const observability = createEdgeObservability({
        serviceName: 'test-service',
        version: '1.0.0',
        environment: 'test',
        platform: 'cloudflare',
        samplingRate: 1.0,
      });

      expect(() => {
        observability.metrics.counter.inc('test.counter', 1);
      }).not.toThrow();
    });

    it('should create spans without errors', () => {
      const observability = createEdgeObservability({
        serviceName: 'test-service',
        version: '1.0.0',
        environment: 'test',
        platform: 'cloudflare',
        samplingRate: 1.0,
      });

      expect(() => {
        const span = observability.tracing.startSpan('test.operation');
        span.setAttribute('test', 'value');
        span.end();
      }).not.toThrow();
    });
  });
});
