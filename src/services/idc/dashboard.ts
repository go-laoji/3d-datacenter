import { request } from '@umijs/max';

export interface DashboardTrendPoint {
  date: string;
  online: number;
  offline: number;
  warning: number;
  error: number;
}

export interface CabinetUsageRankItem {
  cabinetId: string;
  cabinetName: string;
  usage: number;
}

export interface RecentOperation {
  id: string;
  type: string;
  operator: string;
  target: string;
  description: string;
  createdAt: string;
}

export async function getDashboardStats() {
  return request<IDC.ApiResponse<IDC.DashboardStats>>(
    '/api/idc/dashboard/stats',
    { method: 'GET' },
  );
}

export async function getDeviceTrend(days = 7) {
  return request<IDC.ApiResponse<DashboardTrendPoint[]>>(
    '/api/idc/dashboard/device-trend',
    { method: 'GET', params: { days } },
  );
}

export async function getCabinetUsageRank(limit = 10) {
  return request<IDC.ApiResponse<CabinetUsageRankItem[]>>(
    '/api/idc/dashboard/cabinet-usage-rank',
    { method: 'GET', params: { limit } },
  );
}

export async function getDeviceCategory() {
  return request<
    IDC.ApiResponse<
      Array<{
        category: string;
        label: string;
        count: number;
        color: string;
      }>
    >
  >('/api/idc/dashboard/device-category', { method: 'GET' });
}

export async function getDatacenterLoad() {
  return request<
    IDC.ApiResponse<
      Array<{
        datacenterId: string;
        name: string;
        cabinetUsage: number;
        powerUsage: number;
        deviceCount: number;
      }>
    >
  >('/api/idc/dashboard/datacenter-load', { method: 'GET' });
}

export async function getRecentOperations(limit = 10) {
  return request<IDC.ApiResponse<RecentOperation[]>>(
    '/api/idc/dashboard/recent-operations',
    { method: 'GET', params: { limit } },
  );
}

export async function acknowledgeDashboardAlert(id: string) {
  return request<IDC.ApiResponse>(
    `/api/idc/dashboard/alerts/${id}/acknowledge`,
    { method: 'POST' },
  );
}

export async function getTopology(datacenterId: string) {
  return request<
    IDC.ApiResponse<{
      datacenterId: string;
      nodes: Array<{
        id: string;
        label: string;
        type: string;
        status: string;
        x: number;
        y: number;
      }>;
      edges: Array<{ source: string; target: string; type: string }>;
    }>
  >(`/api/idc/topology/${datacenterId}`, { method: 'GET' });
}
