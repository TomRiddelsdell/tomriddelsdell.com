import { http, HttpResponse } from 'msw';

const mockWorkflows = [
  {
    id: 1,
    userId: 1,
    name: 'Test Workflow',
    description: 'A test workflow',
    status: 'active',
    icon: 'play',
    iconColor: 'green',
    config: { steps: [] },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const workflowHandlers = [
  http.get('/api/workflows', () => {
    return HttpResponse.json(mockWorkflows);
  }),

  http.get('/api/workflows/recent', () => {
    return HttpResponse.json(mockWorkflows.slice(0, 3));
  }),

  http.post('/api/workflows', async ({ request }) => {
    const workflow = await request.json() as any;
    const newWorkflow = {
      id: Date.now(),
      userId: 1,
      ...workflow,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return HttpResponse.json(newWorkflow, { status: 201 });
  })
];