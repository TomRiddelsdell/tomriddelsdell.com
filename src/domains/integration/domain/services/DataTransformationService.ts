import { DataMapping, FieldMapping } from '../entities/DataMapping';
import { DataSchema } from '../value-objects/DataSchema';

export interface TransformationContext {
  sourceData: any;
  targetSchema: DataSchema;
  userId: number;
  executionId: string;
  customFunctions?: Record<string, Function>;
  lookupTables?: Record<string, Record<string, any>>;
}

export interface TransformationResult {
  success: boolean;
  transformedData?: any;
  errors: TransformationError[];
  warnings: string[];
  statistics: TransformationStatistics;
}

export interface TransformationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  originalValue?: any;
  expectedType?: string;
}

export interface TransformationStatistics {
  fieldsProcessed: number;
  fieldsTransformed: number;
  fieldsSkipped: number;
  fieldsErrored: number;
  transformationTime: number;
}

export class DataTransformationService {
  async transformData(
    mapping: DataMapping,
    context: TransformationContext
  ): Promise<TransformationResult> {
    const startTime = Date.now();
    const errors: TransformationError[] = [];
    const warnings: string[] = [];
    
    let fieldsProcessed = 0;
    let fieldsTransformed = 0;
    let fieldsSkipped = 0;
    let fieldsErrored = 0;

    try {
      // Validate mapping before transformation
      const mappingValidation = mapping.validateMapping();
      if (!mappingValidation.isValid) {
        throw new Error(`Invalid mapping: ${mappingValidation.errors.join(', ')}`);
      }

      // Validate source data against source schema
      const sourceValidation = mapping.getSourceSchema().validateData(context.sourceData);
      if (!sourceValidation.isValid) {
        sourceValidation.errors.forEach(error => {
          errors.push({
            field: 'source_validation',
            message: error,
            severity: 'error'
          });
        });
      }

      // If there are validation errors, return early
      if (errors.length > 0) {
        return {
          success: false,
          errors,
          warnings,
          statistics: {
            fieldsProcessed: 0,
            fieldsTransformed: 0,
            fieldsSkipped: 0,
            fieldsErrored: errors.length,
            transformationTime: Date.now() - startTime
          }
        };
      }

      // Perform the actual transformation
      const transformedData = await this.executeTransformation(
        mapping,
        context,
        errors,
        warnings
      );

      // Count field statistics
      const mappings = mapping.getMappings();
      fieldsProcessed = mappings.length;
      fieldsTransformed = mappings.filter(m => 
        this.getNestedValue(transformedData, m.targetField) !== undefined
      ).length;
      fieldsSkipped = fieldsProcessed - fieldsTransformed - errors.length;
      fieldsErrored = errors.filter(e => e.severity === 'error').length;

      // Validate transformed data against target schema
      const targetValidation = context.targetSchema.validateData(transformedData);
      if (!targetValidation.isValid) {
        targetValidation.errors.forEach(error => {
          errors.push({
            field: 'target_validation',
            message: error,
            severity: 'error'
          });
        });
      }

      return {
        success: errors.filter(e => e.severity === 'error').length === 0,
        transformedData,
        errors,
        warnings,
        statistics: {
          fieldsProcessed,
          fieldsTransformed,
          fieldsSkipped,
          fieldsErrored,
          transformationTime: Date.now() - startTime
        }
      };

    } catch (error) {
      errors.push({
        field: 'transformation',
        message: error instanceof Error ? error.message : 'Unknown transformation error',
        severity: 'error'
      });

      return {
        success: false,
        errors,
        warnings,
        statistics: {
          fieldsProcessed: 0,
          fieldsTransformed: 0,
          fieldsSkipped: 0,
          fieldsErrored: 1,
          transformationTime: Date.now() - startTime
        }
      };
    }
  }

  private async executeTransformation(
    mapping: DataMapping,
    context: TransformationContext,
    errors: TransformationError[],
    warnings: string[]
  ): Promise<any> {
    const result: any = {};
    const mappings = mapping.getMappings();

    // Sort mappings by dependency order
    const sortedMappings = this.sortMappingsByDependency(mappings);

    for (const fieldMapping of sortedMappings) {
      try {
        const transformedValue = await this.transformField(
          fieldMapping,
          context,
          result
        );

        if (transformedValue !== undefined) {
          this.setNestedValue(result, fieldMapping.targetField, transformedValue);
        }
      } catch (error) {
        const transformationError: TransformationError = {
          field: fieldMapping.targetField,
          message: error instanceof Error ? error.message : 'Field transformation failed',
          severity: fieldMapping.required ? 'error' : 'warning',
          originalValue: this.getNestedValue(context.sourceData, fieldMapping.sourceField)
        };

        errors.push(transformationError);

        // Use default value for non-required fields
        if (!fieldMapping.required && fieldMapping.defaultValue !== undefined) {
          this.setNestedValue(result, fieldMapping.targetField, fieldMapping.defaultValue);
          warnings.push(`Used default value for field '${fieldMapping.targetField}' due to transformation error`);
        }
      }
    }

    return result;
  }

