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
      .filter((alert) => !alert.acknowledged && !alert.resolvedAt)
      .map((alert) => alert.id),
    resolvableIds: selectedAlerts
      .filter((alert) => alert.acknowledged && !alert.resolvedAt)
      .map((alert) => alert.id),
  };
};
