import { configFields, ConfigFieldDefinition, getCSPDirectives } from './config-schema';
import { BaseConfig } from './base-config';

/**
 * Generic configuration transformer that uses schema definitions
 * to convert environment variables to configuration structure
 */
export class ConfigTransformer {
  
  /**
   * Transform environment variables to configuration object based on schema
   */
  static transform(env: NodeJS.ProcessEnv): Partial<BaseConfig> {
    const environment = (env.NODE_ENV as BaseConfig['environment']) || 'development';
    const config: any = {};

    // Process each field definition
    for (const [configPath, fieldDef] of Object.entries(configFields)) {
      const value = this.getFieldValue(env, fieldDef, environment, configPath);
      this.setNestedValue(config, configPath, value);
    }

    // Add special cases that don't follow the simple pattern
    this.addSpecialFields(config, env, environment);

    return config as Partial<BaseConfig>;
  }

  /**
   * Get the value for a configuration field from environment variables
   */
  private static getFieldValue(
    env: NodeJS.ProcessEnv, 
    fieldDef: ConfigFieldDefinition, 
    environment: string,
    configPath: string
  ): any {
    const rawValue = env[fieldDef.envVar];

    // Use transform function if provided
    if (fieldDef.transform) {
      return fieldDef.transform(rawValue || '', environment, env);
    }

    // Handle environment-specific defaults
    if (fieldDef.environmentSpecific && !rawValue) {
      const envDefault = fieldDef.environmentSpecific[environment as keyof typeof fieldDef.environmentSpecific];
      if (envDefault !== undefined) {
        return this.convertType(envDefault, fieldDef.type);
      }
    }

    // Handle regular defaults
    if (!rawValue && fieldDef.defaultValue !== undefined) {
      return this.convertType(fieldDef.defaultValue, fieldDef.type);
    }

    // Convert the raw value to the appropriate type
    if (rawValue) {
      return this.convertType(rawValue, fieldDef.type);
    }

    // Return empty/default for the type if no value
    return this.getTypeDefault(fieldDef.type);
  }

  /**
   * Convert a value to the specified type
   */
  private static convertType(value: any, type: string): any {
    if (value === null || value === undefined) {
      return this.getTypeDefault(type);
    }

    switch (type) {
      case 'string':
        return String(value);
      case 'number':
        return typeof value === 'number' ? value : parseInt(String(value), 10);
      case 'boolean':
        if (typeof value === 'boolean') return value;
        return String(value).toLowerCase() === 'true';
      case 'array':
        if (Array.isArray(value)) return value;
        return String(value).split(',').map(item => item.trim());
      default:
        return value;
    }
  }

  /**
   * Get default value for a type
   */
  private static getTypeDefault(type: string): any {
    switch (type) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'array': return [];
      default: return null;
    }
  }

  /**
   * Set a nested value in an object using dot notation
   */
  private static setNestedValue(obj: any, path: string, value: any): void {
    // Skip setting if value is undefined
    if (value === undefined) return;
    
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Add special configuration fields that don't follow the simple pattern
   */
  private static addSpecialFields(config: any, env: NodeJS.ProcessEnv, environment: string): void {
    // Set environment
    config.environment = environment;

    // Add CSP directives
    if (!config.security) config.security = {};
    config.security.csp = {
      directives: getCSPDirectives(environment)
    };

    // Handle callback and logout URLs that depend on baseUrl
    if (config.services?.external?.baseUrl) {
      const baseUrl = config.services.external.baseUrl;
      
      if (!config.services.external.callbackUrl) {
        config.services.external.callbackUrl = `${baseUrl}/auth/callback`;
      }
      
      if (!config.services.external.logoutUrl) {
        config.services.external.logoutUrl = baseUrl;
      }
    }

    // SendGrid configuration is now handled entirely by field definitions with transform functions
  }

  /**
   * Validate that all required fields are present
   */
  static validateRequired(config: any): string[] {
    const missing: string[] = [];

    for (const [configPath, fieldDef] of Object.entries(configFields)) {
      if (fieldDef.required) {
        const value = this.getNestedValue(config, configPath);
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          missing.push(fieldDef.envVar);
        }
      }
    }

    return missing;
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
