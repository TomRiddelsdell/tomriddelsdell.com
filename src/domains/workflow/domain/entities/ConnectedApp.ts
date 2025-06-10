import { ConnectedAppId } from '../../../shared/kernel/value-objects/ConnectedAppId';
import { UserId } from '../../../shared/kernel/value-objects/UserId';
import { ConnectedAppLinkedEvent } from '../../../shared/kernel/events/DomainEvent';
import { DomainEntity } from '../../../shared/kernel/base/DomainEntity';

export enum AppConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

export interface AppConfig {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  version?: string;
  settings?: Record<string, any>;
}

export class ConnectedApp extends DomainEntity {
  private constructor(
    private readonly id: ConnectedAppId,
    private readonly userId: UserId,
    private name: string,
    private description: string,
    private icon: string,
    private status: AppConnectionStatus,
    private config: AppConfig,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private accessToken?: string,
    private refreshToken?: string,
    private tokenExpiry?: Date
  ) {
    super();
  }

  public static create(
    id: ConnectedAppId,
    userId: UserId,
    name: string,
    description: string,
    icon: string,
    config: AppConfig
  ): ConnectedApp {
    return new ConnectedApp(
      id,
      userId,
      name,
      description,
      icon,
      AppConnectionStatus.DISCONNECTED,
      config,
      new Date(),
      new Date()
    );
  }

  public static fromPersistence(
    id: number,
    userId: number,
    name: string,
    description: string,
    icon: string,
    status: string,
    config: AppConfig,
    createdAt: Date,
    updatedAt: Date,
    accessToken?: string,
    refreshToken?: string,
    tokenExpiry?: Date
  ): ConnectedApp {
    return new ConnectedApp(
      ConnectedAppId.fromNumber(id),
      UserId.fromNumber(userId),
      name,
      description,
      icon,
      status as AppConnectionStatus,
      config,
      createdAt,
      updatedAt,
      accessToken,
      refreshToken,
      tokenExpiry
    );
  }

  // Getters
  public getId(): ConnectedAppId {
    return this.id;
  }

  public getUserId(): UserId {
    return this.userId;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getIcon(): string {
    return this.icon;
  }

  public getStatus(): AppConnectionStatus {
    return this.status;
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public getAccessToken(): string | undefined {
    return this.accessToken;
  }

  public getRefreshToken(): string | undefined {
    return this.refreshToken;
  }

  public getTokenExpiry(): Date | undefined {
    return this.tokenExpiry;
  }

  // Business Logic
  public updateDetails(name: string, description: string): void {
    this.name = name;
    this.description = description;
    this.updatedAt = new Date();
  }

  public updateConfig(config: AppConfig): void {
    this.config = config;
    this.updatedAt = new Date();
  }

  public connect(accessToken: string, refreshToken?: string, tokenExpiry?: Date): void {
    this.status = AppConnectionStatus.CONNECTED;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = tokenExpiry;
    this.updatedAt = new Date();
  }

  public disconnect(): void {
    this.status = AppConnectionStatus.DISCONNECTED;
    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.tokenExpiry = undefined;
    this.updatedAt = new Date();
  }

  public markAsError(errorMessage: string): void {
    this.status = AppConnectionStatus.ERROR;
    this.updatedAt = new Date();
  }

  public linkToWorkflow(workflowId: string): void {
    if (this.status !== AppConnectionStatus.CONNECTED) {
      throw new Error('Cannot link disconnected app to workflow');
    }

    this.addDomainEvent(new ConnectedAppLinkedEvent(
      this.id.getValue().toString(),
      this.userId.getValue().toString(),
      workflowId
    ));
  }

  public isConnected(): boolean {
    return this.status === AppConnectionStatus.CONNECTED;
  }

  public hasValidToken(): boolean {
    if (!this.accessToken) return false;
    if (!this.tokenExpiry) return true; // No expiry means token doesn't expire
    return this.tokenExpiry > new Date();
  }

  public needsTokenRefresh(): boolean {
    if (!this.tokenExpiry || !this.accessToken) return false;
    const refreshTime = new Date(this.tokenExpiry.getTime() - 5 * 60 * 1000); // 5 minutes before expiry
    return new Date() >= refreshTime;
  }

  public refreshAccessToken(newAccessToken: string, newExpiry?: Date): void {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    this.accessToken = newAccessToken;
    this.tokenExpiry = newExpiry;
    this.updatedAt = new Date();
  }

  public toPlainObject(): any {
    return {
      id: this.id.getValue(),
      userId: this.userId.getValue(),
      name: this.name,
      description: this.description,
      icon: this.icon,
      status: this.status,
      config: this.config,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      tokenExpiry: this.tokenExpiry
    };
  }
}