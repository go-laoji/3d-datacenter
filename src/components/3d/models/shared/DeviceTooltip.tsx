import { Html } from '@react-three/drei';
import React from 'react';
import { deviceStatusColors, statusLabels } from './deviceUtils';

// 设备悬停信息面板
interface DeviceTooltipProps {
  device: IDC.Device;
  template?: any;
  visible: boolean;
}

export const DeviceTooltip: React.FC<DeviceTooltipProps> = ({
  device,
  template,
  visible,
}) => {
  if (!visible) return null;

  return (
    <Html center distanceFactor={6} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 12,
          whiteSpace: 'nowrap',
          fontFamily: 'system-ui',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
          {device.name}
        </div>
        <div style={{ color: '#bbb', fontSize: 11, lineHeight: 1.6 }}>
          {template && (
            <div>
              型号: {template.brand} {template.model}
            </div>
          )}
          <div>资产编码: {device.assetCode}</div>
          <div>
            U位: U{device.startU}-U{device.endU}
          </div>
          <div>
            状态:{' '}
            <span style={{ color: deviceStatusColors[device.status]?.color }}>
              {statusLabels[device.status] || device.status}
            </span>
          </div>
          {device.managementIp && <div>IP: {device.managementIp}</div>}
        </div>
      </div>
    </Html>
  );
};
