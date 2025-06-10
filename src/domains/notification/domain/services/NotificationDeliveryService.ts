/**
 * Notification Domain - Phase 5
 * NotificationDeliveryService
 */

import { Notification, NotificationStatus, DeliveryAttempt } from '../entities/Notification';
import { Subscription } from '../entities/Subscription';
import { Channel, ChannelType } from '../valueObjects/Channel';
import { Priority } from '../valueObjects/Priority';

export interface DeliveryResult {
  success: boolean;
  channel: ChannelType;
  deliveryId?: string;
  responseTime: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface DeliveryOptions {
  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  fallbackChannels?: ChannelType[];
  deliveryTimeout?: number;
  bulkDelivery?: boolean;
}

export interface BulkDeliveryRequest {
  notifications: Notification[];
  channel: ChannelType;
  batchSize?: number;
  delayBetweenBatches?: number;
}

export interface DeliveryStats {
  totalAttempts: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  channelStats: Map<ChannelType, {
    attempts: number;
    successes: number;
    failures: number;
    averageResponseTime: number;
  }>;
}

export class NotificationDeliveryService {
  private deliveryStats: DeliveryStats = {
    totalAttempts: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    averageResponseTime: 0,
    channelStats: new Map()
  };

  async deliverNotification(
    notification: Notification,
    subscription: Subscription,
    options: DeliveryOptions = {}
  ): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];

    // Validate notification is ready for delivery
    const validationErrors = notification.validateForDelivery();
    if (validationErrors.length > 0) {
      throw new Error(`Notification validation failed: ${validationErrors.join(', ')}`);
    }

    // Check subscription permissions
    if (!subscription.canReceiveNotifications()) {
      throw new Error('User subscription does not allow notifications');
    }

    // Check quiet hours
    if (subscription.isInQuietHours()) {
      // Schedule for later delivery unless urgent
      if (!notification.getPriority().equals(Priority.urgent())) {
        throw new Error('Delivery blocked by quiet hours');
      }
    }

    // Get enabled channels for this notification type
    const enabledChannels = this.getDeliveryChannels(notification, subscription);
    if (enabledChannels.length === 0) {
      throw new Error('No enabled channels for delivery');
    }

    // Attempt delivery on each channel
    for (const channel of enabledChannels) {
      const channelResult = await this.deliverToChannel(
        notification,
        channel,
        subscription,
        options
      );
      results.push(channelResult);

      // Record delivery attempt
      const attempt: DeliveryAttempt = {
        channel: channel.getType(),
        attemptedAt: new Date(),
        success: channelResult.success,
        errorMessage: channelResult.errorMessage,
        responseTime: channelResult.responseTime,
        deliveryId: channelResult.deliveryId
      };
      notification.addDeliveryAttempt(attempt);

      // Update delivery stats
      this.updateDeliveryStats(channelResult);

      // Mark notification status based on results
      if (channelResult.success) {
        if (notification.getStatus() === NotificationStatus.PENDING) {
          notification.markAsSent();
        }
        if (channel.getType() !== ChannelType.IN_APP) {
          notification.markAsDelivered();
        }
      }
    }

    // Handle retry logic
    const hasSuccessfulDelivery = results.some(r => r.success);
    if (!hasSuccessfulDelivery && options.retryOnFailure !== false) {
      const canRetry = notification.canRetry();
      if (canRetry) {
        await this.scheduleRetry(notification, subscription, options);
      } else {
        notification.markAsFailed('Maximum retry attempts exceeded');
      }
    }

