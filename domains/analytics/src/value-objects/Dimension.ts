import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';

export enum DimensionType {
  USER = 'user',
  WORKFLOW = 'workflow',
  APP = 'app',
  STATUS = 'status',
  TIMEFRAME = 'timeframe',
  REGION = 'region',
  PLATFORM = 'platform',
  DEVICE = 'device',
  SOURCE = 'source',
  CATEGORY = 'category'
}

export class Dimension {
  private constructor(
    public readonly type: DimensionType,
    public readonly value: string,
    public readonly label?: string
  ) {
    if (!value || value.trim().length === 0) {
      throw new DomainException('Dimension value cannot be empty');
    }
  }

  static user(userId: string, label?: string): Dimension {
    return new Dimension(DimensionType.USER, userId, label || `User ${userId}`);
  }

  static workflow(workflowId: string, label?: string): Dimension {
    return new Dimension(DimensionType.WORKFLOW, workflowId, label || `Workflow ${workflowId}`);
  }

  static app(appName: string, label?: string): Dimension {
    return new Dimension(DimensionType.APP, appName, label || appName);
  }

  static status(status: string, label?: string): Dimension {
    return new Dimension(DimensionType.STATUS, status, label || status);
  }

  static timeframe(timeframe: string, label?: string): Dimension {
    return new Dimension(DimensionType.TIMEFRAME, timeframe, label || timeframe);
  }

  static region(region: string, label?: string): Dimension {
    return new Dimension(DimensionType.REGION, region, label || region);
  }

  static platform(platform: string, label?: string): Dimension {
    return new Dimension(DimensionType.PLATFORM, platform, label || platform);
  }

  static device(device: string, label?: string): Dimension {
    return new Dimension(DimensionType.DEVICE, device, label || device);
  }

  static source(source: string, label?: string): Dimension {
    return new Dimension(DimensionType.SOURCE, source, label || source);
  }

  static category(category: string, label?: string): Dimension {
    return new Dimension(DimensionType.CATEGORY, category, label || category);
  }

  get displayLabel(): string {
    return this.label || this.value;
  }

  equals(other: Dimension): boolean {
    return this.type === other.type && this.value === other.value;
  }

  toString(): string {
    return `${this.type}:${this.value}`;
  }

  toFilterString(): string {
    return `${this.type}=${this.value}`;
  }
}

export class DimensionCollection {
  private dimensions: Map<DimensionType, Dimension> = new Map();

  constructor(dimensions: Dimension[] = []) {
    for (const dimension of dimensions) {
      this.add(dimension);
    }
  }

  add(dimension: Dimension): DimensionCollection {
    this.dimensions.set(dimension.type, dimension);
    return this;
  }

  remove(type: DimensionType): DimensionCollection {
    this.dimensions.delete(type);
    return this;
  }

  get(type: DimensionType): Dimension | undefined {
    return this.dimensions.get(type);
  }

  has(type: DimensionType): boolean {
    return this.dimensions.has(type);
  }

  getAll(): Dimension[] {
    return Array.from(this.dimensions.values());
  }

  size(): number {
    return this.dimensions.size;
  }

  isEmpty(): boolean {
    return this.dimensions.size === 0;
  }

  clone(): DimensionCollection {
    return new DimensionCollection(this.getAll());
  }

  merge(other: DimensionCollection): DimensionCollection {
    const merged = this.clone();
    for (const dimension of other.getAll()) {
      merged.add(dimension);
    }
    return merged;
  }

  toFilterObject(): Record<string, string> {
    const filters: Record<string, string> = {};
    for (const dimension of this.getAll()) {
      filters[dimension.type] = dimension.value;
    }
    return filters;
  }

  toString(): string {
    return this.getAll().map(d => d.toString()).join(',');
  }

  equals(other: DimensionCollection): boolean {
    if (this.size() !== other.size()) return false;
    
    for (const dimension of this.getAll()) {
      const otherDimension = other.get(dimension.type);
      if (!otherDimension || !dimension.equals(otherDimension)) {
        return false;
      }
    }
    return true;
  }
}