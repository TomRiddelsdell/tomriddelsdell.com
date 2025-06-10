import { DataSchema } from '../value-objects/DataSchema';

export type MappingType = 'field' | 'object' | 'array' | 'conditional' | 'computed';
export type TransformationType = 'direct' | 'format' | 'lookup' | 'calculate' | 'custom';

export interface FieldMapping {
  id: string;
  type: MappingType;
  sourceField: string;
  targetField: string;
  transformation: TransformationType;
  transformationConfig?: any;
  condition?: string;
  defaultValue?: any;
  required: boolean;
  description?: string;
}

export interface MappingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DataMapping {
  private constructor(
    private readonly id: string,
    private readonly integrationId: string,
    private name: string,
    private description: string,
    private readonly sourceSchema: DataSchema,
    private readonly targetSchema: DataSchema,
    private mappings: FieldMapping[],
    private readonly createdAt: Date,
    private updatedAt: Date,
    private version: string = '1.0.0',
    private isActive: boolean = true,
    private metadata: Record<string, any> = {}
  ) {}

  static create(
    id: string,
    integrationId: string,
    name: string,
    description: string,
    sourceSchema: DataSchema,
    targetSchema: DataSchema
  ): DataMapping {
    const now = new Date();
    return new DataMapping(
      id,
      integrationId,
      name,
      description,
      sourceSchema,
      targetSchema,
      [],
      now,
      now
    );
  }

  static restore(
    id: string,
    integrationId: string,
    name: string,
    description: string,
    sourceSchema: DataSchema,
    targetSchema: DataSchema,
    mappings: FieldMapping[],
    createdAt: Date,
    updatedAt: Date,
    version: string = '1.0.0',
    isActive: boolean = true,
    metadata: Record<string, any> = {}
  ): DataMapping {
    return new DataMapping(
      id,
      integrationId,
      name,
      description,
      sourceSchema,
      targetSchema,
      mappings,
      createdAt,
      updatedAt,
      version,
      isActive,
      metadata
    );
  }

  getId(): string {
    return this.id;
  }

  getIntegrationId(): string {
    return this.integrationId;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getSourceSchema(): DataSchema {
    return this.sourceSchema;
  }

  getTargetSchema(): DataSchema {
    return this.targetSchema;
  }

  getMappings(): FieldMapping[] {
    return [...this.mappings];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getVersion(): string {
    return this.version;
  }

  isActiveMappingActive(): boolean {
    return this.isActive;
  }

  getMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Mapping name cannot be empty');
    }
    this.name = name.trim();
    this.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.description = description || '';
    this.updatedAt = new Date();
  }

  addMapping(mapping: FieldMapping): void {
    // Validate mapping
    this.validateFieldMapping(mapping);
    
    // Check for duplicate mappings
    const existingMapping = this.mappings.find(m => m.id === mapping.id);
    if (existingMapping) {
      throw new Error(`Mapping with id '${mapping.id}' already exists`);
    }

    // Check for duplicate target fields
    const duplicateTarget = this.mappings.find(m => m.targetField === mapping.targetField);
    if (duplicateTarget) {
      throw new Error(`Target field '${mapping.targetField}' is already mapped`);
    }

    this.mappings.push({ ...mapping });
    this.updatedAt = new Date();
  }

  updateMapping(mappingId: string, updates: Partial<FieldMapping>): void {
    const index = this.mappings.findIndex(m => m.id === mappingId);
    if (index === -1) {
      throw new Error(`Mapping with id '${mappingId}' not found`);
    }

    const updatedMapping = { ...this.mappings[index], ...updates };
    this.validateFieldMapping(updatedMapping);

    // Check for duplicate target fields (excluding current mapping)
    if (updates.targetField) {
      const duplicateTarget = this.mappings.find(
        (m, i) => i !== index && m.targetField === updates.targetField
      );
      if (duplicateTarget) {
        throw new Error(`Target field '${updates.targetField}' is already mapped`);
      }
    }

    this.mappings[index] = updatedMapping;
    this.updatedAt = new Date();
  }

  removeMapping(mappingId: string): void {
    const index = this.mappings.findIndex(m => m.id === mappingId);
    if (index === -1) {
      throw new Error(`Mapping with id '${mappingId}' not found`);
    }

    this.mappings.splice(index, 1);
    this.updatedAt = new Date();
  }

  validateMapping(): MappingValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that all required target fields are mapped
    const targetRequiredFields = this.targetSchema.getRequiredFields();
    const mappedTargetFields = new Set(this.mappings.map(m => m.targetField));

    targetRequiredFields.forEach(field => {
      if (!mappedTargetFields.has(field.name)) {
        errors.push(`Required target field '${field.name}' is not mapped`);
      }
    });

