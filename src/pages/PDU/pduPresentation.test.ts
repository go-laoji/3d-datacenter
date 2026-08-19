import { describe, expect, it } from 'vitest';
import type { PDUDevice } from '@/services/idc/pdu';
import { predictOverloadHours, summarizePDUs } from './pduPresentation';

const device = (
  id: string,
  path: 'A' | 'B',
  currentLoad: number,
): PDUDevice => ({
  id,
  name: id,
  category: 'pdu',
  cabinetId: 'cab-1',
  startU: 1,
  endU: 2,
  uHeight: 2,
  assetCode: id,
  status: 'online',
  pduData: {
    powerPath: path,
    inputVoltage: 220,
    outputPorts: 4,
    maxLoad: 1000,
    currentLoad,
  },
  metric: {
    collectedAt: '2026-08-20T10:00:00Z',
    source: 'SNMP',
    quality: 'good',
  },
  outlets: [],
  loadTrend: [
    { time: '08:00', load: 600, comparison: 550 },
    { time: '09:00', load: 650, comparison: 570 },
    { time: '10:00', load: 700, comparison: 590 },
  ],
});

describe('PDU presentation', () => {
  it('summarizes A/B load and imbalance', () => {
    expect(
      summarizePDUs([device('a', 'A', 900), device('b', 'B', 500)]),
    ).toMatchObject({
      averageLoad: 70,
      highLoad: 1,
      imbalance: 40,
    });
  });

  it('predicts when the configured threshold will be reached', () => {
    expect(predictOverloadHours(device('a', 'A', 700))).toBe(2);
  });
});
