import { vi } from 'vitest';

// Mock AWS Cognito for infrastructure tests
vi.mock('../../../interfaces/api-gateway/src/auth/aws-cognito-handler', () => {
  const mockHandler = {
    handleCallback: vi.fn().mockImplementation(async (req: any, res: any) => {
      const { code } = req.body;
      
      // Handle missing code - should return 400
      if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }
      
      // Handle invalid code - should return 400, not 500
      if (code === 'invalid_code') {
        return res.status(400).json({ error: 'Invalid authorization code' });
      }
      
      if (code === 'test-code') {
        // Simulate successful authentication with redirect
        res.redirect('/dashboard');
        return;
      }
      
      // Any other invalid code should return 400
      res.status(400).json({ error: 'Invalid authorization code' });
    }),
    getCurrentUser: vi.fn().mockImplementation(async (req: any, res: any) => {
      res.status(401).json({ error: 'Not authenticated' });
    }),
    signOut: vi.fn().mockImplementation(async (req: any, res: any) => {
      res.json({ 
        message: 'Signed out successfully',
        cognitoLogoutUrl: 'https://cognito.logout.url'
      });
    }),
    getAuthUrl: vi.fn().mockReturnValue('https://cognito.auth.url'),
    getLogoutUrl: vi.fn().mockReturnValue('https://cognito.logout.url')
  };

  return {
    AwsCognitoHandler: vi.fn().mockImplementation(() => mockHandler),
    awsCognitoHandler: mockHandler
  };
});

// Mock SendGrid for testing
vi.mock('@sendgrid/mail', () => ({
  setApiKey: vi.fn(),
  send: vi.fn().mockResolvedValue([{ statusCode: 202 }])
}));

// Mock email functionality
vi.mock('../../../interfaces/api-gateway/src/email', () => ({
  sendContactEmail: vi.fn().mockResolvedValue(true)
}));

// Mock external HTTP calls
global.fetch = vi.fn();

// Set test environment variables
process.env.SENDGRID_API_KEY = 'test-key';
process.env.CONTACT_EMAIL = 'test@example.com';
process.env.FROM_EMAIL = 'noreply@test.com';
process.env.DATABASE_URL = 'postgresql://<username>:<password>@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-session-secret-32-characters-long!!';
process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test-pool-id';
process.env.BASE_URL = 'http://localhost:5001';
process.env.LOG_ENABLE_CONSOLE = 'false';
process.env.FEATURE_ANALYTICS_ENABLED = 'false';