import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { FrontPortPanel, RearPortPanel } from '../PortRenderer3D';
import { DeviceTooltip } from './shared/DeviceTooltip';
import {
  type DeviceModelProps,
  deviceStatusColors,
} from './shared/deviceUtils';

/**
 * PDU(配电单元) 3D模型
 * 特点:
 * - 显示输入/输出端口
 * - 负载指示灯(根据负载百分比变色)
 * - A/B路电源标识
 */
export const PDUModel: React.FC<DeviceModelProps> = ({
  device,
  template,
  ports = [],
  position,
  height,
  width,
  depth,
  selected,
  hovered,
  showRear = false,
  showTooltip = true,
  onClick,
  onDoubleClick,
  onPointerOver,
  onPointerOut,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [breathPhase, setBreathPhase] = useState(0);
  const status =
    deviceStatusColors[device.status] || deviceStatusColors.offline;
  const isWarning = device.status === 'warning' || device.status === 'error';

  // 从设备扩展属性获取PDU特有信息
  const pduData = (device as any).pduData || {};
  const powerPath = pduData.powerPath || 'A'; // A路或B路
  const currentLoad = pduData.currentLoad || 0;
  const maxLoad = pduData.maxLoad || 3000;
  const loadPercent = maxLoad > 0 ? (currentLoad / maxLoad) * 100 : 0;

  useFrame((_, delta) => {
    if (isWarning) {
      setBreathPhase((prev) => (prev + delta * 3) % (Math.PI * 2));
    }
  });

  const emissiveIntensity = isWarning ? 0.5 + Math.sin(breathPhase) * 0.5 : 0.3;

  // 负载指示灯颜色(根据负载百分比)
  const loadColor = useMemo(() => {
    if (loadPercent < 60) return '#52c41a'; // 绿色:正常
    if (loadPercent < 80) return '#faad14'; // 黄色:警告
    return '#f5222d'; // 红色:高负载
  }, [loadPercent]);

  // 输出端口指示灯
  const outputPorts = useMemo(() => {
    const ports: React.ReactNode[] = [];
    const portCount = pduData.outputPorts || 8;
    const cols = Math.min(portCount, 8);
    const rows = Math.ceil(portCount / 8);
    const startX = -width / 2 + 0.03;
    const startY = height / 2 - 0.03;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols && row * 8 + col < portCount; col++) {
        const isActive = Math.random() > 0.3;
        ports.push(
          <group
            key={`${row}-${col}`}
            position={[
              startX + col * 0.04,
              startY - row * 0.025,
              depth / 2 + 0.003,
            ]}
          >
            {/* 端口插座 */}
            <mesh>
              <boxGeometry args={[0.03, 0.02, 0.003]} />
              <meshStandardMaterial
                color="#1a1a1a"
                metalness={0.5}
                roughness={0.4}
              />
            </mesh>
            {/* 端口LED */}
            <mesh position={[0.01, 0.008, 0.002]}>
              <sphereGeometry args={[0.003, 6, 6]} />
              <meshStandardMaterial
                color={isActive ? '#00ff00' : '#333'}
                emissive={isActive ? '#00ff00' : '#000'}
                emissiveIntensity={isActive ? 0.8 : 0}
              />
            </mesh>
          </group>,
        );
      }
    }
    return ports;
  }, [width, height, depth, pduData.outputPorts]);

  // A/B路电源标识颜色
  const pathColor = powerPath === 'A' ? '#1890ff' : '#52c41a';

  return (
    <group ref={groupRef} position={position}>
      {/* PDU主体 */}
      <mesh
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={hovered ? '#4a5568' : '#2d3748'}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* 前面板 */}
      <mesh position={[0, 0, depth / 2 + 0.001]}>
        <boxGeometry args={[width - 0.01, height - 0.005, 0.003]} />
        <meshStandardMaterial color="#1a202c" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* A/B路电源标识 */}
      <mesh
        position={[-width / 2 + 0.04, height / 2 - 0.015, depth / 2 + 0.004]}
      >
        <boxGeometry args={[0.025, 0.015, 0.002]} />
        <meshStandardMaterial
          color={pathColor}
          emissive={pathColor}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* 负载指示灯 */}
      <mesh
        position={[width / 2 - 0.03, height / 2 - 0.015, depth / 2 + 0.005]}
      >
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial
          color={loadColor}
          emissive={loadColor}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* 输出端口 */}
      {outputPorts}

      {/* 状态指示灯 */}
      <mesh position={[width / 2 - 0.02, height / 3, depth / 2 + 0.005]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial
          color={status.color}
          emissive={status.emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* 选中高亮 */}
      {selected && (
        <lineSegments>
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(width + 0.01, height + 0.01, depth + 0.01),
            ]}
          />
          <lineBasicMaterial color="#4096ff" linewidth={2} />
        </lineSegments>
      )}

      {/* 端口渲染 */}
      {ports.length > 0 && template && (
        <FrontPortPanel
          template={template}
          ports={ports}
          width={width}
          height={height}
          depth={depth}
        />
      )}

      {/* 后面板渲染 */}
      {showRear && (
        <RearPortPanel
          template={template}
          ports={ports}
          width={width}
          height={height}
          depth={depth}
        />
      )}

      {showTooltip && hovered && (
        <DeviceTooltip device={device} template={template} visible={true} />
      )}
    </group>
  );
};
