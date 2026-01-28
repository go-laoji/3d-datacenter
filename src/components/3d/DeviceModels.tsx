import React, { useState } from 'react';
import {
  type DeviceModelProps,
  FirewallModel,
  GenericDeviceModel,
  LoadBalancerModel,
  PDUModel,
  RouterModel,
  ServerModel,
  StorageModel,
  SwitchModel,
} from './models';

// 设备3D组件属性
interface Device3DProps {
  device: IDC.Device;
  template?: IDC.DeviceTemplate;
  ports?: IDC.Port[];
  category: string;
  position: [number, number, number];
  height: number;
  width: number;
  depth: number;
  selected?: boolean;
  showRear?: boolean;
  showTooltip?: boolean;
  onSelect?: (device: IDC.Device) => void;
  onDoubleClick?: (
    device: IDC.Device,
    position: [number, number, number],
  ) => void;
}

/**
 * 设备3D模型选择器
 * 根据设备类型渲染对应的3D模型组件
 */
export const Device3D: React.FC<Device3DProps> = ({
  device,
  template,
  ports,
  category,
  position,
  height,
  width,
  depth,
  selected,
  showRear = false,
  showTooltip = true,
  onSelect,
  onDoubleClick,
}) => {
  const [hovered, setHovered] = useState(false);

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect?.(device);
  };

  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    onDoubleClick?.(device, position);
  };

  const commonProps: DeviceModelProps = {
    device,
    template,
    ports,
    position,
    height,
    width,
    depth,
    selected,
    hovered,
    showRear,
    showTooltip,
    onClick: handleClick,
    onDoubleClick: handleDoubleClick,
    onPointerOver: () => setHovered(true),
    onPointerOut: () => setHovered(false),
  };

  // 根据设备类型选择对应的3D模型
  switch (category) {
    case 'server':
      return <ServerModel {...commonProps} />;
    case 'switch':
      return <SwitchModel {...commonProps} />;
    case 'router':
      return <RouterModel {...commonProps} />;
    case 'storage':
      return <StorageModel {...commonProps} />;
    case 'firewall':
      return <FirewallModel {...commonProps} />;
    case 'loadbalancer':
      return <LoadBalancerModel {...commonProps} />;
    case 'pdu':
      return <PDUModel {...commonProps} />;
    default:
      return <GenericDeviceModel {...commonProps} />;
  }
};

export default Device3D;

// 导出设备状态颜色配置供外部使用
export { deviceStatusColors } from './models';