    return results;
  }

  async deliverBulk(request: BulkDeliveryRequest): Promise<Map<string, DeliveryResult[]>> {
    const results = new Map<string, DeliveryResult[]>();
    const batchSize = request.batchSize || 100;
    const delay = request.delayBetweenBatches || 1000;

    // Group notifications by user for subscription lookup
    const userNotifications = new Map<number, Notification[]>();
    for (const notification of request.notifications) {
      const userId = notification.getUserId();
      if (!userNotifications.has(userId)) {
        userNotifications.set(userId, []);
      }
      userNotifications.get(userId)!.push(notification);
    }

    // Process in batches
    const userIds = Array.from(userNotifications.keys());
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      // Process batch concurrently
      const batchPromises = batch.map(async (userId) => {
        const notifications = userNotifications.get(userId)!;
        // In real implementation, fetch user subscription
        // For now, create a mock subscription
        const mockSubscription = this.createMockSubscription(userId, request.channel);
        
        for (const notification of notifications) {
          try {
            const deliveryResults = await this.deliverNotification(notification, mockSubscription);
            results.set(notification.getId().getValue(), deliveryResults);
          } catch (error) {
            // Log error and continue with other notifications
            const errorResult: DeliveryResult = {
              success: false,
              channel: request.channel,
              responseTime: 0,
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            };
            results.set(notification.getId().getValue(), [errorResult]);
          }
        }
      });

      await Promise.all(batchPromises);

      // Add delay between batches to avoid overwhelming external services
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  private async deliverToChannel(
    notification: Notification,
    channel: Channel,
    subscription: Subscription,
    options: DeliveryOptions
  ): Promise<DeliveryResult> {
    const startTime = Date.now();
    const timeout = options.deliveryTimeout || channel.getTypicalDeliveryTime() * 2;

    try {
      // Check if channel is enabled for this subscription
      if (!subscription.hasChannelEnabled(channel.getType())) {
        throw new Error(`Channel ${channel.getValue()} is disabled for user`);
      }

      // Simulate channel-specific delivery
      const deliveryResult = await this.simulateChannelDelivery(
        notification,
        channel,
        subscription,
        timeout
      );

      const responseTime = Date.now() - startTime;
      return {
        success: true,
        channel: channel.getType(),
        deliveryId: deliveryResult.deliveryId,
        responseTime,
        metadata: deliveryResult.metadata
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        channel: channel.getType(),
        responseTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown delivery error'
      };
    }
  }

  private async simulateChannelDelivery(
    notification: Notification,
    channel: Channel,
    subscription: Subscription,
    timeout: number
  ): Promise<{ deliveryId: string; metadata: Record<string, any> }> {
    // Simulate delivery delay based on channel
    const deliveryTime = Math.min(
      channel.getTypicalDeliveryTime() + Math.random() * 1000,
      timeout
    );

    await new Promise(resolve => setTimeout(resolve, deliveryTime));

    // Simulate occasional delivery failures
    const failureRate = this.getChannelFailureRate(channel.getType());
    if (Math.random() < failureRate) {
      throw new Error(`${channel.getValue()} delivery service temporarily unavailable`);
    }

    const deliveryId = `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      deliveryId,
      metadata: {
        channel: channel.getValue(),
        deliveredAt: new Date().toISOString(),
        size: notification.getContent().length,
        priority: notification.getPriority().getValue()
      }
    };
  }

  private getChannelFailureRate(channel: ChannelType): number {
    // Simulate realistic failure rates for different channels
    switch (channel) {
      case ChannelType.IN_APP:
        return 0.01; // 1% failure rate
      case ChannelType.EMAIL:
        return 0.05; // 5% failure rate
      case ChannelType.PUSH:
        return 0.03; // 3% failure rate
      case ChannelType.SMS:
        return 0.08; // 8% failure rate
      case ChannelType.WEBHOOK:
        return 0.10; // 10% failure rate
      default:
        return 0.05;
    }
  }

  private getDeliveryChannels(notification: Notification, subscription: Subscription): Channel[] {
    const notificationChannels = notification.getChannels();
    const enabledChannels = subscription.getEnabledChannels();
    
    return notificationChannels.filter(channel => 
      enabledChannels.includes(channel.getType())
    );
  }

  private async scheduleRetry(
    notification: Notification,
    subscription: Subscription,
    options: DeliveryOptions
  ): Promise<void> {
    const retryCount = notification.getRetryCount();
    const maxRetries = options.maxRetries || notification.getPriority().getMaxRetries();
    
    if (retryCount >= maxRetries) {
      notification.markAsFailed('Maximum retry attempts exceeded');
      return;
    }

    // Calculate exponential backoff delay
    const baseDelay = options.retryDelayMs || 60000; // 1 minute default
    const delay = baseDelay * Math.pow(2, retryCount);
    
    // In a real implementation, this would schedule the retry
    // For now, we'll just update metadata
    notification.updateMetadata({
      nextRetryAt: new Date(Date.now() + delay).toISOString(),
      retryScheduled: true
    });
  }

  private updateDeliveryStats(result: DeliveryResult): void {
    this.deliveryStats.totalAttempts++;
    
    if (result.success) {
      this.deliveryStats.successfulDeliveries++;
    } else {
      this.deliveryStats.failedDeliveries++;
    }

    // Update average response time
    const totalResponseTime = this.deliveryStats.averageResponseTime * (this.deliveryStats.totalAttempts - 1);
    this.deliveryStats.averageResponseTime = (totalResponseTime + result.responseTime) / this.deliveryStats.totalAttempts;

    // Update channel-specific stats
    let channelStats = this.deliveryStats.channelStats.get(result.channel);
    if (!channelStats) {
      channelStats = {
        attempts: 0,
        successes: 0,
        failures: 0,
        averageResponseTime: 0
      };
      this.deliveryStats.channelStats.set(result.channel, channelStats);
    }

    channelStats.attempts++;
    if (result.success) {
      channelStats.successes++;
    } else {
      channelStats.failures++;
    }

    // Update channel average response time
    const channelTotalTime = channelStats.averageResponseTime * (channelStats.attempts - 1);
    channelStats.averageResponseTime = (channelTotalTime + result.responseTime) / channelStats.attempts;
  }

  private createMockSubscription(userId: number, channel: ChannelType): Subscription {
    // In real implementation, this would fetch from repository
    const mockSubscription = Subscription.create(
      userId,
      'alert' as any,
      [{
        channel,
        enabled: true,
        frequency: 'immediate' as any
      }]
    );
    return mockSubscription;
  }

  // Public query methods
  getDeliveryStats(): DeliveryStats {
    return {
      ...this.deliveryStats,
      channelStats: new Map(this.deliveryStats.channelStats)
    };
  }

  getChannelStats(channel: ChannelType) {
    return this.deliveryStats.channelStats.get(channel);
  }

  getSuccessRate(): number {
    if (this.deliveryStats.totalAttempts === 0) return 0;
    return (this.deliveryStats.successfulDeliveries / this.deliveryStats.totalAttempts) * 100;
  }

  getChannelSuccessRate(channel: ChannelType): number {
    const stats = this.deliveryStats.channelStats.get(channel);
    if (!stats || stats.attempts === 0) return 0;
    return (stats.successes / stats.attempts) * 100;
  }

  resetStats(): void {
    this.deliveryStats = {
      totalAttempts: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageResponseTime: 0,
      channelStats: new Map()
    };
  }

  // Channel optimization methods
  getOptimalChannel(notification: Notification, subscription: Subscription): Channel | null {
    const availableChannels = this.getDeliveryChannels(notification, subscription);
    if (availableChannels.length === 0) return null;

    // Consider multiple factors for optimization
    let bestChannel = availableChannels[0];
    let bestScore = 0;

    for (const channel of availableChannels) {
      const score = this.calculateChannelScore(channel, notification);
      if (score > bestScore) {
        bestScore = score;
        bestChannel = channel;
      }
    }

    return bestChannel;
  }

  private calculateChannelScore(channel: Channel, notification: Notification): number {
    const channelStats = this.deliveryStats.channelStats.get(channel.getType());
    const successRate = channelStats ? (channelStats.successes / channelStats.attempts) * 100 : 50;
    const speed = 1000 / channel.getTypicalDeliveryTime(); // Higher score for faster delivery
    const cost = 10 / (channel.getCostFactor() + 1); // Higher score for lower cost
    const priority = notification.getPriority().getNumericValue();

    // Weighted scoring
    return (successRate * 0.4) + (speed * 0.3) + (cost * 0.2) + (priority * 0.1);
  }

  async validateDeliveryCapability(channel: ChannelType): Promise<{
    available: boolean;
    responseTime?: number;
    errorMessage?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Simulate channel health check
      const healthCheckTime = Math.random() * 2000 + 500; // 500-2500ms
      await new Promise(resolve => setTimeout(resolve, healthCheckTime));
      
      const responseTime = Date.now() - startTime;
      
      // Simulate occasional service unavailability
      if (Math.random() < 0.05) {
        throw new Error(`${channel} service is currently unavailable`);
      }
      
      return {
        available: true,
        responseTime
      };
      
    } catch (error) {
      return {
        available: false,
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}