export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  format?: string;
  validation?: string;
  defaultValue?: any;
  description?: string;
}

export interface SchemaMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  condition?: string;
}

export class DataSchema {
  private constructor(
    private readonly name: string,
    private readonly version: string,
    private readonly fields: FieldDefinition[],
    private readonly mappings: SchemaMapping[] = []
  ) {
    this.validateSchema();
  }

  static create(
    name: string,
    version: string,
    fields: FieldDefinition[],
    mappings: SchemaMapping[] = []
  ): DataSchema {
    return new DataSchema(name, version, fields, mappings);
  }

  private validateSchema(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Schema name is required');
    }

    if (!this.version || this.version.trim().length === 0) {
      throw new Error('Schema version is required');
    }

    if (!this.fields || this.fields.length === 0) {
      throw new Error('Schema must have at least one field');
    }

    // Validate field names are unique
    const fieldNames = this.fields.map(f => f.name);
    const uniqueNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueNames.size) {
      throw new Error('Field names must be unique within a schema');
    }

    // Validate each field
    this.fields.forEach(field => this.validateField(field));

    // Validate mappings reference valid fields
    this.mappings.forEach(mapping => this.validateMapping(mapping));
  }

  private validateField(field: FieldDefinition): void {
    if (!field.name || field.name.trim().length === 0) {
      throw new Error('Field name is required');
    }

    const validTypes: FieldType[] = ['string', 'number', 'boolean', 'date', 'array', 'object'];
    if (!validTypes.includes(field.type)) {
      throw new Error(`Invalid field type: ${field.type}. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  private validateMapping(mapping: SchemaMapping): void {
    if (!mapping.sourceField || !mapping.targetField) {
      throw new Error('Mapping must have both source and target fields');
    }
  }

  getName(): string {
    return this.name;
  }

  getVersion(): string {
    return this.version;
  }

  getFields(): FieldDefinition[] {
    return [...this.fields];
  }

  getMappings(): SchemaMapping[] {
    return [...this.mappings];
  }

  getField(name: string): FieldDefinition | undefined {
    return this.fields.find(f => f.name === name);
  }

  getRequiredFields(): FieldDefinition[] {
    return this.fields.filter(f => f.required === true);
  }

  addField(field: FieldDefinition): DataSchema {
    if (this.getField(field.name)) {
      throw new Error(`Field '${field.name}' already exists in schema`);
    }
    
    return new DataSchema(
      this.name,
      this.version,
      [...this.fields, field],
      this.mappings
    );
  }

  addMapping(mapping: SchemaMapping): DataSchema {
    return new DataSchema(
      this.name,
      this.version,
      this.fields,
      [...this.mappings, mapping]
    );
  }

  validateData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Data must be an object'] };
    }

    // Check required fields
    this.getRequiredFields().forEach(field => {
      if (!(field.name in data) || data[field.name] === null || data[field.name] === undefined) {
        errors.push(`Required field '${field.name}' is missing`);
      }
    });

    // Validate field types
    this.fields.forEach(field => {
      if (field.name in data && data[field.name] !== null && data[field.name] !== undefined) {
        const value = data[field.name];
        if (!this.isValidType(value, field.type)) {
          errors.push(`Field '${field.name}' has invalid type. Expected ${field.type}`);
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  private isValidType(value: any, expectedType: FieldType): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      default:
        return false;
    }
  }

  transformData(sourceData: any, targetSchema: DataSchema): any {
    const result: any = {};

    this.mappings.forEach(mapping => {
      const sourceValue = this.getNestedValue(sourceData, mapping.sourceField);
      
      if (sourceValue !== undefined) {
        let transformedValue = sourceValue;
        
        // Apply transformation if specified
        if (mapping.transformation) {
          transformedValue = this.applyTransformation(sourceValue, mapping.transformation);
        }
        
        // Apply condition if specified
        if (mapping.condition) {
          if (!this.evaluateCondition(sourceData, mapping.condition)) {
            return; // Skip this mapping
          }
        }
        
        this.setNestedValue(result, mapping.targetField, transformedValue);
      }
    });

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
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

  private applyTransformation(value: any, transformation: string): any {
    // Simple transformation functions
    switch (transformation.toLowerCase()) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      case 'date':
        return new Date(value);
      default:
        return value;
    }
  }

  private evaluateCondition(data: any, condition: string): boolean {
    // Simple condition evaluation (would be more sophisticated in production)
    try {
      // Very basic condition parsing - in production, use a proper expression parser
      if (condition.includes('exists')) {
        const field = condition.replace('exists(', '').replace(')', '');
        return this.getNestedValue(data, field) !== undefined;
      }
      return true;
    } catch {
      return true; // Default to true if condition can't be evaluated
    }
  }

  equals(other: DataSchema): boolean {
    return this.name === other.name &&
           this.version === other.version &&
           JSON.stringify(this.fields) === JSON.stringify(other.fields) &&
           JSON.stringify(this.mappings) === JSON.stringify(other.mappings);
  }
}