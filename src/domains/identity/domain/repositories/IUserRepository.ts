import { User } from '../entities/User';
import { UserId } from '../../../../shared/kernel/value-objects/UserId';
import { Email } from '../../../../shared/kernel/value-objects/Email';
import { CognitoId } from '../../../../shared/kernel/value-objects/CognitoId';

export interface IUserRepository {
  // Basic CRUD operations
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByCognitoId(cognitoId: CognitoId): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  
  // Persistence operations
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
  
  // Query operations
  findAll(): Promise<User[]>;
  findActiveUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  getActiveUserCount(): Promise<number>;
  getNewUserCount(days: number): Promise<number>;
  
  // Admin operations
  findByRole(role: string): Promise<User[]>;
  searchUsers(query: string, limit?: number): Promise<User[]>;
}