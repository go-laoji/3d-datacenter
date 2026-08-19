import { describe, expect, it } from 'vitest';
import type {
  NetworkTopologyEdge,
  NetworkTopologyNode,
} from '@/services/idc/dashboard';
import {
  aggregateByCabinet,
  filterTopology,
  findTopologyPath,
} from './topologyModel';

const nodes = [
  {
    id: 'a',
    label: 'Core',
    type: 'switch',
    status: 'online',
    cabinetId: 'cab-1',
    alertCount: 0,
    x: 0,
    y: 0,
  },
  {
    id: 'b',
    label: 'App',
    type: 'server',
    status: 'warning',
    cabinetId: 'cab-1',
    alertCount: 1,
    x: 0,
    y: 0,
  },
  {
    id: 'c',
    label: 'DB',
    type: 'server',
    status: 'online',
    cabinetId: 'cab-2',
    alertCount: 0,
    x: 0,
    y: 0,
  },
] as NetworkTopologyNode[];
const edges = [
  {
    id: 'ab',
    source: 'a',
    target: 'b',
    type: 'network',
    sourcePort: '1',
    targetPort: '1',
    speed: '1G',
    status: 'active',
    updatedAt: '',
  },
  {
    id: 'ac',
    source: 'a',
    target: 'c',
    type: 'network',
    sourcePort: '2',
    targetPort: '1',
    speed: '1G',
    status: 'active',
    updatedAt: '',
  },
] as NetworkTopologyEdge[];

describe('topology model', () => {
  it('keeps an abnormal node and its immediate context', () =>
    expect(
      filterTopology(nodes, edges, { onlyAbnormal: true })
        .nodes.map((node) => node.id)
        .sort(),
    ).toEqual(['a', 'b']));
  it('aggregates devices and cross-cabinet links', () =>
    expect(aggregateByCabinet(nodes, edges)).toMatchObject({
      nodes: [{ id: 'cabinet:cab-1' }, { id: 'cabinet:cab-2' }],
      edges: [{ source: 'cabinet:cab-1', target: 'cabinet:cab-2' }],
    }));
  it('finds the shortest path between endpoints', () =>
    expect(findTopologyPath(edges, 'b', 'c')).toEqual(['b', 'a', 'c']));
});
