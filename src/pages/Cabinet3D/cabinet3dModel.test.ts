import { describe, expect, it } from 'vitest';
import {
  filterCabinetDevices,
  findEmptyUSlots,
  getCabinet3DStats,
} from './cabinet3dModel';

const cabinet = {
  uHeight: 10,
  usedU: 4,
  currentPower: 700,
  maxPower: 1000,
} as IDC.Cabinet;
const devices = [
  { id: 'one', startU: 2, endU: 3, status: 'online' },
  { id: 'two', startU: 7, endU: 8, status: 'warning' },
] as IDC.Device[];

describe('cabinet 3D model', () => {
  it('calculates capacity and status summaries', () => {
    expect(getCabinet3DStats(cabinet, devices)).toMatchObject({
      usage: 40,
      powerUsage: 70,
      online: 1,
      abnormal: 1,
    });
  });

  it('filters abnormal equipment', () => {
    expect(filterCabinetDevices(devices, 'abnormal')[0].id).toBe('two');
  });

  it('groups consecutive empty U slots', () => {
    expect(findEmptyUSlots(10, devices)).toEqual([
      { startU: 1, endU: 1 },
      { startU: 4, endU: 6 },
      { startU: 9, endU: 10 },
    ]);
  });
});
