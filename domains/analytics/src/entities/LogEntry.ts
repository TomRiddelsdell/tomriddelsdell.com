import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';

export class LogEntryId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainException('LogEntryId cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: LogEntryId): boolean {
    return this.value === other.value;
  }

  static generate(): LogEntryId {
    return new LogEntryId(`log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }

  static fromString(value: string): LogEntryId {
    return new LogEntryId(value);
  }
}

export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum LogCategory {
  APPLICATION = 'application',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  AUDIT = 'audit',
  SYSTEM = 'system',
  BUSINESS = 'business',
  INTEGRATION = 'integration'
}

export interface LogContext {
  userId?: string;
  workflowId?: string;
  requestId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
}

export interface StructuredData {
  [key: string]: any;
}

export class LogEntry {
  private constructor(
    private readonly id: LogEntryId,
    private readonly level: LogLevel,
    private readonly message: string,
    private readonly category: LogCategory,
    private readonly source: string,
    private readonly timestamp: Date,
    private readonly context: LogContext = {},
    private readonly structuredData: StructuredData = {},
    private readonly tags: string[] = [],
    private readonly error?: Error
  ) {
    if (!message || message.trim().length === 0) {
      throw new DomainException('Log message cannot be empty');
    }
    if (!source || source.trim().length === 0) {
      throw new DomainException('Log source cannot be empty');
    }
  }

  static create(
    level: LogLevel,
    message: string,
    category: LogCategory,
    source: string,
    options: {
      id?: LogEntryId;
      timestamp?: Date;
      context?: LogContext;
      structuredData?: StructuredData;
      tags?: string[];
      error?: Error;
    } = {}
  ): LogEntry {
    return new LogEntry(
      options.id || LogEntryId.generate(),
      level,
      message,
      category,
      source,
      options.timestamp || new Date(),
      options.context || {},
      options.structuredData || {},
      options.tags || [],
      options.error
    );
  }

  // Factory methods for different log levels
  static trace(
    message: string,
    source: string,
    category: LogCategory = LogCategory.APPLICATION,
    options: {
      context?: LogContext;
      structuredData?: StructuredData;
      tags?: string[];
    } = {}
  ): LogEntry {
    return LogEntry.create(LogLevel.TRACE, message, category, source, options);
  }

  static debug(
    message: string,
    source: string,
    category: LogCategory = LogCategory.APPLICATION,
    options: {
      context?: LogContext;
      structuredData?: StructuredData;
      tags?: string[];
    } = {}
  ): LogEntry {
    return LogEntry.create(LogLevel.DEBUG, message, category, source, options);
  }

  static info(
    message: string,
    source: string,
    category: LogCategory = LogCategory.APPLICATION,
    options: {
      context?: LogContext;
      structuredData?: StructuredData;
      tags?: string[];
    } = {}
  ): LogEntry {
    return LogEntry.create(LogLevel.INFO, message, category, source, options);
  }

  static warn(
    message: string,
    source: string,
    category: LogCategory = LogCategory.APPLICATION,
    options: {
      context?: LogContext;
      structuredData?: StructuredData;
      tags?: string[];
    } = {}
  ): LogEntry {
    return LogEntry.create(LogLevel.WARN, message, category, source, options);
  }

  static error(
    message: string,
    source: string,
    error?: Error,
    category: LogCategory = LogCategory.APPLICATION,
    options: {
      context?: LogContext;
      structuredData?: StructuredData;
      tags?: string[];
    } = {}
  ): LogEntry {
    return LogEntry.create(LogLevel.ERROR, message, category, source, {
      ...options,
      error
    });
  }

  static fatal(
    message: string,
    source: string,
    error?: Error,
    category: LogCategory = LogCategory.APPLICATION,
    options: {
      context?: LogContext;
      structuredData?: StructuredData;
      tags?: string[];
    } = {}
  ): LogEntry {
    return LogEntry.create(LogLevel.FATAL, message, category, source, {
      ...options,
      error
    });
  }

  // Factory methods for specific use cases
  static userAction(
    userId: string,
    action: string,
    details: StructuredData = {}
  ): LogEntry {
    return LogEntry.create(
      LogLevel.INFO,
      `User action: ${action}`,
      LogCategory.AUDIT,
      'user-service',
      {
        context: { userId },
        structuredData: { action, ...details },
        tags: ['user-action', 'audit']
      }
    );
  }

  static workflowExecution(
    workflowId: string,
    userId: string,
    status: 'started' | 'completed' | 'failed',
    executionTime?: number,
    error?: Error
  ): LogEntry {
    const message = `Workflow ${status}: ${workflowId}`;
    const level = status === 'failed' ? LogLevel.ERROR : LogLevel.INFO;
    const structuredData: StructuredData = { workflowId, status };
    
    if (executionTime !== undefined) {
      structuredData.executionTime = executionTime;
    }

    return LogEntry.create(
      level,
      message,
      LogCategory.BUSINESS,
      'workflow-engine',
      {
        context: { userId, workflowId },
        structuredData,
        tags: ['workflow', 'execution', status],
        error
      }
    );
  }

  static securityEvent(
    eventType: string,
    userId: string,
    ipAddress: string,
    details: StructuredData = {}
  ): LogEntry {
    return LogEntry.create(
      LogLevel.WARN,
      `Security event: ${eventType}`,
      LogCategory.SECURITY,
      'security-service',
      {
        context: { userId, ipAddress },
        structuredData: { eventType, ...details },
        tags: ['security', eventType.toLowerCase()]
      }
    );
  }

  static performanceMetric(
    operation: string,
    duration: number,
    context: LogContext = {},
    additionalData: StructuredData = {}
  ): LogEntry {
    return LogEntry.create(
      LogLevel.INFO,
      `Performance: ${operation} completed in ${duration}ms`,
      LogCategory.PERFORMANCE,
      'performance-monitor',
      {
        context,
        structuredData: { operation, duration, ...additionalData },
        tags: ['performance', 'timing']
      }
    );
  }

  static apiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    context: LogContext = {}
  ): LogEntry {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    return LogEntry.create(
      level,
      `${method} ${endpoint} - ${statusCode} (${responseTime}ms)`,
      LogCategory.APPLICATION,
      'api-gateway',
      {
        context,
        structuredData: { method, endpoint, statusCode, responseTime },
        tags: ['api', 'request', `status-${Math.floor(statusCode / 100)}xx`]
      }
    );
  }

  static integrationEvent(
    serviceName: string,
    eventType: string,
    status: 'success' | 'failure',
    details: StructuredData = {}
  ): LogEntry {
    const level = status === 'failure' ? LogLevel.ERROR : LogLevel.INFO;
    
    return LogEntry.create(
      level,
      `Integration ${eventType} with ${serviceName}: ${status}`,
      LogCategory.INTEGRATION,
      'integration-service',
      {
        structuredData: { serviceName, eventType, status, ...details },
        tags: ['integration', serviceName.toLowerCase(), status]
      }
    );
  }

  // Query and filtering methods
  matchesLevel(level: LogLevel): boolean {
    const levelOrder = [
      LogLevel.TRACE, LogLevel.DEBUG, LogLevel.INFO, 
      LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL
    ];
    
    return levelOrder.indexOf(this.level) >= levelOrder.indexOf(level);
  }

  matchesCategory(category: LogCategory): boolean {
    return this.category === category;
  }

  matchesSource(source: string): boolean {
    return this.source === source;
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  hasAnyTag(tags: string[]): boolean {
    return tags.some(tag => this.hasTag(tag));
  }

  isInTimeRange(startTime: Date, endTime: Date): boolean {
    return this.timestamp >= startTime && this.timestamp <= endTime;
  }

  matchesContext(contextFilter: Partial<LogContext>): boolean {
    for (const [key, value] of Object.entries(contextFilter)) {
      if (this.context[key as keyof LogContext] !== value) {
        return false;
      }
    }
    return true;
  }

  // Formatting methods
  toJSON(): object {
    return {
      id: this.id.toString(),
      level: this.level,
      message: this.message,
      category: this.category,
      source: this.source,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      structuredData: this.structuredData,
      tags: this.tags,
      error: this.error ? {
        name: this.error.name,
        message: this.error.message,
        stack: this.error.stack
      } : undefined
    };
  }

  toLogString(): string {
    const timestamp = this.timestamp.toISOString();
    const level = this.level.toUpperCase().padEnd(5);
    const source = `[${this.source}]`;
    const message = this.message;
    
    let logLine = `${timestamp} ${level} ${source} ${message}`;
    
    if (Object.keys(this.structuredData).length > 0) {
      logLine += ` | Data: ${JSON.stringify(this.structuredData)}`;
    }
    
    if (this.tags.length > 0) {
      logLine += ` | Tags: ${this.tags.join(', ')}`;
    }
    
    if (this.error) {
      logLine += ` | Error: ${this.error.message}`;
    }
    
    return logLine;
  }

  // Getters
  getId(): LogEntryId {
    return this.id;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  getMessage(): string {
    return this.message;
  }

  getCategory(): LogCategory {
    return this.category;
  }

  getSource(): string {
    return this.source;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getContext(): LogContext {
    return { ...this.context };
  }

  getStructuredData(): StructuredData {
    return { ...this.structuredData };
  }

  getTags(): string[] {
    return [...this.tags];
  }

  getError(): Error | undefined {
    return this.error;
  }

  equals(other: LogEntry): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return this.toLogString();
  }
}