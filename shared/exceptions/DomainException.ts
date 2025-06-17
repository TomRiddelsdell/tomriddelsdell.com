/**
 * Domain Exception - Base exception for domain rule violations
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}