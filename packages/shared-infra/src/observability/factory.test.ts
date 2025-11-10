// packages/shared-infra/src/observability/factory.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { detectRuntime, createObservability } from './factory'
import type { ObservabilityConfig } from './types'

describe('observability/factory', () => {
  describe('detectRuntime', () => {
    let originalProcess: typeof globalThis.process

    beforeEach(() => {
      originalProcess = globalThis.process
    })

    afterEach(() => {
      globalThis.process = originalProcess
    })

    it('should detect Node.js runtime when process.versions.node exists', () => {
      globalThis.process = {
        versions: { node: '18.0.0' },
      } as typeof process

      expect(detectRuntime()).toBe('nodejs')
    })

    it('should detect edge runtime when process.versions.node is undefined', () => {
      // @ts-expect-error - Testing runtime detection
      globalThis.process = undefined

      expect(detectRuntime()).toBe('edge')
    })

    it('should detect edge runtime when process exists but versions.node is undefined', () => {
      globalThis.process = {
        versions: {},
      } as typeof process

      expect(detectRuntime()).toBe('edge')
    })
  })

  describe('createObservability', () => {
    const validConfig: ObservabilityConfig = {
      serviceName: 'test-service',
      serviceVersion: '1.0.0',
      environment: 'development',
      otlp: {
        endpoint: 'http://localhost:4318/v1/traces',
      },
    }

    it('should create Node.js observability when runtime hint is nodejs', () => {
      const obs = createObservability({
        ...validConfig,
        runtime: 'nodejs',
      })

      expect(obs).toBeDefined()
      expect(obs.log).toBeDefined()
      expect(obs.metrics).toBeDefined()
      expect(obs.tracing).toBeDefined()
    })

    it('should create Edge observability when runtime hint is edge', () => {
      const obs = createObservability({
        ...validConfig,
        runtime: 'edge',
      })

      expect(obs).toBeDefined()
      expect(obs.log).toBeDefined()
      expect(obs.metrics).toBeDefined()
      expect(obs.tracing).toBeDefined()
    })

    it('should auto-detect runtime when no hint provided', () => {
      const obs = createObservability(validConfig)

      expect(obs).toBeDefined()
      expect(obs.log).toBeDefined()
      expect(obs.metrics).toBeDefined()
      expect(obs.tracing).toBeDefined()
    })

    describe('config validation', () => {
      it('should throw error when serviceName is missing', () => {
        const invalidConfig = {
          ...validConfig,
          serviceName: '',
        }

        expect(() => createObservability(invalidConfig)).toThrow(
          'serviceName is required and cannot be empty'
        )
      })

      it('should throw error when serviceVersion is missing', () => {
        const invalidConfig = {
          ...validConfig,
          serviceVersion: '',
        }

        expect(() => createObservability(invalidConfig)).toThrow(
          'serviceVersion is required and cannot be empty'
        )
      })

      it('should throw error when environment is invalid', () => {
        const invalidConfig = {
          ...validConfig,
          environment: 'invalid' as 'development',
        }

        expect(() => createObservability(invalidConfig)).toThrow(
          'environment must be one of: development, staging, production'
        )
      })

      it('should throw error when otlp endpoint is missing', () => {
        const invalidConfig = {
          ...validConfig,
          otlp: {},
        } as ObservabilityConfig

        expect(() => createObservability(invalidConfig)).toThrow(
          'otlp.endpoint is required'
        )
      })

      it('should throw error when sampling rate is invalid', () => {
        const invalidConfig = {
          ...validConfig,
          sampling: {
            rate: 1.5, // Invalid: must be 0-1
          },
        }

        expect(() => createObservability(invalidConfig)).toThrow(
          'sampling.rate must be a number between 0 and 1'
        )
      })

      it('should accept valid sampling rate', () => {
        const validSamplingConfig = {
          ...validConfig,
          sampling: {
            rate: 0.5,
          },
        }

        expect(() => createObservability(validSamplingConfig)).not.toThrow()
      })
    })

    describe('logger interface', () => {
      it('should provide all logger methods', () => {
        const obs = createObservability({ ...validConfig, runtime: 'edge' })

        expect(typeof obs.log.debug).toBe('function')
        expect(typeof obs.log.info).toBe('function')
        expect(typeof obs.log.warn).toBe('function')
        expect(typeof obs.log.error).toBe('function')
      })
    })

    describe('metrics interface', () => {
      it('should provide all metrics methods', () => {
        const obs = createObservability({ ...validConfig, runtime: 'edge' })

        expect(typeof obs.metrics.counter).toBe('function')
        expect(typeof obs.metrics.gauge).toBe('function')
        expect(typeof obs.metrics.histogram).toBe('function')
        expect(obs.metrics.eventSourcing).toBeDefined()
      })

      it('should provide all event sourcing metrics', () => {
        const obs = createObservability({ ...validConfig, runtime: 'edge' })
        const es = obs.metrics.eventSourcing

        expect(typeof es.eventsPerCommit).toBe('function')
        expect(typeof es.aggregateSize).toBe('function')
        expect(typeof es.concurrencyConflict).toBe('function')
        expect(typeof es.projectionLag).toBe('function')
        expect(typeof es.projectionThroughput).toBe('function')
        expect(typeof es.projectionError).toBe('function')
        expect(typeof es.snapshotOperation).toBe('function')
        expect(typeof es.snapshotHitRatio).toBe('function')
        expect(typeof es.eventsReplayed).toBe('function')
        expect(typeof es.eventStoreWriteLatency).toBe('function')
      })
    })

    describe('tracing interface', () => {
      it('should provide all tracing methods', () => {
        const obs = createObservability({ ...validConfig, runtime: 'edge' })

        expect(typeof obs.tracing.trace).toBe('function')
        expect(typeof obs.tracing.addMetadata).toBe('function')
        expect(typeof obs.tracing.getTraceId).toBe('function')
      })

      it('should execute trace callback', async () => {
        const obs = createObservability({ ...validConfig, runtime: 'edge' })
        const mockFn = vi.fn(async (ctx) => {
          ctx.addMetadata('test', 'value')
          ctx.setSuccess()
          return 'result'
        })

        const result = await obs.tracing.trace('testOp', mockFn)

        expect(result).toBe('result')
        expect(mockFn).toHaveBeenCalledTimes(1)
      })
    })
  })
})
