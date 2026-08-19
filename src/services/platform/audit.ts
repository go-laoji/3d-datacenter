import { request } from '@umijs/max';
import type { EntityType } from '@/components/operations';

export interface AuditRecord {
  id: string;
  occurredAt: string;
  operator: string;
  operatorId: string;
  action: string;
  actionLabel: string;
  objectType: EntityType;
  objectId: string;
  objectName: string;
  result: 'success' | 'failed';
  ipAddress: string;
  traceId: string;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  errorMessage?: string;
}

export interface AuditFilters {
  keyword?: string;
  operator?: string;
  action?: string;
  result?: string;
}

export async function getAuditRecords(params?: AuditFilters) {
  return request<{ success: boolean; data: AuditRecord[] }>(
    '/api/platform/audits',
    { method: 'GET', params },
  );
}
