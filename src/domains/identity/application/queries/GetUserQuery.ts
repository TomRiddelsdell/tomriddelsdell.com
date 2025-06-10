export class GetUserByIdQuery {
  constructor(
    public readonly userId: number
  ) {}
}

export class GetUserByEmailQuery {
  constructor(
    public readonly email: string
  ) {}
}

export class GetUserByCognitoIdQuery {
  constructor(
    public readonly cognitoId: string
  ) {}
}

export class GetUserStatsQuery {
  constructor(
    public readonly days?: number
  ) {}
}

export class GetAllUsersQuery {
  constructor(
    public readonly activeOnly?: boolean
  ) {}
}

export class SearchUsersQuery {
  constructor(
    public readonly searchTerm: string,
    public readonly limit?: number
  ) {}
}

export class GetUsersByRoleQuery {
  constructor(
    public readonly role: string
  ) {}
}