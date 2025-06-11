# Notification Domain

## Overview
The Notification Domain handles all platform communications, alerts, and messaging across multiple channels. It provides a unified notification system that supports various delivery methods while respecting user preferences, managing delivery status, and ensuring reliable message delivery across the FlowCreate platform.

## Domain Responsibilities

### Primary Responsibilities
- **Multi-channel Delivery**: Support for email, SMS, in-app, push, and webhook notifications
- **User Preference Management**: Respecting individual notification settings and opt-out preferences
- **Template Management**: Consistent message formatting and branding across channels
- **Delivery Tracking**: Monitoring notification delivery status and retry mechanisms
- **Rate Limiting**: Preventing notification spam and managing delivery frequency
- **Compliance Management**: Handling opt-out requests and regulatory compliance

### Business Invariants
- Users must be able to opt-out of non-critical notifications
- Notification templates must be validated before use
- Delivery attempts must respect rate limits
- Critical system notifications cannot be disabled
- All notification events must be auditable

## Domain Model

### Entities
- **Notification**: Core notification entity with content, recipients, and delivery configuration
- **NotificationTemplate**: Reusable message templates with variable substitution
- **DeliveryAttempt**: Individual delivery attempts with status tracking
- **UserPreferences**: Individual user notification settings and channel preferences

### Value Objects
- **NotificationId**: Strongly-typed notification identifier
- **NotificationChannel**: Delivery method enumeration (EMAIL, SMS, IN_APP, PUSH, WEBHOOK)
- **NotificationPriority**: Priority levels (LOW, NORMAL, HIGH, CRITICAL)
- **DeliveryStatus**: Delivery state tracking (PENDING, SENT, DELIVERED, FAILED, BOUNCED)
- **TemplateVariable**: Dynamic content substitution in templates

### Domain Events
- **NotificationSentEvent**: Published when notifications are dispatched
- **NotificationDeliveredEvent**: Published when delivery is confirmed
- **NotificationFailedEvent**: Published when delivery fails
- **PreferencesUpdatedEvent**: Published when user preferences change
- **TemplateCreatedEvent**: Published when new templates are created

## Notification Channels

### Email Notifications
```typescript
const emailNotification = Notification.create({
    channel: NotificationChannel.EMAIL,
    recipients: ['user@example.com'],
    subject: 'Workflow Execution Complete',
    template: 'workflow-completion',
    variables: {
        workflowName: 'Daily Report',
        executionTime: '2 minutes',
        status: 'success'
    }
});
```

### SMS Notifications
```typescript
const smsNotification = Notification.create({
    channel: NotificationChannel.SMS,
    recipients: ['+1234567890'],
    template: 'alert-sms',
    variables: {
        alertType: 'System Error',
        severity: 'High'
    }
});
```

### In-App Notifications
```typescript
const inAppNotification = Notification.create({
    channel: NotificationChannel.IN_APP,
    recipients: [userId],
    template: 'system-update',
    variables: {
        updateType: 'Feature Release',
        version: '2.1.0'
    },
    persistence: {
        displayUntil: new Date('2024-02-01'),
        dismissible: true
    }
});
```

### Push Notifications
```typescript
const pushNotification = Notification.create({
    channel: NotificationChannel.PUSH,
    recipients: [deviceToken],
    template: 'workflow-trigger',
    variables: {
        workflowName: 'Customer Onboarding',
        triggerEvent: 'New Registration'
    },
    pushConfig: {
        badge: 1,
        sound: 'default',
        category: 'workflow'
    }
});
```

### Webhook Notifications
```typescript
const webhookNotification = Notification.create({
    channel: NotificationChannel.WEBHOOK,
    recipients: ['https://api.customer.com/webhooks/flowcreate'],
    template: 'webhook-payload',
    variables: {
        eventType: 'workflow.completed',
        workflowId: 'wf-123',
        timestamp: new Date().toISOString()
    }
});
```

## Template System

