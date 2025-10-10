/**
 * Unit tests for structured logging
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StructuredLogger } from '../src/logging';

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    logger = new StructuredLogger('test-service');
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log info messages with correct format', () => {
    logger.info('Test message', { userId: 'user-123' });

    expect(consoleLogSpy).toHaveBeenCalledOnce();
    const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

    expect(logOutput).toMatchObject({
      level: 'info',
      service: 'test-service',
      message: 'Test message',
      metadata: { userId: 'user-123' },
    });
    expect(logOutput.timestamp).toBeDefined();
  });

  it('should log error messages with stack traces', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error, { aggregateId: 'agg-456' });

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

    expect(logOutput).toMatchObject({
      level: 'error',
      service: 'test-service',
      message: 'Error occurred',
      metadata: { aggregateId: 'agg-456' },
    });
    expect(logOutput.error).toBeDefined();
    expect(logOutput.error.message).toBe('Test error');
    expect(logOutput.error.stack).toBeDefined();
  });

  it('should include correlation ID when provided', () => {
    logger.info('Request received', { correlationId: 'corr-123' });

    const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(logOutput.correlationId).toBe('corr-123');
  });

  it('should generate valid correlation IDs', () => {
    const correlationId = StructuredLogger.generateCorrelationId();
    
    expect(correlationId).toBeDefined();
    expect(typeof correlationId).toBe('string');
    expect(correlationId.length).toBeGreaterThan(0);
  });

  it('should warn with correct level', () => {
    logger.warn('Warning message', { reason: 'test' });

    expect(consoleWarnSpy).toHaveBeenCalledOnce();
    const logOutput = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

    expect(logOutput.level).toBe('warn');
  });
});