  private async transformField(
    mapping: FieldMapping,
    context: TransformationContext,
    currentResult: any
  ): Promise<any> {
    // Check condition if specified
    if (mapping.condition && !this.evaluateCondition(context.sourceData, mapping.condition)) {
      return mapping.defaultValue;
    }

    // Get source value
    let sourceValue = this.getNestedValue(context.sourceData, mapping.sourceField);

    // Use default if source value is undefined
    if (sourceValue === undefined && mapping.defaultValue !== undefined) {
      sourceValue = mapping.defaultValue;
    }

    // Apply transformation based on type
    switch (mapping.transformation) {
      case 'direct':
        return sourceValue;

      case 'format':
        return this.applyFormatTransformation(sourceValue, mapping.transformationConfig);

      case 'lookup':
        return this.applyLookupTransformation(
          sourceValue, 
          mapping.transformationConfig, 
          context.lookupTables
        );

      case 'calculate':
        return this.applyCalculationTransformation(
          context.sourceData, 
          mapping.transformationConfig
        );

      case 'custom':
        return await this.applyCustomTransformation(
          sourceValue,
          mapping.transformationConfig,
          context
        );

      default:
        throw new Error(`Unsupported transformation type: ${mapping.transformation}`);
    }
  }

  private applyFormatTransformation(value: any, config: any): any {
    if (!config) return value;

    switch (config.format) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      
      case 'capitalize':
        return typeof value === 'string' 
          ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() 
          : value;
      
      case 'date':
        if (value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid date value: ${value}`);
          }
          return config.dateFormat ? this.formatDate(date, config.dateFormat) : date;
        }
        return value;
      
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`Cannot convert '${value}' to number`);
        }
        return config.decimals !== undefined ? Number(num.toFixed(config.decimals)) : num;
      
      case 'string':
        return String(value);
      
      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          return lower === 'true' || lower === 'yes' || lower === '1';
        }
        return Boolean(value);
      
      case 'array':
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          const delimiter = config.delimiter || ',';
          return value.split(delimiter).map(item => item.trim());
        }
        return [value];
      
      case 'json':
        if (typeof value === 'object') return JSON.stringify(value);
        return value;
      
      case 'parse_json':
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch {
            throw new Error(`Invalid JSON string: ${value}`);
          }
        }
        return value;
      
      default:
        return value;
    }
  }

  private applyLookupTransformation(
    value: any, 
    config: any, 
    lookupTables?: Record<string, Record<string, any>>
  ): any {
    if (!config) return value;

    // Use embedded lookup table first
    if (config.lookupTable && typeof config.lookupTable === 'object') {
      const result = config.lookupTable[value];
      return result !== undefined ? result : (config.defaultValue || value);
    }

    // Use external lookup table
    if (config.tableName && lookupTables && lookupTables[config.tableName]) {
      const table = lookupTables[config.tableName];
      const result = table[value];
      return result !== undefined ? result : (config.defaultValue || value);
    }

    return config.defaultValue || value;
  }

  private applyCalculationTransformation(sourceData: any, config: any): any {
    if (!config || !config.expression) {
      throw new Error('Calculation transformation requires an expression');
    }

    try {
      let expression = config.expression;
      
      // Replace field references with actual values
      const fieldPattern = /\$\{([^}]+)\}/g;
      expression = expression.replace(fieldPattern, (match: string, fieldPath: string) => {
        const fieldValue = this.getNestedValue(sourceData, fieldPath);
        if (fieldValue === undefined || fieldValue === null) {
          return config.nullValue || 0;
        }
        return Number(fieldValue) || 0;
      });

      // Evaluate mathematical expression
      // Note: In production, use a safe expression evaluator like expr-eval
      const result = this.evaluateMathExpression(expression);
      
      return config.roundTo !== undefined ? Number(result.toFixed(config.roundTo)) : result;

    } catch (error) {
      throw new Error(`Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async applyCustomTransformation(
    value: any,
    config: any,
    context: TransformationContext
  ): Promise<any> {
    if (!config) return value;

    // If a custom function is provided in context
    if (config.functionName && context.customFunctions && context.customFunctions[config.functionName]) {
      try {
        const customFunction = context.customFunctions[config.functionName];
        return await customFunction(value, config.parameters || {}, context.sourceData);
      } catch (error) {
        throw new Error(`Custom function '${config.functionName}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Built-in custom transformations
    switch (config.type) {
      case 'concat':
        return this.concatValues(value, config, context.sourceData);
      
      case 'split':
        return this.splitValue(value, config);
      
      case 'regex_replace':
        return this.regexReplace(value, config);
      
      case 'conditional':
        return this.conditionalTransform(value, config, context.sourceData);
      
      default:
        throw new Error(`Unknown custom transformation type: ${config.type}`);
    }
  }

  private concatValues(value: any, config: any, sourceData: any): string {
    const parts: string[] = [];
    
    if (config.fields && Array.isArray(config.fields)) {
      config.fields.forEach((field: string) => {
        const fieldValue = this.getNestedValue(sourceData, field);
        if (fieldValue !== undefined && fieldValue !== null) {
          parts.push(String(fieldValue));
        }
      });
    }
    
    if (value !== undefined && value !== null) {
      parts.push(String(value));
    }
    
    const separator = config.separator || '';
    return parts.join(separator);
  }

  private splitValue(value: any, config: any): string[] {
    if (typeof value !== 'string') {
      throw new Error('Split transformation requires a string value');
    }
    
    const delimiter = config.delimiter || ',';
    const result = value.split(delimiter);
    
    if (config.trim) {
      return result.map(item => item.trim());
    }
    
    return result;
  }

  private regexReplace(value: any, config: any): string {
    if (typeof value !== 'string') {
      return String(value);
    }
    
    if (!config.pattern) {
      throw new Error('Regex replace requires a pattern');
    }
    
    try {
      const regex = new RegExp(config.pattern, config.flags || 'g');
      return value.replace(regex, config.replacement || '');
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${config.pattern}`);
    }
  }

  private conditionalTransform(value: any, config: any, sourceData: any): any {
    if (!config.conditions || !Array.isArray(config.conditions)) {
      return value;
    }
    
    for (const condition of config.conditions) {
      if (this.evaluateCondition(sourceData, condition.if, value)) {
        return condition.then;
      }
    }
    
    return config.else !== undefined ? config.else : value;
  }

  private evaluateMathExpression(expression: string): number {
    // Simple math expression evaluator
    // In production, use a proper library like expr-eval
    const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
    
    try {
      // eslint-disable-next-line no-eval
      return eval(sanitized);
    } catch {
      throw new Error(`Invalid mathematical expression: ${expression}`);
    }
  }

  private formatDate(date: Date, format: string): string {
    // Simple date formatting - in production, use a library like date-fns
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  private evaluateCondition(data: any, condition: string, currentValue?: any): boolean {
    try {
      if (condition.includes('exists(')) {
        const field = condition.replace('exists(', '').replace(')', '');
        return this.getNestedValue(data, field) !== undefined;
      }
      
      if (condition.includes('notEmpty(')) {
        const field = condition.replace('notEmpty(', '').replace(')', '');
        const value = this.getNestedValue(data, field);
        return value !== undefined && value !== null && value !== '';
      }
      
      if (condition.includes('equals(')) {
        const match = condition.match(/equals\(([^,]+),\s*([^)]+)\)/);
        if (match) {
          const fieldValue = this.getNestedValue(data, match[1]);
          const expectedValue = match[2].replace(/['"]/g, '');
          return String(fieldValue) === expectedValue;
        }
      }
      
      if (currentValue !== undefined) {
        // Simple value-based conditions
        if (condition === 'hasValue') {
          return currentValue !== undefined && currentValue !== null && currentValue !== '';
        }
        if (condition === 'isEmpty') {
          return currentValue === undefined || currentValue === null || currentValue === '';
        }
      }
      
      return true;
    } catch {
      return true; // Default to true if condition can't be evaluated
    }
  }

  private sortMappingsByDependency(mappings: FieldMapping[]): FieldMapping[] {
    const sorted: FieldMapping[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (mapping: FieldMapping) => {
      if (visited.has(mapping.id)) return;
      if (visiting.has(mapping.id)) {
        throw new Error(`Circular dependency detected in field mapping: ${mapping.id}`);
      }

      visiting.add(mapping.id);

      // Handle dependencies for calculated transformations
      if (mapping.transformation === 'calculate' && mapping.transformationConfig?.dependencies) {
        mapping.transformationConfig.dependencies.forEach((dep: string) => {
          const depMapping = mappings.find(m => m.targetField === dep);
          if (depMapping) {
            visit(depMapping);
          }
        });
      }

      visiting.delete(mapping.id);
      visited.add(mapping.id);
      sorted.push(mapping);
    };

    mappings.forEach(mapping => visit(mapping));
    return sorted;
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    if (!obj || !path) return;
    
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  validateTransformationConfig(mapping: FieldMapping): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!mapping.transformation) {
      errors.push('Transformation type is required');
      return { isValid: false, errors };
    }

    switch (mapping.transformation) {
      case 'format':
        if (mapping.transformationConfig && !mapping.transformationConfig.format) {
          errors.push('Format transformation requires a format type');
        }
        break;

      case 'lookup':
        if (!mapping.transformationConfig || 
            (!mapping.transformationConfig.lookupTable && !mapping.transformationConfig.tableName)) {
          errors.push('Lookup transformation requires a lookup table or table name');
        }
        break;

      case 'calculate':
        if (!mapping.transformationConfig || !mapping.transformationConfig.expression) {
          errors.push('Calculate transformation requires an expression');
        }
        break;

      case 'custom':
        if (!mapping.transformationConfig || 
            (!mapping.transformationConfig.functionName && !mapping.transformationConfig.type)) {
          errors.push('Custom transformation requires a function name or type');
        }
        break;
    }

    return { isValid: errors.length === 0, errors };
  }
}