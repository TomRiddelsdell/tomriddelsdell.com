export class AuthenticateUserCommand {
  constructor(
    public readonly cognitoId: string,
    public readonly ipAddress?: string
  ) {}
}

export class AuthenticateOrCreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly cognitoId: string,
    public readonly username: string,
    public readonly displayName?: string,
    public readonly provider?: string,
    public readonly ipAddress?: string
  ) {}
}

export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly cognitoId: string,
    public readonly username: string,
    public readonly displayName?: string,
    public readonly provider?: string
  ) {}
}

export class UpdateUserProfileCommand {
  constructor(
    public readonly userId: number,
    public readonly displayName?: string,
    public readonly preferredLanguage?: string
  ) {}
}

export class ChangeUserRoleCommand {
  constructor(
    public readonly userId: number,
    public readonly newRole: string
  ) {}
}

export class DeactivateUserCommand {
  constructor(
    public readonly userId: number
  ) {}
}