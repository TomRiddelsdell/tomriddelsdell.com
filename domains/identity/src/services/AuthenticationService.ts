import { User, UserRole } from '../entities/User';
import { IUserRepository } from '../repositories/IUserRepository';
import { Email } from '../../../shared-kernel/src/value-objects/Email';
import { CognitoId } from '../../../shared-kernel/src/value-objects/CognitoId';

export class AuthenticationService {
  constructor(private userRepository: IUserRepository) {}

  async authenticateUser(cognitoId: CognitoId, ipAddress?: string): Promise<User> {
    const user = await this.userRepository.findByCognitoId(cognitoId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActiveUser()) {
      throw new Error('User account is inactive');
    }

    user.authenticate(ipAddress);
    await this.userRepository.save(user);

    return user;
  }

  async validateUserAccess(cognitoId: CognitoId, requiredRole?: UserRole): Promise<boolean> {
    const user = await this.userRepository.findByCognitoId(cognitoId);
    
    if (!user || !user.isActiveUser()) {
      return false;
    }

    if (requiredRole && user.getRole() !== requiredRole && !user.isAdmin()) {
      return false;
    }

    return true;
  }

  async getUserByCognitoId(cognitoId: CognitoId): Promise<User | null> {
    return await this.userRepository.findByCognitoId(cognitoId);
  }

  async getUserByEmail(email: Email): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }
}