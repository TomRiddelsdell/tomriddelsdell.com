/**
 * Unit tests for MetricsCollector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsCollector, TechnicalMetrics } from '../metrics';
import type { TelemetryConfig } from '../types';

describe('MetricsCollector', () => {
  let metricsCollector: MetricsCollector;
  let config: TelemetryConfig;

  beforeEach(() => {
    config = {
      serviceName: 'test-service',
      version: '1.0.0',
      environment: 'test',
      platform: 'node',
      samplingRate: 1.0,
    };
    metricsCollector = new MetricsCollector(config);
  });

  describe('counter', () => {
    it('should create and increment counter', () => {
      expect(() => {
        metricsCollector.counter.inc('test.counter', 1, {
          service: 'test-service',
        });
      }).not.toThrow();
    });

    it('should handle counter without tags', () => {
      expect(() => {
        metricsCollector.counter.inc('test.counter.simple', 5);
      }).not.toThrow();
    });

    it('should increment by custom value', () => {
      expect(() => {
        metricsCollector.counter.inc('test.counter.custom', 10, {
          operation: 'batch',
        });
      }).not.toThrow();
    });
  });

  describe('histogram', () => {
    it('should observe histogram values', () => {
      expect(() => {
        metricsCollector.histogram.observe('test.histogram', 123.45, {
          endpoint: '/api/test',
        });
      }).not.toThrow();
    });

    it('should handle histogram without tags', () => {
      expect(() => {
        metricsCollector.histogram.observe('test.histogram.simple', 50);
      }).not.toThrow();
    });

    it('should observe various duration values', () => {
      expect(() => {
        metricsCollector.histogram.observe('request.duration', 0.001); // 1ms
        metricsCollector.histogram.observe('request.duration', 0.1); // 100ms
        metricsCollector.histogram.observe('request.duration', 1.5); // 1.5s
      }).not.toThrow();
    });
  });

  describe('gauge', () => {
    it('should set gauge values', () => {
      expect(() => {
        metricsCollector.gauge.set('test.gauge', 42, {
          resource: 'memory',
        });
      }).not.toThrow();
    });

    it('should handle gauge without tags', () => {
      expect(() => {
        metricsCollector.gauge.set('test.gauge.simple', 100);
      }).not.toThrow();
    });

    it('should update gauge value', () => {
      expect(() => {
        metricsCollector.gauge.set('active.connections', 10);
        metricsCollector.gauge.set('active.connections', 15);
        metricsCollector.gauge.set('active.connections', 5);
      }).not.toThrow();
    });
  });

  describe('TechnicalMetrics', () => {
    it('should define expected metric names', () => {
      expect(TechnicalMetrics.EVENT_PROCESSING_LATENCY).toBe(
        'event.processing.latency'
      );
      expect(TechnicalMetrics.PROJECTION_LAG_SECONDS).toBe('projection.lag.seconds');
      expect(TechnicalMetrics.HTTP_REQUEST_DURATION).toBe(
        'http.request.duration'
      );
      expect(TechnicalMetrics.DATABASE_CONNECTION_POOL_USAGE).toBe(
        'database.connection.pool.usage'
      );
      expect(TechnicalMetrics.ERROR_RATE_BY_SERVICE).toBe('error.rate.by.service');
    });

    it('should use technical metrics for tracking', () => {
      expect(() => {
        metricsCollector.histogram.observe(
          TechnicalMetrics.HTTP_REQUEST_DURATION,
          0.15,
          { endpoint: '/api/test', method: 'GET' }
        );

        metricsCollector.histogram.observe(
          TechnicalMetrics.EVENT_PROCESSING_LATENCY,
          0.025,
          { eventType: 'UserCreated' }
        );

        metricsCollector.gauge.set(TechnicalMetrics.DB_CONNECTION_POOL, 8, {
          pool: 'main',
        });
      }).not.toThrow();
    });
  });

  describe('initialization', () => {
    it('should initialize with service metadata', () => {
      const collector = new MetricsCollector({
        serviceName: 'my-service',
        version: '2.0.0',
        environment: 'production',
        platform: 'aws',
        samplingRate: 0.1,
      });

      expect(collector).toBeDefined();
    });
  });
});
