/**
 * Notification Domain - Phase 5
 * Subscription Entity
 */

import { NotificationType } from './Notification';
import { Channel, ChannelType } from '../valueObjects/Channel';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  UNSUBSCRIBED = 'unsubscribed'
}

export enum FrequencyType {
  IMMEDIATE = 'immediate',
  DIGEST_HOURLY = 'digest_hourly',
  DIGEST_DAILY = 'digest_daily',
  DIGEST_WEEKLY = 'digest_weekly',
  DIGEST_MONTHLY = 'digest_monthly'
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  timezone: string;
}

export interface ChannelPreference {
  channel: ChannelType;
  enabled: boolean;
  frequency: FrequencyType;
  address?: string; // Email address, phone number, etc.
  metadata?: Record<string, any>;
}

export interface FilterRule {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  value: string;
  caseSensitive?: boolean;
}

export class Subscription {
  private constructor(
    private readonly id: string,
    private readonly userId: number,
    private readonly notificationType: NotificationType,
    private status: SubscriptionStatus,
    private channelPreferences: Map<ChannelType, ChannelPreference>,
    private quietHours: QuietHours,
    private filterRules: FilterRule[],
    private readonly createdAt: Date,
    private updatedAt: Date,
    private lastNotificationAt?: Date,
    private metadata: Record<string, any> = {}
  ) {}

  static create(
    userId: number,
    notificationType: NotificationType,
    channelPreferences: ChannelPreference[] = [],
    quietHours?: Partial<QuietHours>,
    filterRules: FilterRule[] = [],
    metadata: Record<string, any> = {}
  ): Subscription {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const defaultQuietHours: QuietHours = {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'UTC',
      ...quietHours
    };

    const subscription = new Subscription(
      id,
      userId,
      notificationType,
      SubscriptionStatus.ACTIVE,
      new Map(),
      defaultQuietHours,
      filterRules,
      now,
      now,
      undefined,
      metadata
    );

    // Set up channel preferences
    channelPreferences.forEach(pref => {
      subscription.channelPreferences.set(pref.channel, pref);
    });

    // Add default in-app preference if none provided
    if (channelPreferences.length === 0) {
      subscription.channelPreferences.set(ChannelType.IN_APP, {
        channel: ChannelType.IN_APP,
        enabled: true,
        frequency: FrequencyType.IMMEDIATE
      });
    }

    return subscription;
  }

