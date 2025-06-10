/**
 * Analytics Domain - Dimension Value Object
 * Represents categorical data for grouping and filtering metrics
 */

export type DimensionType = 
  | 'user' 
  | 'workflow' 
  | 'integration' 
  | 'status' 
  | 'category' 
  | 'region' 
  | 'device' 
  | 'custom';

export class Dimension {
  private constructor(
    private readonly _name: string,
    private readonly _value: string,
    private readonly _type: DimensionType = 'custom'
  ) {
    this.validateDimension();
  }

  static create(name: string, value: string, type: DimensionType = 'custom'): Dimension {
    return new Dimension(name, value, type);
  }

  static user(userId: string | number): Dimension {
    return new Dimension('user_id', userId.toString(), 'user');
  }

  static workflow(workflowId: string | number, workflowName?: string): Dimension {
    const value = workflowName ? `${workflowId}:${workflowName}` : workflowId.toString();
    return new Dimension('workflow_id', value, 'workflow');
  }

  static integration(integrationId: string | number, integrationName?: string): Dimension {
    const value = integrationName ? `${integrationId}:${integrationName}` : integrationId.toString();
    return new Dimension('integration_id', value, 'integration');
  }

  static status(status: string): Dimension {
    return new Dimension('status', status, 'status');
  }

  static category(category: string): Dimension {
    return new Dimension('category', category, 'category');
  }

  static region(region: string): Dimension {
    return new Dimension('region', region, 'region');
  }

  static device(deviceType: string): Dimension {
    return new Dimension('device_type', deviceType, 'device');
  }

  get name(): string {
    return this._name;
  }

  get value(): string {
    return this._value;
  }

  get type(): DimensionType {
    return this._type;
  }

  get displayName(): string {
    return this._name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  get displayValue(): string {
    if (this._type === 'workflow' || this._type === 'integration') {
      const parts = this._value.split(':');
      return parts.length > 1 ? parts[1] : parts[0];
    }
    return this._value;
  }

  get key(): string {
    return `${this._name}:${this._value}`;
  }

  matches(filter: string): boolean {
    const lowerFilter = filter.toLowerCase();
    return this._name.toLowerCase().includes(lowerFilter) ||
           this._value.toLowerCase().includes(lowerFilter) ||
           this.displayValue.toLowerCase().includes(lowerFilter);
  }

  equals(other: Dimension): boolean {
    return this._name === other._name && 
           this._value === other._value && 
           this._type === other._type;
  }

  toJSON(): Record<string, any> {
    return {
      name: this._name,
      value: this._value,
      type: this._type,
      displayName: this.displayName,
      displayValue: this.displayValue,
      key: this.key
    };
  }

  private validateDimension(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Dimension name cannot be empty');
    }

    if (!this._value || this._value.trim().length === 0) {
      throw new Error('Dimension value cannot be empty');
    }

    if (this._name.length > 100) {
      throw new Error('Dimension name cannot exceed 100 characters');
    }

    if (this._value.length > 500) {
      throw new Error('Dimension value cannot exceed 500 characters');
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(this._name)) {
      throw new Error('Dimension name must start with a letter and contain only letters, numbers, and underscores');
    }
  }
}

export class DimensionCollection {
  private readonly dimensions: Map<string, Dimension>;

  constructor(dimensions: Dimension[] = []) {
    this.dimensions = new Map();
    dimensions.forEach(dim => this.add(dim));
  }

  add(dimension: Dimension): DimensionCollection {
    this.dimensions.set(dimension.name, dimension);
    return this;
  }

  get(name: string): Dimension | undefined {
    return this.dimensions.get(name);
  }

  has(name: string): boolean {
    return this.dimensions.has(name);
  }

  remove(name: string): boolean {
    return this.dimensions.delete(name);
  }

  getAll(): Dimension[] {
    return Array.from(this.dimensions.values());
  }

  getByType(type: DimensionType): Dimension[] {
    return this.getAll().filter(dim => dim.type === type);
  }

  filter(predicate: (dimension: Dimension) => boolean): Dimension[] {
    return this.getAll().filter(predicate);
  }

  search(query: string): Dimension[] {
    return this.getAll().filter(dim => dim.matches(query));
  }

  size(): number {
    return this.dimensions.size;
  }

  isEmpty(): boolean {
    return this.dimensions.size === 0;
  }

  merge(other: DimensionCollection): DimensionCollection {
    const merged = new DimensionCollection(this.getAll());
    other.getAll().forEach(dim => merged.add(dim));
    return merged;
  }

  toJSON(): Record<string, any> {
    const result: Record<string, any> = {};
    this.dimensions.forEach((dimension, name) => {
      result[name] = dimension.value;
    });
    return result;
  }

  toArray(): Dimension[] {
    return this.getAll();
  }

  equals(other: DimensionCollection): boolean {
    if (this.size() !== other.size()) {
      return false;
    }

    for (const [name, dimension] of this.dimensions) {
      const otherDimension = other.get(name);
      if (!otherDimension || !dimension.equals(otherDimension)) {
        return false;
      }
    }

    return true;
  }
}