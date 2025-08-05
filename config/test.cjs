/**
 * Test Environment Configuration
 * 
 * Isolated test environment settings that provide predictable,
 * fast configuration for automated testing.
 */

module.exports = {
  // Test-specific core settings
  environment: 'test',

  // Test AWS Configuration (mock values)
  aws: {
    region: 'us-east-1', // Test region
    lambdaFunctionName: 'test-lambda-function',
    accountId: '123456789012', // Test account ID
    accessKeyId: 'AKIATEST123',
    secretAccessKey: 'test-secret-key'
  },

  // Test Neptune Configuration (mock values)
  neptune: {
    endpoint: 'neptune-test.cluster-xyz.us-east-1.neptune.amazonaws.com'
  },

  // Test Domain Configuration
  domain: {
    name: 'test.example.com'
  },

  // Test System Configuration
  system: {
    user: 'test-user'
  },

  // Test security settings (minimal but functional)
  security: {
    session: {
      secret: 'test-session-secret-32-characters-long!!',
      maxAge: 3600000, // 1 hour for tests
      secure: false,
      httpOnly: true,
      sameSite: 'lax'
    },
    cors: {
      allowedOrigins: ['http://localhost:3000', 'http://localhost:5000'],
      allowCredentials: true
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 10000 // Very high limit for tests
    }
  },

  // Test database (isolated from development)
  database: {
    url: 'postgresql://test:test@localhost:5432/test_db',
    pool: {
      min: 1,
      max: 3, // Small pool for tests
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 1000
    },
    ssl: {
      enabled: false,
      rejectUnauthorized: false
    }
  },

  // Test AWS Cognito (mock values)
  cognito: {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    userPoolId: 'eu-west-2_test123',
    region: 'us-east-1', // Match aws.region for consistency
    hostedUIDomain: 'test-auth.auth.us-east-1.amazoncognito.com',
    accessKeyId: 'AKIATEST123',
    secretAccessKey: 'test-secret-key'
  },

  // Test email (disabled)
  email: {
    provider: 'none'
  },

  // Test service endpoints
  services: {
    apiGateway: {
      port: 5001, // Different port to avoid conflicts
      host: '127.0.0.1',
      timeout: 5000
    },
    external: {
      baseUrl: 'http://localhost:5001',
      callbackUrl: 'http://localhost:5001/auth/callback',
      logoutUrl: 'http://localhost:5001'
    }
  },

  // Test integrations (mock values)
  integration: {
    github: {
      token: 'test-github-token',
      owner: 'TestOwner',
      repo: 'test-repo'
    },
    mcp: {
      awsEndpoint: 'http://test-aws-mcp:8001',
      neptuneEndpoint: 'http://test-neptune-mcp:8002',
      neonEndpoint: 'http://neon-mcp:https://mcp.neon.tech/mcp'
    }
  },

  // Test feature flags (predictable state)
  features: {
    emailEnabled: false,
    analyticsEnabled: false, // Disable analytics in tests
    debugMode: false,
    maintenanceMode: false,
    newUserRegistration: true
  },

  // Test logging (minimal)
  logging: {
    level: 'error', // Minimal logging in tests
    enableConsole: false, // Quiet tests
    enableFile: false,
    enableDatabase: false,
    format: 'simple'
  }
};
