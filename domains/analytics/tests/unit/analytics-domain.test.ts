import { describe, it, expect, beforeEach } from 'vitest';
import { 
  MetricValue, 
  TimeRange, 
  Dimension, 
  DimensionCollection, 
  Threshold, 
  Metric, 
  Alert, 
  Report, 
  SystemHealth, 
  LogEntry,
  MetricCategory,
  AlertStatus,
  ReportType,
  ReportStatus,
  HealthStatus,
  ComponentType,
  LogLevel,
  LogCategory
} from '../../src';

describe('Analytics Domain - Complete Implementation', () => {
  describe('MetricValue Value Object', () => {
    it('should create counter metrics correctly', () => {
      const counter = MetricValue.counter(42, 'requests');
      
      expect(counter.value).toBe(42);
      expect(counter.unit).toBe('requests');
      expect(counter.type).toBe('counter');
      expect(counter.precision).toBe(0);
      expect(counter.formattedValue).toBe('42');
    });

    it('should create gauge metrics with precision', () => {
      const gauge = MetricValue.gauge(98.75, 'percentage', 2);
      
      expect(gauge.value).toBe(98.75);
      expect(gauge.unit).toBe('percentage');
      expect(gauge.type).toBe('gauge');
      expect(gauge.precision).toBe(2);
      expect(gauge.formattedValue).toBe('98.75');
    });

    it('should create timer metrics for performance tracking', () => {
      const timer = MetricValue.timer(1543);
      
      expect(timer.value).toBe(1543);
      expect(timer.unit).toBe('milliseconds');
      expect(timer.type).toBe('timer');
      expect(timer.displayValue).toBe('1.5s');
    });

    it('should create percentage metrics with validation', () => {
      const percentage = MetricValue.percentage(85.5, 1);
      
      expect(percentage.value).toBe(85.5);
      expect(percentage.unit).toBe('percentage');
      expect(percentage.displayValue).toBe('85.5%');
    });

    it('should validate percentage bounds', () => {
      expect(() => MetricValue.percentage(-5)).toThrow('Percentage values must be between 0 and 100');
      expect(() => MetricValue.percentage(105)).toThrow('Percentage values must be between 0 and 100');
    });

    it('should format bytes correctly', () => {
      const bytes1 = MetricValue.gauge(512, 'bytes');
      const bytes2 = MetricValue.gauge(2048, 'bytes');
      const bytes3 = MetricValue.gauge(1024 * 1024 * 5, 'bytes');
      
      expect(bytes1.displayValue).toBe('512B');
      expect(bytes2.displayValue).toBe('2.0KB');
      expect(bytes3.displayValue).toBe('5.0MB');
    });

    it('should format duration correctly', () => {
      const duration1 = MetricValue.timer(500);
      const duration2 = MetricValue.timer(5000);
      const duration3 = MetricValue.timer(65000);
      const duration4 = MetricValue.timer(3665000);
      
      expect(duration1.displayValue).toBe('500ms');
      expect(duration2.displayValue).toBe('5.0s');
      expect(duration3.displayValue).toBe('1.1m');
      expect(duration4.displayValue).toBe('1.0h');
    });
  });

  describe('TimeRange Value Object', () => {
    it('should create predefined time ranges', () => {
      const lastHour = TimeRange.lastHour();
      const last24Hours = TimeRange.last24Hours();
      const last7Days = TimeRange.last7Days();
      
      expect(lastHour.type).toBe('last_hour');
      expect(last24Hours.type).toBe('last_24_hours');
      expect(last7Days.type).toBe('last_7_days');
      
      expect(lastHour.durationHours).toBeCloseTo(1, 0);
      expect(last24Hours.durationHours).toBeCloseTo(24, 0);
      expect(last7Days.durationDays).toBeCloseTo(7, 0);
    });

    it('should create custom time ranges', () => {
      const start = new Date('2024-01-01T00:00:00Z');
      const end = new Date('2024-01-02T00:00:00Z');
      const range = TimeRange.create(start, end);
      
      expect(range.type).toBe('custom');
      expect(range.durationDays).toBe(1);
      expect(range.durationHours).toBe(24);
    });

    it('should validate time range boundaries', () => {
      const end = new Date();
      const start = new Date(end.getTime() + 1000); // Start after end
      
      expect(() => TimeRange.create(start, end)).toThrow('Start time must be before end time');
    });

    it('should determine optimal granularity', () => {
      const hourRange = TimeRange.lastHour();
      const weekRange = TimeRange.last7Days();
      const monthRange = TimeRange.last30Days();
      const yearRange = TimeRange.lastYear();
      
      expect(hourRange.getOptimalGranularity()).toBe('hour');
      expect(weekRange.getOptimalGranularity()).toBe('day');
      expect(monthRange.getOptimalGranularity()).toBe('week');
      expect(yearRange.getOptimalGranularity()).toBe('month');
    });

    it('should check time range overlaps', () => {
      const range1 = TimeRange.create(new Date('2024-01-01'), new Date('2024-01-05'));
      const range2 = TimeRange.create(new Date('2024-01-03'), new Date('2024-01-07'));
      const range3 = TimeRange.create(new Date('2024-01-10'), new Date('2024-01-15'));
      
      expect(range1.overlaps(range2)).toBe(true);
      expect(range1.overlaps(range3)).toBe(false);
    });

    it('should intersect overlapping ranges', () => {
      const range1 = TimeRange.create(new Date('2024-01-01'), new Date('2024-01-05'));
      const range2 = TimeRange.create(new Date('2024-01-03'), new Date('2024-01-07'));
      
      const intersection = range1.intersect(range2);
      
      expect(intersection).not.toBeNull();
      expect(intersection!.startTime).toEqual(new Date('2024-01-03'));
      expect(intersection!.endTime).toEqual(new Date('2024-01-05'));
    });
  });

  describe('Dimension Value Object', () => {
    it('should create typed dimensions', () => {
      const userDim = Dimension.user('123');
      const workflowDim = Dimension.workflow('456', 'Email Campaign');
      const statusDim = Dimension.status('active');
      
      expect(userDim.name).toBe('user_id');
      expect(userDim.value).toBe('123');
      expect(userDim.type).toBe('user');
      
      expect(workflowDim.name).toBe('workflow_id');
      expect(workflowDim.value).toBe('456:Email Campaign');
      expect(workflowDim.displayValue).toBe('Email Campaign');
      
      expect(statusDim.name).toBe('status');
      expect(statusDim.value).toBe('active');
    });

    it('should validate dimension names and values', () => {
      expect(() => Dimension.create('', 'value')).toThrow('Dimension name cannot be empty');
      expect(() => Dimension.create('name', '')).toThrow('Dimension value cannot be empty');
      expect(() => Dimension.create('123invalid', 'value')).toThrow('Dimension name must start with a letter');
    });

    it('should support dimension collections', () => {
      const collection = new DimensionCollection([
        Dimension.user('123'),
        Dimension.workflow('456', 'Test Workflow'),
        Dimension.status('active')
      ]);
      
      expect(collection.size()).toBe(3);
      expect(collection.has('user_id')).toBe(true);
      expect(collection.get('status')?.value).toBe('active');
      
      const userDimensions = collection.getByType('user');
      expect(userDimensions).toHaveLength(1);
      expect(userDimensions[0].value).toBe('123');
    });

    it('should merge dimension collections', () => {
      const collection1 = new DimensionCollection([
        Dimension.user('123'),
        Dimension.status('active')
      ]);
      
      const collection2 = new DimensionCollection([
        Dimension.workflow('456'),
        Dimension.category('automation')
      ]);
      
      const merged = collection1.merge(collection2);
      
      expect(merged.size()).toBe(4);
      expect(merged.has('user_id')).toBe(true);
      expect(merged.has('workflow_id')).toBe(true);
    });
  });

  describe('Threshold Value Object', () => {
    it('should create comparison thresholds', () => {
      const greaterThan = Threshold.greaterThan(100, 'high');
      const lessThan = Threshold.lessThan(50, 'medium');
      const equal = Threshold.equal(0, 'critical');
      
      expect(greaterThan.operator).toBe('greater_than');
      expect(greaterThan.value).toBe(100);
      expect(greaterThan.severity).toBe('high');
      expect(greaterThan.displayText).toBe('> 100');
      
      expect(lessThan.displayText).toBe('< 50');
      expect(equal.displayText).toBe('= 0');
    });

    it('should create range thresholds', () => {
      const between = Threshold.between(10, 90, 'medium');
      const notBetween = Threshold.notBetween(50, 100, 'low');
      
      expect(between.operator).toBe('between');
      expect(between.value).toBe(10);
      expect(between.secondaryValue).toBe(90);
      expect(between.displayText).toBe('10 - 90');
      
      expect(notBetween.displayText).toBe('not between 50 - 100');
    });

    it('should evaluate threshold conditions', () => {
      const greaterThan = Threshold.greaterThan(100);
      const between = Threshold.between(50, 150);
      
      expect(greaterThan.evaluate(150)).toBe(true);
      expect(greaterThan.evaluate(50)).toBe(false);
      
      expect(between.evaluate(100)).toBe(true);
      expect(between.evaluate(200)).toBe(false);
      expect(between.evaluate(25)).toBe(false);
    });

    it('should validate threshold bounds for ranges', () => {
      expect(() => Threshold.between(100, 50)).toThrow('Lower bound must be less than or equal to upper bound');
    });
  });

  describe('Metric Entity', () => {
    it('should create workflow metrics with context', () => {
      const metricValue = MetricValue.timer(1500);
      const metric = Metric.workflowMetric(
        1,
        123, // userId
        456, // workflowId
        'execution_time',
        metricValue,
        [Dimension.status('completed')]
      );
      
      expect(metric.id).toBe(1);
      expect(metric.userId).toBe(123);
      expect(metric.workflowId).toBe(456);
      expect(metric.name).toBe('execution_time');
      expect(metric.isWorkflowMetric).toBe(true);
      expect(metric.isIntegrationMetric).toBe(false);
      expect(metric.isSystemMetric).toBe(false);
      
      expect(metric.hasDimension('user_id')).toBe(true);
      expect(metric.hasDimension('workflow_id')).toBe(true);
      expect(metric.hasDimension('status')).toBe(true);
      expect(metric.getDimensionValue('status')).toBe('completed');
    });

    it('should create integration metrics with context', () => {
      const metricValue = MetricValue.counter(25, 'requests');
      const metric = Metric.integrationMetric(
        2,
        123, // userId
        789, // integrationId
        'api_requests',
        metricValue,
        [Dimension.status('success')]
      );
      
      expect(metric.integrationId).toBe(789);
      expect(metric.isIntegrationMetric).toBe(true);
      expect(metric.metadata.source).toBe('integration_execution');
    });

    it('should create system metrics', () => {
      const metricValue = MetricValue.percentage(85.2, 1);
      const metric = Metric.systemMetric(
        3,
        123,
        'cpu_usage',
        metricValue,
        [Dimension.region('us-east-1')]
      );
      
      expect(metric.isSystemMetric).toBe(true);
      expect(metric.workflowId).toBeNull();
      expect(metric.integrationId).toBeNull();
      expect(metric.metadata.source).toBe('system_monitoring');
    });

    it('should support metric filtering', () => {
      const metric = Metric.workflowMetric(
        1,
        123,
        456,
        'test_metric',
        MetricValue.counter(10),
        [
          Dimension.status('active'),
          Dimension.category('automation')
        ]
      );
      
      expect(metric.matchesFilters({ status: 'active' })).toBe(true);
      expect(metric.matchesFilters({ status: 'inactive' })).toBe(false);
      expect(metric.matchesFilters({ status: 'active', category: 'automation' })).toBe(true);
    });

    it('should support metric lifecycle operations', () => {
      const metric = Metric.systemMetric(1, 123, 'test_metric', MetricValue.counter(5));
      
      const taggedMetric = metric.addTag('performance');
      expect(taggedMetric.hasTag('performance')).toBe(true);
      
      const archivedMetric = metric.archive();
      expect(archivedMetric.status).toBe('archived');
      
      const deprecatedMetric = metric.deprecate('Replaced by new metric');
      expect(deprecatedMetric.status).toBe('deprecated');
    });

    it('should validate metric properties', () => {
      expect(() => Metric.create(
        0, // Invalid ID
        123,
        'test_metric',
        MetricValue.counter(10)
      )).toThrow('Metric ID must be positive');
      
      expect(() => Metric.create(
        1,
        123,
        '', // Invalid name
        MetricValue.counter(10)
      )).toThrow('Metric name cannot be empty');
    });
  });

  describe('Alert Entity', () => {
    let threshold: Threshold;
    let notificationConfig: any;

    beforeEach(() => {
      threshold = Threshold.greaterThan(100, 'high');
      notificationConfig = {
        channels: ['email', 'in_app'],
        recipients: ['admin@example.com'],
        messageTemplate: 'Alert: {{metric_name}} is {{metric_value}}',
        cooldownMinutes: 15
      };
    });

    it('should create alerts with threshold monitoring', () => {
      const alert = Alert.create(
        1,
        123,
        'High CPU Usage',
        'Alert when CPU usage exceeds 100%',
        'cpu_usage',
        threshold,
        notificationConfig
      );
      
      expect(alert.id).toBe(1);
      expect(alert.userId).toBe(123);
      expect(alert.name).toBe('High CPU Usage');
      expect(alert.metricName).toBe('cpu_usage');
      expect(alert.isActive).toBe(true);
      expect(alert.severity).toBe('high');
      expect(alert.triggerCount).toBe(0);
    });

    it('should evaluate trigger conditions', () => {
      const alert = Alert.create(1, 123, 'Test Alert', 'Test', 'test_metric', threshold, notificationConfig);
      
      const lowValue = MetricValue.gauge(50);
      const highValue = MetricValue.gauge(150);
      
      expect(alert.shouldTrigger(lowValue)).toBe(false);
      expect(alert.shouldTrigger(highValue)).toBe(true);
    });

    it('should handle alert triggering', () => {
      const alert = Alert.create(1, 123, 'Test Alert', 'Test', 'test_metric', threshold, notificationConfig);
      const triggerValue = MetricValue.gauge(150);
      
      const triggeredAlert = alert.trigger(triggerValue);
      
      expect(triggeredAlert.isTriggered).toBe(true);
      expect(triggeredAlert.triggerCount).toBe(1);
      expect(triggeredAlert.lastTriggered).not.toBeNull();
      expect(triggeredAlert.triggers).toHaveLength(1);
      
      const trigger = triggeredAlert.triggers[0];
      expect(trigger.metricValue.value).toBe(150);
      expect(trigger.message).toContain('test_metric');
    });

    it('should respect cooldown periods', () => {
      const alert = Alert.create(1, 123, 'Test Alert', 'Test', 'test_metric', threshold, notificationConfig);
      const triggerValue = MetricValue.gauge(150);
      
      const triggeredAlert = alert.trigger(triggerValue);
      expect(triggeredAlert.isInCooldown()).toBe(true);
      expect(triggeredAlert.getCooldownRemainingMs()).toBeGreaterThan(0);
      
      // Should not trigger again during cooldown
      expect(triggeredAlert.shouldTrigger(triggerValue)).toBe(false);
    });

    it('should support alert lifecycle operations', () => {
      const alert = Alert.create(1, 123, 'Test Alert', 'Test', 'test_metric', threshold, notificationConfig);
      
      const pausedAlert = alert.pause();
      expect(pausedAlert.isPaused).toBe(true);
      expect(pausedAlert.shouldTrigger(MetricValue.gauge(150))).toBe(false);
      
      const resumedAlert = pausedAlert.resume();
      expect(resumedAlert.isActive).toBe(true);
      
      const disabledAlert = alert.disable();
      expect(disabledAlert.status).toBe('disabled');
    });

    it('should calculate alert frequency', () => {
      let alert = Alert.create(1, 123, 'Test Alert', 'Test', 'test_metric', threshold, notificationConfig);
      const triggerValue = MetricValue.gauge(150);
      
      // Manually create triggers with different timestamps to simulate time span
      const baseTrigger = {
        timestamp: new Date('2024-01-01T10:00:00Z'),
        metricValue: triggerValue,
        message: 'Test trigger',
        notificationsSent: 1
      };
      
      const trigger1 = { ...baseTrigger, timestamp: new Date('2024-01-01T10:00:00Z') };
      const trigger2 = { ...baseTrigger, timestamp: new Date('2024-01-01T10:30:00Z') };
      const trigger3 = { ...baseTrigger, timestamp: new Date('2024-01-01T11:00:00Z') };
      
      // Create alert with pre-existing triggers
      const alertWithTriggers = new (alert.constructor as any)(
        alert.id,
        alert.userId,
        alert.name,
        alert.description,
        alert.metricName,
        alert.threshold,
        alert.notificationConfig,
        'triggered',
        new Date('2024-01-01T11:00:00Z'),
        3,
        [trigger1, trigger2, trigger3],
        alert.createdAt,
        new Date()
      );
      
      expect(alertWithTriggers.getFrequency()).toBeGreaterThan(0);
    });

    it('should validate alert configuration', () => {
      const invalidConfig = {
        channels: [], // No channels
        recipients: ['admin@example.com']
      };
      
      expect(() => Alert.create(
        1, 123, 'Test', 'Test', 'test_metric', threshold, invalidConfig
      )).toThrow('At least one notification channel must be specified');
    });
  });

  describe('Report Entity', () => {
    let timeRange: TimeRange;
    let filters: Dimension[];

    beforeEach(() => {
      timeRange = TimeRange.last7Days();
      filters = [
        Dimension.user('123'),
        Dimension.status('active')
      ];
    });

    it('should create analytics reports', () => {
      const report = Report.create(
        1,
        123,
        'Weekly Performance Report',
        'Analysis of workflow performance over the last week',
        'workflow_performance',
        timeRange,
        filters
      );
      
      expect(report.id).toBe(1);
      expect(report.userId).toBe(123);
      expect(report.name).toBe('Weekly Performance Report');
      expect(report.type).toBe('workflow_performance');
      expect(report.generationStatus).toBe('pending');
      expect(report.isGenerated).toBe(false);
    });

    it('should create scheduled reports', () => {
      const scheduleConfig = {
        frequency: 'weekly' as const,
        dayOfWeek: 1, // Monday
        hour: 9,
        recipients: ['manager@example.com']
      };
      
      const report = Report.scheduled(
        1,
        123,
        'Weekly Report',
        'Automated weekly report',
        'dashboard_summary',
        timeRange,
        scheduleConfig,
        filters
      );
      
      expect(report.isScheduled).toBe(true);
      expect(report.scheduleConfig?.frequency).toBe('weekly');
      expect(report.getNextScheduledGeneration()).not.toBeNull();
    });

    it('should handle report generation lifecycle', () => {
      let report = Report.create(1, 123, 'Test Report', 'Test', 'custom', timeRange, filters);
      
      const generatingReport = report.startGeneration();
      expect(generatingReport.isGenerating).toBe(true);
      expect(generatingReport.generationStatus).toBe('generating');
      
      const reportData = {
        metrics: { total_executions: 150 },
        charts: [],
        tables: [],
        summary: {
          totalRecords: 150,
          timeRange: timeRange,
          generatedAt: new Date(),
          executionTime: 500
        }
      };
      
      const completedReport = generatingReport.completeGeneration(reportData);
      expect(completedReport.isGenerated).toBe(true);
      expect(completedReport.data).not.toBeNull();
      expect(completedReport.lastGenerated).not.toBeNull();
      
      const failedReport = generatingReport.failGeneration('Database connection failed');
      expect(failedReport.hasFailed).toBe(true);
      expect(failedReport.errorMessage).toBe('Database connection failed');
    });

    it('should support report updates', () => {
      const report = Report.create(1, 123, 'Test Report', 'Test', 'custom', timeRange, filters);
      
      const newTimeRange = TimeRange.last30Days();
      const updatedReport = report.updateTimeRange(newTimeRange);
      
      expect(updatedReport.timeRange.type).toBe('last_30_days');
      expect(updatedReport.generationStatus).toBe('pending'); // Reset when time range changes
      
      const newFilters = [Dimension.status('completed')];
      const filteredReport = report.updateFilters(newFilters);
      
      expect(filteredReport.filters.size()).toBe(1);
      expect(filteredReport.filters.get('status')?.value).toBe('completed');
    });

    it('should determine if reports are stale', () => {
      const report = Report.create(1, 123, 'Test Report', 'Test', 'custom', timeRange, filters);
      
      expect(report.isStale).toBe(true); // Never generated
      
      const reportData = {
        metrics: {},
        charts: [],
        tables: [],
        summary: {
          totalRecords: 0,
          timeRange: timeRange,
          generatedAt: new Date(),
          executionTime: 100
        }
      };
      
      const generatedReport = report.completeGeneration(reportData);
      expect(generatedReport.isStale).toBe(false); // Recently generated
    });

    it('should export report data in different formats', () => {
      const report = Report.create(1, 123, 'Test Report', 'Test', 'custom', timeRange, filters);
      const reportData = {
        metrics: { executions: 100 },
        charts: [],
        tables: [{
          title: 'Test Table',
          headers: ['Name', 'Count'],
          rows: [['Test', '100']]
        }],
        summary: {
          totalRecords: 1,
          timeRange: timeRange,
          generatedAt: new Date(),
          executionTime: 200
        }
      };
      
      const generatedReport = report.completeGeneration(reportData);
      
      const jsonExport = generatedReport.exportData('json');
      expect(jsonExport).toContain('executions');
      
      const csvExport = generatedReport.exportData('csv');
      expect(csvExport).toContain('Test Table');
      expect(csvExport).toContain('Name,Count');
      
      const htmlExport = generatedReport.exportData('html');
      expect(htmlExport).toContain('<html>');
      expect(htmlExport).toContain('Test Report');
    });

    it('should validate report configuration', () => {
      expect(() => Report.create(
        0, // Invalid ID
        123,
        'Test Report',
        'Test',
        'custom',
        timeRange,
        filters
      )).toThrow('Report ID must be positive');
      
      expect(() => Report.create(
        1,
        123,
        '', // Empty name
        'Test',
        'custom',
        timeRange,
        filters
      )).toThrow('Report name cannot be empty');
    });
  });
});