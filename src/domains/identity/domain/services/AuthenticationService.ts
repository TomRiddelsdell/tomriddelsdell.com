import { User, AuthProvider, UserRole } from '../entities/User';
import { IUserRepository } from '../repositories/IUserRepository';
import { Email } from '../../../../shared/kernel/value-objects/Email';
import { CognitoId } from '../../../../shared/kernel/value-objects/CognitoId';
import { UserId } from '../../../../shared/kernel/value-objects/UserId';
import { 
  UserNotFoundException, 
  AuthenticationFailedException,
  UserAlreadyExistsException 
} from '../../../../shared/kernel/exceptions/DomainException';

export interface AuthenticationResult {
  user: User;
  isNewUser: boolean;
}

export interface UserCreationData {
  email: string;
  cognitoId: string;
  username: string;
  displayName?: string;
  provider?: AuthProvider;
}

export class AuthenticationService {
  constructor(private readonly userRepository: IUserRepository) {}

  async authenticateUser(cognitoId: string, ipAddress?: string): Promise<User> {
    const cognitoIdVO = CognitoId.fromString(cognitoId);
    const user = await this.userRepository.findByCognitoId(cognitoIdVO);
    
    if (!user) {
      throw new UserNotFoundException(`CognitoId: ${cognitoId}`);
    }

    if (!user.isActiveUser()) {
      throw new AuthenticationFailedException('User account is inactive');
    }

    user.authenticate(ipAddress);
    await this.userRepository.update(user);
    
    return user;
  }

  async authenticateOrCreateUser(
    userData: UserCreationData,
    ipAddress?: string
  ): Promise<AuthenticationResult> {
    const cognitoIdVO = CognitoId.fromString(userData.cognitoId);
    const emailVO = Email.fromString(userData.email);
    
    // Try to find existing user by Cognito ID
    let user = await this.userRepository.findByCognitoId(cognitoIdVO);
    let isNewUser = false;

    if (!user) {
      // Check if user exists by email (migration case)
      const existingUser = await this.userRepository.findByEmail(emailVO);
      
      if (existingUser) {
        // Update existing user with Cognito ID
        throw new UserAlreadyExistsException(userData.email);
      }

      // Create new user
      user = await this.createNewUser(userData);
      isNewUser = true;
    }

    if (!user.isActiveUser()) {
      throw new AuthenticationFailedException('User account is inactive');
    }

    user.authenticate(ipAddress);
    await this.userRepository.update(user);

    return { user, isNewUser };
  }

  async createNewUser(userData: UserCreationData): Promise<User> {
    const emailVO = Email.fromString(userData.email);
    const cognitoIdVO = CognitoId.fromString(userData.cognitoId);

    // Check for existing users
    const existingByEmail = await this.userRepository.findByEmail(emailVO);
    if (existingByEmail) {
      throw new UserAlreadyExistsException(userData.email);
    }

    const existingByCognito = await this.userRepository.findByCognitoId(cognitoIdVO);
    if (existingByCognito) {
      throw new UserAlreadyExistsException(`CognitoId: ${userData.cognitoId}`);
    }

    // Generate new user ID (this would typically be handled by the repository)
    const userId = UserId.fromNumber(Date.now()); // Temporary ID generation
    
    const user = User.create(
      userId,
      emailVO,
      cognitoIdVO,
      userData.username,
      userData.displayName,
      userData.provider || AuthProvider.COGNITO
    );

    await this.userRepository.save(user);
    return user;
  }

  async getUserById(id: number): Promise<User> {
    const userIdVO = UserId.fromNumber(id);
    const user = await this.userRepository.findById(userIdVO);
    
    if (!user) {
      throw new UserNotFoundException(`ID: ${id}`);
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const emailVO = Email.fromString(email);
    const user = await this.userRepository.findByEmail(emailVO);
    
    if (!user) {
      throw new UserNotFoundException(`Email: ${email}`);
    }

    return user;
  }

  async deactivateUser(userId: number): Promise<void> {
    const userIdVO = UserId.fromNumber(userId);
    const user = await this.userRepository.findById(userIdVO);
    
    if (!user) {
      throw new UserNotFoundException(`ID: ${userId}`);
    }

    user.deactivate();
    await this.userRepository.update(user);
  }

  async promoteToAdmin(userId: number): Promise<void> {
    const userIdVO = UserId.fromNumber(userId);
    const user = await this.userRepository.findById(userIdVO);
    
    if (!user) {
      throw new UserNotFoundException(`ID: ${userId}`);
    }

    user.changeRole(UserRole.ADMIN);
    await this.userRepository.update(user);
  }
}