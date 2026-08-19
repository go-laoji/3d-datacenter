import type { InfoDensity } from '@/components/3d/InfoDisplay';

export type SceneViewMode = 'operations' | 'temperature' | 'capacity';
export type SceneStatusFilter = 'all' | 'abnormal' | 'offline';
export type SceneLodProfile = 'detail' | 'balanced' | 'performance';

export interface SceneBookmark {
  id: string;
  name: string;
  datacenterId: string;
  mode: SceneViewMode;
  statusFilter: SceneStatusFilter;
  showConnections: boolean;
  infoDensity: InfoDensity;
  lodProfile: SceneLodProfile;
  selectedCabinetId?: string;
  selectedDeviceId?: string;
  createdAt: string;
}

export interface SceneStats {
  cabinetCount: number;
  deviceCount: number;
  connectionCount: number;
  onlineCount: number;
  abnormalCount: number;
  offlineCount: number;
  usedURatio: number;
  powerRatio: number;
}

const abnormalDeviceStatuses = new Set<IDC.Device['status']>([
  'warning',
  'error',
]);

export function filterSceneEntities(
  cabinets: IDC.Cabinet[],
  devices: IDC.Device[],
  statusFilter: SceneStatusFilter,
) {
  if (statusFilter === 'all') return { cabinets, devices };

  const visibleDevices = devices.filter((device) =>
    statusFilter === 'offline'
      ? device.status === 'offline'
      : abnormalDeviceStatuses.has(device.status),
  );
  const visibleCabinetIds = new Set(
    visibleDevices.map((device) => device.cabinetId),
  );
  const visibleCabinets = cabinets.filter((cabinet) => {
    if (visibleCabinetIds.has(cabinet.id)) return true;
    if (statusFilter === 'offline') return cabinet.status === 'offline';
    return cabinet.status === 'warning' || cabinet.status === 'error';
  });

  return { cabinets: visibleCabinets, devices: visibleDevices };
}

export function getSceneStats(
  cabinets: IDC.Cabinet[],
  devices: IDC.Device[],
  connections: IDC.Connection[],
): SceneStats {
  const totalU = cabinets.reduce((sum, cabinet) => sum + cabinet.uHeight, 0);
  const usedU = cabinets.reduce((sum, cabinet) => sum + cabinet.usedU, 0);
  const maxPower = cabinets.reduce((sum, cabinet) => sum + cabinet.maxPower, 0);
  const currentPower = cabinets.reduce(
    (sum, cabinet) => sum + cabinet.currentPower,
    0,
  );

  return {
    cabinetCount: cabinets.length,
    deviceCount: devices.length,
    connectionCount: connections.length,
    onlineCount: devices.filter((device) => device.status === 'online').length,
    abnormalCount: devices.filter((device) =>
      abnormalDeviceStatuses.has(device.status),
    ).length,
    offlineCount: devices.filter((device) => device.status === 'offline')
      .length,
    usedURatio: totalU ? Math.round((usedU / totalU) * 100) : 0,
    powerRatio: maxPower ? Math.round((currentPower / maxPower) * 100) : 0,
  };
}

export function projectCabinetsForMode(
  cabinets: IDC.Cabinet[],
  mode: SceneViewMode,
  temperatures: { cabinetId: string; status: string }[],
) {
  if (mode === 'operations') return cabinets;
  return cabinets.map((cabinet) => {
    if (mode === 'temperature') {
      const temperature = temperatures.find(
        (item) => item.cabinetId === cabinet.id,
      );
      if (!temperature || temperature.status === 'normal') {
        return { ...cabinet, status: 'normal' as const };
      }
      return {
        ...cabinet,
        status: temperature.status === 'critical' ? 'error' : 'warning',
      } as IDC.Cabinet;
    }
    const uRatio = cabinet.uHeight ? cabinet.usedU / cabinet.uHeight : 0;
    const powerRatio = cabinet.maxPower
      ? cabinet.currentPower / cabinet.maxPower
      : 0;
    const ratio = Math.max(uRatio, powerRatio);
    return {
      ...cabinet,
      status: ratio >= 0.9 ? 'error' : ratio >= 0.75 ? 'warning' : 'normal',
    } as IDC.Cabinet;
  });
}

export function createSceneBookmark(
  input: Omit<SceneBookmark, 'id' | 'createdAt'>,
  now = new Date(),
): SceneBookmark {
  return {
    ...input,
    id: `scene-${now.getTime()}`,
    createdAt: now.toISOString(),
  };
}

export function normalizeSceneBookmarks(value: unknown): SceneBookmark[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is SceneBookmark => {
      if (!item || typeof item !== 'object') return false;
      const bookmark = item as Partial<SceneBookmark>;
      return Boolean(
        bookmark.id &&
          bookmark.name &&
          bookmark.datacenterId &&
          ['operations', 'temperature', 'capacity'].includes(
            bookmark.mode || '',
          ) &&
          ['all', 'abnormal', 'offline'].includes(bookmark.statusFilter || ''),
      );
    })
    .slice(0, 6);
}

export function getSceneSearchResults(devices: IDC.Device[], query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return devices.slice(0, 12);
  return devices
    .filter((device) =>
      [device.name, device.assetCode, device.managementIp]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    )
    .slice(0, 20);
}