    // Check that all source fields exist
    const sourceFields = new Set(this.sourceSchema.getFields().map(f => f.name));
    this.mappings.forEach(mapping => {
      const sourceFieldPath = mapping.sourceField.split('.')[0]; // Handle nested fields
      if (!sourceFields.has(sourceFieldPath)) {
        errors.push(`Source field '${mapping.sourceField}' does not exist in source schema`);
      }
    });

    // Check that all target fields exist
    const targetFields = new Set(this.targetSchema.getFields().map(f => f.name));
    this.mappings.forEach(mapping => {
      const targetFieldPath = mapping.targetField.split('.')[0]; // Handle nested fields
      if (!targetFields.has(targetFieldPath)) {
        errors.push(`Target field '${mapping.targetField}' does not exist in target schema`);
      }
    });

    // Validate individual mappings
    this.mappings.forEach(mapping => {
      try {
        this.validateFieldMapping(mapping);
      } catch (error) {
        errors.push(`Mapping '${mapping.id}': ${error instanceof Error ? error.message : 'Invalid mapping'}`);
      }
    });

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies();
    if (circularDeps.length > 0) {
      errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }

    // Generate warnings for unmapped optional fields
    const optionalTargetFields = this.targetSchema.getFields().filter(f => !f.required);
    optionalTargetFields.forEach(field => {
      if (!mappedTargetFields.has(field.name)) {
        warnings.push(`Optional target field '${field.name}' is not mapped`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateFieldMapping(mapping: FieldMapping): void {
    if (!mapping.id || mapping.id.trim().length === 0) {
      throw new Error('Mapping id is required');
    }

    if (!mapping.sourceField || mapping.sourceField.trim().length === 0) {
      throw new Error('Source field is required');
    }

    if (!mapping.targetField || mapping.targetField.trim().length === 0) {
      throw new Error('Target field is required');
    }

    if (!mapping.type) {
      throw new Error('Mapping type is required');
    }

    if (!mapping.transformation) {
      throw new Error('Transformation type is required');
    }

    // Validate transformation config if required
    if (mapping.transformation === 'custom' && !mapping.transformationConfig) {
      throw new Error('Custom transformation requires transformation config');
    }

    if (mapping.transformation === 'lookup' && !mapping.transformationConfig?.lookupTable) {
      throw new Error('Lookup transformation requires lookup table in config');
    }
  }

  private detectCircularDependencies(): string[] {
    const dependencies = new Map<string, string[]>();
    const circular: string[] = [];

    // Build dependency graph
    this.mappings.forEach(mapping => {
      if (mapping.transformation === 'computed' && mapping.transformationConfig?.dependencies) {
        dependencies.set(mapping.targetField, mapping.transformationConfig.dependencies);
      }
    });

    // Check for circular dependencies using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (field: string): boolean => {
      if (recursionStack.has(field)) {
        circular.push(field);
        return true;
      }

      if (visited.has(field)) {
        return false;
      }

      visited.add(field);
      recursionStack.add(field);

      const deps = dependencies.get(field) || [];
      for (const dep of deps) {
        if (hasCycle(dep)) {
          return true;
        }
      }

      recursionStack.delete(field);
      return false;
    };

    dependencies.forEach((_, field) => {
      if (!visited.has(field)) {
        hasCycle(field);
      }
    });

    return circular;
  }

  transformData(sourceData: any): any {
    const validationResult = this.validateMapping();
    if (!validationResult.isValid) {
      throw new Error(`Cannot transform data with invalid mapping: ${validationResult.errors.join(', ')}`);
    }

    // Validate source data against source schema
    const sourceValidation = this.sourceSchema.validateData(sourceData);
    if (!sourceValidation.isValid) {
      throw new Error(`Source data validation failed: ${sourceValidation.errors.join(', ')}`);
    }

    const result: any = {};

    // Apply mappings in dependency order
    const sortedMappings = this.sortMappingsByDependency();

    sortedMappings.forEach(mapping => {
      try {
        const transformedValue = this.applyFieldMapping(sourceData, mapping, result);
        if (transformedValue !== undefined) {
          this.setNestedValue(result, mapping.targetField, transformedValue);
        }
      } catch (error) {
        if (mapping.required) {
          throw new Error(`Failed to map required field '${mapping.targetField}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // For non-required fields, use default value if available
        if (mapping.defaultValue !== undefined) {
          this.setNestedValue(result, mapping.targetField, mapping.defaultValue);
        }
      }
    });

    // Validate result against target schema
    const targetValidation = this.targetSchema.validateData(result);
    if (!targetValidation.isValid) {
      throw new Error(`Transformed data validation failed: ${targetValidation.errors.join(', ')}`);
    }

    return result;
  }

  private sortMappingsByDependency(): FieldMapping[] {
    const sorted: FieldMapping[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (mappingId: string) => {
      if (visited.has(mappingId)) return;
      if (visiting.has(mappingId)) {
        throw new Error(`Circular dependency detected involving mapping '${mappingId}'`);
      }

      visiting.add(mappingId);

      const mapping = this.mappings.find(m => m.id === mappingId);
      if (!mapping) return;

      // Visit dependencies first
      if (mapping.transformation === 'computed' && mapping.transformationConfig?.dependencies) {
        mapping.transformationConfig.dependencies.forEach((dep: string) => {
          const depMapping = this.mappings.find(m => m.targetField === dep);
          if (depMapping) {
            visit(depMapping.id);
          }
        });
      }

      visiting.delete(mappingId);
      visited.add(mappingId);
      sorted.push(mapping);
    };

    this.mappings.forEach(mapping => visit(mapping.id));
    return sorted;
  }

  private applyFieldMapping(sourceData: any, mapping: FieldMapping, currentResult: any): any {
    // Check condition if specified
    if (mapping.condition && !this.evaluateCondition(sourceData, mapping.condition)) {
      return mapping.defaultValue;
    }

    let sourceValue = this.getNestedValue(sourceData, mapping.sourceField);

    // If source value is undefined and we have a default, use it
    if (sourceValue === undefined && mapping.defaultValue !== undefined) {
      sourceValue = mapping.defaultValue;
    }

    // Apply transformation
    return this.applyTransformation(sourceValue, mapping, sourceData, currentResult);
  }

  private applyTransformation(
    value: any,
    mapping: FieldMapping,
    sourceData: any,
    currentResult: any
  ): any {
    switch (mapping.transformation) {
      case 'direct':
        return value;

      case 'format':
        return this.formatValue(value, mapping.transformationConfig);

      case 'lookup':
        return this.lookupValue(value, mapping.transformationConfig);

      case 'calculate':
        return this.calculateValue(sourceData, mapping.transformationConfig);

      case 'custom':
        return this.executeCustomTransformation(value, mapping.transformationConfig, sourceData, currentResult);

      default:
        throw new Error(`Unsupported transformation type: ${mapping.transformation}`);
    }
  }

  private formatValue(value: any, config: any): any {
    if (!config || !config.format) return value;

    switch (config.format) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'date':
        return new Date(value);
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      default:
        return value;
    }
  }

  private lookupValue(value: any, config: any): any {
    if (!config || !config.lookupTable) return value;
    return config.lookupTable[value] || config.defaultValue || value;
  }

  private calculateValue(sourceData: any, config: any): any {
    if (!config || !config.expression) return undefined;

    // Simple calculator - in production, use a proper expression evaluator
    try {
      // Replace field references in expression
      let expression = config.expression;
      const fieldPattern = /\$\{([^}]+)\}/g;
      expression = expression.replace(fieldPattern, (match: string, fieldPath: string) => {
        const fieldValue = this.getNestedValue(sourceData, fieldPath);
        return fieldValue !== undefined ? fieldValue : 0;
      });

      // Evaluate simple mathematical expressions
      // Note: In production, use a safe expression evaluator
      return eval(expression);
    } catch {
      return config.defaultValue || 0;
    }
  }

  private executeCustomTransformation(
    value: any,
    config: any,
    sourceData: any,
    currentResult: any
  ): any {
    if (!config || !config.function) return value;

    try {
      // In production, this would execute a sandboxed custom function
      // For now, return the value as-is
      return value;
    } catch {
      return config.defaultValue || value;
    }
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

  private evaluateCondition(data: any, condition: string): boolean {
    // Simple condition evaluation - in production, use a proper condition evaluator
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

      return true;
    } catch {
      return true;
    }
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  updateVersion(version: string): void {
    if (!version || version.trim().length === 0) {
      throw new Error('Version cannot be empty');
    }
    this.version = version.trim();
    this.updatedAt = new Date();
  }

  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
    this.updatedAt = new Date();
  }

  removeMetadata(key: string): void {
    delete this.metadata[key];
    this.updatedAt = new Date();
  }

  clone(newId: string, newName: string): DataMapping {
    return DataMapping.restore(
      newId,
      this.integrationId,
      newName,
      `Copy of ${this.description}`,
      this.sourceSchema,
      this.targetSchema,
      this.mappings.map(m => ({ ...m, id: `${m.id}_copy` })),
      new Date(),
      new Date(),
      '1.0.0',
      false,
      { ...this.metadata, clonedFrom: this.id }
    );
  }
}