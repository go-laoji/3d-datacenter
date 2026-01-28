import React, { useMemo } from 'react';
import * as THREE from 'three';

// 端口状态颜色
export const portStatusColors = {
  up_connected: { color: '#52c41a', emissive: '#52c41a', intensity: 0.8 },
  up_disconnected: { color: '#faad14', emissive: '#faad14', intensity: 0.6 },
  down: { color: '#f5222d', emissive: '#f5222d', intensity: 0.5 },
  disabled: { color: '#8c8c8c', emissive: '#000000', intensity: 0 },
  error: { color: '#ff4d4f', emissive: '#ff4d4f', intensity: 1.0 },
};

// 端口类型配置
const portTypeConfigs: Record<
  string,
  {
    width: number;
    height: number;
    depth: number;
    color: string;
    borderColor?: string;
  }
> = {
  RJ45: { width: 0.012, height: 0.01, depth: 0.004, color: '#3a3f44' },
  SFP: { width: 0.008, height: 0.012, depth: 0.004, color: '#2a2f35' },
  'SFP+': {
    width: 0.008,
    height: 0.012,
    depth: 0.004,
    color: '#2a2f35',
    borderColor: '#1890ff',
  },
  'QSFP+': {
    width: 0.018,
    height: 0.012,
    depth: 0.004,
    color: '#2a2f35',
    borderColor: '#52c41a',
  },
  QSFP28: {
    width: 0.018,
    height: 0.012,
    depth: 0.004,
    color: '#2a2f35',
    borderColor: '#722ed1',
  },
  FC: {
    width: 0.01,
    height: 0.01,
    depth: 0.004,
    color: '#2a2f35',
    borderColor: '#d4af37',
  },
  USB: { width: 0.008, height: 0.006, depth: 0.003, color: '#1a1a1a' },
  Console: { width: 0.012, height: 0.01, depth: 0.004, color: '#4a90d9' },
  Power: { width: 0.02, height: 0.015, depth: 0.005, color: '#1a1a1a' },
};

// 获取端口状态
const getPortStatus = (port: IDC.Port) => {
  if (port.status === 'disabled') return portStatusColors.disabled;
  if (port.status === 'error') return portStatusColors.error;
  if (port.status === 'down') return portStatusColors.down;
  if (port.status === 'up' && port.linkStatus === 'connected')
    return portStatusColors.up_connected;
  return portStatusColors.up_disconnected;
};

// 单个端口组件
interface Port3DProps {
  port: IDC.Port;
  position: [number, number, number];
  scale?: number;
}

export const Port3D: React.FC<Port3DProps> = ({
  port,
  position,
  scale = 1,
}) => {
  const config = portTypeConfigs[port.portType] || portTypeConfigs.RJ45;
  const status = getPortStatus(port);

  const { width, height, depth } = {
    width: config.width * scale,
    height: config.height * scale,
    depth: config.depth * scale,
  };

  return (
    <group position={position}>
      {/* 端口主体 */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={config.color}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* 端口内部/插槽 */}
      <mesh position={[0, 0, depth / 2 + 0.0005]}>
        <boxGeometry args={[width * 0.7, height * 0.6, 0.001]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* 边框高亮（SFP+/QSFP+等） */}
      {config.borderColor && (
        <lineSegments>
          <edgesGeometry
            args={[new THREE.BoxGeometry(width + 0.001, height + 0.001, depth)]}
          />
          <lineBasicMaterial color={config.borderColor} />
        </lineSegments>
      )}

      {/* 状态指示灯 */}
      <mesh position={[width / 2 + 0.003, 0, depth / 2]}>
        <sphereGeometry args={[0.002 * scale, 8, 8]} />
        <meshStandardMaterial
          color={status.color}
          emissive={status.emissive}
          emissiveIntensity={status.intensity}
        />
      </mesh>
    </group>
  );
};

// 端口组渲染器
interface PortGroupRendererProps {
  ports: IDC.Port[];
  portGroup: IDC.PortGroup;
  startPosition: [number, number, number];
  direction: 'horizontal' | 'vertical';
  rows?: number;
  scale?: number;
  isRear?: boolean; // 是否为后面板
}

export const PortGroupRenderer: React.FC<PortGroupRendererProps> = ({
  ports,
  portGroup,
  startPosition,
  direction = 'horizontal',
  rows = 1,
  scale = 1,
  isRear = false,
}) => {
  const config = portTypeConfigs[portGroup.portType] || portTypeConfigs.RJ45;
  const spacing =
    (direction === 'horizontal' ? config.width : config.height) * 1.3 * scale;

  // 过滤属于该端口组的端口
  const groupPorts = ports.filter((p) => p.portGroupId === portGroup.id);
  const portsPerRow = Math.ceil(groupPorts.length / rows);

  return (
    <group position={startPosition}>
      {groupPorts.map((port, index) => {
        const row = Math.floor(index / portsPerRow);
        const col = index % portsPerRow;

        let x = col * spacing;
        const y = -row * (config.height * 1.3 * scale);
        const z = 0;

        if (isRear) {
          x = -x; // 后面板镜像
        }

        return (
          <Port3D
            key={port.id}
            port={port}
            position={[x, y, z]}
            scale={scale}
          />
        );
      })}
    </group>
  );
};

// 设备端口面板渲染器 - 前面板
interface DevicePortPanelProps {
  template?: IDC.DeviceTemplate;
  ports: IDC.Port[];
  width: number;
  height: number;
  depth: number;
  scale?: number;
}

