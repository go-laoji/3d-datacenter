import { describe, expect, it } from 'vitest';
import {
  getAlertActionableIds,
  getAlertStatus,
  getSlaPresentation,
} from './alertPresentation';

const createAlert = (
  id: string,
  state: Pick<IDC.AlertDetail, 'acknowledged' | 'resolvedAt'>,
): IDC.AlertDetail => ({
  id,
  level: 'warning',
  type: 'power',
  source: 'system',
  message: id,
  createdAt: '2026-08-20T00:00:00.000Z',
  acknowledged: state.acknowledged,
  resolvedAt: state.resolvedAt,
});

describe('getAlertActionableIds', () => {
  const alerts = [
    createAlert('new', { acknowledged: false }),
    createAlert('acknowledged', { acknowledged: true }),
    createAlert('resolved', {
      acknowledged: true,
      resolvedAt: '2026-08-20T01:00:00.000Z',
    }),
  ];

  it('keeps unacknowledged alerts in the acknowledge action only', () => {
    expect(getAlertActionableIds(alerts, ['new'])).toEqual({
      acknowledgeableIds: ['new'],
      resolvableIds: [],
    });
  });

  it('keeps acknowledged active alerts in the resolve action only', () => {
    expect(getAlertActionableIds(alerts, ['acknowledged'])).toEqual({
      acknowledgeableIds: [],
      resolvableIds: ['acknowledged'],
    });
  });

  it('excludes resolved and unselected alerts from both actions', () => {
    expect(getAlertActionableIds(alerts, ['resolved', 'missing'])).toEqual({
      acknowledgeableIds: [],
      resolvableIds: [],
    });
  });

  it('presents breached and approaching SLA deadlines', () => {
    const now = Date.parse('2026-08-20T02:00:00Z');
    expect(getSlaPresentation('2026-08-20T01:50:00Z', now)).toEqual({
      label: '已超时 10 分钟',
      tone: 'error',
    });
    expect(getSlaPresentation('2026-08-20T02:25:00Z', now).tone).toBe(
      'warning',
    );
  });

  it('uses the explicit workflow status before legacy flags', () => {
    const alert = createAlert('processing', { acknowledged: true });
    alert.workflowStatus = 'processing';
    expect(getAlertStatus(alert)).toBe('processing');
  });
});
