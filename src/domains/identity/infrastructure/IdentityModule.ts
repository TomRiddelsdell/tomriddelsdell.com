import { DatabaseUserRepository } from './repositories/DatabaseUserRepository';
import { AuthenticationService } from '../domain/services/AuthenticationService';
import { AuthenticationCommandHandler } from '../application/handlers/AuthenticationCommandHandler';
import { UserQueryHandler } from '../application/handlers/UserQueryHandler';
import { IdentityController } from './controllers/IdentityController';

export class IdentityModule {
  private static instance: IdentityModule;
  
  private readonly userRepository: DatabaseUserRepository;
  private readonly authenticationService: AuthenticationService;
  private readonly commandHandler: AuthenticationCommandHandler;
  private readonly queryHandler: UserQueryHandler;
  private readonly controller: IdentityController;

  private constructor() {
    // Repository layer
    this.userRepository = new DatabaseUserRepository();
    
    // Domain service layer
    this.authenticationService = new AuthenticationService(this.userRepository);
    
    // Application layer
    this.commandHandler = new AuthenticationCommandHandler(this.authenticationService);
    this.queryHandler = new UserQueryHandler(this.authenticationService, this.userRepository);
    
    // Infrastructure layer
    this.controller = new IdentityController(this.commandHandler, this.queryHandler);
  }

  static getInstance(): IdentityModule {
    if (!IdentityModule.instance) {
      IdentityModule.instance = new IdentityModule();
    }
    return IdentityModule.instance;
  }

  getController(): IdentityController {
    return this.controller;
  }

  getAuthenticationService(): AuthenticationService {
    return this.authenticationService;
  }

  getUserRepository(): DatabaseUserRepository {
    return this.userRepository;
  }

  getCommandHandler(): AuthenticationCommandHandler {
    return this.commandHandler;
  }

  getQueryHandler(): UserQueryHandler {
    return this.queryHandler;
  }
}