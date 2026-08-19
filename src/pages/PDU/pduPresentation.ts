import type { PDUDevice } from '@/services/idc/pdu';

export interface PDUStats {
  total: number;
  pathA: number;
  pathB: number;
  averageLoad: number;
  highLoad: number;
  imbalance: number;
}

export const getLoadPercent = (device: PDUDevice) =>
  Math.round(
    (device.pduData.currentLoad / Math.max(device.pduData.maxLoad, 1)) * 100,
  );

export const getLoadTone = (percent: number) => {
  if (percent >= 80) return { color: '#ff4d4f', label: '高负载' };
  if (percent >= 60) return { color: '#faad14', label: '关注' };
  return { color: '#52c41a', label: '正常' };
};

export const summarizePDUs = (devices: PDUDevice[]): PDUStats => {
  const pathLoads = devices.reduce(
    (result, device) => {
      const percent = getLoadPercent(device);
      result[device.pduData.powerPath].push(percent);
      result.all.push(percent);
      return result;
    },
    { A: [] as number[], B: [] as number[], all: [] as number[] },
  );
  const average = (values: number[]) =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;

  return {
    total: devices.length,
    pathA: pathLoads.A.length,
    pathB: pathLoads.B.length,
    averageLoad: Math.round(average(pathLoads.all)),
    highLoad: pathLoads.all.filter((load) => load >= 80).length,
    imbalance: Math.round(
      Math.abs(average(pathLoads.A) - average(pathLoads.B)),
    ),
  };
};

export const predictOverloadHours = (device: PDUDevice) => {
  const recent = device.loadTrend.slice(-4);
  if (recent.length < 2) return null;
  const growth = (recent.at(-1)!.load - recent[0].load) / (recent.length - 1);
  if (growth <= 0) return null;
  const thresholdLoad =
    device.pduData.maxLoad * ((device.pduData.loadThreshold ?? 80) / 100);
  return Math.max(
    1,
    Math.ceil((thresholdLoad - device.pduData.currentLoad) / growth),
  );
};
