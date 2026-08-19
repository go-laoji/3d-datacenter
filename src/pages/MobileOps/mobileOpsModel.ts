import dayjs from 'dayjs';
import type { WorkOrder } from '@/services/platform';

const alertPriority: Record<IDC.Alert['level'], number> = {
  critical: 0,
  error: 1,
  warning: 2,
  info: 3,
};

export function sortMobileAlerts(alerts: IDC.AlertDetail[]) {
  return [...alerts].sort((left, right) => {
    const priorityDifference =
      alertPriority[left.level] - alertPriority[right.level];
    if (priorityDifference) return priorityDifference;
    return dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf();
  });
}

export function getMobileWorkQueue(workOrders: WorkOrder[]) {
  return workOrders
    .filter((item) => !['resolved', 'closed'].includes(item.status))
    .sort((left, right) => dayjs(left.slaDueAt).diff(dayjs(right.slaDueAt)));
}
