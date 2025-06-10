/**
 * Notification Domain - Phase 5
 * TemplateRenderingService
 */

import { NotificationTemplate, TemplateVariable } from '../entities/NotificationTemplate';
import { ChannelType } from '../valueObjects/Channel';

export interface RenderingContext {
  variables: Record<string, any>;
  locale?: string;
  timezone?: string;
  userPreferences?: Record<string, any>;
}

export interface RenderedTemplate {
  subject?: string;
  body: string;
  format: string;
  metadata: {
    templateId: string;
    templateVersion: number;
    renderedAt: Date;
    variablesUsed: string[];
    renderingTime: number;
  };
}

export interface RenderingError {
  type: 'validation' | 'variable' | 'syntax' | 'format';
  message: string;
  field?: string;
  line?: number;
}

export class TemplateRenderingService {
  private renderingCache = new Map<string, { result: RenderedTemplate; expiry: number }>();
  private readonly cacheExpiryMs = 5 * 60 * 1000; // 5 minutes

  async renderTemplate(
    template: NotificationTemplate,
    channel: ChannelType,
    context: RenderingContext
  ): Promise<RenderedTemplate> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(template, channel, context);
    const cached = this.renderingCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }

    // Validate template is active
    if (!template.isTemplateActive()) {
      throw new Error('Cannot render inactive template');
    }

    // Get channel-specific template
    const channelTemplate = template.getChannelTemplate(channel);
    if (!channelTemplate) {
      throw new Error(`No template found for channel: ${channel}`);
    }

    if (!channelTemplate.enabled) {
      throw new Error(`Template for channel ${channel} is disabled`);
    }

    // Validate variables
    const validationErrors = this.validateRenderingContext(template, context);
    if (validationErrors.length > 0) {
      throw new Error(`Template validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    // Prepare rendering context with defaults
    const enrichedContext = this.enrichContext(template, context);

    // Render subject and body
    const renderedSubject = channelTemplate.subject ? 
      this.renderText(channelTemplate.subject, enrichedContext) : undefined;
    const renderedBody = this.renderText(channelTemplate.body, enrichedContext);

    // Post-process based on format
    const processedBody = this.postProcessContent(renderedBody, channelTemplate.format);

    const renderingTime = Date.now() - startTime;
    const variablesUsed = this.extractUsedVariables(channelTemplate.body, enrichedContext);

    const result: RenderedTemplate = {
      subject: renderedSubject,
      body: processedBody,
      format: channelTemplate.format,
      metadata: {
        templateId: template.getId(),
        templateVersion: template.getCurrentVersion(),
        renderedAt: new Date(),
        variablesUsed,
        renderingTime
      }
    };

    // Cache the result
    this.renderingCache.set(cacheKey, {
      result,
      expiry: Date.now() + this.cacheExpiryMs
    });

    return result;
  }

  async renderBulkTemplates(
    template: NotificationTemplate,
    channel: ChannelType,
    contexts: RenderingContext[]
  ): Promise<(RenderedTemplate | RenderingError)[]> {
    const results: (RenderedTemplate | RenderingError)[] = [];

    // Process in parallel with limited concurrency
    const concurrency = 10;
    for (let i = 0; i < contexts.length; i += concurrency) {
      const batch = contexts.slice(i, i + concurrency);
      const batchPromises = batch.map(async (context) => {
        try {
          return await this.renderTemplate(template, channel, context);
        } catch (error) {
          return {
            type: 'validation' as const,
            message: error instanceof Error ? error.message : 'Unknown rendering error'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  private renderText(template: string, context: Record<string, any>): string {
    let result = template;

    // Handle different types of variable interpolation
    result = this.handleSimpleVariables(result, context);
    result = this.handleConditionals(result, context);
    result = this.handleLoops(result, context);
    result = this.handleFormatting(result, context);

    return result;
  }

  private handleSimpleVariables(template: string, context: Record<string, any>): string {
    // Simple variable interpolation: {{variableName}}
    return template.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (match, variablePath) => {
      const value = this.getNestedValue(context, variablePath);
      return value !== undefined ? String(value) : match;
    });
  }

  private handleConditionals(template: string, context: Record<string, any>): string {
    // Conditional blocks: {{#if condition}}content{{/if}}
    return template.replace(/\{\{#if\s+([a-zA-Z0-9_\.]+)\s*\}\}(.*?)\{\{\/if\}\}/gs, (match, condition, content) => {
      const value = this.getNestedValue(context, condition);
      return this.isTruthy(value) ? content : '';
    });
  }

  private handleLoops(template: string, context: Record<string, any>): string {
    // Loop blocks: {{#each items}}{{name}}{{/each}}
    return template.replace(/\{\{#each\s+([a-zA-Z0-9_\.]+)\s*\}\}(.*?)\{\{\/each\}\}/gs, (match, arrayPath, itemTemplate) => {
      const array = this.getNestedValue(context, arrayPath);
      if (!Array.isArray(array)) return '';

      return array.map((item, index) => {
        const itemContext = {
          ...context,
          ...item,
          '@index': index,
          '@first': index === 0,
          '@last': index === array.length - 1
        };
        return this.handleSimpleVariables(itemTemplate, itemContext);
      }).join('');
    });
  }

  private handleFormatting(template: string, context: Record<string, any>): string {
    // Format helpers: {{format date "YYYY-MM-DD"}}
    return template.replace(/\{\{format\s+([a-zA-Z0-9_\.]+)\s+"([^"]+)"\s*\}\}/g, (match, variablePath, formatString) => {
      const value = this.getNestedValue(context, variablePath);
      return this.formatValue(value, formatString);
    });
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }

  private formatValue(value: any, formatString: string): string {
    if (value === null || value === undefined) return '';

    // Date formatting
    if (value instanceof Date || !isNaN(Date.parse(value))) {
      const date = value instanceof Date ? value : new Date(value);
      return this.formatDate(date, formatString);
    }

    // Number formatting
    if (typeof value === 'number') {
      return this.formatNumber(value, formatString);
    }

    // String formatting
    if (typeof value === 'string') {
      return this.formatString(value, formatString);
    }

    return String(value);
  }

  private formatDate(date: Date, format: string): string {
    const formatMap: Record<string, string> = {
      'YYYY': date.getFullYear().toString(),
      'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
      'DD': date.getDate().toString().padStart(2, '0'),
      'HH': date.getHours().toString().padStart(2, '0'),
      'mm': date.getMinutes().toString().padStart(2, '0'),
      'ss': date.getSeconds().toString().padStart(2, '0')
    };

    let result = format;
    for (const [token, value] of Object.entries(formatMap)) {
      result = result.replace(new RegExp(token, 'g'), value);
    }
    return result;
  }

  private formatNumber(num: number, format: string): string {
    switch (format.toLowerCase()) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
      case 'percent':
        return new Intl.NumberFormat('en-US', { style: 'percent' }).format(num);
      case 'decimal':
        return num.toFixed(2);
      default:
        return num.toString();
    }
  }

  private formatString(str: string, format: string): string {
    switch (format.toLowerCase()) {
      case 'uppercase':
        return str.toUpperCase();
      case 'lowercase':
        return str.toLowerCase();
      case 'capitalize':
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      case 'title':
        return str.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      default:
        return str;
    }
  }

  private postProcessContent(content: string, format: string): string {
    switch (format) {
      case 'html':
        return this.sanitizeHtml(content);
      case 'markdown':
        return this.processMarkdown(content);
      case 'text':
      default:
        return content.trim();
    }
  }

  private sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production use a proper library
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .trim();
  }

  private processMarkdown(markdown: string): string {
    // Basic markdown processing - in production use a proper library
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      .trim();
  }

  private validateRenderingContext(
    template: NotificationTemplate,
    context: RenderingContext
  ): RenderingError[] {
    const errors: RenderingError[] = [];
    const variables = template.getVariables();

    for (const variable of variables) {
      const value = context.variables[variable.name];

      // Check required variables
      if (variable.required && (value === undefined || value === null || value === '')) {
        errors.push({
          type: 'variable',
          message: `Required variable '${variable.name}' is missing`,
          field: variable.name
        });
        continue;
      }

      // Skip validation if variable is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (!this.validateVariableType(value, variable.type)) {
        errors.push({
          type: 'variable',
          message: `Variable '${variable.name}' has invalid type. Expected ${variable.type}`,
          field: variable.name
        });
      }

      // Custom validation
      if (variable.validation) {
        const validationErrors = this.validateVariableConstraints(value, variable);
        errors.push(...validationErrors.map(msg => ({
          type: 'validation' as const,
          message: msg,
          field: variable.name
        })));
      }
    }

    return errors;
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

  private enrichContext(template: NotificationTemplate, context: RenderingContext): Record<string, any> {
    const enriched = { ...context.variables };

    // Add template variables with defaults
    for (const variable of template.getVariables()) {
      if (enriched[variable.name] === undefined && variable.defaultValue !== undefined) {
        enriched[variable.name] = variable.defaultValue;
      }
    }

    // Add system variables
    enriched['@now'] = new Date();
    enriched['@templateId'] = template.getId();
    enriched['@templateName'] = template.getName();
    enriched['@locale'] = context.locale || 'en';
    enriched['@timezone'] = context.timezone || 'UTC';

    return enriched;
  }

  private extractUsedVariables(template: string, context: Record<string, any>): string[] {
    const variablePattern = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;
    const usedVariables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const variablePath = match[1];
      const rootVariable = variablePath.split('.')[0];
      if (context.hasOwnProperty(rootVariable)) {
        usedVariables.add(rootVariable);
      }
    }

    return Array.from(usedVariables);
  }

  private generateCacheKey(
    template: NotificationTemplate,
    channel: ChannelType,
    context: RenderingContext
  ): string {
    const contextHash = this.hashObject({
      variables: context.variables,
      locale: context.locale,
      timezone: context.timezone
    });
    return `${template.getId()}_${template.getCurrentVersion()}_${channel}_${contextHash}`;
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Public utility methods
  clearCache(): void {
    this.renderingCache.clear();
  }

  getCacheStats(): { size: number; hitRate: number } {
    // Simple cache statistics
    return {
      size: this.renderingCache.size,
      hitRate: 0 // Would need to track hits/misses for real implementation
    };
  }

  async previewTemplate(
    template: NotificationTemplate,
    channel: ChannelType,
    sampleVariables: Record<string, any> = {}
  ): Promise<RenderedTemplate> {
    // Generate sample data for variables not provided
    const variables = template.getVariables();
    const previewContext: Record<string, any> = { ...sampleVariables };

    for (const variable of variables) {
      if (previewContext[variable.name] === undefined) {
        previewContext[variable.name] = this.generateSampleValue(variable);
      }
    }

    return this.renderTemplate(template, channel, { variables: previewContext });
  }

  private generateSampleValue(variable: TemplateVariable): any {
    switch (variable.type) {
      case 'string':
        return variable.validation?.options?.[0] || `Sample ${variable.name}`;
      case 'number':
        return 42;
      case 'boolean':
        return true;
      case 'date':
        return new Date();
      case 'object':
        return { sampleKey: 'sampleValue' };
      default:
        return variable.defaultValue || `Sample ${variable.name}`;
    }
  }
}