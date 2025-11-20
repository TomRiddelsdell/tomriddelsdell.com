/**
 * HTTP-based OTLP (OpenTelemetry Protocol) Exporter
 * 
 * Edge runtime compatible exporter that sends telemetry data via HTTP POST.
 * Compatible with Cloudflare Workers, Next.js Edge Runtime, and other V8 isolate environments.
 * 
 * Implements OTLP/HTTP specification:
 * https://opentelemetry.io/docs/specs/otlp/#otlphttp
 */

import type { LogEntry, MetricTags, Span, SpanContext } from '../types.js';

export interface OTLPExporterConfig {
  /** OTLP endpoint URL (e.g., "https://otel.example.com" or "http://localhost:4318") */
  endpoint: string;
  
  /** Optional headers for authentication */
  headers?: Record<string, string>;
  
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
  
  /** Batch size before flushing (default: 100) */
  batchSize?: number;
  
  /** Flush interval in milliseconds (default: 5000) */
  flushInterval?: number;
}

/**
 * OTLP Resource Span format
 * Simplified version matching OTLP/HTTP spec
 */
interface OTLPSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number; // 0=UNSPECIFIED, 1=INTERNAL, 2=SERVER, 3=CLIENT, 4=PRODUCER, 5=CONSUMER
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: Array<{ key: string; value: { stringValue?: string; intValue?: number; boolValue?: boolean } }>;
  status?: {
    code: number; // 0=UNSET, 1=OK, 2=ERROR
    message?: string;
  };
}

/**
 * OTLP Metric format
 */
interface OTLPMetric {
  name: string;
  unit?: string;
  sum?: {
    aggregationTemporality: number; // 1=DELTA, 2=CUMULATIVE
    isMonotonic: boolean;
    dataPoints: Array<{
      timeUnixNano: string;
      asDouble?: number;
      asInt?: number;
      attributes: Array<{ key: string; value: { stringValue?: string } }>;
    }>;
  };
  gauge?: {
    dataPoints: Array<{
      timeUnixNano: string;
      asDouble?: number;
      asInt?: number;
      attributes: Array<{ key: string; value: { stringValue?: string } }>;
    }>;
  };
  histogram?: {
    aggregationTemporality: number;
    dataPoints: Array<{
      timeUnixNano: string;
      count: number;
      sum?: number;
      bucketCounts: number[];
      explicitBounds: number[];
      attributes: Array<{ key: string; value: { stringValue?: string } }>;
    }>;
  };
}

/**
 * OTLP Log Record format
 */
interface OTLPLogRecord {
  timeUnixNano: string;
  severityNumber: number; // 1=TRACE, 5=DEBUG, 9=INFO, 13=WARN, 17=ERROR, 21=FATAL
  severityText: string;
  body: { stringValue: string };
  attributes: Array<{ key: string; value: { stringValue?: string; intValue?: number } }>;
  traceId?: string;
  spanId?: string;
}

/**
 * HTTP-based OTLP Exporter
 * 
 * Batches and exports telemetry data to an OTLP/HTTP endpoint.
 * Compatible with edge runtimes (Cloudflare Workers, Next.js Edge, etc.).
 */
export class OTLPHTTPExporter {
  private config: Required<OTLPExporterConfig>;
  private spanBuffer: OTLPSpan[] = [];
  private metricBuffer: OTLPMetric[] = [];
  private logBuffer: OTLPLogRecord[] = [];
  private flushTimer: NodeJS.Timeout | number | null = null;

  constructor(config: OTLPExporterConfig) {
    this.config = {
      endpoint: config.endpoint,
      headers: config.headers || {},
      timeout: config.timeout || 10000,
      batchSize: config.batchSize || 100,
      flushInterval: config.flushInterval || 5000,
    };

    // Start automatic flush timer
    this.startFlushTimer();
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    // Use setInterval for periodic flushing
    this.flushTimer = setInterval(() => {
      this.flushAll().catch((error) => {
        console.error('OTLP HTTP Exporter: Flush failed', error);
      });
    }, this.config.flushInterval) as any;
  }

