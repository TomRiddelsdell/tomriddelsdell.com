import { vi } from 'vitest';

// Mock AWS Cognito for testing
vi.mock('../src/auth/simple-cognito', () => {
  return {
    SimpleCognitoHandler: vi.fn().mockImplementation(() => ({
      handleCallback: vi.fn().mockImplementation(async (code: string) => {
        if (code === 'test-code') {
          return {
            user: {
              id: 1,
              email: 'test@example.com',
              name: 'Test User',
              role: 'user'
            },
            redirectUrl: '/dashboard'
          };
        }
        throw new Error('Token exchange failed: {"error":"invalid_grant"}');
      }),
      getAuthUrl: vi.fn().mockReturnValue('https://cognito.auth.url'),
      getLogoutUrl: vi.fn().mockReturnValue('https://cognito.logout.url')
    }))
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