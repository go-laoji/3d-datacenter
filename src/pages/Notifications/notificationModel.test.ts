import { describe, expect, it } from 'vitest';
import { validateEscalationSteps } from './notificationModel';

describe('notification escalation model', () => {
  it('requires an immediate first step', () => {
    expect(
      validateEscalationSteps([
        { id: '1', delayMinutes: 5, target: '值班员', channelIds: ['c1'] },
      ]),
    ).toBe('第一个步骤必须立即通知');
  });
  it('accepts a complete escalation chain', () => {
    expect(
      validateEscalationSteps([
        { id: '1', delayMinutes: 0, target: '主值', channelIds: ['c1'] },
        { id: '2', delayMinutes: 10, target: '备值', channelIds: ['c1', 'c2'] },
      ]),
    ).toBeUndefined();
  });
});
