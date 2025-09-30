# ADR-018: OAuth and Authorization Strategy

## Status

Proposed

## Context

Building on ADR-003 (Authentication Strategy), we need to define specific OAuth flows, authorization patterns, and access control mechanisms for our platform.

## Decision

### OAuth Implementation

- **Authorization Code flow with PKCE** for web applications
- **Client Credentials flow** for service-to-service communication
- **GitHub OAuth integration** for developer/admin access
- **Google OAuth integration** for general user access

### Authorization Model

- **Role-Based Access Control (RBAC)** with these roles:
  - `admin`: Full platform access (Tom Riddelsdell)
  - `viewer`: Can view public projects
  - `collaborator`: Can access shared private projects
  - `anonymous`: Public content only

### Permission Strategy

- **Resource-based permissions** tied to projects and portfolios
- **Tenant isolation** enforced at application layer
- **JWT tokens** with embedded permissions for stateless auth
- **Permission caching** in Redis for performance

### Implementation Approach

- **Cloudflare Access** for admin authentication
- **Custom OAuth service** for public user management
- **Token validation middleware** in each application
- **Permission decorators/middleware** for endpoint protection

## Questions for Confirmation

**OAuth Scopes Design:**

```
read:profile - Basic profile information
read:projects - View accessible projects
write:projects - Modify projects (admin only)
read:analytics - View usage analytics (admin only)
```

**JWT Token Structure:**

```json
{
  "sub": "user-uuid",
  "tenant": "user-uuid",
  "roles": ["viewer"],
  "permissions": ["read:profile", "read:projects"],
  "exp": 1234567890
}
```

**Questions for you:**

1. Should we implement refresh token rotation for enhanced security?
2. What's the desired token lifetime? (15 min access + 7 day refresh?)
3. Should we support fine-grained permissions per project?

## Alternatives Considered

1. **Session-based auth**: Doesn't scale well with Workers
2. **Single OAuth provider**: Reduces user choice
3. **Database-stored permissions**: Performance concerns vs flexibility

## Consequences

- Clear authorization boundaries across services
- Stateless authentication enables Worker scaling
- Multiple OAuth providers improve user experience
- Token-based auth simplifies service integration

## Trade-offs

**Benefits:**

- Industry-standard OAuth flows
- Scalable stateless design
- Multiple login options
- Clear permission model

**Drawbacks:**

- Token management complexity
- Multiple OAuth configurations
- Refresh token security considerations

```

```
