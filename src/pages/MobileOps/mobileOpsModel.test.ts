import { describe, expect, it } from 'vitest';
import { getMobileWorkQueue, sortMobileAlerts } from './mobileOpsModel';

describe('mobile duty queue', () => {
  it('prioritizes critical alerts before recency', () => {
    const sorted = sortMobileAlerts([
      { id: 'warning', level: 'warning', createdAt: '2026-08-20T10:00:00Z' },
      { id: 'critical', level: 'critical', createdAt: '2026-08-20T09:00:00Z' },
    ] as never);
    expect(sorted[0].id).toBe('critical');
  });
  it('only keeps active work orders ordered by SLA', () => {
    const queue = getMobileWorkQueue([
      { id: 'later', status: 'pending', slaDueAt: '2026-08-20T12:00:00Z' },
      { id: 'done', status: 'closed', slaDueAt: '2026-08-20T09:00:00Z' },
      { id: 'first', status: 'processing', slaDueAt: '2026-08-20T10:00:00Z' },
    ] as never);
    expect(queue.map((item) => item.id)).toEqual(['first', 'later']);
  });
});
