import { request } from '@umijs/max';
import type { EntityType } from '@/components/operations';

export interface WorkOrderTimelineItem {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  category: 'incident' | 'inspection' | 'maintenance';
  priority: 'P1' | 'P2' | 'P3';
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  assignee: string;
  alertId?: string;
  objectType?: EntityType;
  objectId?: string;
  objectName?: string;
  slaDueAt: string;
  createdAt: string;
  timeline: WorkOrderTimelineItem[];
}

export interface ChangeStep {
  id: string;
  name: string;
  owner: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  rollback?: string;
}

export interface ChangePlan {
  id: string;
  title: string;
  risk: 'low' | 'medium' | 'high';
  status: 'draft' | 'pending' | 'approved' | 'processing' | 'completed';
  windowStart: string;
  windowEnd: string;
  approver: string;
  affectedObjects: { type: EntityType; id: string; name: string }[];
  steps: ChangeStep[];
}

export interface WorkOrderWorkspace {
  workOrders: WorkOrder[];
  changes: ChangePlan[];
  assignees: string[];
}

export interface WorkOrderInput {
  title: string;
  category: WorkOrder['category'];
  priority: WorkOrder['priority'];
  assignee: string;
  alertId?: string;
  objectType?: EntityType;
  objectId?: string;
  objectName?: string;
}

export async function getWorkOrderWorkspace() {
  return request<{ success: boolean; data: WorkOrderWorkspace }>(
    '/api/platform/work-orders',
    { method: 'GET' },
  );
}

export async function createWorkOrder(data: WorkOrderInput) {
  return request<{ success: boolean; data: WorkOrder }>(
    '/api/platform/work-orders',
    { method: 'POST', data },
  );
}

export async function transitionWorkOrder(id: string, action: string) {
  return request<{ success: boolean; data: WorkOrder }>(
    `/api/platform/work-orders/${id}/transition`,
    { method: 'POST', data: { action } },
  );
}

export async function transitionChangePlan(id: string, action: string) {
  return request<{ success: boolean; data: ChangePlan }>(
    `/api/platform/changes/${id}/transition`,
    { method: 'POST', data: { action } },
  );
}
