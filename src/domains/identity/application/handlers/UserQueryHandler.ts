import { AuthenticationService } from '../../domain/services/AuthenticationService';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { 
  GetUserByIdQuery,
  GetUserByEmailQuery,
  GetUserByCognitoIdQuery,
  GetUserStatsQuery,
  GetAllUsersQuery,
  SearchUsersQuery,
  GetUsersByRoleQuery
} from '../queries/GetUserQuery';
import { User } from '../../domain/entities/User';

export interface UserStatsResult {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
}

export class UserQueryHandler {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly userRepository: IUserRepository
  ) {}

  async handleGetUserById(query: GetUserByIdQuery): Promise<User> {
    return await this.authenticationService.getUserById(query.userId);
  }

  async handleGetUserByEmail(query: GetUserByEmailQuery): Promise<User> {
    return await this.authenticationService.getUserByEmail(query.email);
  }

  async handleGetUserByCognitoId(query: GetUserByCognitoIdQuery): Promise<User | null> {
    const cognitoId = query.cognitoId;
    return await this.userRepository.findByCognitoId({ getValue: () => cognitoId } as any);
  }

  async handleGetUserStats(query: GetUserStatsQuery): Promise<UserStatsResult> {
    const days = query.days || 30;
    
    const [totalUsers, activeUsers, newUsers] = await Promise.all([
      this.userRepository.getUserCount(),
      this.userRepository.getActiveUserCount(),
      this.userRepository.getNewUserCount(days)
    ]);

    return {
      totalUsers,
      activeUsers,
      newUsers
    };
  }

  async handleGetAllUsers(query: GetAllUsersQuery): Promise<User[]> {
    if (query.activeOnly) {
      return await this.userRepository.findActiveUsers();
    }
    return await this.userRepository.findAll();
  }

  async handleSearchUsers(query: SearchUsersQuery): Promise<User[]> {
    return await this.userRepository.searchUsers(query.searchTerm, query.limit);
  }

  async handleGetUsersByRole(query: GetUsersByRoleQuery): Promise<User[]> {
    return await this.userRepository.findByRole(query.role);
  }
}