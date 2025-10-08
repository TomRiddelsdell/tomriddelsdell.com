# ADR-003: Authentication Strategy - AWS Cognito

## Status

Accepted

## Context

We need to establish an authentication and authorization strategy for the personal portfolio platform that will:

- Handle user authentication for Tom Riddelsdell and potential collaborators
- Support OAuth flows for secure authentication
- Provide session management capabilities
- Support future scalability while remaining cost-effective
- Ensure compliance with GDPR requirements for EU users

The platform already has an existing AWS Cognito User Pool setup that has been configured and is operational.

## Decision

We will use the **Authorization Code flow with PKCE (Proof Key for Code Exchange)** as our primary OAuth flow:

- **Primary Flow**: Authorization Code with PKCE for web applications
- **Token Exchange**: Standard OAuth 2.0 token exchange for refresh tokens
- **Client Type**: Public client (no client secret required)
- **PKCE Implementation**: SHA256 code challenge method for enhanced security

**OAuth Flow Configuration:**

```typescript
// OAuth flow configuration
interface OAuthConfig {
  flow: 'authorization_code';
  pkce: {
    enabled: true;
    codeChallenge: 'S256'; // SHA256
  };
  scopes: ['email', 'openid', 'profile'];
  responseType: 'code';
  grantTypes: ['authorization_code', 'refresh_token'];
}
```

**Why Authorization Code with PKCE:**

- **Security**: PKCE protects against authorization code interception attacks
- **Single Page Apps**: Suitable for modern web applications without backend secrets
- **Mobile Ready**: Can be extended to mobile applications in the future
- **Standard Compliance**: Follows OAuth 2.0 security best practices
- **Cognito Support**: Native support in AWS Cognito User Pools

We will continue using **AWS Cognito User Pool** as our primary authentication provider:

- **User Pool ID**: `eu-west-2_g2Bs4XiwN`
- **Region**: eu-west-2
- **App Client**: "tomriddelsdell.com" (ID: 483n96q9sudb248kp2sgto7i47)
- **Domain**: `eu-west-2g2bs4xiwn.auth.eu-west-2.amazoncognito.com`
- **OAuth Flow**: Authorization Code with PKCE
- **OAuth Scopes**: email, openid, profile
- **Token Configuration**:
  - Access Token Validity: 60 minutes
  - ID Token Validity: 60 minutes
  - Refresh Token Validity: 5 days
  - Auth Session Validity: 3 minutes

## Rationale

- **Existing Investment**: Already configured and operational with 2 users
- **Cost-Effective**: Cognito pricing aligns with personal portfolio scale
- **AWS Integration**: Seamless integration with other AWS services if needed
- **Security Features**: Built-in security features including token revocation, rate limiting
- **Compliance**: Supports GDPR requirements with proper data handling
- **OAuth Standards**: Implements standard OAuth 2.0 and OpenID Connect protocols
- **Multi-Environment Support**: Callback URLs already configured for dev, staging, and production

## Implementation Details

**OAuth Flow Implementation:**

```typescript
// OAuth flow steps
const authFlow = {
  // 1. Generate PKCE parameters
  codeVerifier: generateCodeVerifier(),
  codeChallenge: generateCodeChallenge(codeVerifier),

  // 2. Authorization request
  authorizationUrl: buildAuthUrl({
    clientId: '483n96q9sudb248kp2sgto7i47',
    redirectUri: 'https://tomriddelsdell.com/auth/callback',
    scope: 'email openid profile',
    responseType: 'code',
    codeChallenge: codeChallenge,
    codeChallengeMethod: 'S256',
  }),

  // 3. Token exchange
  tokenExchange: {
    grantType: 'authorization_code',
    code: authorizationCode,
    codeVerifier: codeVerifier,
    redirectUri: 'https://tomriddelsdell.com/auth/callback',
  },
};
```

**Token Management:**

- **Access Token**: JWT with 60-minute validity for API authorization
- **ID Token**: JWT with user claims for client-side user information
- **Refresh Token**: Opaque token with 5-day validity for token renewal
- **Token Refresh**: Automatic refresh before expiration using refresh token

- **Password Policy**: 8+ characters, requires uppercase, lowercase, numbers, symbols
- **Account Recovery**: Email-based recovery mechanism
- **MFA**: Currently disabled but can be enabled when needed
- **User Attributes**: Standard OpenID claims (name, email, profile, etc.)
- **Callback URLs**: Configured for localhost, tomriddelsdell.com, and replit environments
- **Email Verification**: Automatic email verification enabled

## Consequences

- **Vendor Lock-in**: Tied to AWS ecosystem for authentication
- **Regional Dependency**: Authentication service tied to eu-west-2 region
- **Feature Limitations**: Limited to Cognito's feature set and customization options
- **Cost Predictability**: Predictable costs based on monthly active users
- **Development Velocity**: Reduces need to build custom authentication infrastructure
- **Compliance Simplified**: Leverages AWS's compliance certifications for GDPR

## Security Considerations

**OAuth Security Best Practices:**

- **PKCE**: Protects against authorization code interception
- **State Parameter**: CSRF protection during authorization flow
- **Secure Redirect**: HTTPS-only redirect URIs
- **Token Validation**: JWT signature verification and expiration checks
- **Scope Limitation**: Minimal scopes requested (email, openid, profile only)

- **Token Management**: Short-lived access tokens with longer refresh tokens
- **Rate Limiting**: Built-in Cognito throttling protects against brute force attacks
- **Audit Logging**: Standard Cognito audit logs for authentication events
- **Data Retention**: Automatic cleanup of unused accounts after 7 days
- **Cross-Site Protection**: CSRF protection through proper token validation

## Alternatives Considered

**Other OAuth Flows Considered:**

- **Implicit Flow**: Deprecated due to security concerns, tokens exposed in URL
- **Client Credentials**: Not suitable for user authentication (service-to-service only)
- **Resource Owner Password Credentials**: Requires handling user passwords directly
- **Device Authorization Grant**: Not needed for web application use case

**Why Not Other Flows:**

- **Implicit Flow**: Security vulnerabilities, no refresh token support
- **Client Credentials**: For machine-to-machine authentication only
- **Password Grant**: Anti-pattern for third-party authentication

- **Auth0**: More features but higher cost for small scale
- **Custom OIDC Provider**: Complete control but requires significant development effort
- **Firebase Auth**: Good features but ties to Google ecosystem
- **Supabase Auth**: Modern approach but less mature than Cognito
- **NextAuth.js**: Library-based solution but requires more infrastructure management

---

**Status**: Accepted  
**Next Review**: 2025-12-12
