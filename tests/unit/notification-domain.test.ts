/**
 * Notification Domain Tests - Phase 5
 * Comprehensive test suite for notification domain entities and services
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Notification, NotificationStatus, NotificationType } from '../../src/domains/notification/domain/entities/Notification';
import { NotificationTemplate } from '../../src/domains/notification/domain/entities/NotificationTemplate';
import { Subscription, SubscriptionStatus, FrequencyType } from '../../src/domains/notification/domain/entities/Subscription';
import { NotificationId } from '../../src/domains/notification/domain/valueObjects/NotificationId';
import { Priority, PriorityLevel } from '../../src/domains/notification/domain/valueObjects/Priority';
import { Channel, ChannelType } from '../../src/domains/notification/domain/valueObjects/Channel';
import { NotificationDeliveryService } from '../../src/domains/notification/domain/services/NotificationDeliveryService';
import { TemplateRenderingService } from '../../src/domains/notification/domain/services/TemplateRenderingService';

describe('Notification Domain - Phase 5', () => {
  
  describe('Value Objects', () => {
    
    describe('NotificationId', () => {
      it('should create unique notification IDs', () => {
        const id1 = NotificationId.create();
        const id2 = NotificationId.create();
        
        expect(id1.getValue()).toBeDefined();
        expect(id2.getValue()).toBeDefined();
        expect(id1.getValue()).not.toBe(id2.getValue());
      });

      it('should create from string', () => {
        const idString = 'notif_test_123';
        const id = NotificationId.fromString(idString);
        
        expect(id.getValue()).toBe(idString);
      });

      it('should validate ID format', () => {
        expect(() => NotificationId.fromString('')).toThrow('NotificationId cannot be empty');
        expect(() => NotificationId.fromString('invalid@id')).toThrow('can only contain alphanumeric characters');
      });

      it('should support equality comparison', () => {
        const id1 = NotificationId.fromString('test_id');
        const id2 = NotificationId.fromString('test_id');
        const id3 = NotificationId.fromString('other_id');
        
        expect(id1.equals(id2)).toBe(true);
        expect(id1.equals(id3)).toBe(false);
      });
    });

    describe('Priority', () => {
      it('should create priority levels', () => {
        const low = Priority.low();
        const normal = Priority.normal();
        const high = Priority.high();
        const urgent = Priority.urgent();
        
        expect(low.getLevel()).toBe(PriorityLevel.LOW);
        expect(normal.getLevel()).toBe(PriorityLevel.NORMAL);
        expect(high.getLevel()).toBe(PriorityLevel.HIGH);
        expect(urgent.getLevel()).toBe(PriorityLevel.URGENT);
      });

      it('should provide numeric values for comparison', () => {
        const low = Priority.low();
        const urgent = Priority.urgent();
        
        expect(urgent.getNumericValue()).toBeGreaterThan(low.getNumericValue());
        expect(urgent.isHigherThan(low)).toBe(true);
        expect(low.isLowerThan(urgent)).toBe(true);
      });

      it('should provide delivery timeouts based on priority', () => {
        const urgent = Priority.urgent();
        const low = Priority.low();
        
        expect(urgent.getDeliveryTimeout()).toBeLessThan(low.getDeliveryTimeout());
        expect(urgent.getMaxRetries()).toBeGreaterThan(low.getMaxRetries());
      });
    });

    describe('Channel', () => {
      it('should create different channel types', () => {
        const email = Channel.email();
        const sms = Channel.sms();
        const push = Channel.push();
        const inApp = Channel.inApp();
        const webhook = Channel.webhook();
        
        expect(email.getType()).toBe(ChannelType.EMAIL);
        expect(sms.getType()).toBe(ChannelType.SMS);
        expect(push.getType()).toBe(ChannelType.PUSH);
        expect(inApp.getType()).toBe(ChannelType.IN_APP);
        expect(webhook.getType()).toBe(ChannelType.WEBHOOK);
      });

      it('should validate channel capabilities', () => {
        const email = Channel.email();
        const inApp = Channel.inApp();
        const sms = Channel.sms();
        
        expect(email.requiresConfiguration()).toBe(true);
        expect(inApp.requiresConfiguration()).toBe(false);
        expect(email.supportsRichContent()).toBe(true);
        expect(sms.supportsRichContent()).toBe(false);
        expect(email.supportsBulkDelivery()).toBe(true);
      });

      it('should provide channel-specific metrics', () => {
        const sms = Channel.sms();
        const email = Channel.email();
        
        expect(sms.getMaxMessageSize()).toBe(160);
        expect(email.getMaxMessageSize()).toBeGreaterThan(sms.getMaxMessageSize());
        expect(sms.getCostFactor()).toBeGreaterThan(email.getCostFactor());
      });
    });
  });

  describe('Entities', () => {
    
    describe('Notification', () => {
      let notification: Notification;

      beforeEach(() => {
        notification = Notification.create(
          1,
          'Test Notification',
          'This is a test notification',
          NotificationType.ALERT,
          Priority.normal(),
          [Channel.inApp(), Channel.email()]
        );
      });

      it('should create notification with required fields', () => {
        expect(notification.getUserId()).toBe(1);
        expect(notification.getTitle()).toBe('Test Notification');
        expect(notification.getContent()).toBe('This is a test notification');
        expect(notification.getType()).toBe(NotificationType.ALERT);
        expect(notification.getStatus()).toBe(NotificationStatus.PENDING);
        expect(notification.getChannels()).toHaveLength(2);
      });

      it('should update notification content', () => {
        notification.updateTitle('Updated Title');
        notification.updateContent('Updated content');
        
        expect(notification.getTitle()).toBe('Updated Title');
        expect(notification.getContent()).toBe('Updated content');
      });

      it('should validate content constraints', () => {
        expect(() => notification.updateTitle('')).toThrow('Title cannot be empty');
        expect(() => notification.updateTitle('x'.repeat(201))).toThrow('Title cannot exceed 200 characters');
        expect(() => notification.updateContent('')).toThrow('Content cannot be empty');
      });

      it('should manage notification channels', () => {
        const smsChannel = Channel.sms();
        
        notification.addChannel(smsChannel);
        expect(notification.hasChannel(smsChannel)).toBe(true);
        expect(notification.getChannels()).toHaveLength(3);
        
        notification.removeChannel(smsChannel);
        expect(notification.hasChannel(smsChannel)).toBe(false);
        expect(notification.getChannels()).toHaveLength(2);
      });

      it('should handle notification scheduling', () => {
        const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
        
        notification.schedule(futureDate);
        expect(notification.getScheduledAt()).toEqual(futureDate);
        expect(notification.isReadyToSend()).toBe(false);
      });

      it('should track delivery status transitions', () => {
        expect(notification.getStatus()).toBe(NotificationStatus.PENDING);
        
        notification.markAsSent();
        expect(notification.getStatus()).toBe(NotificationStatus.SENT);
        expect(notification.getSentAt()).toBeDefined();
        
        notification.markAsDelivered();
        expect(notification.getStatus()).toBe(NotificationStatus.DELIVERED);
        expect(notification.getDeliveredAt()).toBeDefined();
        
        notification.markAsRead();
        expect(notification.getStatus()).toBe(NotificationStatus.READ);
        expect(notification.getReadAt()).toBeDefined();
      });

      it('should track delivery attempts', () => {
        const attempt = {
          channel: ChannelType.EMAIL,
          attemptedAt: new Date(),
          success: true,
          responseTime: 1500,
          deliveryId: 'del_123'
        };
        
        notification.addDeliveryAttempt(attempt);
        expect(notification.getDeliveryAttempts()).toHaveLength(1);
        expect(notification.getRetryCount()).toBe(1);
        expect(notification.hasSuccessfulDelivery()).toBe(true);
      });

      it('should validate notification for delivery', () => {
        const errors = notification.validateForDelivery();
        expect(errors).toHaveLength(0);
        
        notification.updateContent('x'.repeat(200)); // Exceed SMS limit
        const smsChannel = Channel.sms();
        notification.addChannel(smsChannel);
        
        const validationErrors = notification.validateForDelivery();
        expect(validationErrors.length).toBeGreaterThan(0);
      });

      it('should handle expiration', () => {
        const expiredDate = new Date(Date.now() - 1000); // 1 second ago
        const notificationWithExpiry = Notification.create(
          1,
          'Expired Notification',
          'This notification has expired',
          NotificationType.REMINDER,
          Priority.normal(),
          [Channel.inApp()],
          undefined,
          expiredDate
        );
        
        expect(notificationWithExpiry.isExpired()).toBe(true);
        expect(notificationWithExpiry.isReadyToSend()).toBe(false);
      });
    });

    describe('NotificationTemplate', () => {
      let template: NotificationTemplate;

      beforeEach(() => {
        template = NotificationTemplate.create(
          'Welcome Template',
          'Template for welcome notifications',
          NotificationType.WELCOME,
          1,
          [
            {
              name: 'userName',
              type: 'string',
              required: true,
              description: 'User name for personalization'
            },
            {
              name: 'activationUrl',
              type: 'string',
              required: false,
              description: 'Account activation URL'
            }
          ],
          [
            {
              channel: ChannelType.EMAIL,
              subject: 'Welcome {{userName}}!',
              body: '<h1>Welcome {{userName}}</h1><p>Click <a href="{{activationUrl}}">here</a> to activate your account.</p>',
              format: 'html',
              enabled: true
            }
          ]
        );
      });

      it('should create template with variables and channel templates', () => {
        expect(template.getName()).toBe('Welcome Template');
        expect(template.getType()).toBe(NotificationType.WELCOME);
        expect(template.getVariables()).toHaveLength(2);
        expect(template.getChannelTemplates()).toHaveLength(1);
        expect(template.isTemplateActive()).toBe(true);
      });

      it('should manage template variables', () => {
        const newVariable = {
          name: 'companyName',
          type: 'string' as const,
          required: false,
          description: 'Company name'
        };
        
        template.addVariable(newVariable);
        expect(template.getVariables()).toHaveLength(3);
        expect(template.hasVariable('companyName')).toBe(true);
        
        template.updateVariable('companyName', { required: true });
        const updatedVar = template.getVariables().find(v => v.name === 'companyName');
        expect(updatedVar?.required).toBe(true);
        
        template.removeVariable('companyName');
        expect(template.hasVariable('companyName')).toBe(false);
      });

      it('should manage channel templates', () => {
        const smsTemplate = {
          channel: ChannelType.SMS,
          body: 'Welcome {{userName}}! Activate: {{activationUrl}}',
          format: 'text' as const,
          enabled: true
        };
        
        template.addChannelTemplate(smsTemplate);
        expect(template.hasChannelTemplate(ChannelType.SMS)).toBe(true);
        expect(template.getChannelTemplate(ChannelType.SMS)).toBeDefined();
        
        template.disableChannelTemplate(ChannelType.SMS);
        const smsChannelTemplate = template.getChannelTemplate(ChannelType.SMS);
        expect(smsChannelTemplate?.enabled).toBe(false);
      });

      it('should render templates with variables', () => {
        const variables = {
          userName: 'John Doe',
          activationUrl: 'https://example.com/activate/abc123'
        };
        
        const rendered = template.renderTemplate(ChannelType.EMAIL, variables);
        
        expect(rendered.subject).toBe('Welcome John Doe!');
        expect(rendered.body).toContain('Welcome John Doe');
        expect(rendered.body).toContain('href="https://example.com/activate/abc123"');
        expect(rendered.format).toBe('html');
      });

      it('should validate template variables', () => {
        const incompleteVariables = { userName: '' }; // Missing required variable content
        const validationErrors = template.validateVariables(incompleteVariables);
        expect(validationErrors.length).toBeGreaterThan(0);
        
        const completeVariables = { 
          userName: 'John Doe',
          activationUrl: 'https://example.com/activate'
        };
        const noErrors = template.validateVariables(completeVariables);
        expect(noErrors).toHaveLength(0);
      });

      it('should manage template versioning', () => {
        const initialVersion = template.getCurrentVersion();
        
        template.createVersion(1, 'Updated template content');
        expect(template.getCurrentVersion()).toBe(initialVersion + 1);
        expect(template.getVersions()).toHaveLength(2);
      });

      it('should handle template activation state', () => {
        expect(template.isTemplateActive()).toBe(true);
        
        template.deactivate();
        expect(template.isTemplateActive()).toBe(false);
        
        template.activate();
        expect(template.isTemplateActive()).toBe(true);
      });

      it('should manage template tags', () => {
        template.addTag('onboarding');
        template.addTag('welcome');
        
        expect(template.getTags()).toContain('onboarding');
        expect(template.getTags()).toContain('welcome');
        expect(template.hasTag('onboarding')).toBe(true);
        
        template.removeTag('welcome');
        expect(template.hasTag('welcome')).toBe(false);
      });
    });

    describe('Subscription', () => {
      let subscription: Subscription;

      beforeEach(() => {
        subscription = Subscription.create(
          1,
          NotificationType.ALERT,
          [
            {
              channel: ChannelType.EMAIL,
              enabled: true,
              frequency: FrequencyType.IMMEDIATE,
              address: 'user@example.com'
            },
            {
              channel: ChannelType.SMS,
              enabled: false,
              frequency: FrequencyType.DIGEST_DAILY,
              address: '+1234567890'
            }
          ],
          {
            enabled: true,
            startTime: '22:00',
            endTime: '08:00',
            timezone: 'UTC'
          }
        );
      });

      it('should create subscription with channel preferences', () => {
        expect(subscription.getUserId()).toBe(1);
        expect(subscription.getNotificationType()).toBe(NotificationType.ALERT);
        expect(subscription.getChannelPreferences()).toHaveLength(2);
        expect(subscription.isActive()).toBe(true);
      });

      it('should manage channel preferences', () => {
        expect(subscription.hasChannelEnabled(ChannelType.EMAIL)).toBe(true);
        expect(subscription.hasChannelEnabled(ChannelType.SMS)).toBe(false);
        
        subscription.enableChannel(ChannelType.SMS);
        expect(subscription.hasChannelEnabled(ChannelType.SMS)).toBe(true);
        
        subscription.disableChannel(ChannelType.SMS);
        expect(subscription.hasChannelEnabled(ChannelType.SMS)).toBe(false);
      });

      it('should handle subscription status changes', () => {
        expect(subscription.isActive()).toBe(true);
        
        subscription.pause();
        expect(subscription.isPaused()).toBe(true);
        expect(subscription.canReceiveNotifications()).toBe(false);
        
        subscription.activate();
        expect(subscription.isActive()).toBe(true);
        
        subscription.unsubscribe();
        expect(subscription.isUnsubscribed()).toBe(true);
      });

      it('should validate quiet hours', () => {
        // Create a time during quiet hours (23:00 UTC)
        const quietTime = new Date();
        quietTime.setUTCHours(23, 0, 0, 0);
        
        expect(subscription.isInQuietHours(quietTime)).toBe(true);
        
        // Create a time outside quiet hours (12:00 UTC)
        const activeTime = new Date();
        activeTime.setUTCHours(12, 0, 0, 0);
        
        expect(subscription.isInQuietHours(activeTime)).toBe(false);
      });

      it('should determine immediate delivery eligibility', () => {
        expect(subscription.shouldReceiveImmediately(ChannelType.EMAIL)).toBe(true);
        expect(subscription.shouldReceiveImmediately(ChannelType.SMS)).toBe(false);
        
        // During quiet hours, should not receive immediately
        const quietTime = new Date();
        quietTime.setUTCHours(23, 0, 0, 0);
        expect(subscription.isInQuietHours(quietTime)).toBe(true);
      });

      it('should manage filter rules', () => {
        const filterRule = {
          field: 'priority',
          operator: 'equals' as const,
          value: 'high',
          caseSensitive: false
        };
        
        subscription.addFilterRule(filterRule);
        expect(subscription.getFilterRules()).toHaveLength(1);
        
        // Test filter matching
        const highPriorityData = { priority: 'high', message: 'Test' };
        const lowPriorityData = { priority: 'low', message: 'Test' };
        
        expect(subscription.matchesFilters(highPriorityData)).toBe(true);
        expect(subscription.matchesFilters(lowPriorityData)).toBe(false);
      });

      it('should track notification history', () => {
        expect(subscription.getLastNotificationAt()).toBeUndefined();
        expect(subscription.getDaysSinceLastNotification()).toBe(Infinity);
        
        subscription.recordNotification();
        expect(subscription.getLastNotificationAt()).toBeDefined();
        expect(subscription.getDaysSinceLastNotification()).toBe(0);
      });

      it('should validate channel addresses', () => {
        const emailPreference = {
          channel: ChannelType.EMAIL,
          enabled: true,
          frequency: FrequencyType.IMMEDIATE,
          address: 'invalid-email'
        };
        
        expect(() => subscription.updateChannelPreference(emailPreference)).toThrow('Invalid email address format');
        
        const validEmailPreference = {
          channel: ChannelType.EMAIL,
          enabled: true,
          frequency: FrequencyType.IMMEDIATE,
          address: 'valid@example.com'
        };
        
        expect(() => subscription.updateChannelPreference(validEmailPreference)).not.toThrow();
      });
    });
  });

  describe('Domain Services', () => {
    
    describe('NotificationDeliveryService', () => {
      let deliveryService: NotificationDeliveryService;
      let notification: Notification;
      let subscription: Subscription;

      beforeEach(() => {
        deliveryService = new NotificationDeliveryService();
        
        notification = Notification.create(
          1,
          'Test Alert',
          'This is a test alert notification',
          NotificationType.ALERT,
          Priority.high(),
          [Channel.email(), Channel.inApp()]
        );
        
        subscription = Subscription.create(
          1,
          NotificationType.ALERT,
          [
            {
              channel: ChannelType.EMAIL,
              enabled: true,
              frequency: FrequencyType.IMMEDIATE,
              address: 'user@example.com'
            },
            {
              channel: ChannelType.IN_APP,
              enabled: true,
              frequency: FrequencyType.IMMEDIATE
            }
          ]
        );
      });

      it('should deliver notification to enabled channels', async () => {
        const results = await deliveryService.deliverNotification(notification, subscription);
        
        expect(results).toHaveLength(2);
        expect(results.some(r => r.channel === ChannelType.EMAIL)).toBe(true);
        expect(results.some(r => r.channel === ChannelType.IN_APP)).toBe(true);
        expect(notification.getStatus()).not.toBe(NotificationStatus.PENDING);
      });

      it('should handle delivery failures and retries', async () => {
        // Simulate a notification that might fail
        const failureProneNotification = Notification.create(
          1,
          'Test Failure',
          'This notification might fail',
          NotificationType.ALERT,
          Priority.normal(),
          [Channel.sms()] // SMS has higher failure rate in mock
        );
        
        const smsSubscription = Subscription.create(
          1,
          NotificationType.ALERT,
          [{
            channel: ChannelType.SMS,
            enabled: true,
            frequency: FrequencyType.IMMEDIATE,
            address: '+1234567890'
          }]
        );
        
        const results = await deliveryService.deliverNotification(
          failureProneNotification, 
          smsSubscription,
          { retryOnFailure: true, maxRetries: 2 }
        );
        
        expect(results).toHaveLength(1);
        expect(failureProneNotification.getDeliveryAttempts().length).toBeGreaterThan(0);
      });

      it('should respect quiet hours for non-urgent notifications', async () => {
        const quietHoursSubscription = Subscription.create(
          1,
          NotificationType.ALERT,
          [{
            channel: ChannelType.EMAIL,
            enabled: true,
            frequency: FrequencyType.IMMEDIATE,
            address: 'user@example.com'
          }],
          {
            enabled: true,
            startTime: '00:00',
            endTime: '23:59',
            timezone: 'UTC'
          }
        );
        
        await expect(
          deliveryService.deliverNotification(notification, quietHoursSubscription)
        ).rejects.toThrow('Delivery blocked by quiet hours');
      });

      it('should deliver urgent notifications despite quiet hours', async () => {
        const urgentNotification = Notification.create(
          1,
          'Urgent Alert',
          'This is urgent',
          NotificationType.SECURITY,
          Priority.urgent(),
          [Channel.email()]
        );
        
        const quietHoursSubscription = Subscription.create(
          1,
          NotificationType.SECURITY,
          [{
            channel: ChannelType.EMAIL,
            enabled: true,
            frequency: FrequencyType.IMMEDIATE,
            address: 'user@example.com'
          }],
          {
            enabled: true,
            startTime: '00:00',
            endTime: '23:59',
            timezone: 'UTC'
          }
        );
        
        const results = await deliveryService.deliverNotification(urgentNotification, quietHoursSubscription);
        expect(results).toHaveLength(1);
        expect(results[0].success).toBe(true);
      });

      it('should handle bulk delivery', async () => {
        const notifications = Array.from({ length: 5 }, (_, i) => 
          Notification.create(
            i + 1,
            `Bulk Test ${i + 1}`,
            `Bulk notification content ${i + 1}`,
            NotificationType.SYSTEM_UPDATE,
            Priority.normal(),
            [Channel.email()]
          )
        );
        
        const bulkResults = await deliveryService.deliverBulk({
          notifications,
          channel: ChannelType.EMAIL,
          batchSize: 2
        });
        
        expect(bulkResults.size).toBe(5);
        
        for (const [notificationId, results] of bulkResults) {
          expect(results).toHaveLength(1);
          expect(results[0].channel).toBe(ChannelType.EMAIL);
        }
      });

      it('should track delivery statistics', async () => {
        const initialStats = deliveryService.getDeliveryStats();
        
        await deliveryService.deliverNotification(notification, subscription);
        
        const updatedStats = deliveryService.getDeliveryStats();
        expect(updatedStats.totalAttempts).toBeGreaterThan(initialStats.totalAttempts);
        expect(updatedStats.successfulDeliveries).toBeGreaterThan(initialStats.successfulDeliveries);
      });

      it('should validate channel capability', async () => {
        const emailCapability = await deliveryService.validateDeliveryCapability(ChannelType.EMAIL);
        expect(emailCapability.available).toBeDefined();
        expect(emailCapability.responseTime).toBeDefined();
        
        if (emailCapability.available) {
          expect(emailCapability.responseTime).toBeGreaterThan(0);
        }
      });

      it('should optimize channel selection', () => {
        const optimalChannel = deliveryService.getOptimalChannel(notification, subscription);
        expect(optimalChannel).toBeDefined();
        expect([ChannelType.EMAIL, ChannelType.IN_APP]).toContain(optimalChannel?.getType());
      });
    });

    describe('TemplateRenderingService', () => {
      let renderingService: TemplateRenderingService;
      let template: NotificationTemplate;

      beforeEach(() => {
        renderingService = new TemplateRenderingService();
        
        template = NotificationTemplate.create(
          'User Activity Template',
          'Template for user activity notifications',
          NotificationType.ALERT,
          1,
          [
            {
              name: 'userName',
              type: 'string',
              required: true,
              description: 'User name'
            },
            {
              name: 'activityCount',
              type: 'number',
              required: true,
              description: 'Number of activities'
            },
            {
              name: 'lastLoginDate',
              type: 'date',
              required: false,
              description: 'Last login date'
            }
          ],
          [
            {
              channel: ChannelType.EMAIL,
              subject: 'Activity Summary for {{userName}}',
              body: '<h2>Hello {{userName}}</h2><p>You have {{activityCount}} new activities. {{#if lastLoginDate}}Last login: {{format lastLoginDate "YYYY-MM-DD"}}{{/if}}</p>',
              format: 'html',
              enabled: true
            },
            {
              channel: ChannelType.SMS,
              body: 'Hello {{userName}}! You have {{activityCount}} new activities.',
              format: 'text',
              enabled: true
            }
          ]
        );
      });

      it('should render template with variables', async () => {
        const context = {
          variables: {
            userName: 'Alice Johnson',
            activityCount: 5,
            lastLoginDate: new Date('2024-01-15')
          }
        };
        
        const rendered = await renderingService.renderTemplate(template, ChannelType.EMAIL, context);
        
        expect(rendered.subject).toBe('Activity Summary for Alice Johnson');
        expect(rendered.body).toContain('Hello Alice Johnson');
        expect(rendered.body).toContain('5 new activities');
        expect(rendered.body).toContain('2024-01-15');
        expect(rendered.format).toBe('html');
        expect(rendered.metadata.templateId).toBe(template.getId());
      });

      it('should handle conditional blocks in templates', async () => {
        const contextWithLogin = {
          variables: {
            userName: 'Bob Smith',
            activityCount: 3,
            lastLoginDate: new Date('2024-01-10')
          }
        };
        
        const contextWithoutLogin = {
          variables: {
            userName: 'Charlie Brown',
            activityCount: 2
          }
        };
        
        const renderedWithLogin = await renderingService.renderTemplate(template, ChannelType.EMAIL, contextWithLogin);
        const renderedWithoutLogin = await renderingService.renderTemplate(template, ChannelType.EMAIL, contextWithoutLogin);
        
        expect(renderedWithLogin.body).toContain('Last login: 2024-01-10');
        expect(renderedWithoutLogin.body).not.toContain('Last login:');
      });

      it('should validate required variables', async () => {
        const incompleteContext = {
          variables: {
            userName: 'Test User'
            // Missing required activityCount
          }
        };
        
        await expect(
          renderingService.renderTemplate(template, ChannelType.EMAIL, incompleteContext)
        ).rejects.toThrow('Template validation failed');
      });

      it('should handle different output formats', async () => {
        const context = {
          variables: {
            userName: 'David Wilson',
            activityCount: 7
          }
        };
        
        const emailRendered = await renderingService.renderTemplate(template, ChannelType.EMAIL, context);
        const smsRendered = await renderingService.renderTemplate(template, ChannelType.SMS, context);
        
        expect(emailRendered.format).toBe('html');
        expect(smsRendered.format).toBe('text');
        expect(emailRendered.subject).toBeDefined();
        expect(smsRendered.subject).toBeUndefined();
      });

      it('should render bulk templates efficiently', async () => {
        const contexts = Array.from({ length: 10 }, (_, i) => ({
          variables: {
            userName: `User ${i + 1}`,
            activityCount: i + 1
          }
        }));
        
        const results = await renderingService.renderBulkTemplates(template, ChannelType.SMS, contexts);
        
        expect(results).toHaveLength(10);
        
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if ('body' in result) {
            expect(result.body).toContain(`User ${i + 1}`);
            expect(result.body).toContain(`${i + 1} new activities`);
          }
        }
      });

      it('should preview templates with sample data', async () => {
        const preview = await renderingService.previewTemplate(
          template,
          ChannelType.EMAIL,
          { userName: 'Preview User' }
        );
        
        expect(preview.subject).toContain('Preview User');
        expect(preview.body).toContain('Preview User');
        expect(preview.metadata.templateId).toBe(template.getId());
      });

      it('should cache rendered templates', async () => {
        const context = {
          variables: {
            userName: 'Cache Test',
            activityCount: 1
          }
        };
        
        const startTime = Date.now();
        const result1 = await renderingService.renderTemplate(template, ChannelType.EMAIL, context);
        const firstRenderTime = Date.now() - startTime;
        
        const startTime2 = Date.now();
        const result2 = await renderingService.renderTemplate(template, ChannelType.EMAIL, context);
        const secondRenderTime = Date.now() - startTime2;
        
        expect(result1.body).toBe(result2.body);
        expect(secondRenderTime).toBeLessThanOrEqual(firstRenderTime);
      });

      it('should format variables correctly', async () => {
        const templateWithFormatting = NotificationTemplate.create(
          'Formatting Test',
          'Test formatting features',
          NotificationType.REPORT,
          1,
          [
            { name: 'amount', type: 'number', required: true, description: 'Amount' },
            { name: 'percentage', type: 'number', required: true, description: 'Percentage' },
            { name: 'reportDate', type: 'date', required: true, description: 'Report date' },
            { name: 'title', type: 'string', required: true, description: 'Title' }
          ],
          [{
            channel: ChannelType.EMAIL,
            subject: 'Report: {{format title "title"}}',
            body: 'Amount: {{format amount "currency"}}, Success rate: {{format percentage "percent"}}, Date: {{format reportDate "YYYY-MM-DD"}}',
            format: 'text',
            enabled: true
          }]
        );
        
        const context = {
          variables: {
            amount: 1234.56,
            percentage: 0.856,
            reportDate: new Date('2024-01-15'),
            title: 'monthly sales report'
          }
        };
        
        const rendered = await renderingService.renderTemplate(templateWithFormatting, ChannelType.EMAIL, context);
        
        expect(rendered.subject).toContain('Monthly Sales Report');
        expect(rendered.body).toContain('$1,234.56');
        expect(rendered.body).toContain('86%');
        expect(rendered.body).toContain('2024-01-15');
      });
    });
  });
});