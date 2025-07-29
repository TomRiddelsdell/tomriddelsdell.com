import { vi } from 'vitest';
import { Express } from 'express';

/**
 * Authentication test utilities following DDD Interface Layer principles
 * These utilities handle cross-cutting concerns for authentication testing
 */

export interface AuthTestUser {
  id: string;
  email: string;
  displayName: string;
  cognitoId: string;
  role?: string;
}

export interface AuthTestSession {
  userId: string;
  user: AuthTestUser;
}

/**
 * Create a mock authenticated session for testing
 */
export function createMockAuthSession(user: Partial<AuthTestUser> = {}): AuthTestSession {
  const defaultUser: AuthTestUser = {
    id: 'test-user-id-123',
    email: 'test@example.com',
    displayName: 'Test User',
    cognitoId: 'test-cognito-id-456',
    role: 'user',
    ...user
  };

  return {
    userId: defaultUser.id,
    user: defaultUser
  };
}

/**
 * Mock authentication middleware for testing
 */
export function createMockAuthMiddleware(authenticated: boolean = true) {
  return vi.fn((req: any, res: any, next: any) => {
    if (authenticated) {
      const session = createMockAuthSession();
      req.session = {
        userId: session.userId,
        user: session.user
      };
    }
    next();
  });
}

/**
 * Create a mock express app with authentication setup for testing
 */
export function createTestAppWithAuth(authenticated: boolean = false): Express {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // Mock session middleware
  app.use((req: any, res: any, next: any) => {
    req.session = authenticated ? createMockAuthSession() : {};
    next();
  });
  
  return app;
}

/**
 * Mock Cognito authentication response handlers
 */
export const mockCognitoHandlers = {
  validCallback: vi.fn().mockImplementation(async (req: any, res: any) => {
    const { code } = req.body;
    if (code === 'valid_test_code') {
      const session = createMockAuthSession();
      req.session = {
        userId: session.userId,
        user: session.user
      };
      return res.json(session.user);
    }
    return res.status(400).json({ error: 'Invalid authorization code' });
  }),

  invalidCallback: vi.fn().mockImplementation(async (req: any, res: any) => {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }
    return res.status(400).json({ error: 'Invalid authorization code' });
  }),

  getCurrentUser: vi.fn().mockImplementation(async (req: any, res: any) => {
    if (req.session?.user) {
      return res.json(req.session.user);
    }
    return res.status(401).json({ error: 'Not authenticated' });
  }),

  signOut: vi.fn().mockImplementation(async (req: any, res: any) => {
    req.session = {};
    return res.json({ 
      message: 'Signed out successfully',
      cognitoLogoutUrl: 'https://test-cognito.auth.us-east-1.amazoncognito.com/logout'
    });
  })
};

/**
 * Reset all authentication test mocks
 */
export function resetAuthMocks() {
  Object.values(mockCognitoHandlers).forEach(mock => {
    if (vi.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
}
