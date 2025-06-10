/**
 * Base Repository Interface - Shared Kernel
 * Defines common repository patterns across all domains
 */
export interface IRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
}

export interface IReadOnlyRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  exists(id: ID): Promise<boolean>;
}

export interface IPaginatedRepository<T, ID> extends IRepository<T, ID> {
  findAll(page: number, limit: number): Promise<{ items: T[]; total: number; hasMore: boolean }>;
}

/**
 * Specification pattern for complex queries
 */
export interface ISpecification<T> {
  isSatisfiedBy(entity: T): boolean;
  and(other: ISpecification<T>): ISpecification<T>;
  or(other: ISpecification<T>): ISpecification<T>;
  not(): ISpecification<T>;
}