/**
 * Test Environment Setup Helper
 * Provides consistent environment variable setup for tests
 */

export function setupValidTestEnvironment() {
  // Core required variables
  process.env.DATABASE_URL = 'postgresql://localhost/test';
  process.env.SESSION_SECRET = 'secure_session_secret_32_characters_long';
  
  // AWS Cognito required variables
  process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test_client_id';
  process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test_pool_id';
  process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
  process.env.VITE_AWS_COGNITO_HOSTED_UI_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
  process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
  
  // Email provider configuration
  process.env.EMAIL_PROVIDER = 'none';
  
  // Database pool configuration
  process.env.DB_POOL_MIN = '2';
  process.env.DB_POOL_MAX = '10';
  process.env.DB_SSL_ENABLED = 'false';
  
  // Services configuration
  process.env.VITE_BASE_URL = 'http://localhost:5000';
  process.env.VITE_API_BASE_URL = 'http://localhost:5000';
  process.env.VITE_WS_URL = 'ws://localhost:5000';
  process.env.API_GATEWAY_PORT = '5000';
  process.env.API_GATEWAY_HOST = '0.0.0.0';
  
  // Security configuration 
  process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:5000';
  process.env.RATE_LIMIT_WINDOW_MS = '900000';
  process.env.RATE_LIMIT_MAX_REQUESTS = '100';
  process.env.CSP_DIRECTIVES = "default-src 'self'";
  
  // Logging configuration
  process.env.LOG_LEVEL = 'info';
  process.env.LOG_ENABLE_CONSOLE = 'true';
  process.env.LOG_ENABLE_FILE = 'false';
  process.env.LOG_ENABLE_DATABASE = 'true';
}

export function setupProductionTestEnvironment() {
  setupValidTestEnvironment();
  
  // Production-specific variables
  process.env.NODE_ENV = 'production';
  process.env.CORS_ALLOWED_ORIGINS = 'https://my-app.replit.app';
  process.env.SESSION_SECURE = 'true';
  
  // Production database settings
  process.env.DB_SSL_ENABLED = 'true';
  process.env.DB_SSL_REJECT_UNAUTHORIZED = 'true';
  process.env.DB_POOL_MIN = '5';
  process.env.DB_POOL_MAX = '20';
}

export function setupDevelopmentTestEnvironment() {
  setupValidTestEnvironment();
  
  // Development-specific variables
  process.env.NODE_ENV = 'development';
}

export function setupWithSendGrid() {
  setupValidTestEnvironment();
  
  // SendGrid configuration
  process.env.SENDGRID_API_KEY = 'SG.test-sendgrid-api-key';
  process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';
  process.env.SENDGRID_FROM_NAME = 'Test App';
}

export function removeAllTestEnvironmentVars() {
  const envVarsToRemove = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'VITE_AWS_COGNITO_CLIENT_ID',
    'VITE_AWS_COGNITO_USER_POOL_ID',
    'VITE_AWS_COGNITO_REGION',
    'VITE_AWS_COGNITO_HOSTED_UI_DOMAIN',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'CORS_ALLOWED_ORIGINS',
    'SESSION_SECURE',
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
    'SENDGRID_FROM_NAME',
    'EMAIL_PROVIDER',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
    'REPLIT_DOMAINS'
  ];
  
  envVarsToRemove.forEach(varName => {
    delete process.env[varName];
  });
}

export function cleanSlate() {
  removeAllTestEnvironmentVars();
  // Reset configuration singleton
  const configModule = '../../configuration/config-loader';
  delete require.cache[require.resolve(configModule)];
}