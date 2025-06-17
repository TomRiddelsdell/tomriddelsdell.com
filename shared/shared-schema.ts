// Shared kernel types for cross-domain communication
// This file only contains types and interfaces that are shared across domain boundaries
// Actual domain models remain within their respective bounded contexts

export interface DomainEvent {
  id: string;
  occurredOn: Date;
  eventVersion: number;
}

export interface QueryResult<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}