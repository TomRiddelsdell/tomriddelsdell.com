import { LogEntry, LogLevel, LogCategory } from '../entities/LogEntry';
import { Metric, MetricType, MetricCategory } from '../entities/Metric';
import { MetricCollectionService } from '../services/MetricCollectionService';
import { IssueReproductionService } from '../services/IssueReproductionService';
import { DimensionCollection } from '../entities/Dimension';

/**
 * Interactive demonstration of issue reproduction using centralized logging
 * Shows real-world scenarios and investigation techniques
 */
export class IssueReproductionDemo {
  private reproductionService: IssueReproductionService;
  private metricService: MetricCollectionService;

  constructor() {
    this.metricService = new MetricCollectionService();
    this.reproductionService = new IssueReproductionService(this.metricService);
    this.setupDemoData();
  }

  /**
   * Scenario 1: User reports "Workflow keeps failing, can't figure out why"
   */
  async investigateWorkflowFailures(): Promise<void> {
    console.log('\n🔍 SCENARIO 1: Investigating Workflow Failures');
    console.log('User Report: "My automation workflow keeps failing randomly"');
    console.log('Time: 2024-06-11 14:30:00 UTC');
    console.log('User ID: user_123');
    console.log('Workflow ID: workflow_456');

    const incidentTime = new Date('2024-06-11T14:30:00Z');
    
    // Step 1: Collect logs around the incident
    console.log('\n📋 Step 1: Collecting logs around incident time...');
    const incidentLogs = await this.reproductionService.collectIncidentLogs(
      incidentTime,
      30, // 30-minute window
      {
        userId: 'user_123',
        workflowId: 'workflow_456'
      }
    );

    console.log(`Found ${incidentLogs.length} relevant log entries`);
    console.log('\nRecent error logs:');
    incidentLogs
      .filter(log => log.level === LogLevel.ERROR || log.level === LogLevel.FATAL)
      .slice(-3)
      .forEach(log => {
        console.log(`  ${log.timestamp.toISOString()} [${log.level}] ${log.message}`);
        if (log.context.requestId) console.log(`    Request: ${log.context.requestId}`);
      });

    // Step 2: Analyze error patterns
    console.log('\n📊 Step 2: Analyzing error patterns...');
    const errorAnalysis = await this.reproductionService.analyzeErrorPattern(incidentTime, 60);
    
    console.log(`Total errors in last hour: ${errorAnalysis.errorCount}`);
    console.log('Error types:');
    errorAnalysis.errorTypes.forEach((count, type) => {
      console.log(`  ${type}: ${count} occurrences`);
    });
    
    console.log(`Affected users: ${errorAnalysis.affectedUsers.size}`);
    console.log(`Critical errors: ${errorAnalysis.criticalErrors.length}`);

    // Step 3: Trace user journey
    console.log('\n👤 Step 3: Tracing user journey...');
    const userJourney = await this.reproductionService.traceUserJourney('user_123', incidentTime, 120);
    
    console.log('User actions leading to failure:');
    userJourney.actionsPerformed.slice(-5).forEach(action => {
      console.log(`  → ${action}`);
    });
    
    if (userJourney.firstError) {
      console.log(`\nFirst error occurred: ${userJourney.firstError.timestamp.toISOString()}`);
      console.log(`Error: ${userJourney.firstError.message}`);
    }

    // Step 4: Correlate with system metrics
    console.log('\n⚡ Step 4: Correlating with system metrics...');
    const correlation = await this.reproductionService.correlateWithMetrics(incidentTime, 15);
    
    const highCorrelations = correlation.correlations.filter(c => c.correlation === 'high');
    console.log(`Found ${highCorrelations.length} high correlations with system metrics`);
    
    highCorrelations.forEach(corr => {
      console.log(`  📈 ${corr.metric.name}: ${corr.metric.value} (${corr.relatedLogs.length} related logs)`);
    });

    // Step 5: Generate findings
    console.log('\n🎯 Investigation Results:');
    console.log('Root Cause: Database connection timeout during peak usage');
    console.log('Evidence:');
    console.log('  • Multiple "connection timeout" errors in logs');
    console.log('  • High database connection pool usage (95%)');
    console.log('  • Correlation with CPU spike at 14:28:30');
    console.log('  • User retried workflow 3 times before reporting');
    
    console.log('\n💡 Recommended Actions:');
    console.log('  1. Increase database connection pool size');
    console.log('  2. Add database query timeout monitoring');
    console.log('  3. Implement exponential backoff for retries');
    console.log('  4. Set up alerts for connection pool usage > 80%');
  }

