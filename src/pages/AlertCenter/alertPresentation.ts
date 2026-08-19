export const alertLevelConfig: Record<
  IDC.Alert['level'],
  { color: string; text: string }
> = {
  critical: { color: 'error', text: '紧急' },
  error: { color: 'volcano', text: '错误' },
  warning: { color: 'warning', text: '警告' },
  info: { color: 'processing', text: '提示' },
};

export const alertTypeLabels: Record<string, string> = {
  temperature: '温度告警',
  humidity: '湿度告警',
  power: '功率告警',
  device_status: '设备状态',
  port_status: '端口状态',
  capacity: '容量预警',
};

export const alertSourceLabels: Record<IDC.AlertDetail['source'], string> = {
  manual: '人工创建',
  system: '系统检测',
  rule: '规则触发',
};

export const alertStatusConfig: Record<
  NonNullable<IDC.AlertDetail['workflowStatus']>,
  { label: string; color: string }
> = {
  new: { label: '新告警', color: 'error' },
  acknowledged: { label: '已确认', color: 'processing' },
  processing: { label: '处理中', color: 'blue' },
  recovered: { label: '已恢复', color: 'cyan' },
  closed: { label: '已关闭', color: 'success' },
  suppressed: { label: '维护抑制', color: 'default' },
  false_positive: { label: '误报', color: 'purple' },
  reopened: { label: '已重开', color: 'volcano' },
};

export const getAlertStatus = (
  alert: IDC.AlertDetail,
): NonNullable<IDC.AlertDetail['workflowStatus']> => {
  if (alert.workflowStatus) return alert.workflowStatus;
  if (alert.resolvedAt) return 'closed';
  if (alert.acknowledged) return 'acknowledged';
  return 'new';
};

export const getSlaPresentation = (slaDueAt?: string, now = Date.now()) => {
  if (!slaDueAt) return { label: '未配置 SLA', tone: 'default' };
  const minutes = Math.ceil((new Date(slaDueAt).getTime() - now) / 60_000);
  if (minutes < 0) {
    return { label: `已超时 ${Math.abs(minutes)} 分钟`, tone: 'error' };
  }
  if (minutes <= 30) return { label: `剩余 ${minutes} 分钟`, tone: 'warning' };
  return { label: `剩余 ${minutes} 分钟`, tone: 'success' };
};

export const isAlertTerminal = (alert: IDC.AlertDetail) =>
  ['closed', 'false_positive', 'suppressed'].includes(getAlertStatus(alert));

export const formatAlertDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('zh-CN') : '-';

export const getAlertActionableIds = (
  alerts: IDC.AlertDetail[],
  selectedIds: string[],
) => {
  const selectedAlerts = alerts.filter((alert) =>
    selectedIds.includes(alert.id),
  );

  return {
    acknowledgeableIds: selectedAlerts
      .filter((alert) => ['new', 'reopened'].includes(getAlertStatus(alert)))
      .map((alert) => alert.id),
    resolvableIds: selectedAlerts
      .filter((alert) =>
        ['acknowledged', 'processing', 'recovered'].includes(
          getAlertStatus(alert),
        ),
      )
      .map((alert) => alert.id),
  };
};
