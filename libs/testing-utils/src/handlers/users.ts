import { http, HttpResponse } from 'msw';

export const userHandlers = [
  http.get('/api/dashboard/stats', () => {
    return HttpResponse.json({
      activeWorkflows: 5,
      tasksAutomated: 42,
      connectedApps: 8,
      timeSaved: '2.5 hours'
    });
  })
];