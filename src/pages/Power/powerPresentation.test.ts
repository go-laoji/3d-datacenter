import { describe, expect, it } from 'vitest';
import type { PowerLink, PowerNode } from '@/services/idc/power';
import {
  getDownstreamDeviceIds,
  traceUpstreamPaths,
} from './powerPresentation';

const node = (id: string, type: PowerNode['type']): PowerNode => ({
  id,
  type,
  name: id,
  status: 'online',
  source: 'mock',
  collectedAt: '2026-08-20T02:00:00Z',
  quality: 'good',
});
const link = (
  id: string,
  source: string,
  target: string,
  powerPath: 'A' | 'B',
): PowerLink => ({
  id,
  source,
  target,
  powerPath,
  status: 'active',
  sourcePort: 'out',
  targetPort: 'in',
  ratedCurrent: 16,
  collectedAt: '2026-08-20T02:00:00Z',
});

const nodes = [
  node('utility-a', 'utility'),
  node('pdu-a', 'pdu'),
  node('utility-b', 'utility'),
  node('pdu-b', 'pdu'),
  node('server', 'device'),
];
const links = [
  link('a1', 'utility-a', 'pdu-a', 'A'),
  link('a2', 'pdu-a', 'server', 'A'),
  link('b1', 'utility-b', 'pdu-b', 'B'),
  link('b2', 'pdu-b', 'server', 'B'),
];

describe('power path presentation', () => {
  it('traces both upstream power paths in source-to-device order', () => {
    const traces = traceUpstreamPaths('server', nodes, links);
    expect(traces.map((trace) => trace.path)).toEqual(['A', 'B']);
    expect(traces[0].nodes.map((item) => item.id)).toEqual([
      'utility-a',
      'pdu-a',
      'server',
    ]);
  });

  it('finds devices affected downstream of a PDU', () => {
    expect(getDownstreamDeviceIds('pdu-a', nodes, links)).toEqual(['server']);
  });
});
