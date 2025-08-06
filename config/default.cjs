/**
 * Default Configuration
 * 
 * Base configuration values that can be overridden by environment-specific configurations.
 * All values use environment variables with sensible defaults.
 */

module.exports = {
  // Environment settings
  environment: process.env.NODE_ENV || 'development',

  // AWS Configuration (simple structure matching schema)
  aws: {
    region: process.env.AWS_REGION || 'eu-west-2',
    lambdaFunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME || '',
    accountId: process.env.AWS_ACCOUNT_ID || '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  },

  // Neptune Configuration (simple structure matching schema)
  neptune: {
    endpoint: process.env.NEPTUNE_ENDPOINT || ''
  },

  // Domain Configuration (simple structure matching schema)
  domain: {
    name: process.env.DOMAIN_NAME || 'tomriddelsdell.com'
  },

  // System Configuration (simple structure matching schema)
  system: {
    user: process.env.SYSTEM_USER || 'unknown'
  },

  // Integration Configuration (matching schema)
  integration: {
    github: {
      token: process.env.GITHUB_TOKEN || '',
      owner: process.env.GITHUB_OWNER || 'TomRiddelsdell',
      repo: process.env.GITHUB_REPO || 'tomriddelsdell.com',
      deployment: {
        awsAccountId: process.env.AWS_ACCOUNT_ID || '',
        stagingCertArn: process.env.STAGING_CERTIFICATE_ARN || '',
        productionCertArn: process.env.PRODUCTION_CERTIFICATE_ARN || '',
        cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || ''
      }
    },
    mcp: {
      awsEndpoint: process.env.AWS_MCP_ENDPOINT || 'http://aws-mcp:8001',
      neptuneEndpoint: process.env.NEPTUNE_MCP_ENDPOINT || 'http://neptune-mcp:8002',
      neonEndpoint: process.env.MCP_NEON_ENDPOINT || 'http://neon-mcp:https://mcp.neon.tech/mcp'
    }
  },

  // Cognito Configuration (matching schema)
  cognito: {
    clientId: process.env.VITE_AWS_COGNITO_CLIENT_ID || 'REQUIRED',
    clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET || '',
    userPoolId: process.env.VITE_AWS_COGNITO_USER_POOL_ID || 'REQUIRED',
    region: process.env.VITE_AWS_COGNITO_REGION || 'REQUIRED',
    hostedUIDomain: process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN || 'REQUIRED',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'REQUIRED',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'REQUIRED'
  },

  // Database Configuration (matching schema)
  database: {
    url: process.env.DATABASE_URL || 'REQUIRED',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '1', 10), // Development default: 1
      max: parseInt(process.env.DB_POOL_MAX || '5', 10), // Development default: 5
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10), // Development default: 10 seconds
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10)
    },
    ssl: {
      enabled: process.env.DB_SSL_ENABLED === 'true',
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    }
  },

  // Email Configuration (matching schema)
  email: {
    provider: process.env.EMAIL_PROVIDER || 'none',
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || '',
      fromName: process.env.SENDGRID_FROM_NAME || ''
    }
  },

  // Services Configuration (matching schema)
  services: {
    apiGateway: {
      port: parseInt(process.env.API_GATEWAY_PORT || '5000', 10),
      host: process.env.API_GATEWAY_HOST || '0.0.0.0',
      timeout: parseInt(process.env.API_GATEWAY_TIMEOUT || '30000', 10)
    },
    external: {
      baseUrl: process.env.BASE_URL || 'http://localhost:5000', // Documented default for development
      callbackUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/auth/callback`,
      logoutUrl: process.env.BASE_URL || 'http://localhost:5000'
    }
  },

  // Security Configuration (matching schema)
  security: {
    cors: {
      allowedOrigins: process.env.CORS_ALLOWED_ORIGINS 
        ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
      allowedMethods: process.env.CORS_ALLOWED_METHODS 
        ? process.env.CORS_ALLOWED_METHODS.split(',').map(method => method.trim())
        : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: process.env.CORS_ALLOWED_HEADERS
        ? process.env.CORS_ALLOWED_HEADERS.split(',').map(header => header.trim())
        : ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
      allowCredentials: process.env.CORS_ALLOW_CREDENTIALS !== 'false'
    },
    session: {
      secret: process.env.SESSION_SECRET || 'REQUIRED',
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800000', 10), // 7 days
      secure: process.env.SESSION_SECURE === 'true' || process.env.NODE_ENV === 'production',
      httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
      sameSite: process.env.SESSION_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'lax')
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // Default: 1 minute for development
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // Default: 1000 for development
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
      skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true'
    },
    csp: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://replit.com'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'"],
        'font-src': ["'self'"],
        'object-src': ["'none'"],
        'media-src': ["'self'"],
        'frame-src': ["'none'"]
      }
    }
  },

  // Feature Flags Configuration (matching schema)
  features: {
    emailEnabled: process.env.FEATURE_EMAIL_ENABLED === 'true', // Development default: false
    analyticsEnabled: process.env.FEATURE_ANALYTICS_ENABLED !== 'false', // Default: true
    debugMode: process.env.DEBUG_MODE === 'true', // Development default: true, production: false  
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true', // Default: false
    newUserRegistration: process.env.FEATURE_NEW_USER_REGISTRATION !== 'false' // Default: true
  },

  // Logging Configuration (matching schema)
  logging: {
    level: process.env.LOG_LEVEL || 'debug', // Development default: debug, production: info
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false', // Default: true
    enableFile: process.env.LOG_ENABLE_FILE === 'true', // Development default: false, production: true
    enableDatabase: process.env.LOG_ENABLE_DATABASE === 'true', // Development default: false, production: true
    format: process.env.LOG_FORMAT || 'simple', // Development default: simple, production: json
    maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10mb', // Development default: 10mb, production: 50mb
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '3', 10) // Development default: 3, production: 10
  }
};
