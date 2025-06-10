import { ConnectedApp } from '../entities/ConnectedApp';
import { ConnectedAppId } from '../../../shared/kernel/value-objects/ConnectedAppId';
import { UserId } from '../../../shared/kernel/value-objects/UserId';

export interface IConnectedAppRepository {
  findById(id: ConnectedAppId): Promise<ConnectedApp | null>;
  findByUserId(userId: UserId): Promise<ConnectedApp[]>;
  findConnectedByUserId(userId: UserId): Promise<ConnectedApp[]>;
  findAvailable(): Promise<ConnectedApp[]>;
  save(app: ConnectedApp): Promise<void>;
  update(app: ConnectedApp): Promise<void>;
  delete(id: ConnectedAppId): Promise<void>;
  findAll(): Promise<ConnectedApp[]>;
  findByStatus(status: string): Promise<ConnectedApp[]>;
  searchByName(query: string): Promise<ConnectedApp[]>;
}