### Template Definition
```typescript
const template = NotificationTemplate.create({
    name: 'workflow-completion',
    channel: NotificationChannel.EMAIL,
    subject: 'Workflow "{{workflowName}}" completed successfully',
    content: `
        Your workflow "{{workflowName}}" has completed execution.
        
        Execution Details:
        - Status: {{status}}
        - Duration: {{executionTime}}
        - Timestamp: {{timestamp}}
        
        View details: {{dashboardUrl}}
    `,
    variables: [
        TemplateVariable.required('workflowName'),
        TemplateVariable.required('status'),
        TemplateVariable.required('executionTime'),
        TemplateVariable.optional('timestamp'),
        TemplateVariable.optional('dashboardUrl')
    ]
});
```

### Template Validation
```typescript
class TemplateValidator {
    validate(template: NotificationTemplate): ValidationResult {
        // Check for required variables
        const missingVars = this.findMissingVariables(template);
        if (missingVars.length > 0) {
            return ValidationResult.error(`Missing variables: ${missingVars.join(', ')}`);
        }
        
        // Validate template syntax
        if (!this.isValidSyntax(template.content)) {
            return ValidationResult.error('Invalid template syntax');
        }
        
        return ValidationResult.success();
    }
}
```

## User Preference Management

### Preference Configuration
```typescript
const preferences = UserPreferences.create(userId, {
    channels: {
        [NotificationChannel.EMAIL]: {
            enabled: true,
            types: ['workflow-completion', 'system-alerts'],
            frequency: 'immediate'
        },
        [NotificationChannel.SMS]: {
            enabled: false,
            types: [],
            frequency: 'never'
        },
        [NotificationChannel.IN_APP]: {
            enabled: true,
            types: ['all'],
            frequency: 'immediate'
        }
    },
    quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'America/New_York'
    }
});
```

### Preference Enforcement
```typescript
class PreferenceEnforcer {
    async canSendNotification(
        notification: Notification, 
        userId: UserId
    ): Promise<boolean> {
        const preferences = await this.getPreferences(userId);
        
        // Check if channel is enabled
        if (!preferences.isChannelEnabled(notification.channel)) {
            return false;
        }
        
        // Check if notification type is allowed
        if (!preferences.isTypeAllowed(notification.type)) {
            return false;
        }
        
        // Check quiet hours
        if (preferences.isInQuietHours()) {
            return notification.priority === NotificationPriority.CRITICAL;
        }
        
        return true;
    }
}
```

## Delivery Management

### Delivery Scheduling
```typescript
class DeliveryScheduler {
    async scheduleDelivery(notification: Notification): Promise<void> {
        const deliveryTime = this.calculateOptimalDeliveryTime(notification);
        
        const attempt = DeliveryAttempt.create({
            notificationId: notification.id,
            channel: notification.channel,
            scheduledAt: deliveryTime,
            maxRetries: this.getMaxRetries(notification.priority)
        });
        
        await this.queue.schedule(attempt, deliveryTime);
    }
}
```

### Retry Logic
```typescript
class RetryHandler {
    async handleFailedDelivery(attempt: DeliveryAttempt): Promise<void> {
        if (attempt.canRetry()) {
            const nextAttempt = attempt.createRetry({
                delay: this.calculateBackoffDelay(attempt.retryCount),
                reason: 'Previous attempt failed'
            });
            
            await this.queue.schedule(nextAttempt, nextAttempt.scheduledAt);
        } else {
            await this.markAsPermanentFailure(attempt);
        }
    }
    
    private calculateBackoffDelay(retryCount: number): number {
        return Math.min(1000 * Math.pow(2, retryCount), 300000); // Max 5 minutes
    }
}
```

## Rate Limiting

### Per-User Rate Limits
```typescript
class NotificationRateLimiter {
    async checkRateLimit(userId: UserId, channel: NotificationChannel): Promise<boolean> {
        const limits = this.getRateLimits(channel);
        const recent = await this.getRecentNotifications(userId, channel, limits.window);
        
        return recent.length < limits.maxCount;
    }
    
    private getRateLimits(channel: NotificationChannel): RateLimit {
        return {
            [NotificationChannel.EMAIL]: { maxCount: 10, window: '1h' },
            [NotificationChannel.SMS]: { maxCount: 5, window: '1h' },
            [NotificationChannel.PUSH]: { maxCount: 20, window: '1h' },
            [NotificationChannel.IN_APP]: { maxCount: 50, window: '1h' }
        }[channel];
    }
}
```