  /**
   * Scenario 2: Performance degradation investigation
   */
  async investigatePerformanceDegradation(): Promise<void> {
    console.log('\n\n🔍 SCENARIO 2: Performance Degradation Investigation');
    console.log('User Report: "App is really slow today, pages taking forever to load"');
    console.log('Time: 2024-06-11 16:45:00 UTC');

    const incidentTime = new Date('2024-06-11T16:45:00Z');

    // Generate comprehensive incident report
    const report = await this.reproductionService.generateIncidentReport(
      incidentTime,
      'Performance degradation - slow page loads',
      ['user_789', 'user_101', 'user_234'], // Multiple affected users
      ['workflow_123', 'workflow_456'] // Affected workflows
    );

    console.log('\n📊 INCIDENT REPORT');
    console.log('='.repeat(50));
    console.log(report.summary);
    
    console.log('\n🔍 Root Cause Hypotheses:');
    report.rootCauseHypotheses.forEach((hypothesis, index) => {
      console.log(`  ${index + 1}. ${hypothesis}`);
    });

    console.log('\n⚠️ Error Analysis:');
    console.log(`  • Error progression shows spike starting at 16:42`);
    console.log(`  • Most common error: "Request timeout" (${Math.floor(Math.random() * 20) + 10} times)`);
    console.log(`  • Critical errors involve memory allocation failures`);

    console.log('\n👥 User Impact:');
    report.userJourneys.forEach((journey: any) => {
      console.log(`  • User ${journey.userId}: ${journey.actionsPerformed.length} actions, ${journey.workflowsAttempted.size} workflows attempted`);
    });

    console.log('\n🎯 Recommended Actions:');
    report.recommendedActions.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action}`);
    });
  }

  /**
   * Scenario 3: Security incident investigation
   */
  async investigateSecurityIncident(): Promise<void> {
    console.log('\n\n🔍 SCENARIO 3: Security Incident Investigation');
    console.log('Alert: Multiple failed login attempts detected');
    console.log('Time: 2024-06-11 20:15:00 UTC');
    console.log('Source IP: 192.168.1.100');

    const incidentTime = new Date('2024-06-11T20:15:00Z');

    // Look for security-related logs
    const securityLogs = await this.reproductionService.collectIncidentLogs(
      incidentTime,
      60, // 1-hour window
      { component: 'auth-service' }
    );

    const failedLogins = securityLogs.filter(log => 
      log.category === LogCategory.SECURITY && 
      log.message.includes('failed_login')
    );

    console.log('\n🚨 Security Analysis:');
    console.log(`Total security events: ${securityLogs.length}`);
    console.log(`Failed login attempts: ${failedLogins.length}`);

    // Analyze attack pattern
    const attackPattern = this.analyzeAttackPattern(failedLogins);
    console.log('\n🎯 Attack Pattern:');
    console.log(`  • Peak attempts: ${attackPattern.peakAttempts} per minute`);
    console.log(`  • Targeted accounts: ${attackPattern.targetedAccounts.join(', ')}`);
    console.log(`  • Attack duration: ${attackPattern.durationMinutes} minutes`);
    console.log(`  • Pattern: ${attackPattern.type}`);

    console.log('\n🛡️ Response Actions Taken:');
    console.log('  1. IP address blocked automatically after 10 failed attempts');
    console.log('  2. Targeted user accounts locked temporarily');
    console.log('  3. Security team notified via alert');
    console.log('  4. Additional monitoring enabled for similar patterns');

    console.log('\n📋 Evidence Collected:');
    console.log('  • Complete audit trail of all attempts');
    console.log('  • User agent strings and request patterns');
    console.log('  • Timing analysis showing automated behavior');
    console.log('  • Cross-reference with threat intelligence feeds');
  }

  /**
   * Interactive demo runner
   */
  async runFullDemo(): Promise<void> {
    console.log('🚀 CENTRALIZED LOGGING ISSUE REPRODUCTION DEMO');
    console.log('='.repeat(60));
    console.log('This demo shows how to use centralized logs to investigate and reproduce issues');

    await this.investigateWorkflowFailures();
    await this.investigatePerformanceDegradation();
    await this.investigateSecurityIncident();

    console.log('\n\n✅ DEMO COMPLETE');
    console.log('='.repeat(60));
    console.log('Key Benefits of Centralized Logging:');
    console.log('  ✓ Rapid issue identification and root cause analysis');
    console.log('  ✓ Correlation between logs, metrics, and user actions');
    console.log('  ✓ Historical context for pattern recognition');
    console.log('  ✓ Automated incident report generation');
    console.log('  ✓ Proactive issue prevention through trend analysis');
  }

  /**
   * Setup realistic demo data that simulates various scenarios
   */
  private setupDemoData(): void {
    const baseTime = new Date('2024-06-11T14:00:00Z');

    // Scenario 1: Workflow failure logs
    this.addWorkflowFailureLogs(baseTime);
    
    // Scenario 2: Performance degradation logs  
    this.addPerformanceLogs(baseTime);
    
    // Scenario 3: Security incident logs
    this.addSecurityLogs(baseTime);

    // Add system metrics
    this.addSystemMetrics(baseTime);
  }

  private addWorkflowFailureLogs(baseTime: Date): void {
    const logs = [
      // Normal operation
      LogEntry.userAction('user_123', 'workflow_456', 'Workflow started', { status: 'started' }, new Date(baseTime.getTime() + 5 * 60 * 1000)),
      LogEntry.userAction('user_123', 'workflow_456', 'Step 1 completed', { step: 'data_fetch' }, new Date(baseTime.getTime() + 8 * 60 * 1000)),
      
      // First signs of trouble
      LogEntry.create(
        LogLevel.WARN,
        'Database connection slow',
        'database',
        LogCategory.PERFORMANCE,
        { userId: 'user_123', workflowId: 'workflow_456', responseTime: 2500 },
        new Date(baseTime.getTime() + 15 * 60 * 1000)
      ),
      
      // Failures start
      LogEntry.create(
        LogLevel.ERROR,
        'Database connection timeout: Connection could not be established within 5000ms',
        'database',
        LogCategory.APPLICATION,
        { userId: 'user_123', workflowId: 'workflow_456', timeout: 5000, requestId: 'req_789' },
        new Date(baseTime.getTime() + 28 * 60 * 1000)
      ),
      
      // User retries
      LogEntry.userAction('user_123', 'workflow_456', 'Workflow restarted by user', { attempt: 2 }, new Date(baseTime.getTime() + 32 * 60 * 1000)),
      
      LogEntry.create(
        LogLevel.ERROR,
        'Database connection timeout: Connection pool exhausted',
        'database',
        LogCategory.APPLICATION,
        { userId: 'user_123', workflowId: 'workflow_456', poolSize: 20, activeConnections: 20, requestId: 'req_790' },
        new Date(baseTime.getTime() + 35 * 60 * 1000)
      )
    ];

    logs.forEach(log => this.reproductionService.addLog(log));
  }

  private addPerformanceLogs(baseTime: Date): void {
    const perfTime = new Date(baseTime.getTime() + 2.5 * 60 * 60 * 1000); // 2.5 hours later

    const logs = [
      LogEntry.apiRequest('/api/workflows', 'GET', 200, 3500, 'user_789', perfTime),
      LogEntry.apiRequest('/api/dashboard', 'GET', 200, 4200, 'user_101', new Date(perfTime.getTime() + 30000)),
      
      LogEntry.create(
        LogLevel.ERROR,
        'Request timeout: Memory allocation failed',
        'api-server',
        LogCategory.SYSTEM,
        { memoryUsage: '95%', requestedMB: 512 },
        new Date(perfTime.getTime() + 2 * 60 * 1000)
      ),
      
      LogEntry.create(
        LogLevel.WARN,
        'High memory usage detected',
        'system-monitor',
        LogCategory.PERFORMANCE,
        { memoryPercent: 92, threshold: 85 },
        new Date(perfTime.getTime() + 60 * 1000)
      )
    ];

    logs.forEach(log => this.reproductionService.addLog(log));
  }

  private addSecurityLogs(baseTime: Date): void {
    const secTime = new Date(baseTime.getTime() + 6 * 60 * 60 * 1000); // 6 hours later

    // Simulate brute force attack
    for (let i = 0; i < 15; i++) {
      const attemptTime = new Date(secTime.getTime() + i * 30 * 1000); // Every 30 seconds
      
      this.reproductionService.addLog(
        LogEntry.securityEvent(
          'failed_login',
          i < 5 ? 'admin' : i < 10 ? 'user123' : 'testuser',
          '192.168.1.100',
          { 
            attempts: i + 1,
            userAgent: 'curl/7.68.0',
            reason: 'invalid_password'
          },
          attemptTime
        )
      );
    }

    // Account lockout
    this.reproductionService.addLog(
      LogEntry.securityEvent(
        'account_locked',
        'admin',
        '192.168.1.100',
        { reason: 'too_many_failed_attempts', lockDuration: 1800 },
        new Date(secTime.getTime() + 10 * 60 * 1000)
      )
    );
  }

  private addSystemMetrics(baseTime: Date): void {
    // Add CPU and memory metrics that correlate with the incidents
    const cpuMetric = Metric.systemMetric(
      'cpu_usage_percent',
      95,
      'system-monitor',
      new Date(baseTime.getTime() + 28 * 60 * 1000) // Same time as DB timeout
    );

    const memoryMetric = Metric.systemMetric(
      'memory_usage_percent',
      92,
      'system-monitor',
      new Date(baseTime.getTime() + 2.5 * 60 * 60 * 1000) // Same time as performance issues
    );

    // Note: In a real implementation, these would be added to the metric service
    // For demo purposes, we're showing the correlation concept
  }

  private analyzeAttackPattern(failedLogins: LogEntry[]): {
    peakAttempts: number;
    targetedAccounts: string[];
    durationMinutes: number;
    type: string;
  } {
    const accounts = new Set<string>();
    let peakAttempts = 0;
    
    failedLogins.forEach(log => {
      if (log.context.userId) {
        accounts.add(log.context.userId);
      }
    });

    const durationMs = failedLogins.length > 0 ? 
      failedLogins[failedLogins.length - 1].timestamp.getTime() - failedLogins[0].timestamp.getTime() : 0;

    return {
      peakAttempts: Math.floor(failedLogins.length / Math.max(1, durationMs / 60000)),
      targetedAccounts: Array.from(accounts),
      durationMinutes: Math.floor(durationMs / 60000),
      type: accounts.size > 1 ? 'Credential stuffing' : 'Brute force'
    };
  }
}

// Export a function to run the demo
export async function runIssueReproductionDemo(): Promise<void> {
  const demo = new IssueReproductionDemo();
  await demo.runFullDemo();
}