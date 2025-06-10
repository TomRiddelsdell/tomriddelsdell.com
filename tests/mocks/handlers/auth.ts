import { http, HttpResponse } from 'msw';

let currentUser: any = null;

export const authHandlers = [
  // Current user endpoint
  http.get('/api/auth/me', () => {
    if (currentUser) {
      return HttpResponse.json(currentUser);
    }
    return HttpResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }),

  // Auth callback endpoint (simulates Cognito callback)
  http.post('/api/auth/callback', async ({ request }) => {
    const { code } = await request.json() as any;
    
    if (code === 'valid_test_code') {
      currentUser = {
        id: 1,
        email: 'test@example.com',
        displayName: 'Test User',
        cognitoId: 'test-cognito-id-123'
      };
      
      return HttpResponse.json(currentUser);
    }
    
    return HttpResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }),

  // Sign out endpoint
  http.post('/api/auth/signout', () => {
    currentUser = null;
    return HttpResponse.json({ 
      message: 'Signed out successfully',
      cognitoLogoutUrl: 'https://test-cognito.auth.us-east-1.amazoncognito.com/logout?client_id=test&logout_uri=http://localhost:5173'
    });
  }),

  // Legacy auth endpoints for backward compatibility tests
  http.post('/api/auth/signin', async ({ request }) => {
    const { email, password } = await request.json() as any;
    
    if (email === 'test@example.com' && password === 'password123') {
      currentUser = {
        id: 1,
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'cognito'
      };
      return HttpResponse.json({ user: currentUser });
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Contact form endpoint
  http.post('/api/contact', async ({ request }) => {
    const { name, email, message } = await request.json() as any;
    
    if (!name || !email || !message) {
      return HttpResponse.json(
        { message: 'Name, email and message are required' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({ 
      message: 'Message sent successfully' 
    });
  }),
];