## Domain Events Flow

```
Notification Creation:
1. NotificationSentEvent → Analytics Domain (delivery metrics)
2. NotificationSentEvent → Audit Domain (compliance logging)

Delivery Confirmation:
1. NotificationDeliveredEvent → Analytics Domain (success metrics)
2. NotificationDeliveredEvent → User Engagement tracking

Delivery Failure:
1. NotificationFailedEvent → Analytics Domain (failure metrics)
2. NotificationFailedEvent → Support system (investigation)

Preference Updates:
1. PreferencesUpdatedEvent → Analytics Domain (preference analytics)
2. PreferencesUpdatedEvent → Compliance system (opt-out tracking)
```

## Business Rules

### Notification Validation
```typescript
// Critical notifications cannot be disabled
if (notification.priority === NotificationPriority.CRITICAL) {
    // Always send regardless of user preferences
    return true;
}

// Respect user opt-out preferences
if (userPreferences.hasOptedOut(notification.type)) {
    throw new DomainException('User has opted out of this notification type');
}
```

### Template Requirements
```typescript
// Templates must have all required variables
const missingVars = template.getMissingVariables(notification.variables);
if (missingVars.length > 0) {
    throw new DomainException(`Missing template variables: ${missingVars.join(', ')}`);
}

// Email templates must have valid subject lines
if (channel === NotificationChannel.EMAIL && !template.subject) {
    throw new DomainException('Email notifications must have subject lines');
}
```

### Delivery Constraints
```typescript
// SMS notifications have character limits
if (channel === NotificationChannel.SMS && content.length > 160) {
    throw new DomainException('SMS content exceeds character limit');
}

// Webhook notifications must have valid URLs
if (channel === NotificationChannel.WEBHOOK && !isValidUrl(recipient)) {
    throw new DomainException('Invalid webhook URL');
}
```

## Implementation Status

### ✅ Completed Features
- Basic notification entity structure
- Domain event framework
- Channel enumeration and types

### 🚧 Partially Implemented
- Template system architecture
- User preference models
- Delivery status tracking

### 📋 Planned Features
- Multi-channel delivery engine
- Template rendering engine
- Preference management interface
- Rate limiting implementation
- Retry and error handling
- Analytics and reporting

## Integration Patterns

### Repository Pattern
```typescript
interface INotificationRepository {
    save(notification: Notification): Promise<void>;
    findById(id: NotificationId): Promise<Notification | null>;
    findByUserId(userId: UserId): Promise<Notification[]>;
    findPendingDeliveries(): Promise<Notification[]>;
}
```

### Channel Service Abstraction
```typescript
interface INotificationChannel {
    send(notification: Notification): Promise<DeliveryResult>;
    validateRecipient(recipient: string): boolean;
    getMaxRetries(): number;
    supportsBatching(): boolean;
}
```

## Usage Examples

### Sending a Workflow Completion Notification
```typescript
const notification = Notification.create({
    type: 'workflow-completion',
    channel: NotificationChannel.EMAIL,
    recipients: [user.email],
    template: 'workflow-success',
    variables: {
        workflowName: workflow.name,
        executionTime: workflow.lastExecutionDuration,
        status: 'completed'
    },
    priority: NotificationPriority.NORMAL
});

await notificationService.send(notification);
```

### Creating a System Alert
```typescript
const alert = Notification.create({
    type: 'system-alert',
    channel: NotificationChannel.IN_APP,
    recipients: await userService.getAdminUsers(),
    template: 'system-error',
    variables: {
        errorType: 'Database Connection',
        severity: 'High',
        timestamp: new Date().toISOString()
    },
    priority: NotificationPriority.CRITICAL
});

await notificationService.broadcast(alert);
```

This domain provides comprehensive notification capabilities, ensuring reliable and user-friendly communication across all platform interactions while maintaining compliance and respecting user preferences.