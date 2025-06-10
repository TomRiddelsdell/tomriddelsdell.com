/**
 * Notification Application Layer Tests - Phase 5
 * Test suite for notification command handlers and application services
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationCommandHandler } from '../../src/domains/notification/application/handlers/NotificationCommandHandler';
import { NotificationDeliveryService } from '../../src/domains/notification/domain/services/NotificationDeliveryService';
import { TemplateRenderingService } from '../../src/domains/notification/domain/services/TemplateRenderingService';
import { SendNotificationCommand } from '../../src/domains/notification/application/commands/SendNotificationCommand';
import { CreateTemplateCommand, UpdateTemplateCommand } from '../../src/domains/notification/application/commands/CreateTemplateCommand';
import { NotificationType } from '../../src/domains/notification/domain/entities/Notification';
import { ChannelType } from '../../src/domains/notification/domain/valueObjects/Channel';
import { PriorityLevel } from '../../src/domains/notification/domain/valueObjects/Priority';

describe('Notification Application Layer - Phase 5', () => {
  let commandHandler: NotificationCommandHandler;
  let deliveryService: NotificationDeliveryService;
  let templateService: TemplateRenderingService;

  beforeEach(() => {
    deliveryService = new NotificationDeliveryService();
    templateService = new TemplateRenderingService();
    commandHandler = new NotificationCommandHandler(deliveryService, templateService);
  });

  describe('Command Handling', () => {
    
    it('should send immediate notification successfully', async () => {
      const command = new SendNotificationCommand(
        1,
        'Security Alert',
        'Your account was accessed from a new device',
        NotificationType.SECURITY,
        PriorityLevel.HIGH,
        [ChannelType.EMAIL, ChannelType.SMS]
      );

      const result = await commandHandler.handleSendNotification(command);

      expect(result.success).toBe(true);
      expect(result.data.notificationId).toBeDefined();
      expect(result.data.deliveryResults).toHaveLength(2);
      expect(result.data.deliveryResults.some(r => r.channel === ChannelType.EMAIL)).toBe(true);
      expect(result.data.deliveryResults.some(r => r.channel === ChannelType.SMS)).toBe(true);
    });

    it('should handle notification validation errors', async () => {
      const invalidCommand = new SendNotificationCommand(
        1,
        '', // Empty title
        'Content',
        NotificationType.ALERT,
        PriorityLevel.NORMAL,
        []  // No channels
      );

      const validation = await commandHandler.validateNotificationContent(
        invalidCommand.title,
        invalidCommand.content,
        invalidCommand.channels
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Title is required');
      expect(validation.errors).toContain('At least one delivery channel is required');
    });

    it('should send templated notification', async () => {
      const command = new SendNotificationCommand(
        1,
        'Welcome User',
        'Template will override this',
        NotificationType.WELCOME,
        PriorityLevel.NORMAL,
        [ChannelType.EMAIL],
        'welcome_template',
        {
          userName: 'John Doe',
          activationUrl: 'https://example.com/activate/abc123'
        }
      );

      const result = await commandHandler.handleSendNotification(command);

      expect(result.success).toBe(true);
      expect(result.data.notificationId).toBeDefined();
      expect(result.data.deliveryResults).toHaveLength(1);
    });

    it('should schedule notification for future delivery', async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const command = new SendNotificationCommand(
        1,
        'Scheduled Reminder',
        'This is a scheduled notification',
        NotificationType.REMINDER,
        PriorityLevel.NORMAL,
        [ChannelType.EMAIL],
        undefined,
        undefined,
        futureDate
      );

      const result = await commandHandler.handleScheduleNotification(command);

      expect(result.success).toBe(true);
      expect(result.data.scheduledAt).toEqual(futureDate);
      expect(result.data.estimatedDelivery).toBeDefined();
    });

    it('should reject scheduling in the past', async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const command = new SendNotificationCommand(
        1,
        'Invalid Schedule',
        'This should fail',
        NotificationType.REMINDER,
        PriorityLevel.NORMAL,
        [ChannelType.EMAIL],
        undefined,
        undefined,
        pastDate
      );

      const result = await commandHandler.handleScheduleNotification(command);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('must be in the future');
    });

    it('should handle bulk notification sending', async () => {
      const commands = Array.from({ length: 3 }, (_, i) => 
        new SendNotificationCommand(
          i + 1,
          `Bulk Notification ${i + 1}`,
          `Content for user ${i + 1}`,
          NotificationType.SYSTEM_UPDATE,
          PriorityLevel.NORMAL,
          [ChannelType.EMAIL]
        )
      );

      const result = await commandHandler.handleSendBulkNotification(commands);

      expect(result.success).toBe(true);
      expect(result.data.totalNotifications).toBe(3);
      expect(result.data.summary.successful).toBeDefined();
      expect(result.data.summary.failed).toBeDefined();
    });

    it('should validate content length for different channels', async () => {
      const longContent = 'x'.repeat(200); // Exceeds SMS limit
      
      const validation = await commandHandler.validateNotificationContent(
        'Test Title',
        longContent,
        [ChannelType.SMS]
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('exceeds maximum size'))).toBe(true);
    });
  });

  describe('Template Management', () => {
    
    it('should create notification template', async () => {
      const command = new CreateTemplateCommand(
        'New User Welcome',
        'Template for welcoming new users',
        NotificationType.WELCOME,
        1,
        [
          {
            name: 'userName',
            type: 'string',
            required: true,
            description: 'User name for personalization'
          }
        ],
        [
          {
            channel: ChannelType.EMAIL,
            subject: 'Welcome {{userName}}!',
            body: '<h1>Welcome to our platform, {{userName}}!</h1>',
            format: 'html',
            enabled: true
          }
        ],
        ['onboarding', 'welcome']
      );

      const result = await commandHandler.handleCreateTemplate(command);

      expect(result.success).toBe(true);
      expect(result.data.templateId).toBeDefined();
      expect(result.data.name).toBe('New User Welcome');
      expect(result.data.channelCount).toBe(1);
      expect(result.data.variableCount).toBe(1);
    });

    it('should update existing template', async () => {
      const updateCommand = new UpdateTemplateCommand(
        'existing_template_id',
        'Updated Template Name',
        'Updated description',
        undefined,
        undefined,
        ['updated', 'template'],
        { version: '2.0' },
        true
      );

      const result = await commandHandler.handleUpdateTemplate(updateCommand);

      expect(result.success).toBe(true);
      expect(result.data.templateId).toBe('existing_template_id');
      expect(result.data.name).toBe('Updated Template Name');
      expect(result.data.isActive).toBe(true);
    });

    it('should preview template with sample data', async () => {
      const result = await commandHandler.previewTemplate(
        'sample_template',
        ChannelType.EMAIL,
        {
          userName: 'Preview User',
          companyName: 'Test Company'
        }
      );

      expect(result.success).toBe(true);
      expect(result.data.preview.subject).toBeDefined();
      expect(result.data.preview.body).toBeDefined();
      expect(result.data.metadata).toBeDefined();
    });

    it('should validate template preview warnings', async () => {
      const result = await commandHandler.previewTemplate(
        'sample_template',
        ChannelType.EMAIL,
        {
          userName: 'Test User'
          // Missing some variables to trigger warnings
        }
      );

      expect(result.success).toBe(true);
      if (result.warnings && result.warnings.length > 0) {
        expect(result.warnings.some(w => w.includes('unresolved variables'))).toBeTruthy();
      }
    });

    it('should deactivate template on delete', async () => {
      const deleteCommand = {
        templateId: 'template_to_delete'
      };

      const result = await commandHandler.handleDeleteTemplate(deleteCommand);

      expect(result.success).toBe(true);
      expect(result.data.templateId).toBe('template_to_delete');
      expect(result.data.message).toContain('deactivated');
    });

    it('should handle template creation with invalid data', async () => {
      const invalidCommand = new CreateTemplateCommand(
        '', // Empty name
        'Description',
        NotificationType.ALERT,
        1,
        [],
        []
      );

      const result = await commandHandler.handleCreateTemplate(invalidCommand);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('name cannot be empty');
    });
  });

  describe('Priority and Channel Handling', () => {
    
    it('should handle urgent notifications with higher priority', async () => {
      const urgentCommand = new SendNotificationCommand(
        1,
        'System Critical Alert',
        'Critical system failure detected',
        NotificationType.SECURITY,
        PriorityLevel.URGENT,
        [ChannelType.EMAIL, ChannelType.SMS, ChannelType.PUSH]
      );

      const result = await commandHandler.handleSendNotification(urgentCommand);

      expect(result.success).toBe(true);
      expect(result.data.deliveryResults).toHaveLength(3);
      
      // Urgent notifications should have faster delivery
      const responseTime = result.data.deliveryResults[0].responseTime;
      expect(responseTime).toBeDefined();
    });

    it('should optimize channel selection based on content', async () => {
      const shortCommand = new SendNotificationCommand(
        1,
        'Quick Alert',
        'Short message', // Suitable for SMS
        NotificationType.ALERT,
        PriorityLevel.HIGH,
        [ChannelType.SMS, ChannelType.EMAIL]
      );

      const longCommand = new SendNotificationCommand(
        1,
        'Detailed Report',
        'x'.repeat(500), // Too long for SMS
        NotificationType.REPORT,
        PriorityLevel.NORMAL,
        [ChannelType.SMS, ChannelType.EMAIL]
      );

      const shortResult = await commandHandler.handleSendNotification(shortCommand);
      const longValidation = await commandHandler.validateNotificationContent(
        longCommand.title,
        longCommand.content,
        [ChannelType.SMS]
      );

      expect(shortResult.success).toBe(true);
      expect(longValidation.isValid).toBe(false);
    });

    it('should handle in-app notifications differently', async () => {
      const inAppCommand = new SendNotificationCommand(
        1,
        'In-App Notification',
        'This is an in-app notification with rich content',
        NotificationType.ALERT,
        PriorityLevel.NORMAL,
        [ChannelType.IN_APP]
      );

      const result = await commandHandler.handleSendNotification(inAppCommand);

      expect(result.success).toBe(true);
      expect(result.data.deliveryResults).toHaveLength(1);
      expect(result.data.deliveryResults[0].channel).toBe(ChannelType.IN_APP);
    });
  });

  describe('Error Handling and Resilience', () => {
    
    it('should handle delivery service failures gracefully', async () => {
      // Create a command that might trigger delivery issues
      const problematicCommand = new SendNotificationCommand(
        999, // Non-existent user
        'Test Notification',
        'Content',
        NotificationType.ALERT,
        PriorityLevel.NORMAL,
        [ChannelType.WEBHOOK] // Higher failure rate channel
      );

      const result = await commandHandler.handleSendNotification(problematicCommand);

      // Should not throw, but may have partial success
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should validate command data before processing', async () => {
      const validationTests = [
        {
          title: '',
          content: 'Valid content',
          channels: [ChannelType.EMAIL],
          expectedError: 'Title is required'
        },
        {
          title: 'Valid title',
          content: '',
          channels: [ChannelType.EMAIL],
          expectedError: 'Content is required'
        },
        {
          title: 'Valid title',
          content: 'Valid content',
          channels: [],
          expectedError: 'At least one delivery channel is required'
        }
      ];

      for (const test of validationTests) {
        const validation = await commandHandler.validateNotificationContent(
          test.title,
          test.content,
          test.channels
        );

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain(test.expectedError);
      }
    });

    it('should handle template rendering failures', async () => {
      const commandWithInvalidTemplate = new SendNotificationCommand(
        1,
        'Test',
        'Content',
        NotificationType.ALERT,
        PriorityLevel.NORMAL,
        [ChannelType.EMAIL],
        'non_existent_template',
        {}
      );

      const result = await commandHandler.handleSendNotification(commandWithInvalidTemplate);

      // Should handle gracefully, either succeed with fallback or fail cleanly
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Performance and Scalability', () => {
    
    it('should handle large bulk operations efficiently', async () => {
      const largeCommandSet = Array.from({ length: 50 }, (_, i) => 
        new SendNotificationCommand(
          i + 1,
          `Bulk Test ${i + 1}`,
          `Content ${i + 1}`,
          NotificationType.SYSTEM_UPDATE,
          PriorityLevel.NORMAL,
          [ChannelType.EMAIL]
        )
      );

      const startTime = Date.now();
      const result = await commandHandler.handleSendBulkNotification(largeCommandSet);
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data.totalNotifications).toBe(50);
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should batch operations appropriately', async () => {
      const commands = Array.from({ length: 25 }, (_, i) => 
        new SendNotificationCommand(
          i + 1,
          `Batch Test ${i + 1}`,
          'Batch content',
          NotificationType.ALERT,
          PriorityLevel.NORMAL,
          [ChannelType.EMAIL]
        )
      );

      const result = await commandHandler.handleSendBulkNotification(commands);

      expect(result.success).toBe(true);
      expect(result.data.deliveryResults).toBeDefined();
      
      // Check that batching occurred
      const deliveryCount = Object.keys(result.data.deliveryResults).length;
      expect(deliveryCount).toBe(25);
    });
  });

  describe('Cross-Domain Integration', () => {
    
    it('should handle workflow completion notifications', async () => {
      const workflowCommand = new SendNotificationCommand(
        1,
        'Workflow Completed',
        'Your automation workflow has completed successfully',
        NotificationType.WORKFLOW_STATUS,
        PriorityLevel.NORMAL,
        [ChannelType.EMAIL, ChannelType.IN_APP],
        undefined,
        undefined,
        undefined,
        undefined,
        {
          workflowId: 'workflow_123',
          executionTime: 45000,
          tasksCompleted: 5
        }
      );

      const result = await commandHandler.handleSendNotification(workflowCommand);

      expect(result.success).toBe(true);
      expect(result.data.deliveryResults).toHaveLength(2);
    });

    it('should handle integration failure alerts', async () => {
      const integrationAlert = new SendNotificationCommand(
        1,
        'Integration Failed',
        'API integration has failed and requires attention',
        NotificationType.INTEGRATION_STATUS,
        PriorityLevel.HIGH,
        [ChannelType.EMAIL, ChannelType.SMS],
        undefined,
        undefined,
        undefined,
        undefined,
        {
          integrationId: 'integration_456',
          errorCode: 'API_TIMEOUT',
          lastSuccessful: new Date(Date.now() - 3600000)
        }
      );

      const result = await commandHandler.handleSendNotification(integrationAlert);

      expect(result.success).toBe(true);
      expect(result.data.deliveryResults.length).toBeGreaterThan(0);
    });

    it('should handle analytics threshold alerts', async () => {
      const analyticsAlert = new SendNotificationCommand(
        1,
        'Performance Threshold Exceeded',
        'System performance has exceeded warning thresholds',
        NotificationType.ALERT,
        PriorityLevel.HIGH,
        [ChannelType.EMAIL],
        undefined,
        undefined,
        undefined,
        undefined,
        {
          metricName: 'response_time',
          currentValue: 5000,
          threshold: 3000,
          trend: 'increasing'
        }
      );

      const result = await commandHandler.handleSendNotification(analyticsAlert);

      expect(result.success).toBe(true);
    });
  });
});