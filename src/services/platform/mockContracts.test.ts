import accessRoutes from '../../../mock/access';
import auditRoutes from '../../../mock/audit';
import dataHealthRoutes from '../../../mock/dataHealth';
import notificationRoutes from '../../../mock/notification';
import reportRoutes from '../../../mock/report';
import taskRoutes from '../../../mock/task';
import workOrderRoutes from '../../../mock/workOrder';

type MockHandler = (
  request: { query: Record<string, unknown> },
  response: { json: (body: unknown) => void },
) => Promise<void>;

async function requestMock(
  routes: Record<string, unknown>,
  route: string,
) {
  let responseBody: unknown;
  const handler = routes[route] as MockHandler;
  await handler(
    { query: {} },
    {
      json: (body) => {
        responseBody = body;
      },
    },
  );
  return responseBody as { success: boolean; data: unknown };
}

const routeContracts = [
  {
    name: 'access',
    routes: accessRoutes,
    getRoute: 'GET /api/platform/access',
    mutations: [
      'POST /api/platform/users',
      'PUT /api/platform/users',
      'PUT /api/platform/users/:id/status',
      'PUT /api/platform/roles',
    ],
  },
  {
    name: 'audit',
    routes: auditRoutes,
    getRoute: 'GET /api/platform/audits',
    mutations: [],
  },
  {
    name: 'notifications',
    routes: notificationRoutes,
    getRoute: 'GET /api/platform/notifications',
    mutations: [
      'PUT /api/platform/notification-channels/:id',
      'POST /api/platform/notification-channels/:id/test',
      'POST /api/platform/on-call/:id/handoff',
      'PUT /api/platform/escalation-policy',
    ],
  },
  {
    name: 'work orders',
    routes: workOrderRoutes,
    getRoute: 'GET /api/platform/work-orders',
    mutations: [
      'POST /api/platform/work-orders',
      'POST /api/platform/work-orders/:id/transition',
      'POST /api/platform/changes/:id/transition',
    ],
  },
  {
    name: 'tasks',
    routes: taskRoutes,
    getRoute: 'GET /api/platform/tasks',
    mutations: [
      'POST /api/platform/imports/preview',
      'POST /api/platform/imports/apply',
      'POST /api/platform/tasks/:id/retry',
      'POST /api/platform/tasks/:id/cancel',
    ],
  },
  {
    name: 'reports',
    routes: reportRoutes,
    getRoute: 'GET /api/platform/reports',
    mutations: [],
  },
  {
    name: 'data health',
    routes: dataHealthRoutes,
    getRoute: 'GET /api/platform/data-health',
    mutations: [
      'POST /api/platform/data-sources/:id/retry',
      'POST /api/platform/data-quality/:id/acknowledge',
    ],
  },
] as const;

describe('platform mock contracts', () => {
  it.each(routeContracts)(
    'exposes the complete $name route contract',
    ({ routes, getRoute, mutations }) => {
      const routeMap = routes as Record<string, unknown>;
      expect(typeof routeMap[getRoute]).toBe('function');
      for (const route of mutations) {
        expect(typeof routeMap[route]).toBe('function');
      }
    },
  );

  it('returns successful data envelopes from all workspace queries', async () => {
    const responses = await Promise.all(
      routeContracts.map(({ routes, getRoute }) =>
        requestMock(routes, getRoute),
      ),
    );

    for (const response of responses) {
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    }
  });
});
