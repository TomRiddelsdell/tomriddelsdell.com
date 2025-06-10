/**
 * Notification Domain - Phase 5
 * NotificationCommandHandler
 */

import { Notification, NotificationType } from '../../domain/entities/Notification';
import { NotificationTemplate } from '../../domain/entities/NotificationTemplate';
import { Subscription } from '../../domain/entities/Subscription';
import { NotificationDeliveryService } from '../../domain/services/NotificationDeliveryService';
import { TemplateRenderingService } from '../../domain/services/TemplateRenderingService';
import { Channel } from '../../domain/valueObjects/Channel';
import { Priority } from '../../domain/valueObjects/Priority';
import { SendNotificationCommand } from '../commands/SendNotificationCommand';
import { CreateTemplateCommand, UpdateTemplateCommand, DeleteTemplateCommand } from '../commands/CreateTemplateCommand';

export interface CommandResult {
  success: boolean;
  data?: any;
  errorMessage?: string;
  warnings?: string[];
}

export class NotificationCommandHandler {
  constructor(
    private readonly deliveryService: NotificationDeliveryService,
    private readonly templateService: TemplateRenderingService
  ) {}

  async handleSendNotification(command: SendNotificationCommand): Promise<CommandResult> {
    try {
      let notification: Notification;

      if (command.templateId && command.templateVariables) {
        // Create notification from template
        notification = await this.createNotificationFromTemplate(command);
      } else {
        // Create notification directly
        notification = this.createNotificationDirect(command);
      }

      // Create mock subscription for user
      const subscription = this.createMockSubscription(command.userId, command.type);

      // Deliver notification
      const deliveryResults = await this.deliveryService.deliverNotification(
        notification,
        subscription,
        {
          retryOnFailure: true,
          maxRetries: notification.getPriority().getMaxRetries()
        }
      );

      return {
        success: true,
        data: {
          notificationId: notification.getId().getValue(),
          status: notification.getStatus(),
          deliveryResults: deliveryResults.map(result => ({
            channel: result.channel,
            success: result.success,
            deliveryId: result.deliveryId,
            responseTime: result.responseTime,
            errorMessage: result.errorMessage
          }))
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to send notification'
      };
    }
  }

  async handleSendBulkNotification(notifications: SendNotificationCommand[]): Promise<CommandResult> {
    try {
      const createdNotifications: Notification[] = [];

      for (const command of notifications) {
        let notification: Notification;

        if (command.templateId && command.templateVariables) {
          notification = await this.createNotificationFromTemplate(command);
        } else {
          notification = this.createNotificationDirect(command);
        }

        createdNotifications.push(notification);
      }

      // Use first notification's channel for bulk delivery
      const primaryChannel = createdNotifications[0]?.getChannels()[0]?.getType();
      if (!primaryChannel) {
        throw new Error('No delivery channel available for bulk notification');
      }

      const bulkResults = await this.deliveryService.deliverBulk({
        notifications: createdNotifications,
        channel: primaryChannel,
        batchSize: 50,
        delayBetweenBatches: 2000
      });

      return {
        success: true,
        data: {
          totalNotifications: createdNotifications.length,
          deliveryResults: Object.fromEntries(bulkResults),
          summary: {
            successful: Array.from(bulkResults.values()).filter(results => 
              results.some(r => r.success)
            ).length,
            failed: Array.from(bulkResults.values()).filter(results => 
              results.every(r => !r.success)
            ).length
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to send bulk notifications'
      };
    }
  }

  async handleCreateTemplate(command: CreateTemplateCommand): Promise<CommandResult> {
    try {
      const template = NotificationTemplate.create(
        command.name,
        command.description,
        command.type,
        command.createdBy,
        command.variables,
        command.channelTemplates,
        command.tags,
        command.metadata
      );

      return {
        success: true,
        data: {
          templateId: template.getId(),
          name: template.getName(),
          type: template.getType(),
          version: template.getCurrentVersion(),
          channelCount: template.getChannelTemplates().length,
          variableCount: template.getVariables().length
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to create template'
      };
    }
  }

  async handleUpdateTemplate(command: UpdateTemplateCommand): Promise<CommandResult> {
    try {
      // In production, fetch template from repository
      const mockTemplate = this.createMockTemplate(command.templateId);

      if (command.name) {
        mockTemplate.updateName(command.name);
      }

      if (command.description) {
        mockTemplate.updateDescription(command.description);
      }

      if (command.isActive !== undefined) {
        if (command.isActive) {
          mockTemplate.activate();
        } else {
          mockTemplate.deactivate();
        }
      }

      if (command.variables) {
        // Update variables
        for (const variable of command.variables) {
          if (mockTemplate.hasVariable(variable.name)) {
            mockTemplate.updateVariable(variable.name, variable);
          } else {
            mockTemplate.addVariable(variable);
          }
        }
      }

      if (command.channelTemplates) {
        // Update channel templates
        for (const channelTemplate of command.channelTemplates) {
          mockTemplate.addChannelTemplate(channelTemplate);
        }
      }

      if (command.tags) {
        // Update tags
        for (const tag of command.tags) {
          mockTemplate.addTag(tag);
        }
      }

      if (command.metadata) {
        mockTemplate.updateMetadata(command.metadata);
      }

      return {
        success: true,
        data: {
          templateId: mockTemplate.getId(),
          name: mockTemplate.getName(),
          version: mockTemplate.getCurrentVersion(),
          isActive: mockTemplate.isTemplateActive(),
          updatedAt: mockTemplate.getUpdatedAt()
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to update template'
      };
    }
  }

  async handleDeleteTemplate(command: DeleteTemplateCommand): Promise<CommandResult> {
    try {
      // In production, fetch and delete template from repository
      const mockTemplate = this.createMockTemplate(command.templateId);
      
      // Deactivate instead of hard delete to preserve history
      mockTemplate.deactivate();

      return {
        success: true,
        data: {
          templateId: command.templateId,
          deletedAt: new Date(),
          message: 'Template deactivated successfully'
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to delete template'
      };
    }
  }

  async handleScheduleNotification(command: SendNotificationCommand): Promise<CommandResult> {
    try {
      if (!command.scheduledAt) {
        throw new Error('Scheduled time is required for scheduled notifications');
      }

      if (command.scheduledAt <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      let notification: Notification;

      if (command.templateId && command.templateVariables) {
        notification = await this.createNotificationFromTemplate(command);
      } else {
        notification = this.createNotificationDirect(command);
      }

      notification.schedule(command.scheduledAt);

      return {
        success: true,
        data: {
          notificationId: notification.getId().getValue(),
          status: notification.getStatus(),
          scheduledAt: notification.getScheduledAt(),
          title: notification.getTitle(),
          estimatedDelivery: this.calculateEstimatedDelivery(notification)
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to schedule notification'
      };
    }
  }

  private async createNotificationFromTemplate(command: SendNotificationCommand): Promise<Notification> {
    // In production, fetch template from repository
    const template = this.createMockTemplate(command.templateId!);
    
    if (!template.isTemplateActive()) {
      throw new Error('Cannot use inactive template');
    }

    // Render template for primary channel
    const primaryChannel = command.channels[0];
    const rendered = await this.templateService.renderTemplate(
      template,
      primaryChannel,
      {
        variables: command.templateVariables!,
        locale: 'en',
        timezone: 'UTC'
      }
    );

    // Create notification with rendered content
    return Notification.create(
      command.userId,
      rendered.subject || command.title,
      rendered.body,
      command.type,
      Priority.fromString(command.priority),
      command.channels.map(c => Channel.fromString(c)),
      command.scheduledAt,
      command.expiresAt,
      {
        templateId: command.templateId,
        templateVariables: command.templateVariables,
        ...(command.metadata || {})
      }
    );
  }

  private createNotificationDirect(command: SendNotificationCommand): Notification {
    return Notification.create(
      command.userId,
      command.title,
      command.content,
      command.type,
      Priority.fromString(command.priority),
      command.channels.map(c => Channel.fromString(c)),
      command.scheduledAt,
      command.expiresAt,
      command.metadata
    );
  }

  private createMockSubscription(userId: number, type: NotificationType): Subscription {
    return Subscription.create(
      userId,
      type,
      [
        {
          channel: 'in_app' as any,
          enabled: true,
          frequency: 'immediate' as any
        },
        {
          channel: 'email' as any,
          enabled: true,
          frequency: 'immediate' as any,
          address: `user${userId}@example.com`
        }
      ]
    );
  }

  private createMockTemplate(templateId: string): NotificationTemplate {
    return NotificationTemplate.create(
      'Sample Template',
      'A sample notification template',
      NotificationType.ALERT,
      1,
      [
        {
          name: 'title',
          type: 'string',
          required: true,
          description: 'Notification title'
        },
        {
          name: 'message',
          type: 'string',
          required: true,
          description: 'Notification message'
        }
      ],
      [
        {
          channel: 'in_app' as any,
          subject: '{{title}}',
          body: '{{message}}',
          format: 'text',
          enabled: true
        },
        {
          channel: 'email' as any,
          subject: '{{title}}',
          body: '<h2>{{title}}</h2><p>{{message}}</p>',
          format: 'html',
          enabled: true
        }
      ]
    );
  }

  private calculateEstimatedDelivery(notification: Notification): Date {
    const scheduledAt = notification.getScheduledAt() || new Date();
    const priority = notification.getPriority();
    const processingDelay = priority.getDeliveryTimeout() / 10; // Estimate processing time
    
    return new Date(scheduledAt.getTime() + processingDelay);
  }

  // Utility methods for testing and validation
  async validateNotificationContent(
    title: string,
    content: string,
    channels: string[]
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }

    if (!content || content.trim().length === 0) {
      errors.push('Content is required');
    } else if (content.length > 10000) {
      errors.push('Content cannot exceed 10000 characters');
    }

    if (!channels || channels.length === 0) {
      errors.push('At least one delivery channel is required');
    }

    // Channel-specific validation
    for (const channelStr of channels) {
      try {
        const channel = Channel.fromString(channelStr);
        const maxSize = channel.getMaxMessageSize();
        
        if (content.length > maxSize) {
          errors.push(`Content exceeds maximum size for ${channelStr} (${maxSize} characters)`);
        }
      } catch {
        errors.push(`Invalid channel: ${channelStr}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async previewTemplate(
    templateId: string,
    channelType: string,
    variables: Record<string, any>
  ): Promise<CommandResult> {
    try {
      const template = this.createMockTemplate(templateId);
      const channel = Channel.fromString(channelType);

      const preview = await this.templateService.previewTemplate(
        template,
        channel.getType(),
        variables
      );

      return {
        success: true,
        data: {
          preview: {
            subject: preview.subject,
            body: preview.body,
            format: preview.format
          },
          metadata: preview.metadata,
          warnings: this.validateTemplatePreview(preview)
        }
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to preview template'
      };
    }
  }

  private validateTemplatePreview(preview: any): string[] {
    const warnings: string[] = [];

    if (preview.body.length > 5000) {
      warnings.push('Template content is quite long - consider shortening for better readability');
    }

    if (preview.body.includes('{{') && preview.body.includes('}}')) {
      warnings.push('Template contains unresolved variables - ensure all required variables are provided');
    }

    return warnings;
  }
}