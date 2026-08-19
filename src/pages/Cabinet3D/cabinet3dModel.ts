export type CabinetViewPreset = 'overview' | 'front' | 'rear' | 'left';
export type CabinetDeviceFilter = 'all' | 'abnormal' | 'offline';

export interface Cabinet3DStats {
  total: number;
  online: number;
  abnormal: number;
  offline: number;
  usedU: number;
  totalU: number;
  usage: number;
  currentPower: number;
  maxPower: number;
  powerUsage: number;
}

export interface EmptyUSlotRange {
  startU: number;
  endU: number;
}

export function getCabinet3DStats(
  cabinet: IDC.Cabinet,
  devices: IDC.Device[],
): Cabinet3DStats {
  return {
    total: devices.length,
    online: devices.filter((device) => device.status === 'online').length,
    abnormal: devices.filter(
      (device) => device.status === 'warning' || device.status === 'error',
    ).length,
    offline: devices.filter((device) => device.status === 'offline').length,
    usedU: cabinet.usedU,
    totalU: cabinet.uHeight,
    usage: cabinet.uHeight
      ? Math.round((cabinet.usedU / cabinet.uHeight) * 100)
      : 0,
    currentPower: cabinet.currentPower,
    maxPower: cabinet.maxPower,
    powerUsage: cabinet.maxPower
      ? Math.round((cabinet.currentPower / cabinet.maxPower) * 100)
      : 0,
  };
}

export function filterCabinetDevices(
  devices: IDC.Device[],
  filter: CabinetDeviceFilter,
) {
  if (filter === 'all') return devices;
  return devices.filter((device) =>
    filter === 'offline'
      ? device.status === 'offline'
      : device.status === 'warning' || device.status === 'error',
  );
}

export function findEmptyUSlots(
  uHeight: number,
  devices: IDC.Device[],
): EmptyUSlotRange[] {
  const occupied = new Set<number>();
  for (const device of devices) {
    for (let u = device.startU; u <= device.endU; u += 1) occupied.add(u);
  }

  const ranges: EmptyUSlotRange[] = [];
  let startU: number | undefined;
  for (let u = 1; u <= uHeight; u += 1) {
    if (!occupied.has(u) && startU === undefined) startU = u;
    if (occupied.has(u) && startU !== undefined) {
      ranges.push({ startU, endU: u - 1 });
      startU = undefined;
    }
  }
  if (startU !== undefined) ranges.push({ startU, endU: uHeight });
  return ranges;
}
