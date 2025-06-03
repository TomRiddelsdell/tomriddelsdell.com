import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.get('/api/auth/status', () => {
    return HttpResponse.json({ user: null });
  }),

  http.post('/api/auth/signin', async ({ request }) => {
    const { email, password } = await request.json() as any;
    
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        user: {
          id: 1,
          email: 'test@example.com',
          displayName: 'Test User',
          provider: 'cognito'
        }
      });
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    const { email, password } = await request.json() as any;
    
    return HttpResponse.json({
      user: {
        id: 2,
        email,
        displayName: email.split('@')[0],
        provider: 'cognito'
      }
    }, { status: 201 });
  }),

  http.post('/api/auth/signout', () => {
    return HttpResponse.json({ message: 'Signed out successfully' });
  })
];