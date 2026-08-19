import { describe, expect, it } from 'vitest';
import type { CabinetEnvironmentView } from '@/services/idc/environment';
import { formatMetric, sortCabinetsByRisk } from './environmentPresentation';

const cabinet = (
  cabinetId: string,
  status: CabinetEnvironmentView['status'],
  maxTemperature: number | null,
): CabinetEnvironmentView => ({
  cabinetId,
  cabinetName: cabinetId,
  datacenterId: 'dc-001',
  datacenterName: '北京亦庄',
  avgTemperature: maxTemperature,
  maxTemperature,
  minTemperature: maxTemperature,
  avgHumidity: 45,
  status,
  quality: 'good',
  source: 'mock',
  collectedAt: '2026-08-20T02:00:00Z',
  sensorCount: 3,
});

describe('environment presentation', () => {
  it('keeps missing metrics distinct from zero', () => {
    expect(formatMetric(null, '℃')).toBe('—');
    expect(formatMetric(0, '℃')).toBe('0.0℃');
  });

  it('places unavailable and anomalous cabinets first', () => {
    const sorted = sortCabinetsByRisk([
      cabinet('normal', 'normal', 24),
      cabinet('critical', 'critical', 29),
      cabinet('missing', 'unavailable', null),
    ]);
    expect(sorted.map((item) => item.cabinetId)).toEqual([
      'missing',
      'critical',
      'normal',
    ]);
  });
});
