import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { workflowHandlers } from './handlers/workflows';
import { userHandlers } from './handlers/users';

export const server = setupServer(
  ...authHandlers,
  ...workflowHandlers,
  ...userHandlers
);