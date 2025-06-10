import { TemplateId } from '../../../shared/kernel/value-objects/TemplateId';
import { TemplateUsedEvent } from '../../../shared/kernel/events/DomainEvent';
import { DomainEntity } from '../../../shared/kernel/base/DomainEntity';
import { WorkflowConfig } from './Workflow';

export enum TemplateIconType {
  SHARE = 'share',
  MAIL = 'mail',
  CALENDAR = 'calendar',
  VIDEO = 'video',
  MESSAGE = 'message',
  FILE = 'file',
  DATA = 'data',
  AUTOMATION = 'automation'
}

export enum TemplateIconColor {
  INDIGO = 'indigo',
  GREEN = 'green',
  AMBER = 'amber',
  ROSE = 'rose',
  SKY = 'sky',
  PURPLE = 'purple',
  EMERALD = 'emerald',
  ORANGE = 'orange'
}

export class Template extends DomainEntity {
  private constructor(
    private readonly id: TemplateId,
    private name: string,
    private description: string,
    private iconType: TemplateIconType,
    private iconColor: TemplateIconColor,
    private usersCount: number,
    private config: WorkflowConfig,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private isActive: boolean = true
  ) {
    super();
  }

  public static create(
    id: TemplateId,
    name: string,
    description: string,
    iconType: TemplateIconType,
    iconColor: TemplateIconColor,
    config: WorkflowConfig
  ): Template {
    return new Template(
      id,
      name,
      description,
      iconType,
      iconColor,
      0,
      config,
      new Date(),
      new Date(),
      true
    );
  }

  public static fromPersistence(
    id: number,
    name: string,
    description: string,
    iconType: string,
    iconColor: string,
    usersCount: number,
    config: WorkflowConfig,
    createdAt: Date,
    updatedAt: Date
  ): Template {
    return new Template(
      TemplateId.fromNumber(id),
      name,
      description,
      iconType as TemplateIconType,
      iconColor as TemplateIconColor,
      usersCount,
      config,
      createdAt,
      updatedAt,
      true
    );
  }

  // Getters
  public getId(): TemplateId {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getIconType(): TemplateIconType {
    return this.iconType;
  }

  public getIconColor(): TemplateIconColor {
    return this.iconColor;
  }

  public getUsersCount(): number {
    return this.usersCount;
  }

  public getConfig(): WorkflowConfig {
    return this.config;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  // Business Logic
  public updateDetails(name: string, description: string): void {
    this.name = name;
    this.description = description;
    this.updatedAt = new Date();
  }

  public updateConfig(config: WorkflowConfig): void {
    this.config = config;
    this.updatedAt = new Date();
  }

  public updateIcon(iconType: TemplateIconType, iconColor: TemplateIconColor): void {
    this.iconType = iconType;
    this.iconColor = iconColor;
    this.updatedAt = new Date();
  }

  public markAsUsed(userId: string, workflowId: string): void {
    this.usersCount++;
    this.updatedAt = new Date();

    this.addDomainEvent(new TemplateUsedEvent(
      this.id.getValue().toString(),
      userId,
      workflowId
    ));
  }

  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  public isPopular(): boolean {
    return this.usersCount >= 100;
  }

  public canBeDeleted(): boolean {
    return this.usersCount === 0;
  }

  public toPlainObject(): any {
    return {
      id: this.id.getValue(),
      name: this.name,
      description: this.description,
      iconType: this.iconType,
      iconColor: this.iconColor,
      usersCount: this.usersCount,
      config: this.config,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive
    };
  }
}