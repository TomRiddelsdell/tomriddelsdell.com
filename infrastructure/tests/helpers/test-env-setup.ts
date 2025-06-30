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
}

export function setupProductionTestEnvironment() {
  setupValidTestEnvironment();
  
  // Production-specific variables
  process.env.NODE_ENV = 'production';
  process.env.CORS_ALLOWED_ORIGINS = 'https://my-app.replit.app';
  process.env.SESSION_SECURE = 'true';
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
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
    'REPLIT_DOMAINS'
  ];
  
  envVarsToRemove.forEach(varName => {
    delete process.env[varName];
  });
}