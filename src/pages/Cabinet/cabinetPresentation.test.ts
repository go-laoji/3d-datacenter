import { getCabinetHealth } from './cabinetPresentation';

const cabinet = (overrides: Partial<IDC.Cabinet> = {}): IDC.Cabinet => ({
  id: 'cab-1',
  datacenterId: 'dc-1',
  name: 'A01',
  code: 'A01',
  row: 1,
  column: 1,
  uHeight: 42,
  usedU: 20,
  maxPower: 10000,
  currentPower: 5000,
  status: 'normal',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('cabinet presentation', () => {
  it('keeps a healthy cabinet at full score', () => {
    expect(getCabinetHealth(cabinet())).toMatchObject({
      score: 100,
      risks: [],
    });
  });

  it('explains simultaneous space and power risks', () => {
    const result = getCabinetHealth(cabinet({ usedU: 39, currentPower: 9000 }));
    expect(result.score).toBe(60);
    expect(result.risks.map((risk) => risk.label)).toEqual([
      '空间紧张',
      '功率高',
    ]);
  });

  it('penalizes offline collection state', () => {
    const result = getCabinetHealth(cabinet({ status: 'offline' }));
    expect(result.score).toBe(70);
    expect(result.risks[0].label).toBe('采集离线');
  });
});
