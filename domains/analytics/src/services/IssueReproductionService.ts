import { LogEntry, LogLevel, LogCategory } from '../entities/LogEntry';
import { MetricCollectionService } from './MetricCollectionService';
import { Metric, MetricType } from '../entities/Metric';

/**
 * Service for reproducing and analyzing issues using centralized logs
 * Provides tools for log correlation, pattern detection, and root cause analysis
 */
export class IssueReproductionService {
  constructor(
    private metricService: MetricCollectionService,
    private logs: LogEntry[] = []
  ) {}

  /**
   * Collect logs for a specific time window around an incident
   */
  async collectIncidentLogs(
    incidentTime: Date,
    windowMinutes: number = 30,
    filters?: {
      userId?: string;
      workflowId?: string;
      requestId?: string;
      component?: string;
    }
  ): Promise<LogEntry[]> {
    const startTime = new Date(incidentTime.getTime() - (windowMinutes * 60 * 1000));
    const endTime = new Date(incidentTime.getTime() + (windowMinutes * 60 * 1000));

    return this.logs.filter(log => {
      const inTimeWindow = log.timestamp >= startTime && log.timestamp <= endTime;
      
      if (!inTimeWindow) return false;
      
      // Apply optional filters
      if (filters?.userId && log.context.userId !== filters.userId) return false;
      if (filters?.workflowId && log.context.workflowId !== filters.workflowId) return false;
      if (filters?.requestId && log.context.requestId !== filters.requestId) return false;
      if (filters?.component && log.component !== filters.component) return false;
      
      return true;
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Analyze error patterns leading up to an issue
   */
  async analyzeErrorPattern(incidentTime: Date, lookbackMinutes: number = 60): Promise<{
    errorCount: number;
    errorTypes: Map<string, number>;
    affectedUsers: Set<string>;
    criticalErrors: LogEntry[];
    errorProgression: Array<{ time: Date; errorCount: number }>;
  }> {
    const startTime = new Date(incidentTime.getTime() - (lookbackMinutes * 60 * 1000));
    
    const errorLogs = this.logs.filter(log => 
      log.timestamp >= startTime && 
      log.timestamp <= incidentTime &&
      (log.level === LogLevel.ERROR || log.level === LogLevel.FATAL)
    );

    const errorTypes = new Map<string, number>();
    const affectedUsers = new Set<string>();
    const criticalErrors: LogEntry[] = [];
    
    errorLogs.forEach(log => {
      // Count error types
      const errorType = log.message.split(':')[0] || 'Unknown';
      errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);
      
      // Track affected users
      if (log.context.userId) {
        affectedUsers.add(log.context.userId);
      }
      
      // Identify critical errors
      if (log.level === LogLevel.FATAL || 
          log.message.includes('database') || 
          log.message.includes('timeout') ||
          log.message.includes('crash')) {
        criticalErrors.push(log);
      }
    });

    // Create error progression timeline (5-minute buckets)
    const errorProgression: Array<{ time: Date; errorCount: number }> = [];
    const bucketSize = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    for (let time = startTime.getTime(); time <= incidentTime.getTime(); time += bucketSize) {
      const bucketStart = new Date(time);
      const bucketEnd = new Date(time + bucketSize);
      
      const errorsInBucket = errorLogs.filter(log => 
        log.timestamp >= bucketStart && log.timestamp < bucketEnd
      ).length;
      
      errorProgression.push({
        time: bucketStart,
        errorCount: errorsInBucket
      });
    }

    return {
      errorCount: errorLogs.length,
      errorTypes,
      affectedUsers,
      criticalErrors,
      errorProgression
    };
  }

  /**
   * Trace a user's journey leading to an issue
   */
  async traceUserJourney(
    userId: string,
    incidentTime: Date,
    lookbackMinutes: number = 120
  ): Promise<{
    timeline: LogEntry[];
    actionsPerformed: string[];
    lastSuccessfulAction?: LogEntry;
    firstError?: LogEntry;
    workflowsAttempted: Set<string>;
  }> {
    const startTime = new Date(incidentTime.getTime() - (lookbackMinutes * 60 * 1000));
    
    const userLogs = this.logs.filter(log =>
      log.context.userId === userId &&
      log.timestamp >= startTime &&
      log.timestamp <= incidentTime
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const actionsPerformed: string[] = [];
    const workflowsAttempted = new Set<string>();
    let lastSuccessfulAction: LogEntry | undefined;
    let firstError: LogEntry | undefined;

    userLogs.forEach(log => {
      // Track actions
      if (log.category === LogCategory.APPLICATION && log.level === LogLevel.INFO) {
        actionsPerformed.push(log.message);
        lastSuccessfulAction = log;
      }
      
      // Track workflows
      if (log.context.workflowId) {
        workflowsAttempted.add(log.context.workflowId);
      }
      
      // Find first error
      if (!firstError && (log.level === LogLevel.ERROR || log.level === LogLevel.FATAL)) {
        firstError = log;
      }
    });

    return {
      timeline: userLogs,
      actionsPerformed,
      lastSuccessfulAction,
      firstError,
      workflowsAttempted
    };
  }

  /**
   * Correlate logs with system metrics during an incident
   */
  async correlateWithMetrics(
    incidentTime: Date,
    windowMinutes: number = 15
  ): Promise<{
    logs: LogEntry[];
    metrics: Metric[];
    correlations: Array<{
      metric: Metric;
      relatedLogs: LogEntry[];
      correlation: 'high' | 'medium' | 'low';
    }>;
  }> {
    const startTime = new Date(incidentTime.getTime() - (windowMinutes * 60 * 1000));
    const endTime = new Date(incidentTime.getTime() + (windowMinutes * 60 * 1000));

    const incidentLogs = this.logs.filter(log =>
      log.timestamp >= startTime && log.timestamp <= endTime
    );

    // Get metrics for the same time window
    const metrics = await this.metricService.getMetricsInTimeRange(startTime, endTime);
    
    const correlations: Array<{
      metric: Metric;
      relatedLogs: LogEntry[];
      correlation: 'high' | 'medium' | 'low';
    }> = [];

    metrics.forEach(metric => {
      // Find logs that occurred around the same time as metric spikes
      const relatedLogs = incidentLogs.filter(log => {
        const timeDiff = Math.abs(log.timestamp.getTime() - metric.timestamp.getTime());
        return timeDiff <= 5 * 60 * 1000; // Within 5 minutes
      });

      // Determine correlation strength
      let correlation: 'high' | 'medium' | 'low' = 'low';
      
      if (metric.type === MetricType.COUNTER && metric.value > 100) {
        correlation = 'high'; // High activity correlates with many logs
      } else if (metric.type === MetricType.GAUGE && metric.value > 80) {
        correlation = 'medium'; // High resource usage might correlate
      } else if (relatedLogs.some(log => log.level === LogLevel.ERROR)) {
        correlation = 'high'; // Errors strongly correlate with performance issues
      }

      if (relatedLogs.length > 0) {
        correlations.push({
          metric,
          relatedLogs,
          correlation
        });
      }
    });

    return {
      logs: incidentLogs,
      metrics,
      correlations
    };
  }

  /**
   * Generate a comprehensive incident report
   */
  async generateIncidentReport(
    incidentTime: Date,
    description: string,
    affectedUsers?: string[],
    affectedWorkflows?: string[]
  ): Promise<{
    summary: string;
    timeline: LogEntry[];
    errorAnalysis: any;
    userJourneys: any[];
    systemMetrics: any;
    rootCauseHypotheses: string[];
    recommendedActions: string[];
  }> {
    const windowMinutes = 60;
    
    // Collect all relevant logs
    const timeline = await this.collectIncidentLogs(incidentTime, windowMinutes);
    
    // Analyze error patterns
    const errorAnalysis = await this.analyzeErrorPattern(incidentTime, windowMinutes);
    
    // Trace affected user journeys
    const userJourneys = [];
    if (affectedUsers) {
      for (const userId of affectedUsers) {
        const journey = await this.traceUserJourney(userId, incidentTime, 120);
        userJourneys.push({ userId, ...journey });
      }
    }
    
    // Correlate with system metrics
    const systemMetrics = await this.correlateWithMetrics(incidentTime, 30);
    
    // Generate hypotheses based on patterns
    const rootCauseHypotheses = this.generateRootCauseHypotheses(
      errorAnalysis, 
      systemMetrics,
      timeline
    );
    
    // Recommend actions
    const recommendedActions = this.generateRecommendedActions(
      errorAnalysis,
      systemMetrics,
      rootCauseHypotheses
    );

    const summary = `
Incident: ${description}
Time: ${incidentTime.toISOString()}
Duration: Analyzed ${windowMinutes} minutes around incident
Affected Users: ${affectedUsers?.length || 'Unknown'}
Error Count: ${errorAnalysis.errorCount}
Critical Errors: ${errorAnalysis.criticalErrors.length}
    `.trim();

    return {
      summary,
      timeline,
      errorAnalysis,
      userJourneys,
      systemMetrics,
      rootCauseHypotheses,
      recommendedActions
    };
  }

  private generateRootCauseHypotheses(
    errorAnalysis: any,
    systemMetrics: any,
    timeline: LogEntry[]
  ): string[] {
    const hypotheses: string[] = [];
    
    // Database-related issues
    if (Array.from(errorAnalysis.errorTypes.keys()).some(type => 
      type.toLowerCase().includes('database') || 
      type.toLowerCase().includes('connection')
    )) {
      hypotheses.push('Database connectivity or performance issue');
    }
    
    // High error rate
    if (errorAnalysis.errorCount > 50) {
      hypotheses.push('System overload or cascading failure');
    }
    
    // Memory/CPU issues
    const highResourceUsage = systemMetrics.correlations.some((corr: any) => 
      corr.correlation === 'high' && 
      (corr.metric.name.includes('cpu') || corr.metric.name.includes('memory'))
    );
    
    if (highResourceUsage) {
      hypotheses.push('Resource exhaustion (CPU/Memory)');
    }
    
    // Authentication issues
    if (timeline.some(log => 
      log.category === LogCategory.SECURITY && 
      log.message.includes('auth')
    )) {
      hypotheses.push('Authentication service degradation');
    }
    
    return hypotheses.length > 0 ? hypotheses : ['Unknown - requires further investigation'];
  }

  private generateRecommendedActions(
    errorAnalysis: any,
    systemMetrics: any,
    hypotheses: string[]
  ): string[] {
    const actions: string[] = [];
    
    hypotheses.forEach(hypothesis => {
      if (hypothesis.includes('Database')) {
        actions.push('Check database connection pool and query performance');
        actions.push('Review recent database schema changes');
      }
      
      if (hypothesis.includes('overload')) {
        actions.push('Implement rate limiting and circuit breakers');
        actions.push('Scale horizontally or increase resource allocation');
      }
      
      if (hypothesis.includes('Resource exhaustion')) {
        actions.push('Investigate memory leaks and optimize resource usage');
        actions.push('Add resource monitoring alerts');
      }
      
      if (hypothesis.includes('Authentication')) {
        actions.push('Check authentication service health and dependencies');
        actions.push('Review authentication token expiration settings');
      }
    });
    
    // General recommendations
    actions.push('Implement additional monitoring for early detection');
    actions.push('Create runbook for similar incidents');
    
    return Array.from(new Set(actions)); // Remove duplicates
  }

  /**
   * Add a log entry for testing/demonstration
   */
  addLog(log: LogEntry): void {
    this.logs.push(log);
  }

  /**
   * Clear all logs (for testing)
   */
  clearLogs(): void {
    this.logs = [];
  }
}