  /**
   * Stop automatic flush timer
   */
  public shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer as any);
      this.flushTimer = null;
    }
    // Final flush
    this.flushAll().catch((error) => {
      console.error('OTLP HTTP Exporter: Final flush failed', error);
    });
  }

  /**
   * Export a span
   */
  public async exportSpan(span: {
    name: string;
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    startTime: number;
    endTime: number;
    attributes?: Record<string, string | number | boolean>;
    status?: { code: number; message?: string };
  }): Promise<void> {
    const otlpSpan: OTLPSpan = {
      traceId: this.hexToBase64(span.traceId),
      spanId: this.hexToBase64(span.spanId),
      parentSpanId: span.parentSpanId ? this.hexToBase64(span.parentSpanId) : undefined,
      name: span.name,
      kind: 1, // INTERNAL
      startTimeUnixNano: (span.startTime * 1_000_000).toString(),
      endTimeUnixNano: (span.endTime * 1_000_000).toString(),
      attributes: this.attributesToOTLP(span.attributes || {}),
      status: span.status,
    };

    this.spanBuffer.push(otlpSpan);

    // Flush if buffer is full
    if (this.spanBuffer.length >= this.config.batchSize) {
      await this.flushSpans();
    }
  }

  /**
   * Export a metric
   */
  public async exportMetric(metric: {
    name: string;
    value: number;
    type: 'counter' | 'gauge' | 'histogram';
    tags?: MetricTags;
    timestamp?: number;
  }): Promise<void> {
    const timestamp = (metric.timestamp || Date.now()) * 1_000_000;
    const attributes = this.tagsToOTLP(metric.tags || {});

    const otlpMetric: OTLPMetric = {
      name: metric.name,
      unit: undefined,
    };

    if (metric.type === 'counter') {
      otlpMetric.sum = {
        aggregationTemporality: 1, // DELTA
        isMonotonic: true,
        dataPoints: [
          {
            timeUnixNano: timestamp.toString(),
            asDouble: metric.value,
            attributes,
          },
        ],
      };
    } else if (metric.type === 'gauge') {
      otlpMetric.gauge = {
        dataPoints: [
          {
            timeUnixNano: timestamp.toString(),
            asDouble: metric.value,
            attributes,
          },
        ],
      };
    } else if (metric.type === 'histogram') {
      otlpMetric.histogram = {
        aggregationTemporality: 1, // DELTA
        dataPoints: [
          {
            timeUnixNano: timestamp.toString(),
            count: 1,
            sum: metric.value,
            bucketCounts: [1], // Simplified: single bucket
            explicitBounds: [],
            attributes,
          },
        ],
      };
    }

    this.metricBuffer.push(otlpMetric);

    // Flush if buffer is full
    if (this.metricBuffer.length >= this.config.batchSize) {
      await this.flushMetrics();
    }
  }

  /**
   * Export a log entry
   */
  public async exportLog(log: LogEntry): Promise<void> {
    const timestamp = new Date(log.timestamp).getTime() * 1_000_000;
    const severityMap = {
      debug: 5,
      info: 9,
      warn: 13,
      error: 17,
    };

    const attributes = [
      { key: 'service.name', value: { stringValue: log.service } },
      ...(log.correlationId ? [{ key: 'correlation.id', value: { stringValue: log.correlationId } }] : []),
      ...(log.userId ? [{ key: 'user.id', value: { stringValue: log.userId } }] : []),
      ...(log.aggregateId ? [{ key: 'aggregate.id', value: { stringValue: log.aggregateId } }] : []),
      ...(log.metadata ? Object.entries(log.metadata).map(([key, value]) => ({
        key,
        value: { stringValue: String(value) },
      })) : []),
    ];

    const otlpLog: OTLPLogRecord = {
      timeUnixNano: timestamp.toString(),
      severityNumber: severityMap[log.level] || 9,
      severityText: log.level.toUpperCase(),
      body: { stringValue: log.message },
      attributes,
      traceId: log.traceId ? this.hexToBase64(log.traceId) : undefined,
      spanId: log.spanId ? this.hexToBase64(log.spanId) : undefined,
    };

    this.logBuffer.push(otlpLog);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.config.batchSize) {
      await this.flushLogs();
    }
  }

  /**
   * Flush all buffered telemetry
   */
  public async flushAll(): Promise<void> {
    await Promise.all([
      this.flushSpans(),
      this.flushMetrics(),
      this.flushLogs(),
    ]);
  }

  /**
   * Flush spans to OTLP endpoint
   */
  private async flushSpans(): Promise<void> {
    if (this.spanBuffer.length === 0) return;

    const spans = [...this.spanBuffer];
    this.spanBuffer = [];

    const payload = {
      resourceSpans: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: 'platform' } },
            ],
          },
          scopeSpans: [
            {
              scope: { name: '@platform/observability', version: '1.0.0' },
              spans,
            },
          ],
        },
      ],
    };

    await this.sendRequest(`${this.config.endpoint}/v1/traces`, payload);
  }

  /**
   * Flush metrics to OTLP endpoint
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricBuffer.length === 0) return;

    const metrics = [...this.metricBuffer];
    this.metricBuffer = [];

    const payload = {
      resourceMetrics: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: 'platform' } },
            ],
          },
          scopeMetrics: [
            {
              scope: { name: '@platform/observability', version: '1.0.0' },
              metrics,
            },
          ],
        },
      ],
    };

    await this.sendRequest(`${this.config.endpoint}/v1/metrics`, payload);
  }

  /**
   * Flush logs to OTLP endpoint
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    const payload = {
      resourceLogs: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: 'platform' } },
            ],
          },
          scopeLogs: [
            {
              scope: { name: '@platform/observability', version: '1.0.0' },
              logRecords: logs,
            },
          ],
        },
      ],
    };

    await this.sendRequest(`${this.config.endpoint}/v1/logs`, payload);
  }

  /**
   * Send HTTP request to OTLP endpoint
   */
  private async sendRequest(url: string, payload: any): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        console.error(`OTLP HTTP export failed: ${response.status} ${response.statusText}`, text);
      }
    } catch (error) {
      // Log error but don't throw - observability should not break the application
      console.error('OTLP HTTP export error:', error);
    }
  }

  /**
   * Convert attributes to OTLP format
   */
  private attributesToOTLP(attrs: Record<string, string | number | boolean>): Array<{
    key: string;
    value: { stringValue?: string; intValue?: number; boolValue?: boolean };
  }> {
    return Object.entries(attrs).map(([key, value]) => {
      if (typeof value === 'string') {
        return { key, value: { stringValue: value } };
      } else if (typeof value === 'number') {
        return { key, value: { intValue: value } };
      } else {
        return { key, value: { boolValue: value } };
      }
    });
  }

  /**
   * Convert tags to OTLP attributes
   */
  private tagsToOTLP(tags: MetricTags): Array<{ key: string; value: { stringValue: string } }> {
    return Object.entries(tags)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => ({
        key,
        value: { stringValue: String(value) },
      }));
  }

  /**
   * Convert hex string to base64 (OTLP trace/span IDs)
   */
  private hexToBase64(hex: string): string {
    // Simple hex to base64 conversion
    // In production, use proper encoding library
    return hex;
  }
}

/**
 * Create an OTLP HTTP exporter from environment variables
 */
export function createOTLPExporterFromEnv(): OTLPHTTPExporter | null {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  
  if (!endpoint) {
    return null;
  }

  const headersStr = process.env.OTEL_EXPORTER_OTLP_HEADERS;
  const headers: Record<string, string> = {};
  
  if (headersStr) {
    try {
      // Parse headers from format: "key1=value1,key2=value2"
      headersStr.split(',').forEach((pair) => {
        const [key, value] = pair.split('=');
        if (key && value) {
          headers[key.trim()] = value.trim();
        }
      });
    } catch (error) {
      console.warn('Failed to parse OTEL_EXPORTER_OTLP_HEADERS:', error);
    }
  }

  return new OTLPHTTPExporter({
    endpoint,
    headers,
  });
}
