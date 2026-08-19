import { request } from '@umijs/max';

export type PowerMetricQuality = 'good' | 'delayed' | 'estimated' | 'invalid';

export interface PowerNode {
  id: string;
  type: 'utility' | 'ups' | 'pdu' | 'device';
  name: string;
  status: 'online' | 'offline' | 'warning';
  load?: number;
  capacity?: number;
  datacenterId?: string;
  cabinetId?: string;
  assetCode?: string;
  ratedPower?: number;
  source: string;
  collectedAt: string;
  quality: PowerMetricQuality;
}

export interface PowerLink {
  id: string;
  source: string;
  target: string;
  powerPath: 'A' | 'B';
  status: 'active' | 'inactive' | 'fault';
  sourcePort: string;
  targetPort: string;
  ratedCurrent: number;
  collectedAt: string;
}

export interface RedundancyStatus {
  dualPower: Array<PowerNode & { powerPaths: string[] }>;
  singlePower: Array<PowerNode & { powerPaths: string[]; risk: string }>;
  summary: {
    totalDevices: number;
    dualPowerCount: number;
    singlePowerCount: number;
    redundancyRate: string;
  };
}

export interface LoadBalanceStatus {
  pathA: { load: number; percentage: string; capacity: number };
  pathB: { load: number; percentage: string; capacity: number };
  totalLoad: number;
  balanceRate: string;
  status: 'balanced' | 'warning' | 'unbalanced';
  source: string;
  collectedAt: string;
}

export interface PowerFailureSimulation {
  failedNodeId: string;
  failedNodeName: string;
  affectedDeviceIds: string[];
  transferredDeviceIds: string[];
  offlineDeviceIds: string[];
  impactedLoad: number;
  predictedPathA: number;
  predictedPathB: number;
  overloadedNodeIds: string[];
  severity: 'low' | 'medium' | 'high';
  explanation: string;
}

export async function getPowerTopology(datacenterId?: string) {
  return request<IDC.ApiResponse<{ nodes: PowerNode[]; links: PowerLink[] }>>(
    '/api/power/topology',
    { method: 'GET', params: { datacenterId } },
  );
}

export async function getPowerRedundancy(datacenterId?: string) {
  return request<IDC.ApiResponse<RedundancyStatus>>('/api/power/redundancy', {
    method: 'GET',
    params: { datacenterId },
  });
}

export async function getPowerLoadBalance(datacenterId?: string) {
  return request<IDC.ApiResponse<LoadBalanceStatus>>(
    '/api/power/load-balance',
    { method: 'GET', params: { datacenterId } },
  );
}

export async function simulatePowerFailure(
  datacenterId: string,
  nodeId: string,
) {
  return request<IDC.ApiResponse<PowerFailureSimulation>>(
    '/api/power/simulate',
    { method: 'POST', data: { datacenterId, nodeId } },
  );
}
