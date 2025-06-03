import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

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
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';