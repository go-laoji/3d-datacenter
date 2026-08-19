import { describe, expect, it } from 'vitest';
import type { ResourceTreeItem } from '@/services/idc/resourceTree';
import {
  buildResourceTree,
  filterResourceIndex,
  getAncestorIds,
} from './resourceTreeModel';

const item = (
  id: string,
  type: ResourceTreeItem['type'],
  parentId?: string,
  alertCount = 0,
): ResourceTreeItem => ({
  id,
  type,
  parentId,
  name: id,
  code: id,
  status: alertCount ? 'warning' : 'normal',
  alertCount,
  route: '/',
  source: 'mock',
  collectedAt: '2026-08-20T00:00:00Z',
  keywords: [],
});

const items = [
  item('dc', 'datacenter'),
  item('cabinet', 'cabinet', 'dc', 1),
  item('device', 'device', 'cabinet'),
];

describe('resource tree model', () => {
  it('builds hierarchy and keeps anomalies first', () => {
    expect(buildResourceTree(items)[0].children[0].item.id).toBe('cabinet');
  });

  it('returns every ancestor required to restore URL selection', () => {
    expect(getAncestorIds('device', items)).toEqual(['dc', 'cabinet']);
  });

  it('filters anomalies without losing keyword matching', () => {
    expect(
      filterResourceIndex(items, 'cab', true).map((entry) => entry.id),
    ).toEqual(['cabinet']);
  });
});
