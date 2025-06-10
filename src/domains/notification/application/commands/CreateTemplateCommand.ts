/**
 * Notification Domain - Phase 5
 * CreateTemplateCommand
 */

import { NotificationType } from '../../domain/entities/Notification';
import { ChannelTemplate, TemplateVariable } from '../../domain/entities/NotificationTemplate';

export class CreateTemplateCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly type: NotificationType,
    public readonly createdBy: number,
    public readonly variables: TemplateVariable[] = [],
    public readonly channelTemplates: ChannelTemplate[] = [],
    public readonly tags: string[] = [],
    public readonly metadata: Record<string, any> = {}
  ) {}
}

export class UpdateTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly variables?: TemplateVariable[],
    public readonly channelTemplates?: ChannelTemplate[],
    public readonly tags?: string[],
    public readonly metadata?: Record<string, any>,
    public readonly isActive?: boolean
  ) {}
}

export class DeleteTemplateCommand {
  constructor(
    public readonly templateId: string
  ) {}
}