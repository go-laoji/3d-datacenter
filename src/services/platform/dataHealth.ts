import { request } from '@umijs/max';
import type { DataQuality, EntityType } from '@/components/operations';

export interface DataSourceHealth {
  id: string;
  name: string;
  type: 'snmp' | 'redfish' | 'cmdb' | 'manual';
  endpoint: string;
  quality: DataQuality;
  lastSyncedAt?: string;
  nextSyncAt?: string;
  records: number;
  lagSeconds: number;
  successRate: number;
}

export interface DataQualityIssue {
  id: string;
  severity: 'warning' | 'error';
  rule: string;
  objectType: EntityType;
  objectId: string;
  objectName: string;
  detail: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  detectedAt: string;
}

export interface SystemHealthItem {
  key: string;
  name: string;
  status: 'normal' | 'warning' | 'error';
  latencyMs: number;
  detail: string;
}

export interface DataHealthWorkspace {
  sources: DataSourceHealth[];
  issues: DataQualityIssue[];
  system: SystemHealthItem[];
}

export async function getDataHealthWorkspace() {
  return request<{ success: boolean; data: DataHealthWorkspace }>(
    '/api/platform/data-health',
    { method: 'GET' },
  );
}

export async function retryDataSource(id: string) {
  return request<{ success: boolean; data: DataSourceHealth }>(
    `/api/platform/data-sources/${id}/retry`,
    { method: 'POST' },
  );
}

export async function acknowledgeQualityIssue(id: string) {
  return request<{ success: boolean; data: DataQualityIssue }>(
    `/api/platform/data-quality/${id}/acknowledge`,
    { method: 'POST' },
  );
}