export const FrontPortPanel: React.FC<DevicePortPanelProps> = ({
  template,
  ports,
  width,
  height,
  depth,
  scale = 1,
}) => {
  const portGroups = template?.portGroups || [];

  // 计算端口组布局
  const layout = useMemo(() => {
    // 过滤出前面板端口（非电源/管理端口）
    const frontGroups = portGroups.filter(
      (g) => !['Power', 'Console'].includes(g.portType),
    );

    if (frontGroups.length === 0) return [];

    // 计算每个端口组的起始位置
    let currentX = -width / 2 + 0.02;
    const result: {
      group: IDC.PortGroup;
      position: [number, number, number];
    }[] = [];

    frontGroups.forEach((group) => {
      const config = portTypeConfigs[group.portType] || portTypeConfigs.RJ45;
      const groupWidth = group.count * config.width * 1.3 * scale;

      // 根据端口类型决定行数
      let rows = 1;
      if (group.portType === 'RJ45' && group.count > 12) rows = 2;
      if (['SFP', 'SFP+'].includes(group.portType) && group.count > 8) rows = 2;

      result.push({
        group,
        position: [currentX, height / 4, depth / 2 + 0.002],
      });

      currentX += groupWidth / rows + 0.01;
    });

    return result;
  }, [portGroups, width, height, depth, scale]);

  return (
    <group>
      {layout.map(({ group, position }) => (
        <PortGroupRenderer
          key={group.id}
          ports={ports}
          portGroup={group}
          startPosition={position}
          direction="horizontal"
          rows={group.count > 12 ? 2 : 1}
          scale={scale}
        />
      ))}
    </group>
  );
};

// 设备端口面板渲染器 - 后面板
export const RearPortPanel: React.FC<DevicePortPanelProps> = ({
  template,
  ports,
  width,
  height,
  depth,
  scale = 1,
}) => {
  const portGroups = template?.portGroups || [];

  // 计算后面板端口布局
  const layout = useMemo(() => {
    // 后面板通常有电源口和管理口
    const rearGroups = portGroups.filter((g) =>
      ['Power', 'Console'].includes(g.portType),
    );

    // 如果没有专门的后面板端口组，创建默认的电源口
    if (rearGroups.length === 0) {
      return [
        {
          type: 'power_default',
          position: [width / 4, 0, -depth / 2 - 0.002] as [
            number,
            number,
            number,
          ],
        },
      ];
    }

    let currentX = width / 2 - 0.03;
    const result: {
      group: IDC.PortGroup;
      position: [number, number, number];
    }[] = [];

    rearGroups.forEach((group) => {
      result.push({
        group,
        position: [currentX, 0, -depth / 2 - 0.002],
      });
      currentX -= 0.04;
    });

    return result;
  }, [portGroups, width, height, depth]);

  return (
    <group>
      {/* 后面板底板 */}
      <mesh position={[0, 0, -depth / 2 - 0.001]}>
        <boxGeometry args={[width - 0.01, height - 0.005, 0.003]} />
        <meshStandardMaterial color="#1f2428" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* 散热栅格 */}
      {Array.from({ length: Math.floor(width / 0.03) }, (_, i) => (
        <mesh
          key={`vent-${i}`}
          position={[
            -width / 2 + 0.02 + i * 0.025,
            -height / 4,
            -depth / 2 - 0.002,
          ]}
        >
          <boxGeometry args={[0.015, height * 0.3, 0.001]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      ))}

      {/* 电源模块 */}
      <group position={[width / 3, 0, -depth / 2 - 0.003]}>
        <mesh>
          <boxGeometry args={[0.06, height * 0.7, 0.01]} />
          <meshStandardMaterial
            color="#2a2a2a"
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
        {/* 电源指示灯 */}
        <mesh position={[0.025, height * 0.25, 0.006]}>
          <sphereGeometry args={[0.003, 8, 8]} />
          <meshStandardMaterial
            color="#52c41a"
            emissive="#52c41a"
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>

      {/* 第二电源模块（冗余） */}
      <group position={[width / 3 - 0.08, 0, -depth / 2 - 0.003]}>
        <mesh>
          <boxGeometry args={[0.06, height * 0.7, 0.01]} />
          <meshStandardMaterial
            color="#2a2a2a"
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0.025, height * 0.25, 0.006]}>
          <sphereGeometry args={[0.003, 8, 8]} />
          <meshStandardMaterial
            color="#52c41a"
            emissive="#52c41a"
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>

      {/* 管理口区域 */}
      <group position={[-width / 3, height * 0.2, -depth / 2 - 0.003]}>
        {/* Console口 */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.012, 0.01, 0.004]} />
          <meshStandardMaterial
            color="#4a90d9"
            metalness={0.3}
            roughness={0.5}
          />
        </mesh>
        {/* 管理网口 */}
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[0.012, 0.01, 0.004]} />
          <meshStandardMaterial
            color="#3a3f44"
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>
      </group>

      {/* 端口组渲染 */}
      {layout
        .filter((item) => 'group' in item)
        .map(({ group, position }) => (
          <PortGroupRenderer
            key={group?.id}
            ports={ports}
            portGroup={group!}
            startPosition={position}
            direction="horizontal"
            scale={scale}
            isRear={true}
          />
        ))}
    </group>
  );
};

export default {
  Port3D,
  PortGroupRenderer,
  FrontPortPanel,
  RearPortPanel,
  portStatusColors,
};
