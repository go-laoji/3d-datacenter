// 设备模型共享工具和类型定义

// 设备状态颜色配置
export const deviceStatusColors: Record<
  string,
  { color: string; emissive: string }
> = {
  online: { color: '#52c41a', emissive: '#52c41a' },
  offline: { color: '#8c8c8c', emissive: '#4a4a4a' },
  warning: { color: '#faad14', emissive: '#faad14' },
  error: { color: '#f5222d', emissive: '#f5222d' },
  maintenance: { color: '#1890ff', emissive: '#1890ff' },
};

// 通用设备属性接口
export interface DeviceModelProps {
  device: IDC.Device;
  template?: IDC.DeviceTemplate;
  ports?: IDC.Port[];
  position: [number, number, number];
  height: number;
  width: number;
  depth: number;
  selected?: boolean;
  hovered?: boolean;
  showRear?: boolean;
  showTooltip?: boolean;
  onClick?: (e: any) => void;
  onDoubleClick?: (e: any) => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

// 状态标签映射
export const statusLabels: Record<string, string> = {
  online: '在线',
  offline: '离线',
  warning: '告警',
  error: '故障',
  maintenance: '维护中',
};
