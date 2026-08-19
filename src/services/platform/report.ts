import { request } from '@umijs/max';

export interface ReportKpi {
  key: string;
  label: string;
  value: number;
  unit: string;
  trend: number;
  status: 'success' | 'warning' | 'error' | 'processing';
}

export interface AssetReportRow {
  datacenterId: string;
  datacenterName: string;
  devices: number;
  onlineRate: number;
  expiringWarranty: number;
  unknownOwner: number;
}

export interface CapacityReportRow {
  datacenterId: string;
  datacenterName: string;
  uUsage: number;
  powerUsage: number;
  coolingUsage: number;
  networkUsage: number;
}

export interface EnergyTrendPoint {
  month: string;
  value: number;
  series: '能耗 MWh' | 'PUE';
}

export interface SlaReportRow {
  priority: string;
  total: number;
  acknowledgedInTime: number;
  resolvedInTime: number;
  averageAckMinutes: number;
  averageResolveMinutes: number;
}

export interface ReportSnapshot {
  generatedAt: string;
  kpis: ReportKpi[];
  assets: AssetReportRow[];
  capacity: CapacityReportRow[];
  energyTrend: EnergyTrendPoint[];
  sla: SlaReportRow[];
  datacenters: { id: string; name: string }[];
}

export async function getReportSnapshot(params?: {
  datacenterId?: string;
  period?: string;
}) {
  return request<{ success: boolean; data: ReportSnapshot }>(
    '/api/platform/reports',
    { method: 'GET', params },
  );
}
