export type EntityType =
  | 'datacenter'
  | 'cabinet'
  | 'device'
  | 'pdu'
  | 'port'
  | 'connection'
  | 'alert'
  | 'workOrder'
  | 'change'
  | 'user'
  | 'role'
  | 'audit'
  | 'source'
  | 'task'
  | 'report';

export type EntityRouteContext = Partial<
  Record<'datacenterId' | 'cabinetId' | 'deviceId', string>
>;

const entityRouteConfig: Record<
  EntityType,
  { pathname: string; parameter: string }
> = {
  datacenter: { pathname: '/idc/datacenter', parameter: 'datacenterId' },
  cabinet: { pathname: '/idc/cabinet', parameter: 'cabinetId' },
  device: { pathname: '/idc/device', parameter: 'deviceId' },
  pdu: { pathname: '/idc/pdu', parameter: 'pduId' },
  port: { pathname: '/network/port', parameter: 'portId' },
  connection: { pathname: '/network/connection', parameter: 'connectionId' },
  alert: { pathname: '/monitor/alert', parameter: 'alertId' },
  workOrder: {
    pathname: '/operations/work-orders',
    parameter: 'workOrderId',
  },
  change: { pathname: '/operations/work-orders', parameter: 'changeId' },
  user: { pathname: '/system/access', parameter: 'userId' },
  role: { pathname: '/system/access', parameter: 'roleId' },
  audit: { pathname: '/system/audit', parameter: 'auditId' },
  source: { pathname: '/system/data-health', parameter: 'sourceId' },
  task: { pathname: '/system/tasks', parameter: 'taskId' },
  report: { pathname: '/reports', parameter: 'reportId' },
};

export function buildEntityRoute(
  type: EntityType,
  id: string,
  context: EntityRouteContext = {},
) {
  const config = entityRouteConfig[type];
  const parameters = new URLSearchParams();
  parameters.set(config.parameter, id);
  Object.entries(context).forEach(([key, value]) => {
    if (value && key !== config.parameter) parameters.set(key, value);
  });
  return `${config.pathname}?${parameters.toString()}`;
}

export type OperationalTone =
  | 'success'
  | 'warning'
  | 'error'
  | 'processing'
  | 'default';

const statusDefinitions: Record<
  string,
  { label: string; tone: OperationalTone }
> = {
  online: { label: '在线', tone: 'success' },
  normal: { label: '正常', tone: 'success' },
  success: { label: '成功', tone: 'success' },
  completed: { label: '已完成', tone: 'success' },
  resolved: { label: '已解决', tone: 'success' },
  enabled: { label: '已启用', tone: 'success' },
  warning: { label: '需关注', tone: 'warning' },
  pending: { label: '待处理', tone: 'warning' },
  delayed: { label: '延迟', tone: 'warning' },
  error: { label: '异常', tone: 'error' },
  failed: { label: '失败', tone: 'error' },
  critical: { label: '严重', tone: 'error' },
  interrupted: { label: '中断', tone: 'error' },
  running: { label: '运行中', tone: 'processing' },
  processing: { label: '处理中', tone: 'processing' },
  acknowledged: { label: '已确认', tone: 'processing' },
  maintenance: { label: '维护中', tone: 'processing' },
  offline: { label: '离线', tone: 'default' },
  disabled: { label: '已停用', tone: 'default' },
  cancelled: { label: '已取消', tone: 'default' },
};

export function getStatusDefinition(status: string, label?: string) {
  const definition = statusDefinitions[status.toLowerCase()] ?? {
    label: status || '未知',
    tone: 'default' as const,
  };
  return { ...definition, label: label ?? definition.label };
}

export function formatMetricValue(
  value: number | string | null | undefined,
  unit?: string,
) {
  if (value === null || value === undefined || value === '') return '--';
  return unit ? `${value}${unit}` : String(value);
}

export interface BatchResultItem {
  id: string;
  name: string;
  success: boolean;
  reason?: string;
}

export function summarizeBatchResults(items: BatchResultItem[]) {
  return items.reduce(
    (summary, item) => {
      if (item.success) summary.succeeded += 1;
      else summary.failed += 1;
      return summary;
    },
    { total: items.length, succeeded: 0, failed: 0 },
  );
}
