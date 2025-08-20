import { vi } from 'vitest';

// Mock AWS Cognito for testing
vi.mock('../src/auth/aws-cognito-handler', () => {
  const mockHandler = {
    handleCallback: vi.fn().mockImplementation(async (req: any, res: any) => {
      const { code } = req.body;
      if (code === 'test-code') {
        // Simulate successful authentication with redirect
        res.redirect('/dashboard');
        return;
      }
      
      if (code === 'invalid_code') {
        // Simulate invalid code error
        res.status(400).json({ error: 'Invalid authorization code' });
        return;
      }
      
      // Simulate missing code
      if (!code) {
        res.status(400).json({ error: 'Authorization code required' });
        return;
      }
      
      // Default case - simulate server error
      res.status(500).json({ error: 'Authentication failed' });
    }),
    getCurrentUser: vi.fn().mockImplementation((req: any, res: any) => {
      if (req.session?.user) {
        res.json(req.session.user);
      } else {
        res.status(401).json({ error: 'Not authenticated' });
      }
    }),
    signOut: vi.fn().mockImplementation((req: any, res: any) => {
      req.session.destroy(() => {
        res.json({ 
          message: 'Signed out successfully',
          cognitoLogoutUrl: 'https://cognito.logout.url'
        });
      });
    })
  };
  
  return {
    awsCognitoHandler: mockHandler
  };
});

// Mock SendGrid for testing
vi.mock('@sendgrid/mail', () => ({
  setApiKey: vi.fn(),
  send: vi.fn().mockResolvedValue([{ statusCode: 202 }])
}));

// Mock email functionality
vi.mock('../src/email', () => ({
  sendContactEmail: vi.fn().mockResolvedValue(true)
}));

// Mock external HTTP calls
global.fetch = vi.fn();

// Set test environment variables
process.env.SENDGRID_API_KEY = 'test-key';
process.env.CONTACT_EMAIL = 'test@example.com';
process.env.FROM_EMAIL = 'noreply@test.com';