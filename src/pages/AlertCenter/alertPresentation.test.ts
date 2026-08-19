import { describe, expect, it } from 'vitest';
import { getAlertActionableIds } from './alertPresentation';

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
});
