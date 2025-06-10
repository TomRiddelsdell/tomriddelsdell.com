import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../../server/storage';
import { MetricValue } from '../../src/domains/analytics/domain/value-objects/MetricValue';
import { TimeRange } from '../../src/domains/analytics/domain/value-objects/TimeRange';
import { Dimension } from '../../src/domains/analytics/domain/value-objects/Dimension';
import { Threshold } from '../../src/domains/analytics/domain/value-objects/Threshold';
import { Metric } from '../../src/domains/analytics/domain/entities/Metric';
import { Alert } from '../../src/domains/analytics/domain/entities/Alert';
import { Report } from '../../src/domains/analytics/domain/entities/Report';

describe('Analytics Domain Compatibility - Phase 4', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    // Clear demo data for clean test environment
    storage['workflows'].clear();
    storage['connectedApps'].clear();
    storage['activityLogs'].clear();
  });

  describe('Integration with Existing Workflow Domain', () => {
    it('should collect workflow execution metrics', async () => {
      const userId = 1;
      
      // Create a workflow
      const workflow = await storage.createWorkflow({
        userId,
        name: 'Email Campaign Workflow',
        description: 'Automated email marketing campaign',
        status: 'active',
        config: {
          steps: [
            {
              id: 'trigger-1',
              type: 'trigger',
              name: 'Schedule Trigger',
              config: { schedule: '0 9 * * 1' },
              position: { x: 0, y: 0 }
            },
            {
              id: 'action-1',
              type: 'action',
              name: 'Send Email',
              config: { template: 'weekly_newsletter' },
              position: { x: 200, y: 0 }
            }
          ]
        }
      });

      // Simulate workflow execution metrics
      const executionTimeMetric = Metric.workflowMetric(
        1,
        userId,
        workflow.id,
        'execution_time',
        MetricValue.timer(2350), // 2.35 seconds
        [
          Dimension.status('completed'),
          Dimension.category('automation')
        ]
      );

      const emailsSentMetric = Metric.workflowMetric(
        2,
        userId,
        workflow.id,
        'emails_sent',
        MetricValue.counter(1250, 'count'),
        [
          Dimension.status('success'),
          Dimension.category('email')
        ]
      );

      const successRateMetric = Metric.workflowMetric(
        3,
        userId,
        workflow.id,
        'success_rate',
        MetricValue.percentage(98.4, 1),
        [
          Dimension.category('performance')
        ]
      );

      // Validate metrics are properly contextualized
      expect(executionTimeMetric.isWorkflowMetric).toBe(true);
      expect(executionTimeMetric.workflowId).toBe(workflow.id);
      expect(executionTimeMetric.value.displayValue).toBe('2.4s');
      
      expect(emailsSentMetric.value.value).toBe(1250);
      expect(emailsSentMetric.getDimensionValue('status')).toBe('success');
      
      expect(successRateMetric.value.displayValue).toBe('98.4%');

      // Create activity log for workflow execution
      await storage.createActivityLog({
        userId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        eventType: 'workflow_execution',
        status: 'success',
        details: {
          executionTime: 2350,
          emailsSent: 1250,
          successRate: 98.4,
          metrics: {
            execution_time: executionTimeMetric.toJSON(),
            emails_sent: emailsSentMetric.toJSON(),
            success_rate: successRateMetric.toJSON()
          }
        }
      });

      const activityLogs = await storage.getActivityLogsByUserId(userId);
      expect(activityLogs.entries).toHaveLength(1);
      expect(activityLogs.entries[0].details.metrics).toBeDefined();
    });

    it('should track workflow performance over time', async () => {
      const userId = 1;
      
      const workflow = await storage.createWorkflow({
        userId,
        name: 'Data Processing Pipeline',
        description: 'Batch data processing workflow',
        status: 'active',
        config: { steps: [] }
      });

      // Simulate metrics collected over multiple executions
      const executionMetrics = [
        { time: 1500, records: 10000, errors: 5 },
        { time: 1750, records: 12000, errors: 3 },
        { time: 1200, records: 8500, errors: 1 },
        { time: 2100, records: 15000, errors: 8 },
        { time: 1650, records: 11000, errors: 2 }
      ];

      const metrics: Metric[] = [];
      executionMetrics.forEach((exec, index) => {
        const timeMetric = Metric.workflowMetric(
          index * 3 + 1,
          userId,
          workflow.id,
          'execution_time',
          MetricValue.timer(exec.time),
          [Dimension.status('completed')]
        );

        const recordsMetric = Metric.workflowMetric(
          index * 3 + 2,
          userId,
          workflow.id,
          'records_processed',
          MetricValue.counter(exec.records, 'count'),
          [Dimension.status('success')]
        );

        const errorMetric = Metric.workflowMetric(
          index * 3 + 3,
          userId,
          workflow.id,
          'error_count',
          MetricValue.counter(exec.errors, 'errors'),
          [Dimension.status(exec.errors > 5 ? 'warning' : 'success')]
        );

        metrics.push(timeMetric, recordsMetric, errorMetric);
      });

      // Calculate performance analytics
      const avgExecutionTime = metrics
        .filter(m => m.name === 'execution_time')
        .reduce((sum, m) => sum + m.value.value, 0) / 5;

      const totalRecords = metrics
        .filter(m => m.name === 'records_processed')
        .reduce((sum, m) => sum + m.value.value, 0);

      const totalErrors = metrics
        .filter(m => m.name === 'error_count')
        .reduce((sum, m) => sum + m.value.value, 0);

      const errorRate = (totalErrors / totalRecords) * 100;

      expect(avgExecutionTime).toBeCloseTo(1640, 0);
      expect(totalRecords).toBe(56500);
      expect(totalErrors).toBe(19);
      expect(errorRate).toBeCloseTo(0.034, 3);

      // Verify workflow context is maintained
      expect(metrics.every(m => m.workflowId === workflow.id)).toBe(true);
      expect(metrics.every(m => m.userId === userId)).toBe(true);
    });
  });

  describe('Integration with Connected Apps/Integrations', () => {
    it('should monitor integration health and performance', async () => {
      const userId = 1;
      
      // Create integrations
      const salesforceIntegration = await storage.createConnectedApp({
        userId,
        name: 'Salesforce CRM',
        description: 'Customer relationship management',
        icon: 'salesforce',
        status: 'connected',
        config: {
          authType: 'oauth2',
          instanceUrl: 'https://company.salesforce.com',
          scopes: ['read', 'write']
        },
        accessToken: 'sf_token_123',
        tokenExpiry: new Date(Date.now() + 3600000)
      });

      const slackIntegration = await storage.createConnectedApp({
        userId,
        name: 'Slack Notifications',
        description: 'Team communication platform',
        icon: 'slack',
        status: 'connected',
        config: {
          authType: 'webhook',
          webhookUrl: 'https://hooks.slack.com/services/T00/B00/XXX'
        }
      });

      // Simulate integration performance metrics
      const sfApiCallsMetric = Metric.integrationMetric(
        1,
        userId,
        salesforceIntegration.id,
        'api_calls',
        MetricValue.counter(156, 'requests'),
        [Dimension.status('success')]
      );

      const sfResponseTimeMetric = Metric.integrationMetric(
        2,
        userId,
        salesforceIntegration.id,
        'avg_response_time',
        MetricValue.timer(245),
        [Dimension.status('success')]
      );

      const sfErrorRateMetric = Metric.integrationMetric(
        3,
        userId,
        salesforceIntegration.id,
        'error_rate',
        MetricValue.percentage(1.2, 1),
        [Dimension.status('warning')]
      );

      const slackMessagesMetric = Metric.integrationMetric(
        4,
        userId,
        slackIntegration.id,
        'messages_sent',
        MetricValue.counter(43, 'count'),
        [Dimension.status('success')]
      );

      const slackDeliveryRateMetric = Metric.integrationMetric(
        5,
        userId,
        slackIntegration.id,
        'delivery_rate',
        MetricValue.percentage(100.0, 1),
        [Dimension.status('success')]
      );

      // Validate integration metrics
      expect(sfApiCallsMetric.isIntegrationMetric).toBe(true);
      expect(sfApiCallsMetric.integrationId).toBe(salesforceIntegration.id);
      expect(sfResponseTimeMetric.value.displayValue).toBe('245ms');
      expect(sfErrorRateMetric.value.displayValue).toBe('1.2%');

      expect(slackMessagesMetric.integrationId).toBe(slackIntegration.id);
      expect(slackDeliveryRateMetric.value.displayValue).toBe('100.0%');

      // Log integration health events
      await storage.createActivityLog({
        userId,
        workflowId: null,
        workflowName: 'Integration Monitoring',
        eventType: 'integration_health_check',
        status: 'success',
        details: {
          integrationId: salesforceIntegration.id,
          integrationName: salesforceIntegration.name,
          healthScore: 97.8,
          metrics: {
            api_calls: sfApiCallsMetric.toJSON(),
            response_time: sfResponseTimeMetric.toJSON(),
            error_rate: sfErrorRateMetric.toJSON()
          },
          issues: ['Minor rate limiting detected']
        }
      });

      const healthLogs = await storage.getActivityLogsByUserId(userId);
      expect(healthLogs.entries).toHaveLength(1);
      expect(healthLogs.entries[0].details.healthScore).toBe(97.8);
    });

    it('should create alerts for integration failures', async () => {
      const userId = 1;
      
      const apiIntegration = await storage.createConnectedApp({
        userId,
        name: 'External API',
        description: 'Third-party API integration',
        icon: 'api',
        status: 'connected',
        config: { baseUrl: 'https://api.example.com' }
      });

      // Create alerts for integration monitoring
      const responseTimeThreshold = Threshold.greaterThan(5000, 'high'); // 5 seconds
      const errorRateThreshold = Threshold.greaterThan(5, 'critical'); // 5%

      const responseTimeAlert = Alert.create(
        1,
        userId,
        'API Response Time Alert',
        'Alert when API response time exceeds 5 seconds',
        'api_response_time',
        responseTimeThreshold,
        {
          channels: ['email', 'slack'],
          recipients: ['devops@company.com'],
          messageTemplate: 'HIGH: {{integration_name}} response time is {{metric_value}} (threshold: {{threshold}})',
          cooldownMinutes: 10
        }
      );

      const errorRateAlert = Alert.create(
        2,
        userId,
        'API Error Rate Alert',
        'Alert when API error rate exceeds 5%',
        'api_error_rate',
        errorRateThreshold,
        {
          channels: ['email', 'in_app', 'slack'],
          recipients: ['devops@company.com', 'support@company.com'],
          messageTemplate: 'CRITICAL: {{integration_name}} error rate is {{metric_value}} (threshold: {{threshold}})',
          cooldownMinutes: 5
        }
      );

      // Simulate high response time
      const slowResponseMetric = MetricValue.timer(7500); // 7.5 seconds
      const triggeredResponseAlert = responseTimeAlert.trigger(slowResponseMetric);

      expect(triggeredResponseAlert.isTriggered).toBe(true);
      expect(triggeredResponseAlert.severity).toBe('high');
      expect(triggeredResponseAlert.triggerCount).toBe(1);

      // Simulate high error rate
      const highErrorRateMetric = MetricValue.percentage(8.5, 1); // 8.5%
      const triggeredErrorAlert = errorRateAlert.trigger(highErrorRateMetric);

      expect(triggeredErrorAlert.isTriggered).toBe(true);
      expect(triggeredErrorAlert.severity).toBe('critical');

      // Log alert triggers
      await storage.createActivityLog({
        userId,
        workflowId: null,
        workflowName: 'Alert System',
        eventType: 'alert_triggered',
        status: 'warning',
        details: {
          alertId: triggeredResponseAlert.id,
          alertName: triggeredResponseAlert.name,
          integrationId: apiIntegration.id,
          metricName: 'api_response_time',
          metricValue: slowResponseMetric.displayValue,
          threshold: responseTimeThreshold.displayText,
          severity: 'high'
        }
      });

      const alertLogs = await storage.getActivityLogsByUserId(userId);
      expect(alertLogs.entries).toHaveLength(1);
      expect(alertLogs.entries[0].eventType).toBe('alert_triggered');
    });
  });

  describe('Enhanced Dashboard Statistics with Analytics', () => {
    it('should provide comprehensive analytics-enhanced dashboard stats', async () => {
      const userId = 1;
      
      // Create test workflows
      await storage.createWorkflow({
        userId,
        name: 'Email Automation',
        description: 'Automated email campaigns',
        status: 'active',
        config: { steps: [] }
      });

      await storage.createWorkflow({
        userId,
        name: 'Data Sync',
        description: 'Database synchronization',
        status: 'active',
        config: { steps: [] }
      });

      await storage.createWorkflow({
        userId,
        name: 'Report Generation',
        description: 'Automated reporting',
        status: 'paused',
        config: { steps: [] }
      });

      // Create test integrations
      await storage.createConnectedApp({
        userId,
        name: 'Primary Integration',
        description: 'Main API integration',
        icon: 'api',
        status: 'connected',
        config: { healthScore: 98 }
      });

      await storage.createConnectedApp({
        userId,
        name: 'Secondary Integration',
        description: 'Backup service',
        icon: 'backup',
        status: 'connected',
        config: { healthScore: 85 }
      });

      await storage.createConnectedApp({
        userId,
        name: 'Failed Integration',
        description: 'Problematic service',
        icon: 'warning',
        status: 'disconnected',
        config: { healthScore: 20 }
      });

      // Log successful executions
      for (let i = 0; i < 15; i++) {
        await storage.createActivityLog({
          userId,
          workflowId: 1,
          workflowName: 'Email Automation',
          eventType: 'workflow_execution',
          status: 'success',
          details: {
            executionTime: 1200 + (i * 50),
            recordsProcessed: 100 + (i * 10),
            metricsCollected: {
              execution_time: 1200 + (i * 50),
              success_rate: 98.5,
              records_processed: 100 + (i * 10)
            }
          }
        });
      }

      // Log integration metrics
      for (let i = 0; i < 10; i++) {
        await storage.createActivityLog({
          userId,
          workflowId: null,
          workflowName: 'Integration Monitoring',
          eventType: 'integration_execution',
          status: 'success',
          details: {
            integrationId: 1,
            responseTime: 200 + (i * 25),
            dataTransferred: 1024 * (i + 1),
            healthScore: 98 - (i * 0.5)
          }
        });
      }

      const stats = await storage.getDashboardStats(userId);
      
      // Validate enhanced statistics
      expect(stats.activeWorkflows).toBeGreaterThanOrEqual(2);
      expect(stats.connectedApps).toBeGreaterThanOrEqual(2);
      expect(stats.tasksAutomated).toBeGreaterThanOrEqual(15);
      expect(typeof stats.timeSaved).toBe('string');

      // The existing dashboard should continue working
      expect(stats).toHaveProperty('activeWorkflows');
      expect(stats).toHaveProperty('tasksAutomated');
      expect(stats).toHaveProperty('connectedApps');
      expect(stats).toHaveProperty('timeSaved');
    });

    it('should calculate time savings from automation metrics', async () => {
      const userId = 1;
      
      // Create automation workflow
      const workflow = await storage.createWorkflow({
        userId,
        name: 'Invoice Processing',
        description: 'Automated invoice processing',
        status: 'active',
        config: { steps: [] }
      });

      // Simulate automation metrics showing time savings
      const executionMetrics = [
        { manualTime: 3600, automatedTime: 300, tasksCompleted: 50 }, // 1 hour manual vs 5 min automated
        { manualTime: 2400, automatedTime: 180, tasksCompleted: 30 }, // 40 min vs 3 min
        { manualTime: 1800, automatedTime: 120, tasksCompleted: 25 }, // 30 min vs 2 min
        { manualTime: 4200, automatedTime: 240, tasksCompleted: 35 }, // 70 min vs 4 min
        { manualTime: 3000, automatedTime: 200, tasksCompleted: 40 }  // 50 min vs 3.3 min
      ];

      let totalTimeSaved = 0;
      let totalTasks = 0;

      executionMetrics.forEach((metrics, index) => {
        const timeSavedPerTask = metrics.manualTime - metrics.automatedTime;
        const totalTimeSavedBatch = timeSavedPerTask * metrics.tasksCompleted;
        totalTimeSaved += totalTimeSavedBatch;
        totalTasks += metrics.tasksCompleted;

        // Log the automation execution
        storage.createActivityLog({
          userId,
          workflowId: workflow.id,
          workflowName: workflow.name,
          eventType: 'automation_execution',
          status: 'success',
          details: {
            batchId: index + 1,
            tasksCompleted: metrics.tasksCompleted,
            manualTimePerTask: metrics.manualTime,
            automatedTimePerTask: metrics.automatedTime,
            timeSavedPerTask: timeSavedPerTask,
            totalTimeSaved: totalTimeSavedBatch,
            efficiencyGain: ((timeSavedPerTask / metrics.manualTime) * 100).toFixed(1) + '%'
          }
        });
      });

      const stats = await storage.getDashboardStats(userId);
      
      // Calculate expected time savings
      const totalHoursSaved = totalTimeSaved / 3600; // Convert seconds to hours
      expect(totalTasks).toBe(180);
      expect(totalHoursSaved).toBeGreaterThan(100); // Should save significant time
      
      // Verify stats reflect automation benefits
      expect(stats.tasksAutomated).toBeGreaterThanOrEqual(totalTasks);
      expect(stats.timeSaved).toContain('hour'); // Should show substantial time savings
    });
  });

  describe('Cross-Domain Analytics Reporting', () => {
    it('should generate comprehensive performance reports', async () => {
      const userId = 1;
      
      // Create workflows and integrations for comprehensive reporting
      const emailWorkflow = await storage.createWorkflow({
        userId,
        name: 'Email Marketing Campaign',
        description: 'Automated email marketing',
        status: 'active',
        config: { steps: [] }
      });

      const dataWorkflow = await storage.createWorkflow({
        userId,
        name: 'Data Processing Pipeline',
        description: 'ETL data processing',
        status: 'active',
        config: { steps: [] }
      });

      const emailIntegration = await storage.createConnectedApp({
        userId,
        name: 'Email Service Provider',
        description: 'SMTP email service',
        icon: 'email',
        status: 'connected',
        config: { provider: 'sendgrid' }
      });

      const databaseIntegration = await storage.createConnectedApp({
        userId,
        name: 'Database Connection',
        description: 'PostgreSQL database',
        icon: 'database',
        status: 'connected',
        config: { provider: 'postgresql' }
      });

      // Generate comprehensive analytics report
      const timeRange = TimeRange.last30Days();
      const filters = [
        Dimension.user(userId),
        Dimension.status('active')
      ];

      const performanceReport = Report.create(
        1,
        userId,
        'Monthly Performance Report',
        'Comprehensive analysis of workflows and integrations performance',
        'dashboard_summary',
        timeRange,
        filters
      );

      // Simulate report data generation
      const reportData = {
        metrics: {
          totalWorkflows: 2,
          activeWorkflows: 2,
          totalIntegrations: 2,
          connectedIntegrations: 2,
          totalExecutions: 125,
          successfulExecutions: 121,
          failedExecutions: 4,
          avgExecutionTime: 1850,
          totalTimeSaved: 147.5,
          avgSuccessRate: 96.8
        },
        charts: [
          {
            type: 'line',
            title: 'Workflow Execution Trends',
            data: [
              { date: '2024-01-01', executions: 12, success_rate: 95.0 },
              { date: '2024-01-02', executions: 15, success_rate: 98.2 },
              { date: '2024-01-03', executions: 18, success_rate: 97.1 }
            ],
            config: { xAxis: 'date', yAxis: 'executions' }
          },
          {
            type: 'bar',
            title: 'Integration Performance',
            data: [
              { integration: 'Email Service', requests: 1250, errors: 15, avg_response: 245 },
              { integration: 'Database', requests: 890, errors: 3, avg_response: 156 }
            ],
            config: { xAxis: 'integration', yAxis: 'requests' }
          }
        ],
        tables: [
          {
            title: 'Top Performing Workflows',
            headers: ['Workflow Name', 'Executions', 'Success Rate', 'Avg Time'],
            rows: [
              ['Email Marketing Campaign', '75', '98.7%', '1.2s'],
              ['Data Processing Pipeline', '50', '94.0%', '2.8s']
            ]
          },
          {
            title: 'Integration Health Summary',
            headers: ['Integration', 'Status', 'Health Score', 'Last Check'],
            rows: [
              ['Email Service Provider', 'Connected', '98%', '2 min ago'],
              ['Database Connection', 'Connected', '95%', '5 min ago']
            ]
          }
        ],
        summary: {
          totalRecords: 175,
          timeRange: timeRange,
          generatedAt: new Date(),
          executionTime: 1250
        }
      };

      const generatedReport = performanceReport.completeGeneration(reportData);
      
      expect(generatedReport.isGenerated).toBe(true);
      expect(generatedReport.data?.metrics.totalWorkflows).toBe(2);
      expect(generatedReport.data?.charts).toHaveLength(2);
      expect(generatedReport.data?.tables).toHaveLength(2);
      
      // Test report export capabilities
      const jsonExport = generatedReport.exportData('json');
      expect(jsonExport).toContain('totalWorkflows');
      
      const csvExport = generatedReport.exportData('csv');
      expect(csvExport).toContain('Top Performing Workflows');
      expect(csvExport).toContain('Email Marketing Campaign');
      
      const htmlExport = generatedReport.exportData('html');
      expect(htmlExport).toContain('<html>');
      expect(htmlExport).toContain('Monthly Performance Report');
    });

    it('should support real-time analytics dashboards', async () => {
      const userId = 1;
      
      // Create real-time metrics for dashboard
      const realtimeMetrics = [
        Metric.systemMetric(1, userId, 'active_workflows', MetricValue.gauge(5)),
        Metric.systemMetric(2, userId, 'current_executions', MetricValue.counter(12)),
        Metric.systemMetric(3, userId, 'system_load', MetricValue.percentage(68.5, 1)),
        Metric.systemMetric(4, userId, 'error_rate', MetricValue.percentage(2.1, 1)),
        Metric.systemMetric(5, userId, 'throughput', MetricValue.gauge(156.8, 'rate', 1))
      ];

      // Create alerts for real-time monitoring
      const highLoadAlert = Alert.create(
        1,
        userId,
        'High System Load',
        'Alert when system load exceeds 80%',
        'system_load',
        Threshold.greaterThan(80, 'high'),
        {
          channels: ['in_app'],
          recipients: ['admin'],
          cooldownMinutes: 5
        }
      );

      const errorRateAlert = Alert.create(
        2,
        userId,
        'High Error Rate',
        'Alert when error rate exceeds 5%',
        'error_rate',
        Threshold.greaterThan(5, 'critical'),
        {
          channels: ['email', 'in_app'],
          recipients: ['admin', 'devops'],
          cooldownMinutes: 10
        }
      );

      // Validate real-time metrics structure
      expect(realtimeMetrics.every(m => m.isSystemMetric)).toBe(true);
      expect(realtimeMetrics.every(m => m.userId === userId)).toBe(true);
      
      const loadMetric = realtimeMetrics.find(m => m.name === 'system_load');
      expect(loadMetric?.value.displayValue).toBe('68.5%');
      
      const errorMetric = realtimeMetrics.find(m => m.name === 'error_rate');
      expect(errorMetric?.value.displayValue).toBe('2.1%');
      
      // Test alert evaluation against real-time metrics
      expect(highLoadAlert.shouldTrigger(loadMetric!.value)).toBe(false); // 68.5% < 80%
      expect(errorRateAlert.shouldTrigger(errorMetric!.value)).toBe(false); // 2.1% < 5%
      
      // Simulate threshold breach
      const highLoadValue = MetricValue.percentage(85.2, 1);
      const triggeredAlert = highLoadAlert.trigger(highLoadValue);
      
      expect(triggeredAlert.isTriggered).toBe(true);
      expect(triggeredAlert.triggerCount).toBe(1);
    });
  });

  describe('Backward Compatibility Validation', () => {
    it('should maintain all existing functionality unchanged', async () => {
      const userId = 1;
      
      // Test existing workflow operations work unchanged
      const workflow = await storage.createWorkflow({
        userId,
        name: 'Compatibility Test Workflow',
        description: 'Testing backward compatibility',
        status: 'active',
        config: { steps: [] }
      });

      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe('Compatibility Test Workflow');

      const workflows = await storage.getWorkflowsByUserId(userId);
      expect(workflows).toHaveLength(1);

      // Test existing connected app operations work unchanged
      const app = await storage.createConnectedApp({
        userId,
        name: 'Compatibility Test App',
        description: 'Testing app compatibility',
        icon: 'test',
        status: 'connected',
        config: { apiKey: 'test_key' }
      });

      expect(app.id).toBeDefined();
      expect(app.name).toBe('Compatibility Test App');

      const apps = await storage.getConnectedAppsByUserId(userId);
      expect(apps).toHaveLength(1);

      // Test existing activity logging works unchanged
      await storage.createActivityLog({
        userId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        eventType: 'workflow_execution',
        status: 'success',
        details: { message: 'Test execution' }
      });

      const logs = await storage.getActivityLogsByUserId(userId);
      expect(logs.entries).toHaveLength(1);

      // Test existing dashboard stats work unchanged
      const stats = await storage.getDashboardStats(userId);
      expect(stats).toHaveProperty('activeWorkflows');
      expect(stats).toHaveProperty('tasksAutomated');
      expect(stats).toHaveProperty('connectedApps');
      expect(stats).toHaveProperty('timeSaved');
    });

    it('should preserve existing API response formats', async () => {
      const userId = 1;
      
      // Create test data using existing methods
      await storage.createWorkflow({
        userId,
        name: 'API Test Workflow',
        description: 'Testing API compatibility',
        status: 'active',
        config: { steps: [] }
      });

      await storage.createConnectedApp({
        userId,
        name: 'API Test App',
        description: 'Testing app API',
        icon: 'api',
        status: 'connected',
        config: { test: true }
      });

      // Verify response formats match expected structure
      const workflows = await storage.getWorkflowsByUserId(userId);
      const workflow = workflows[0];
      
      expect(workflow).toHaveProperty('id');
      expect(workflow).toHaveProperty('userId');
      expect(workflow).toHaveProperty('name');
      expect(workflow).toHaveProperty('description');
      expect(workflow).toHaveProperty('status');
      expect(workflow).toHaveProperty('config');
      expect(workflow).toHaveProperty('createdAt');
      expect(workflow).toHaveProperty('updatedAt');

      const apps = await storage.getConnectedAppsByUserId(userId);
      const app = apps[0];
      
      expect(app).toHaveProperty('id');
      expect(app).toHaveProperty('userId');
      expect(app).toHaveProperty('name');
      expect(app).toHaveProperty('description');
      expect(app).toHaveProperty('icon');
      expect(app).toHaveProperty('status');
      expect(app).toHaveProperty('config');
      expect(app).toHaveProperty('createdAt');
      expect(app).toHaveProperty('updatedAt');

      const stats = await storage.getDashboardStats(userId);
      
      expect(typeof stats.activeWorkflows).toBe('number');
      expect(typeof stats.tasksAutomated).toBe('number');
      expect(typeof stats.connectedApps).toBe('number');
      expect(typeof stats.timeSaved).toBe('string');
    });
  });
});