import { vi } from 'vitest';

// Mock AWS Cognito for infrastructure tests
vi.mock('../../../interfaces/api-gateway/src/auth/simple-cognito', () => {
  const mockHandler = {
    handleCallback: vi.fn().mockImplementation(async (req: any, res: any) => {
      const { code } = req.body;
      if (code === 'test-code') {
        // Simulate successful authentication with redirect
        res.redirect('/dashboard');
        return;
      }
      // Simulate auth failure
      res.status(500).json({ error: 'Authentication failed' });
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
    SimpleCognitoHandler: vi.fn().mockImplementation(() => mockHandler),
    simpleCognitoHandler: mockHandler
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
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SESSION_SECRET = 'test-secret';
process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test-pool-id';