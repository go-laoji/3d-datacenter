import { describe, expect, it } from 'vitest';
import {
  buildEntityRoute,
  formatMetricValue,
  getStatusDefinition,
  summarizeBatchResults,
} from './operationsModel';

describe('operations presentation model', () => {
  it('builds entity routes while preserving scene context', () => {
    expect(
      buildEntityRoute('device', 'dev 01', {
        datacenterId: 'dc-001',
        cabinetId: 'cab-01',
      }),
    ).toBe('/idc/device?deviceId=dev+01&datacenterId=dc-001&cabinetId=cab-01');
    expect(buildEntityRoute('workOrder', 'wo-01')).toBe(
      '/operations/work-orders?workOrderId=wo-01',
    );
  });

  it('preserves zero and only substitutes unavailable metrics', () => {
    expect(formatMetricValue(0, '%')).toBe('0%');
    expect(formatMetricValue(null, 'kW')).toBe('--');
    expect(formatMetricValue('', '℃')).toBe('--');
  });

  it('normalizes known and unknown statuses', () => {
    expect(getStatusDefinition('running')).toEqual({
      label: '运行中',
      tone: 'processing',
    });
    expect(getStatusDefinition('custom')).toEqual({
      label: 'custom',
      tone: 'default',
    });
  });

  it('summarizes partial batch failures', () => {
    expect(
      summarizeBatchResults([
        { id: '1', name: 'A', success: true },
        { id: '2', name: 'B', success: false, reason: 'busy' },
      ]),
    ).toEqual({ total: 2, succeeded: 1, failed: 1 });
  });
});
