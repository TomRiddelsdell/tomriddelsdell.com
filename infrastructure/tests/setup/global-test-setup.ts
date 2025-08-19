import { vi } from 'vitest';

/**
 * Global test setup following DDD principles
 * Infrastructure layer: Cross-cutting concerns and external dependencies
 */

// Mock external dependencies that cross domain boundaries
vi.mock('../../../../domains/shared-kernel/src/services/external-api-service', () => ({
  ExternalApiService: vi.fn().mockImplementation(() => ({
    makeRequest: vi.fn().mockResolvedValue({ data: 'mocked' }),
    authenticate: vi.fn().mockResolvedValue(true)
  }))
}));

// Mock infrastructure-level database connections
vi.mock('../../../database/config/db', () => ({
  db: {
    query: vi.fn(),
    transaction: vi.fn(),
    close: vi.fn()
  }
}));

// Mock AWS Cognito authentication infrastructure
vi.mock('../../../security/auth/aws-cognito-provider', () => ({
  AwsCognitoProvider: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn().mockResolvedValue({
      id: 'test-cognito-id',
      email: 'test@example.com',
      name: 'Test User'
    }),
    signOut: vi.fn().mockResolvedValue(true),
    getCurrentUser: vi.fn().mockResolvedValue(null)
  }))
}));

// Mock SendGrid email infrastructure
vi.mock('@sendgrid/mail', () => ({
  setApiKey: vi.fn(),
  send: vi.fn().mockResolvedValue([{ statusCode: 202 }])
}));

// Mock configuration system
vi.mock('../../../configuration/node-config-service', () => ({
  getConfig: vi.fn(() => ({
    environment: 'test',
    database: {
      url: 'postgresql://test:test@localhost:5432/test',
      pool: { min: 2, max: 10, connectionTimeoutMillis: 5000 },
      ssl: { enabled: false, rejectUnauthorized: false }
    },
    security: {
      session: {
        secret: 'test-session-secret-minimum-32-characters-long',
        secure: false
      },
      cors: { allowedOrigins: ['http://localhost:3000'] },
      rateLimit: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
      csp: { directives: {} }
    },
    cognito: {
      clientId: 'test-client-id',
      userPoolId: 'test-user-pool-id',
      region: 'us-east-1',
      hostedUIDomain: 'test-domain.auth.us-east-1.amazoncognito.com'
    },
    services: {
      external: {
        baseUrl: 'https://test.example.com',
        callbackUrl: 'https://test.example.com/auth/callback',
        logoutUrl: 'https://test.example.com/logout'
      }
    },
    features: {
      analyticsEnabled: true,
      debugMode: true,
      emailEnabled: false,
      newUserRegistration: true
    }
  }))
}));

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SESSION_SECRET = 'test-session-secret-minimum-32-characters-long';
process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test-client-id';
process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test-user-pool-id';
process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'test-domain.auth.us-east-1.amazoncognito.com';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';

// Global fetch mock for external API calls
global.fetch = vi.fn();

console.log('🏗️  Global test infrastructure initialized');
