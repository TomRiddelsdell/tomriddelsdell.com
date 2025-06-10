/**
 * Basic Notification Domain Tests - Phase 5
 * Focused test suite to validate core functionality
 */

import { describe, it, expect } from 'vitest';
import { Notification, NotificationStatus, NotificationType } from '../../src/domains/notification/domain/entities/Notification';
import { NotificationId } from '../../src/domains/notification/domain/valueObjects/NotificationId';
import { Priority, PriorityLevel } from '../../src/domains/notification/domain/valueObjects/Priority';
import { Channel, ChannelType } from '../../src/domains/notification/domain/valueObjects/Channel';

describe('Notification Domain - Core Tests', () => {
  
  describe('Value Objects', () => {
    it('should create notification ID', () => {
      const id = NotificationId.create();
      expect(id.getValue()).toMatch(/^notif_/);
    });

    it('should create priority levels', () => {
      const urgent = Priority.urgent();
      const low = Priority.low();
      
      expect(urgent.getLevel()).toBe(PriorityLevel.URGENT);
      expect(urgent.getNumericValue()).toBeGreaterThan(low.getNumericValue());
    });

    it('should create channels', () => {
      const email = Channel.email();
      const sms = Channel.sms();
      
      expect(email.getType()).toBe(ChannelType.EMAIL);
      expect(email.supportsRichContent()).toBe(true);
      expect(sms.supportsRichContent()).toBe(false);
    });
  });

  describe('Notification Entity', () => {
    it('should create notification', () => {
      const notification = Notification.create(
        1,
        'Test Title',
        'Test content',
        NotificationType.ALERT,
        Priority.normal(),
        [Channel.email()]
      );

      expect(notification.getTitle()).toBe('Test Title');
      expect(notification.getStatus()).toBe(NotificationStatus.PENDING);
      expect(notification.getChannels()).toHaveLength(1);
    });

    it('should update notification status', () => {
      const notification = Notification.create(
        1,
        'Test',
        'Content',
        NotificationType.ALERT,
        Priority.normal(),
        [Channel.email()]
      );

      notification.markAsSent();
      expect(notification.getStatus()).toBe(NotificationStatus.SENT);
      expect(notification.getSentAt()).toBeDefined();
    });

    it('should validate notification', () => {
      const notification = Notification.create(
        1,
        'Valid',
        'Valid content',
        NotificationType.ALERT,
        Priority.normal(),
        [Channel.email()]
      );

      const errors = notification.validateForDelivery();
      expect(errors).toHaveLength(0);
    });
  });
});