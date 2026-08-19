import { describe, expect, it } from 'vitest';
import { normalizeReportSection, serializeReportSection } from './reportModel';

describe('report model', () => {
  it('normalizes deep-linked report sections', () => {
    expect(normalizeReportSection('sla')).toBe('sla');
    expect(normalizeReportSection('unknown')).toBe('assets');
  });
  it('serializes a report section', () => {
    const csv = serializeReportSection(
      {
        assets: [
          {
            datacenterName: '北京',
            devices: 2,
            onlineRate: 100,
            expiringWarranty: 0,
            unknownOwner: 0,
          },
        ],
      } as never,
      'assets',
    );
    expect(csv).toContain('北京,2,100,0,0');
  });
});
