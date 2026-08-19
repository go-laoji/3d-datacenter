import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { getSlaState, getWorkOrderNextAction } from './workOrderModel';

describe('work order model', () => {
  it('defines the legal next action', () => {
    expect(getWorkOrderNextAction('pending')).toEqual({
      action: 'start',
      label: '开始处理',
    });
    expect(getWorkOrderNextAction('closed')).toBeUndefined();
  });
  it('detects breached SLA', () => {
    expect(
      getSlaState(
        { status: 'processing', slaDueAt: '2026-08-20T09:00:00Z' } as never,
        dayjs('2026-08-20T10:00:00Z'),
      ),
    ).toBe('breached');
  });
});
