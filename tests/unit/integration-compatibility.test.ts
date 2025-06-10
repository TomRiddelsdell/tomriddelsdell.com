import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../../server/storage';

describe('Integration Domain Compatibility - Phase 3', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    // Clear demo data for clean test environment
    storage['workflows'].clear();
    storage['connectedApps'].clear();
    storage['activityLogs'].clear();
  });

  describe('Backward Compatibility Validation', () => {
    it('should maintain existing connected app interface', async () => {
      const legacyAppData = {
        userId: 1,
        name: 'Legacy App',
        description: 'Existing connected app',
        icon: 'legacy',
        status: 'connected' as const,
        config: { apiKey: 'legacy_key_123' }
      };

      const app = await storage.createConnectedApp(legacyAppData);
      
      expect(app).toBeDefined();
      expect(app.id).toBeDefined();
      expect(app.userId).toBe(1);
      expect(app.name).toBe('Legacy App');
      expect(app.status).toBe('connected');
      expect(app.config.apiKey).toBe('legacy_key_123');
      expect(app.createdAt).toBeInstanceOf(Date);
      expect(app.updatedAt).toBeInstanceOf(Date);
    });

    it('should support enhanced connected app features', async () => {
      const enhancedAppData = {
        userId: 1,
        name: 'Enhanced Salesforce',
        description: 'Salesforce with OAuth2 integration',
        icon: 'salesforce',
        status: 'connected' as const,
        config: {
          clientId: 'sf_client_123',
          authType: 'oauth2',
          instanceUrl: 'https://company.salesforce.com',
          scopes: ['read', 'write', 'admin']
        },
        accessToken: 'sf_access_token_abc',
        refreshToken: 'sf_refresh_token_xyz',
        tokenExpiry: new Date(Date.now() + 3600000)
      };

      const app = await storage.createConnectedApp(enhancedAppData);
      
      expect(app.config.authType).toBe('oauth2');
      expect(app.config.scopes).toEqual(['read', 'write', 'admin']);
      expect(app.accessToken).toBe('sf_access_token_abc');
      expect(app.refreshToken).toBe('sf_refresh_token_xyz');
      expect(app.tokenExpiry).toBeInstanceOf(Date);
    });

    it('should retrieve apps with integration context', async () => {
      const userId = 1;
      
      // Create multiple apps with different configurations
      await storage.createConnectedApp({
        userId,
        name: 'Gmail API',
        description: 'Gmail integration with OAuth2',
        icon: 'gmail',
        status: 'connected',
        config: { authType: 'oauth2', scopes: ['gmail.readonly'] },
        accessToken: 'gmail_token',
        tokenExpiry: new Date(Date.now() + 3600000)
      });

      await storage.createConnectedApp({
        userId,
        name: 'Webhook Service',
        description: 'Incoming webhook handler',
        icon: 'webhook',
        status: 'disconnected',
        config: { authType: 'none', webhookUrl: 'https://api.example.com/webhook' }
      });

      await storage.createConnectedApp({
        userId,
        name: 'API Integration',
        description: 'REST API with key authentication',
        icon: 'api',
        status: 'connected',
        config: { authType: 'api_key', baseUrl: 'https://api.service.com' },
        accessToken: 'api_key_123'
      });

      const userApps = await storage.getConnectedAppsByUserId(userId);
      
      expect(userApps).toHaveLength(3);
      expect(userApps.every(app => app.userId === userId)).toBe(true);
      
      const connectedApps = userApps.filter(app => app.status === 'connected');
      expect(connectedApps).toHaveLength(2);
      
      const oauthApps = userApps.filter(app => app.config.authType === 'oauth2');
      expect(oauthApps).toHaveLength(1);
      expect(oauthApps[0].name).toBe('Gmail API');
    });

    it('should handle app lifecycle transitions', async () => {
      const appData = {
        userId: 1,
        name: 'GitHub Integration',
        description: 'GitHub API access',
        icon: 'github',
        status: 'disconnected' as const,
        config: { authType: 'token', baseUrl: 'https://api.github.com' }
      };

      const app = await storage.createConnectedApp(appData);
      expect(app.status).toBe('disconnected');

      // Simulate OAuth connection flow
      const connectedApp = await storage.updateConnectedApp(app.id, {
        status: 'connected',
        accessToken: 'ghp_token_abc123',
        tokenExpiry: new Date(Date.now() + 86400000),
        config: {
          ...app.config,
          userId: 'github_user_123',
          permissions: ['repo', 'user']
        }
      });

      expect(connectedApp?.status).toBe('connected');
      expect(connectedApp?.accessToken).toBe('ghp_token_abc123');
      expect(connectedApp?.config.userId).toBe('github_user_123');

      // Simulate token refresh
      const refreshedApp = await storage.updateConnectedApp(app.id, {
        accessToken: 'ghp_new_token_xyz789',
        tokenExpiry: new Date(Date.now() + 86400000)
      });

      expect(refreshedApp?.accessToken).toBe('ghp_new_token_xyz789');

      // Simulate disconnection
      const disconnectedApp = await storage.updateConnectedApp(app.id, {
        status: 'disconnected',
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null
      });

      expect(disconnectedApp?.status).toBe('disconnected');
      expect(disconnectedApp?.accessToken).toBeNull();
    });
  });

  describe('Integration with Workflow Domain', () => {
    it('should link workflows with integrations', async () => {
      const userId = 1;
      
      // Create integration first
      const integration = await storage.createConnectedApp({
        userId,
        name: 'Slack Notifications',
        description: 'Send notifications to Slack',
        icon: 'slack',
        status: 'connected',
        config: { 
          webhookUrl: 'https://hooks.slack.com/services/T00/B00/XXX',
          channel: '#notifications'
        },
        accessToken: 'xoxb-slack-token'
      });

      // Create workflow that uses the integration
      const workflow = await storage.createWorkflow({
        userId,
        name: 'Slack Notification Workflow',
        description: 'Send alerts to Slack when conditions are met',
        status: 'active',
        config: {
          steps: [
            {
              id: 'trigger-1',
              type: 'trigger',
              name: 'Data Change Detected',
              config: { event: 'data_updated' },
              position: { x: 0, y: 0 }
            },
            {
              id: 'action-1',
              type: 'action',
              name: 'Send Slack Message',
              config: { 
                integrationId: integration.id,
                message: 'Data has been updated: {{data.changes}}',
                channel: '#alerts'
              },
              position: { x: 200, y: 0 }
            }
          ],
          triggers: [
            {
              type: 'webhook',
              config: { endpoint: '/api/webhook/data-change' }
            }
          ]
        }
      });

      expect(workflow.config.steps[1].config.integrationId).toBe(integration.id);
      
      // Create activity log for integration usage
      await storage.createActivityLog({
        userId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        eventType: 'integration_execution',
        status: 'success',
        details: {
          integrationId: integration.id,
          integrationName: integration.name,
          messagesSent: 1,
          responseTime: 245
        }
      });

      const activityLogs = await storage.getActivityLogsByUserId(userId);
      expect(activityLogs.entries).toHaveLength(1);
      expect(activityLogs.entries[0].details.integrationId).toBe(integration.id);
    });

    it('should track integration usage in workflows', async () => {
      const userId = 1;
      
      // Create multiple integrations
      const emailIntegration = await storage.createConnectedApp({
        userId,
        name: 'Email Service',
        description: 'SMTP email sending',
        icon: 'email',
        status: 'connected',
        config: { smtpHost: 'smtp.example.com', port: 587 }
      });

      const smsIntegration = await storage.createConnectedApp({
        userId,
        name: 'SMS Gateway',
        description: 'SMS messaging service',
        icon: 'sms',
        status: 'connected',
        config: { apiUrl: 'https://api.sms-service.com' }
      });

      // Create workflow using both integrations
      const multiIntegrationWorkflow = await storage.createWorkflow({
        userId,
        name: 'Multi-Channel Alerts',
        description: 'Send alerts via email and SMS',
        status: 'active',
        config: {
          steps: [
            {
              id: 'trigger-1',
              type: 'trigger',
              name: 'Alert Triggered',
              config: { severity: 'high' },
              position: { x: 0, y: 0 }
            },
            {
              id: 'email-step',
              type: 'action',
              name: 'Send Email Alert',
              config: { 
                integrationId: emailIntegration.id,
                subject: 'High Severity Alert',
                template: 'alert_email'
              },
              position: { x: 200, y: -50 }
            },
            {
              id: 'sms-step',
              type: 'action',
              name: 'Send SMS Alert',
              config: { 
                integrationId: smsIntegration.id,
                message: 'ALERT: {{alert.description}}',
                recipients: ['admin']
              },
              position: { x: 200, y: 50 }
            }
          ]
        }
      });

      const integrationSteps = multiIntegrationWorkflow.config.steps.filter(
        step => step.config.integrationId
      );
      
      expect(integrationSteps).toHaveLength(2);
      expect(integrationSteps.map(s => s.config.integrationId)).toContain(emailIntegration.id);
      expect(integrationSteps.map(s => s.config.integrationId)).toContain(smsIntegration.id);
    });

    it('should handle integration errors in workflow context', async () => {
      const userId = 1;
      
      const faultyIntegration = await storage.createConnectedApp({
        userId,
        name: 'Faulty API',
        description: 'Integration that frequently fails',
        icon: 'api',
        status: 'connected',
        config: { baseUrl: 'https://unreliable-api.com' }
      });

      const workflow = await storage.createWorkflow({
        userId,
        name: 'Error-Prone Workflow',
        description: 'Workflow with unreliable integration',
        status: 'active',
        config: {
          steps: [
            {
              id: 'integration-step',
              type: 'action',
              name: 'Call Unreliable API',
              config: { integrationId: faultyIntegration.id },
              position: { x: 0, y: 0 }
            }
          ]
        }
      });

      // Log integration failures
      await storage.createActivityLog({
        userId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        eventType: 'integration_execution',
        status: 'failure',
        details: {
          integrationId: faultyIntegration.id,
          error: 'Connection timeout after 30 seconds',
          retryAttempt: 1,
          nextRetry: new Date(Date.now() + 60000)
        }
      });

      await storage.createActivityLog({
        userId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        eventType: 'integration_execution',
        status: 'failure',
        details: {
          integrationId: faultyIntegration.id,
          error: 'HTTP 503 Service Unavailable',
          retryAttempt: 2,
          maxRetriesReached: true
        }
      });

      const errorLogs = await storage.getActivityLogsByUserId(userId);
      const integrationErrors = errorLogs.entries.filter(
        log => log.status === 'failure' && log.details.integrationId === faultyIntegration.id
      );
      
      expect(integrationErrors).toHaveLength(2);
      expect(integrationErrors[0].details.retryAttempt).toBe(1);
      expect(integrationErrors[1].details.maxRetriesReached).toBe(true);
    });
  });

  describe('Enhanced Dashboard Statistics', () => {
    it('should provide comprehensive integration metrics', async () => {
      const userId = 1;
      
      // Create diverse test data
      await storage.createWorkflow({
        userId,
        name: 'Active Integration Workflow',
        description: 'Uses multiple integrations',
        status: 'active',
        config: { steps: [] }
      });

      await storage.createConnectedApp({
        userId,
        name: 'Primary Integration',
        description: 'Main integration service',
        icon: 'primary',
        status: 'connected',
        config: { type: 'api' }
      });

      await storage.createConnectedApp({
        userId,
        name: 'Secondary Integration',
        description: 'Backup integration service',
        icon: 'secondary',
        status: 'connected',
        config: { type: 'webhook' }
      });

      await storage.createConnectedApp({
        userId,
        name: 'Disconnected Integration',
        description: 'Currently offline',
        icon: 'offline',
        status: 'disconnected',
        config: { type: 'api' }
      });

      // Log successful integration executions
      await storage.createActivityLog({
        userId,
        workflowId: null,
        workflowName: 'Integration System',
        eventType: 'integration_execution',
        status: 'success',
        details: {
          executionTime: 150,
          dataProcessed: '2.5MB',
          requestsCount: 12
        }
      });

      const stats = await storage.getDashboardStats(userId);
      
      expect(stats.activeWorkflows).toBeGreaterThanOrEqual(1);
      expect(stats.connectedApps).toBeGreaterThanOrEqual(2);
      expect(typeof stats.timeSaved).toBe('string');
      expect(typeof stats.tasksAutomated).toBe('number');
    });

    it('should calculate integration health metrics', async () => {
      const userId = 1;
      
      // Create integrations with different health states
      const healthyIntegration = await storage.createConnectedApp({
        userId,
        name: 'Healthy Integration',
        description: 'Performing well',
        icon: 'healthy',
        status: 'connected',
        config: { healthScore: 95 }
      });

      const warningIntegration = await storage.createConnectedApp({
        userId,
        name: 'Warning Integration',
        description: 'Some issues detected',
        icon: 'warning',
        status: 'connected',
        config: { healthScore: 70 }
      });

      const criticalIntegration = await storage.createConnectedApp({
        userId,
        name: 'Critical Integration',
        description: 'Needs attention',
        icon: 'critical',
        status: 'disconnected',
        config: { healthScore: 20 }
      });

      const integrations = [healthyIntegration, warningIntegration, criticalIntegration];
      const connectedIntegrations = integrations.filter(i => i.status === 'connected');
      const disconnectedIntegrations = integrations.filter(i => i.status === 'disconnected');
      
      expect(connectedIntegrations).toHaveLength(2);
      expect(disconnectedIntegrations).toHaveLength(1);
      
      const averageHealthScore = connectedIntegrations.reduce(
        (sum, integration) => sum + (integration.config.healthScore || 0), 0
      ) / connectedIntegrations.length;
      
      expect(averageHealthScore).toBe(82.5); // (95 + 70) / 2
    });
  });

  describe('Data Validation and Integrity', () => {
    it('should validate integration configuration schemas', async () => {
      const userId = 1;
      
      // Valid configuration
      const validIntegration = await storage.createConnectedApp({
        userId,
        name: 'Valid API Integration',
        description: 'Properly configured integration',
        icon: 'api',
        status: 'connected',
        config: {
          baseUrl: 'https://api.service.com',
          authType: 'bearer',
          timeout: 30000,
          retryAttempts: 3,
          rateLimits: {
            requestsPerMinute: 60,
            requestsPerHour: 1000
          }
        },
        accessToken: 'valid_token_123'
      });

      expect(validIntegration.config.baseUrl).toBe('https://api.service.com');
      expect(validIntegration.config.authType).toBe('bearer');
      expect(validIntegration.config.rateLimits.requestsPerMinute).toBe(60);
    });

    it('should handle complex integration workflows', async () => {
      const userId = 1;
      
      // Create a complex workflow with multiple integration points
      const complexWorkflow = await storage.createWorkflow({
        userId,
        name: 'Data Processing Pipeline',
        description: 'Multi-stage data processing with integrations',
        status: 'active',
        config: {
          steps: [
            {
              id: 'data-source',
              type: 'trigger',
              name: 'Data Source Integration',
              config: {
                integrationId: 'source_integration_123',
                pollInterval: 300000,
                dataFormat: 'json'
              },
              position: { x: 0, y: 0 }
            },
            {
              id: 'transform',
              type: 'action',
              name: 'Data Transformation',
              config: {
                transformationType: 'map_fields',
                mapping: {
                  'source.id': 'target.userId',
                  'source.name': 'target.fullName',
                  'source.email': 'target.emailAddress'
                }
              },
              position: { x: 200, y: 0 }
            },
            {
              id: 'destination',
              type: 'action',
              name: 'Data Destination Integration',
              config: {
                integrationId: 'dest_integration_456',
                batchSize: 100,
                errorHandling: 'retry_with_backoff'
              },
              position: { x: 400, y: 0 }
            }
          ],
          triggers: [
            {
              type: 'schedule',
              config: { cron: '0 */5 * * * *' } // Every 5 minutes
            }
          ],
          settings: {
            maxExecutionTime: 600000,
            enableParallelProcessing: false,
            dataRetentionDays: 30
          }
        }
      });

      expect(complexWorkflow.config.steps).toHaveLength(3);
      expect(complexWorkflow.config.settings.maxExecutionTime).toBe(600000);
      
      const integrationSteps = complexWorkflow.config.steps.filter(
        step => step.config.integrationId
      );
      expect(integrationSteps).toHaveLength(2);
    });
  });
});