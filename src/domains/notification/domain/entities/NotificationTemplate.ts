/**
 * Notification Domain - Phase 5
 * NotificationTemplate Entity
 */

import { NotificationType } from './Notification';
import { Channel, ChannelType } from '../valueObjects/Channel';

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface ChannelTemplate {
  channel: ChannelType;
  subject?: string; // For email
  body: string;
  format: 'text' | 'html' | 'markdown';
  enabled: boolean;
}

export interface TemplateVersion {
  version: number;
  createdAt: Date;
  createdBy: number;
  changelog?: string;
  isActive: boolean;
}

export class NotificationTemplate {
  private constructor(
    private readonly id: string,
    private name: string,
    private description: string,
    private readonly type: NotificationType,
    private variables: TemplateVariable[],
    private channelTemplates: Map<ChannelType, ChannelTemplate>,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private readonly createdBy: number,
    private isActive: boolean = true,
    private versions: TemplateVersion[] = [],
    private currentVersion: number = 1,
    private tags: string[] = [],
    private metadata: Record<string, any> = {}
  ) {}

  static create(
    name: string,
    description: string,
    type: NotificationType,
    createdBy: number,
    variables: TemplateVariable[] = [],
    channelTemplates: ChannelTemplate[] = [],
    tags: string[] = [],
    metadata: Record<string, any> = {}
  ): NotificationTemplate {
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const template = new NotificationTemplate(
      id,
      name,
      description,
      type,
      variables,
      new Map(),
      now,
      now,
      createdBy,
      true,
      [],
      1,
      tags,
      metadata
    );

    // Add initial version
    template.versions.push({
      version: 1,
      createdAt: now,
      createdBy,
      changelog: 'Initial template creation',
      isActive: true
    });

    // Set up channel templates
    channelTemplates.forEach(ct => {
      template.channelTemplates.set(ct.channel, ct);
    });

    return template;
  }

  static fromPersistence(data: {
    id: string;
    name: string;
    description: string;
    type: NotificationType;
    variables: TemplateVariable[];
    channelTemplates: ChannelTemplate[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: number;
    isActive: boolean;
    versions: TemplateVersion[];
    currentVersion: number;
    tags: string[];
    metadata: Record<string, any>;
  }): NotificationTemplate {
    const template = new NotificationTemplate(
      data.id,
      data.name,
      data.description,
      data.type,
      data.variables,
      new Map(),
      data.createdAt,
      data.updatedAt,
      data.createdBy,
      data.isActive,
      data.versions,
      data.currentVersion,
      data.tags,
      data.metadata
    );

    // Restore channel templates
    data.channelTemplates.forEach(ct => {
      template.channelTemplates.set(ct.channel, ct);
    });

    return template;
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getType(): NotificationType {
    return this.type;
  }

  getVariables(): TemplateVariable[] {
    return [...this.variables];
  }

  getChannelTemplates(): ChannelTemplate[] {
    return Array.from(this.channelTemplates.values());
  }

  getChannelTemplate(channel: ChannelType): ChannelTemplate | undefined {
    return this.channelTemplates.get(channel);
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getCreatedBy(): number {
    return this.createdBy;
  }

  isTemplateActive(): boolean {
    return this.isActive;
  }

  getVersions(): TemplateVersion[] {
    return [...this.versions];
  }

  getCurrentVersion(): number {
    return this.currentVersion;
  }

  getTags(): string[] {
    return [...this.tags];
  }

  getMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  // Business logic methods
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Template name cannot be empty');
    }
    if (name.length > 100) {
      throw new Error('Template name cannot exceed 100 characters');
    }
    this.name = name.trim();
    this.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Template description cannot be empty');
    }
    if (description.length > 500) {
      throw new Error('Template description cannot exceed 500 characters');
    }
    this.description = description.trim();
    this.updatedAt = new Date();
  }

  addVariable(variable: TemplateVariable): void {
    if (this.variables.some(v => v.name === variable.name)) {
      throw new Error(`Variable '${variable.name}' already exists`);
    }
    
    this.validateVariable(variable);
    this.variables.push(variable);
    this.updatedAt = new Date();
  }

  updateVariable(name: string, updates: Partial<TemplateVariable>): void {
    const index = this.variables.findIndex(v => v.name === name);
    if (index === -1) {
      throw new Error(`Variable '${name}' not found`);
    }

    const updatedVariable = { ...this.variables[index], ...updates };
    this.validateVariable(updatedVariable);
    
    this.variables[index] = updatedVariable;
    this.updatedAt = new Date();
  }

  removeVariable(name: string): void {
    const index = this.variables.findIndex(v => v.name === name);
    if (index === -1) {
      throw new Error(`Variable '${name}' not found`);
    }
    
    this.variables.splice(index, 1);
    this.updatedAt = new Date();
  }

  addChannelTemplate(channelTemplate: ChannelTemplate): void {
    this.validateChannelTemplate(channelTemplate);
    this.channelTemplates.set(channelTemplate.channel, channelTemplate);
    this.updatedAt = new Date();
  }

  updateChannelTemplate(channel: ChannelType, updates: Partial<ChannelTemplate>): void {
    const existing = this.channelTemplates.get(channel);
    if (!existing) {
      throw new Error(`Channel template for '${channel}' not found`);
    }

    const updated = { ...existing, ...updates };
    this.validateChannelTemplate(updated);
    
    this.channelTemplates.set(channel, updated);
    this.updatedAt = new Date();
  }

  removeChannelTemplate(channel: ChannelType): void {
    if (!this.channelTemplates.has(channel)) {
      throw new Error(`Channel template for '${channel}' not found`);
    }
    
    this.channelTemplates.delete(channel);
    this.updatedAt = new Date();
  }

