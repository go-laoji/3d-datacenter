import dayjs from 'dayjs';
import type { ChangePlan, WorkOrder } from '@/services/platform';

export function getWorkOrderNextAction(status: WorkOrder['status']) {
  if (status === 'pending') return { action: 'start', label: '开始处理' };
  if (status === 'processing') return { action: 'resolve', label: '标记解决' };
  if (status === 'resolved') return { action: 'close', label: '关闭工单' };
  return undefined;
}

export function getSlaState(workOrder: WorkOrder, now = dayjs()) {
  if (['resolved', 'closed'].includes(workOrder.status)) return 'met';
  const remaining = dayjs(workOrder.slaDueAt).diff(now, 'minute');
  if (remaining < 0) return 'breached';
  if (remaining <= 30) return 'risk';
  return 'healthy';
}

export function getChangeNextAction(change: ChangePlan) {
  if (change.status === 'pending')
    return { action: 'approve', label: '审批通过' };
  if (change.status === 'approved')
    return { action: 'execute', label: '开始执行' };
  if (change.status === 'processing')
    return { action: 'complete', label: '完成变更' };
  return undefined;
}
