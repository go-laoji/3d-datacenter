import { request } from '@umijs/max';

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'webhook' | 'email' | 'sms';
  target: string;
  status: 'enabled' | 'disabled' | 'error';
  lastTestAt?: string;
  deliveryRate: number;
}

export interface OnCallShift {
  id: string;
  startsAt: string;
  endsAt: string;
  primary: string;
  backup: string;
  status: 'active' | 'upcoming' | 'completed';
}

export interface EscalationStep {
  id: string;
  delayMinutes: number;
  target: string;
  channelIds: string[];
}

export interface NotificationWorkspace {
  channels: NotificationChannel[];
  shifts: OnCallShift[];
  escalationSteps: EscalationStep[];
  responders: string[];
}

export async function getNotificationWorkspace() {
  return request<{ success: boolean; data: NotificationWorkspace }>(
    '/api/platform/notifications',
    { method: 'GET' },
  );
}

export async function updateNotificationChannel(
  id: string,
  status: NotificationChannel['status'],
) {
  return request<{ success: boolean; data: NotificationChannel }>(
    `/api/platform/notification-channels/${id}`,
    { method: 'PUT', data: { status } },
  );
}

export async function testNotificationChannel(id: string) {
  return request<{
    success: boolean;
    data: { delivered: boolean; detail: string };
  }>(`/api/platform/notification-channels/${id}/test`, { method: 'POST' });
}

export async function handoffOnCallShift(shiftId: string, primary: string) {
  return request<{ success: boolean; data: OnCallShift }>(
    `/api/platform/on-call/${shiftId}/handoff`,
    { method: 'POST', data: { primary } },
  );
}

export async function saveEscalationSteps(steps: EscalationStep[]) {
  return request<{ success: boolean; data: EscalationStep[] }>(
    '/api/platform/escalation-policy',
    { method: 'PUT', data: { steps } },
  );
}