  enableChannelTemplate(channel: ChannelType): void {
    const template = this.channelTemplates.get(channel);
    if (!template) {
      throw new Error(`Channel template for '${channel}' not found`);
    }
    
    template.enabled = true;
    this.updatedAt = new Date();
  }

  disableChannelTemplate(channel: ChannelType): void {
    const template = this.channelTemplates.get(channel);
    if (!template) {
      throw new Error(`Channel template for '${channel}' not found`);
    }
    
    template.enabled = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!tag || tag.trim().length === 0) {
      throw new Error('Tag cannot be empty');
    }
    
    const normalizedTag = tag.trim().toLowerCase();
    if (!this.tags.includes(normalizedTag)) {
      this.tags.push(normalizedTag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    const index = this.tags.indexOf(normalizedTag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  createVersion(createdBy: number, changelog?: string): void {
    const newVersion = this.currentVersion + 1;
    
    // Deactivate previous version
    this.versions.forEach(v => v.isActive = false);
    
    // Add new version
    this.versions.push({
      version: newVersion,
      createdAt: new Date(),
      createdBy,
      changelog: changelog || `Version ${newVersion}`,
      isActive: true
    });
    
    this.currentVersion = newVersion;
    this.updatedAt = new Date();
  }

  // Rendering methods
  renderTemplate(channel: ChannelType, variables: Record<string, any> = {}): {
    subject?: string;
    body: string;
    format: string;
  } {
    const channelTemplate = this.channelTemplates.get(channel);
    if (!channelTemplate) {
      throw new Error(`No template found for channel '${channel}'`);
    }

    if (!channelTemplate.enabled) {
      throw new Error(`Template for channel '${channel}' is disabled`);
    }

    // Validate required variables
    const validationErrors = this.validateVariables(variables);
    if (validationErrors.length > 0) {
      throw new Error(`Template validation failed: ${validationErrors.join(', ')}`);
    }

    // Render subject and body
    const renderedSubject = channelTemplate.subject ? 
      this.interpolateVariables(channelTemplate.subject, variables) : undefined;
    const renderedBody = this.interpolateVariables(channelTemplate.body, variables);

    return {
      subject: renderedSubject,
      body: renderedBody,
      format: channelTemplate.format
    };
  }

  private interpolateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    // Simple variable interpolation: {{variableName}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    return result;
  }

  // Validation methods
  validateVariables(variables: Record<string, any>): string[] {
    const errors: string[] = [];
    
    for (const templateVar of this.variables) {
      const value = variables[templateVar.name];
      
      // Check required variables
      if (templateVar.required && (value === undefined || value === null || value === '')) {
        errors.push(`Required variable '${templateVar.name}' is missing`);
        continue;
      }
      
      // Skip validation if variable is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }
      
      // Type validation
      if (!this.validateVariableType(value, templateVar.type)) {
        errors.push(`Variable '${templateVar.name}' has invalid type. Expected ${templateVar.type}`);
      }
      
      // Custom validation
      if (templateVar.validation) {
        const validationErrors = this.validateVariableConstraints(value, templateVar);
        errors.push(...validationErrors);
      }
    }
    
    return errors;
  }

  private validateVariable(variable: TemplateVariable): void {
    if (!variable.name || variable.name.trim().length === 0) {
      throw new Error('Variable name cannot be empty');
    }
    
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(variable.name)) {
      throw new Error('Variable name must start with a letter and contain only letters, numbers, and underscores');
    }
    
    if (!['string', 'number', 'boolean', 'date', 'object'].includes(variable.type)) {
      throw new Error('Invalid variable type');
    }
  }

  private validateChannelTemplate(channelTemplate: ChannelTemplate): void {
    if (!channelTemplate.body || channelTemplate.body.trim().length === 0) {
      throw new Error('Channel template body cannot be empty');
    }
    
    if (!['text', 'html', 'markdown'].includes(channelTemplate.format)) {
      throw new Error('Invalid template format');
    }
    
    // Channel-specific validation
    const channel = Channel.fromString(channelTemplate.channel);
    const maxSize = channel.getMaxMessageSize();
    
    if (channelTemplate.body.length > maxSize) {
      throw new Error(`Template body exceeds maximum size for ${channelTemplate.channel} (${maxSize} characters)`);
    }
  }

  private validateVariableType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'object':
        return typeof value === 'object' && value !== null;
      default:
        return false;
    }
  }

  private validateVariableConstraints(value: any, variable: TemplateVariable): string[] {
    const errors: string[] = [];
    const validation = variable.validation;
    
    if (!validation) return errors;
    
    if (typeof value === 'string') {
      if (validation.minLength && value.length < validation.minLength) {
        errors.push(`Variable '${variable.name}' is too short (minimum ${validation.minLength} characters)`);
      }
      
      if (validation.maxLength && value.length > validation.maxLength) {
        errors.push(`Variable '${variable.name}' is too long (maximum ${validation.maxLength} characters)`);
      }
      
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        errors.push(`Variable '${variable.name}' does not match required pattern`);
      }
      
      if (validation.options && !validation.options.includes(value)) {
        errors.push(`Variable '${variable.name}' must be one of: ${validation.options.join(', ')}`);
      }
    }
    
    return errors;
  }

  // Query methods
  hasVariable(name: string): boolean {
    return this.variables.some(v => v.name === name);
  }

  hasChannelTemplate(channel: ChannelType): boolean {
    return this.channelTemplates.has(channel);
  }

  getEnabledChannels(): ChannelType[] {
    return Array.from(this.channelTemplates.entries())
      .filter(([_, template]) => template.enabled)
      .map(([channel, _]) => channel);
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag.trim().toLowerCase());
  }

  equals(other: NotificationTemplate): boolean {
    return this.id === other.id;
  }
}