/**
 * Unit tests for metrics collection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector, TechnicalMetrics } from '../src/metrics';

describe('MetricsCollector', () => {
  let metrics: MetricsCollector;

  beforeEach(() => {
    metrics = new MetricsCollector({
      serviceName: 'test-service',
      environment: 'test',
      version: '1.0.0',
    });
  });

  it('should increment counters', () => {
    expect(() => {
      metrics.counter.inc('test.counter', 1, { tag: 'value' });
    }).not.toThrow();
  });

  it('should observe histogram values', () => {
    expect(() => {
      metrics.histogram.observe('test.histogram', 123.45, { tag: 'value' });
    }).not.toThrow();
  });

  it('should set gauge values', () => {
    expect(() => {
      metrics.gauge.set('test.gauge', 42, { tag: 'value' });
    }).not.toThrow();
  });

  it('should have predefined technical metrics', () => {
    expect(TechnicalMetrics.EVENT_PROCESSING_LATENCY).toBe('event.processing.latency');
    expect(TechnicalMetrics.PROJECTION_LAG_SECONDS).toBe('projection.lag.seconds');
    expect(TechnicalMetrics.HTTP_REQUEST_DURATION).toBe('http.request.duration');
    expect(TechnicalMetrics.DATABASE_CONNECTION_POOL_USAGE).toBe('database.connection.pool.usage');
    expect(TechnicalMetrics.ERROR_RATE_BY_SERVICE).toBe('error.rate.by.service');
  });
});
