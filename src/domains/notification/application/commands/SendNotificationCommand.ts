/**
 * Notification Domain - Phase 5
 * SendNotificationCommand
 */

import { NotificationType } from '../../domain/entities/Notification';
import { ChannelType } from '../../domain/valueObjects/Channel';
import { PriorityLevel } from '../../domain/valueObjects/Priority';

export class SendNotificationCommand {
  constructor(
    public readonly userId: number,
    public readonly title: string,
    public readonly content: string,
    public readonly type: NotificationType,
    public readonly priority: PriorityLevel = PriorityLevel.NORMAL,
    public readonly channels: ChannelType[] = [ChannelType.IN_APP],
    public readonly templateId?: string,
    public readonly templateVariables?: Record<string, any>,
    public readonly scheduledAt?: Date,
    public readonly expiresAt?: Date,
    public readonly metadata?: Record<string, any>
  ) {}
}