import { describe, expect, it } from 'vitest';
import {
  createSceneBookmark,
  filterSceneEntities,
  getSceneStats,
  normalizeSceneBookmarks,
  projectCabinetsForMode,
} from './datacenter3dModel';

const cabinets = [
  {
    id: 'cab-1',
    status: 'normal',
    uHeight: 42,
    usedU: 21,
    maxPower: 1000,
    currentPower: 500,
  },
  {
    id: 'cab-2',
    status: 'error',
    uHeight: 42,
    usedU: 42,
    maxPower: 1000,
    currentPower: 900,
  },
] as IDC.Cabinet[];

const devices = [
  { id: 'dev-1', cabinetId: 'cab-1', status: 'online' },
  { id: 'dev-2', cabinetId: 'cab-2', status: 'warning' },
  { id: 'dev-3', cabinetId: 'cab-2', status: 'offline' },
] as IDC.Device[];

describe('datacenter 3D model', () => {
  it('keeps only anomalous entities in anomaly mode', () => {
    const result = filterSceneEntities(cabinets, devices, 'abnormal');
    expect(result.cabinets.map((cabinet) => cabinet.id)).toEqual(['cab-2']);
    expect(result.devices.map((device) => device.id)).toEqual(['dev-2']);
  });

  it('summarizes scene capacity and operational status', () => {
    const stats = getSceneStats(cabinets, devices, []);
    expect(stats).toMatchObject({
      cabinetCount: 2,
      deviceCount: 3,
      abnormalCount: 1,
      offlineCount: 1,
      usedURatio: 75,
      powerRatio: 70,
    });
  });

  it('creates and validates persisted bookmarks', () => {
    const bookmark = createSceneBookmark(
      {
        name: '北京运维视图',
        datacenterId: 'dc-1',
        mode: 'operations',
        statusFilter: 'all',
        showConnections: true,
        infoDensity: 'normal',
        lodProfile: 'balanced',
      },
      new Date('2026-08-20T08:00:00Z'),
    );
    expect(normalizeSceneBookmarks([bookmark, { id: 'bad' }])).toEqual([
      bookmark,
    ]);
  });

  it('projects capacity risk into the cabinet scene status', () => {
    expect(projectCabinetsForMode(cabinets, 'capacity', [])[1].status).toBe(
      'error',
    );
  });
});
