import { User } from '../entities/User';
import { UserId } from '../../../shared-kernel/src/value-objects/UserId';
import { Email } from '../../../shared-kernel/src/value-objects/Email';
import { CognitoId } from '../../../shared-kernel/src/value-objects/CognitoId';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByCognitoId(cognitoId: CognitoId): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  delete(id: UserId): Promise<void>;
  findAll(): Promise<User[]>;
  count(): Promise<number>;
  findActiveUsers(): Promise<User[]>;
  findNewUsers(days: number): Promise<User[]>;
}