  static fromPersistence(data: {
    id: string;
    userId: number;
    notificationType: NotificationType;
    status: SubscriptionStatus;
    channelPreferences: ChannelPreference[];
    quietHours: QuietHours;
    filterRules: FilterRule[];
    createdAt: Date;
    updatedAt: Date;
    lastNotificationAt?: Date;
    metadata: Record<string, any>;
  }): Subscription {
    const subscription = new Subscription(
      data.id,
      data.userId,
      data.notificationType,
      data.status,
      new Map(),
      data.quietHours,
      data.filterRules,
      data.createdAt,
      data.updatedAt,
      data.lastNotificationAt,
      data.metadata
    );

    // Restore channel preferences
    data.channelPreferences.forEach(pref => {
      subscription.channelPreferences.set(pref.channel, pref);
    });

    return subscription;
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getUserId(): number {
    return this.userId;
  }

  getNotificationType(): NotificationType {
    return this.notificationType;
  }

  getStatus(): SubscriptionStatus {
    return this.status;
  }

  getChannelPreferences(): ChannelPreference[] {
    return Array.from(this.channelPreferences.values());
  }

  getChannelPreference(channel: ChannelType): ChannelPreference | undefined {
    return this.channelPreferences.get(channel);
  }

  getQuietHours(): QuietHours {
    return { ...this.quietHours };
  }

  getFilterRules(): FilterRule[] {
    return [...this.filterRules];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getLastNotificationAt(): Date | undefined {
    return this.lastNotificationAt;
  }

  getMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  // Business logic methods
  activate(): void {
    if (this.status === SubscriptionStatus.UNSUBSCRIBED) {
      throw new Error('Cannot activate unsubscribed subscription');
    }
    this.status = SubscriptionStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  pause(): void {
    if (this.status === SubscriptionStatus.UNSUBSCRIBED) {
      throw new Error('Cannot pause unsubscribed subscription');
    }
    this.status = SubscriptionStatus.PAUSED;
    this.updatedAt = new Date();
  }

  unsubscribe(): void {
    this.status = SubscriptionStatus.UNSUBSCRIBED;
    this.updatedAt = new Date();
  }

  updateChannelPreference(preference: ChannelPreference): void {
    this.validateChannelPreference(preference);
    this.channelPreferences.set(preference.channel, preference);
    this.updatedAt = new Date();
  }

  removeChannelPreference(channel: ChannelType): void {
    if (!this.channelPreferences.has(channel)) {
      throw new Error(`Channel preference for '${channel}' not found`);
    }
    
    this.channelPreferences.delete(channel);
    
    // Ensure at least one channel remains enabled
    if (this.getEnabledChannels().length === 0) {
      throw new Error('At least one channel must remain enabled');
    }
    
    this.updatedAt = new Date();
  }

  enableChannel(channel: ChannelType): void {
    const preference = this.channelPreferences.get(channel);
    if (preference) {
      preference.enabled = true;
    } else {
      this.channelPreferences.set(channel, {
        channel,
        enabled: true,
        frequency: FrequencyType.IMMEDIATE
      });
    }
    this.updatedAt = new Date();
  }

  disableChannel(channel: ChannelType): void {
    const preference = this.channelPreferences.get(channel);
    if (preference) {
      preference.enabled = false;
      
      // Ensure at least one channel remains enabled
      if (this.getEnabledChannels().length === 0) {
        throw new Error('At least one channel must remain enabled');
      }
      
      this.updatedAt = new Date();
    }
  }

  updateQuietHours(quietHours: Partial<QuietHours>): void {
    this.validateQuietHours({ ...this.quietHours, ...quietHours });
    this.quietHours = { ...this.quietHours, ...quietHours };
    this.updatedAt = new Date();
  }

  addFilterRule(rule: FilterRule): void {
    this.validateFilterRule(rule);
    this.filterRules.push(rule);
    this.updatedAt = new Date();
  }

  updateFilterRule(index: number, rule: FilterRule): void {
    if (index < 0 || index >= this.filterRules.length) {
      throw new Error('Filter rule index out of bounds');
    }
    
    this.validateFilterRule(rule);
    this.filterRules[index] = rule;
    this.updatedAt = new Date();
  }

  removeFilterRule(index: number): void {
    if (index < 0 || index >= this.filterRules.length) {
      throw new Error('Filter rule index out of bounds');
    }
    
    this.filterRules.splice(index, 1);
    this.updatedAt = new Date();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  recordNotification(): void {
    this.lastNotificationAt = new Date();
    this.updatedAt = new Date();
  }

  // Query methods
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  isPaused(): boolean {
    return this.status === SubscriptionStatus.PAUSED;
  }

  isUnsubscribed(): boolean {
    return this.status === SubscriptionStatus.UNSUBSCRIBED;
  }

  canReceiveNotifications(): boolean {
    return this.status === SubscriptionStatus.ACTIVE && this.getEnabledChannels().length > 0;
  }

  getEnabledChannels(): ChannelType[] {
    return Array.from(this.channelPreferences.entries())
      .filter(([_, pref]) => pref.enabled)
      .map(([channel, _]) => channel);
  }

  hasChannelEnabled(channel: ChannelType): boolean {
    const preference = this.channelPreferences.get(channel);
    return preference ? preference.enabled : false;
  }

  isInQuietHours(currentTime: Date = new Date()): boolean {
    if (!this.quietHours.enabled) {
      return false;
    }

    const timeZone = this.quietHours.timezone;
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone
    });

    const currentTimeStr = formatter.format(currentTime);
    const startTime = this.quietHours.startTime;
    const endTime = this.quietHours.endTime;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTimeStr >= startTime || currentTimeStr <= endTime;
    }
    
    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTimeStr >= startTime && currentTimeStr <= endTime;
  }

  shouldReceiveImmediately(channel: ChannelType): boolean {
    if (!this.canReceiveNotifications()) {
      return false;
    }

    if (this.isInQuietHours()) {
      return false;
    }

    const preference = this.channelPreferences.get(channel);
    return preference ? 
      preference.enabled && preference.frequency === FrequencyType.IMMEDIATE : 
      false;
  }

  getDigestFrequency(channel: ChannelType): FrequencyType | null {
    const preference = this.channelPreferences.get(channel);
    if (!preference || !preference.enabled) {
      return null;
    }

    return preference.frequency !== FrequencyType.IMMEDIATE ? 
      preference.frequency : null;
  }

  matchesFilters(notificationData: Record<string, any>): boolean {
    if (this.filterRules.length === 0) {
      return true; // No filters means all notifications match
    }

    return this.filterRules.every(rule => this.evaluateFilterRule(rule, notificationData));
  }

  private evaluateFilterRule(rule: FilterRule, data: Record<string, any>): boolean {
    const fieldValue = String(data[rule.field] || '');
    const ruleValue = rule.caseSensitive ? rule.value : rule.value.toLowerCase();
    const compareValue = rule.caseSensitive ? fieldValue : fieldValue.toLowerCase();

    switch (rule.operator) {
      case 'equals':
        return compareValue === ruleValue;
      case 'contains':
        return compareValue.includes(ruleValue);
      case 'startsWith':
        return compareValue.startsWith(ruleValue);
      case 'endsWith':
        return compareValue.endsWith(ruleValue);
      case 'regex':
        try {
          const regex = new RegExp(rule.value, rule.caseSensitive ? 'g' : 'gi');
          return regex.test(fieldValue);
        } catch {
          return false; // Invalid regex fails the rule
        }
      default:
        return false;
    }
  }

  getDaysSinceLastNotification(): number {
    if (!this.lastNotificationAt) {
      return Infinity;
    }
    
    const now = new Date();
    const diffMs = now.getTime() - this.lastNotificationAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Validation methods
  private validateChannelPreference(preference: ChannelPreference): void {
    if (!Object.values(ChannelType).includes(preference.channel)) {
      throw new Error(`Invalid channel type: ${preference.channel}`);
    }

    if (!Object.values(FrequencyType).includes(preference.frequency)) {
      throw new Error(`Invalid frequency type: ${preference.frequency}`);
    }

    // Channel-specific validation
    const channel = Channel.fromString(preference.channel);
    if (channel.requiresConfiguration() && !preference.address) {
      throw new Error(`Channel '${preference.channel}' requires an address`);
    }

    // Validate address format based on channel
    if (preference.address) {
      this.validateChannelAddress(preference.channel, preference.address);
    }
  }

  private validateChannelAddress(channel: ChannelType, address: string): void {
    switch (channel) {
      case ChannelType.EMAIL:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(address)) {
          throw new Error('Invalid email address format');
        }
        break;
      case ChannelType.SMS:
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(address.replace(/[\s\-\(\)]/g, ''))) {
          throw new Error('Invalid phone number format');
        }
        break;
      case ChannelType.WEBHOOK:
        try {
          new URL(address);
        } catch {
          throw new Error('Invalid webhook URL format');
        }
        break;
    }
  }

  private validateQuietHours(quietHours: QuietHours): void {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(quietHours.startTime)) {
      throw new Error('Invalid start time format. Use HH:MM');
    }
    
    if (!timeRegex.test(quietHours.endTime)) {
      throw new Error('Invalid end time format. Use HH:MM');
    }

    // Validate timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: quietHours.timezone });
    } catch {
      throw new Error(`Invalid timezone: ${quietHours.timezone}`);
    }
  }

  private validateFilterRule(rule: FilterRule): void {
    if (!rule.field || rule.field.trim().length === 0) {
      throw new Error('Filter rule field cannot be empty');
    }

    if (!['equals', 'contains', 'startsWith', 'endsWith', 'regex'].includes(rule.operator)) {
      throw new Error(`Invalid filter operator: ${rule.operator}`);
    }

    if (rule.value === undefined || rule.value === null) {
      throw new Error('Filter rule value cannot be null or undefined');
    }

    // Validate regex if operator is regex
    if (rule.operator === 'regex') {
      try {
        new RegExp(rule.value);
      } catch {
        throw new Error('Invalid regular expression in filter rule');
      }
    }
  }

  equals(other: Subscription): boolean {
    return this.id === other.id;
  }
}