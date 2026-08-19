import { request } from '@umijs/max';

export type ResourceEntityType =
  | 'datacenter'
  | 'cabinet'
  | 'device'
  | 'pdu'
  | 'port'
  | 'connection';

export interface ResourceTreeItem {
  id: string;
  type: ResourceEntityType;
  name: string;
  code: string;
  parentId?: string;
  datacenterId?: string;
  cabinetId?: string;
  subtitle?: string;
  status: 'normal' | 'warning' | 'critical' | 'offline';
  alertCount: number;
  route: string;
  source: string;
  collectedAt: string;
  keywords: string[];
}

export async function getResourceIndex(keyword?: string) {
  return request<IDC.ApiResponse<ResourceTreeItem[]>>(
    '/api/idc/resource-index',
    { method: 'GET', params: { keyword } },
  );
}
