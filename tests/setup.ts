import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';

// Setup MSW server
beforeAll(() => server.listen());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// Mock environment variables for tests
process.env.VITE_AWS_COGNITO_CLIENT_ID = 'test-client-id';
process.env.VITE_AWS_COGNITO_REGION = 'us-east-1';
process.env.VITE_AWS_COGNITO_USER_POOL_ID = 'test-pool-id';
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret';

// Use the actual database URL for tests in this environment
// Tests will use the same PostgreSQL instance as development
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for tests');
}