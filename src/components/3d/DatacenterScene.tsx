import {
  Grid,
  Html,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { Device3D } from './DeviceModels';
import { HeatmapOverlay } from './HeatmapOverlay';

// 设备悬停Tooltip组件
const DeviceTooltip: React.FC<{ device: IDC.Device; visible: boolean }> = ({
  device,
  visible,
}) => {
  if (!visible) return null;

  const statusLabels: Record<string, string> = {
    online: '在线',
    offline: '离线',
    warning: '告警',
    error: '故障',
    maintenance: '维护中',
  };

  return (
    <Html center distanceFactor={6} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 12,
          whiteSpace: 'nowrap',
          fontFamily: 'system-ui',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{device.name}</div>
        <div style={{ color: '#aaa', fontSize: 11 }}>
          <div>资产编码: {device.assetCode}</div>
          <div>
            U位: U{device.startU}-U{device.endU}
          </div>
          <div>状态: {statusLabels[device.status] || device.status}</div>
          {device.managementIp && <div>IP: {device.managementIp}</div>}
        </div>
      </div>
    </Html>
  );
};

interface CabinetProps {
  cabinet: IDC.Cabinet;
  devices: IDC.Device[];
  templates: any[];
  position: [number, number, number];
  selected: boolean;
  highlighted: boolean;
  onSelect: (cabinet: IDC.Cabinet) => void;
  onDoubleClick: (
    cabinet: IDC.Cabinet,
    position: [number, number, number],
  ) => void;
  onDeviceSelect: (device: IDC.Device) => void;
  onDeviceDoubleClick: (
    device: IDC.Device,
    position: [number, number, number],
  ) => void;
}

// 单个机柜组件
export const Cabinet3D: React.FC<CabinetProps> = ({
  cabinet,
  devices,
  templates,
  position,
  selected,
  highlighted,
  onSelect,
  onDoubleClick,
  onDeviceSelect,
  onDeviceDoubleClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [hoveredDevice, setHoveredDevice] = useState<IDC.Device | null>(null);
  const [flashIntensity, setFlashIntensity] = useState(0.8);

  // 机柜尺寸（按U位缩放）
  const cabinetHeight = cabinet.uHeight * 0.0445; // 1U = 44.5mm
  const cabinetWidth = 0.6;
  const cabinetDepth = 1.0;

  // 状态颜色
  const statusColors: Record<string, string> = {
    normal: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    offline: '#8c8c8c',
  };

  // 计算使用率颜色
  const usageRate = cabinet.usedU / cabinet.uHeight;
  const usageColor =
    usageRate > 0.9 ? '#f5222d' : usageRate > 0.7 ? '#faad14' : '#52c41a';

  // 告警闪烁效果
  const isWarning = cabinet.status === 'warning' || cabinet.status === 'error';

  // 使用useFrame实现闪烁动画
  useFrame(({ clock }) => {
    if (isWarning) {
      // 使用正弦函数创建平滑的闪烁效果，频率根据告警级别调整
      const speed = cabinet.status === 'error' ? 4 : 2;
      const newIntensity = 0.8 + Math.sin(clock.getElapsedTime() * speed) * 0.7;
      setFlashIntensity(Math.max(0.3, Math.min(1.5, newIntensity)));
    }
  });

  // 机柜主体颜色
  const getBodyColor = () => {
    if (selected) return '#4096ff';
    if (highlighted) return '#95de64';
    if (hovered) return '#69b1ff';
    if (isWarning) return statusColors[cabinet.status];
    return '#5b6c7d';
  };

  return (
    <group ref={groupRef} position={position}>
      {/* 机柜框架 */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(cabinet);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick(cabinet, position);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[cabinetWidth, cabinetHeight, cabinetDepth]} />
        <meshStandardMaterial
          color={getBodyColor()}
          metalness={0.3}
          roughness={0.6}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* 高亮边框 */}
      {(selected || highlighted) && (
        <lineSegments>
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(
                cabinetWidth + 0.02,
                cabinetHeight + 0.02,
                cabinetDepth + 0.02,
              ),
            ]}
          />
          <lineBasicMaterial
            color={selected ? '#4096ff' : '#52c41a'}
            linewidth={2}
          />
        </lineSegments>
      )}

      {/* 机柜前门（玻璃效果） */}
      <mesh position={[0, 0, cabinetDepth / 2 + 0.01]}>
        <boxGeometry args={[cabinetWidth - 0.02, cabinetHeight - 0.02, 0.02]} />
        <meshStandardMaterial
          color="#3d4852"
          metalness={0.5}
          roughness={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* U位指示条 */}
      <mesh position={[-cabinetWidth / 2 - 0.02, 0, cabinetDepth / 2]}>
        <boxGeometry args={[0.02, cabinetHeight * usageRate, 0.02]} />
        <meshStandardMaterial
          color={usageColor}
          emissive={usageColor}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* 状态指示灯 */}
      <mesh
        position={[
          cabinetWidth / 2 - 0.05,
          cabinetHeight / 2 + 0.02,
          cabinetDepth / 2,
        ]}
      >
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial
          color={statusColors[cabinet.status]}
          emissive={statusColors[cabinet.status]}
          emissiveIntensity={isWarning ? flashIntensity : 0.8}
        />
      </mesh>

      {/* 使用新的3D设备模型渲染 */}
      {devices.map((device) => {
        const deviceY =
          (device.startU - 1) * 0.0445 -
          cabinetHeight / 2 +
          ((device.endU - device.startU + 1) * 0.0445) / 2;
        const deviceHeight = (device.endU - device.startU + 1) * 0.0445;
        const template = templates.find((t) => t.id === device.templateId);
        const category = template?.category || 'other';

        return (
          <Device3D
            key={device.id}
            device={device}
            template={template}
            category={category}
            position={[0, deviceY, cabinetDepth / 2 - 0.05]}
            height={deviceHeight - 0.005}
            width={cabinetWidth - 0.06}
            depth={0.08}
            selected={hoveredDevice?.id === device.id}
            onSelect={(d) => {
              setHoveredDevice(d);
              onDeviceSelect(d);
            }}
            onDoubleClick={(d, _pos) => {
              const devicePos: [number, number, number] = [
                position[0],
                position[1] + deviceY,
                position[2],
              ];
              onDeviceDoubleClick(d, devicePos);
            }}
          />
        );
      })}

      {/* 机柜标签 */}
      <Html
        position={[0, cabinetHeight / 2 + 0.1, cabinetDepth / 2]}
        center
        distanceFactor={8}
      >
        <div
          style={{
            background: selected
              ? '#1890ff'
              : highlighted
                ? '#52c41a'
                : 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 12,
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui',
          }}
        >
          {cabinet.name}
        </div>
      </Html>
    </group>
  );
};

// 相机控制器组件
interface CameraControllerProps {
  targetPosition: [number, number, number] | null;
  onAnimationComplete: () => void;
}

const CameraController: React.FC<CameraControllerProps> = ({
  targetPosition,
  onAnimationComplete,
}) => {
  const { camera } = useThree();
  const isAnimating = useRef(false);
  const targetRef = useRef<THREE.Vector3 | null>(null);

  useFrame(() => {
    if (targetPosition && !isAnimating.current) {
      isAnimating.current = true;
      targetRef.current = new THREE.Vector3(
        targetPosition[0] + 3,
        targetPosition[1] + 2,
        targetPosition[2] + 3,
      );
    }

    if (isAnimating.current && targetRef.current) {
      camera.position.lerp(targetRef.current, 0.05);

      if (camera.position.distanceTo(targetRef.current) < 0.1) {
        isAnimating.current = false;
        targetRef.current = null;
        onAnimationComplete();
      }
    }
  });

  return null;
};

export interface DatacenterSceneRef {
  focusOnPosition: (position: [number, number, number]) => void;
  resetCamera: () => void;
}

interface CabinetTemperature {
  cabinetId: string;
  temperature: number;
  status: 'normal' | 'warning' | 'critical';
}

interface DatacenterSceneProps {
  cabinets: IDC.Cabinet[];
  devices: IDC.Device[];
  connections: IDC.Connection[];
  templates: any[];
  selectedCabinet: IDC.Cabinet | null;
  selectedDevice: IDC.Device | null;
  highlightedCabinetId: string | null;
  highlightedDeviceId: string | null;
  onSelectCabinet: (cabinet: IDC.Cabinet | null) => void;
  onSelectDevice: (device: IDC.Device | null) => void;
  // 热力图相关属性
  showHeatmap?: boolean;
  cabinetTemperatures?: CabinetTemperature[];
}

// 数据中心3D场景
export const DatacenterScene = forwardRef<
  DatacenterSceneRef,
  DatacenterSceneProps
>(
  (
    {
      cabinets,
      devices,
      connections,
      templates,
      selectedCabinet,
      selectedDevice,
      highlightedCabinetId,
      highlightedDeviceId,
      onSelectCabinet,
      onSelectDevice,
      showHeatmap = false,
      cabinetTemperatures = [],
    },
    ref,
  ) => {
    const [cameraTarget, setCameraTarget] = useState<
      [number, number, number] | null
    >(null);

    // 计算机柜位置
    const cabinetPositions = useMemo(() => {
      const positions: Record<string, [number, number, number]> = {};
      const rowSpacing = 1.5;
      const colSpacing = 0.8;

      cabinets.forEach((cab) => {
        const x = (cab.column - 1) * colSpacing;
        const y = (cab.uHeight * 0.0445) / 2;
        const z = (cab.row - 1) * rowSpacing;
        positions[cab.id] = [x, y, z];
      });

      return positions;
    }, [cabinets]);

    // 获取机柜内的设备
    const getDevicesByCabinet = (cabinetId: string) => {
      return devices.filter((d) => d.cabinetId === cabinetId);
    };

    // 双击聚焦
    const handleCabinetDoubleClick = useCallback(
      (_cabinet: IDC.Cabinet, position: [number, number, number]) => {
        setCameraTarget(position);
      },
      [],
    );

    const handleDeviceDoubleClick = useCallback(
      (_device: IDC.Device, position: [number, number, number]) => {
        setCameraTarget(position);
      },
      [],
    );

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      focusOnPosition: (position: [number, number, number]) => {
        setCameraTarget(position);
      },
      resetCamera: () => {
        setCameraTarget([4, 1, 4]);
      },
    }));

    return (
      <>
        {/* 相机 */}
        <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={50} />

        {/* 相机动画控制器 */}
        <CameraController
          targetPosition={cameraTarget}
          onAnimationComplete={() => setCameraTarget(null)}
        />

        {/* 环境光 - 增强亮度 */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
        <pointLight position={[-10, 10, -10]} intensity={0.6} />
        <pointLight position={[10, 5, 10]} intensity={0.4} color="#e0e7ff" />

        {/* 地板网格 */}
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#8899aa"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#667788"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          position={[4, 0, 4]}
        />

        {/* 地板 */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[4, -0.01, 4]}
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial
            color="#d0d8e0"
            metalness={0.1}
            roughness={0.9}
          />
        </mesh>

        {/* 渲染机柜 */}
        {cabinets.map((cabinet) => (
          <Cabinet3D
            key={cabinet.id}
            cabinet={cabinet}
            devices={getDevicesByCabinet(cabinet.id)}
            templates={templates}
            position={cabinetPositions[cabinet.id] || [0, 0, 0]}
            selected={selectedCabinet?.id === cabinet.id}
            highlighted={
              highlightedCabinetId === cabinet.id ||
              getDevicesByCabinet(cabinet.id).some(
                (d) => d.id === highlightedDeviceId,
              )
            }
            onSelect={onSelectCabinet}
            onDoubleClick={handleCabinetDoubleClick}
            onDeviceSelect={onSelectDevice}
            onDeviceDoubleClick={handleDeviceDoubleClick}
          />
        ))}

        {/* 热力图叠加层 */}
        <HeatmapOverlay
          cabinetPositions={cabinetPositions}
          cabinetTemperatures={cabinetTemperatures}
          cabinetHeights={cabinets.reduce(
            (acc, cab) => {
              acc[cab.id] = cab.uHeight * 0.0445;
              return acc;
            },
            {} as Record<string, number>,
          )}
          visible={showHeatmap}
        />

        {/* 渲染连线 */}
        {connections.map((conn) => {
          const sourceDevice = devices.find(
            (d) => d.id === conn.sourceDeviceId,
          );
          const targetDevice = devices.find(
            (d) => d.id === conn.targetDeviceId,
          );

          if (!sourceDevice || !targetDevice) return null;

          const sourceCabPos = cabinetPositions[sourceDevice.cabinetId];
          const targetCabPos = cabinetPositions[targetDevice.cabinetId];

          if (!sourceCabPos || !targetCabPos) return null;

          const sourceY = sourceDevice.startU * 0.0445;
          const targetY = targetDevice.startU * 0.0445;

          const points = [
            new THREE.Vector3(sourceCabPos[0], sourceY, sourceCabPos[2] + 0.6),
            new THREE.Vector3(sourceCabPos[0], sourceY, sourceCabPos[2] + 0.8),
            new THREE.Vector3(targetCabPos[0], targetY, targetCabPos[2] + 0.8),
            new THREE.Vector3(targetCabPos[0], targetY, targetCabPos[2] + 0.6),
          ];

          const curve = new THREE.CatmullRomCurve3(points);

          // 高亮相关连线
          const isHighlighted =
            selectedDevice?.id === conn.sourceDeviceId ||
            selectedDevice?.id === conn.targetDeviceId ||
            highlightedDeviceId === conn.sourceDeviceId ||
            highlightedDeviceId === conn.targetDeviceId;

          return (
            <mesh key={conn.id}>
              <tubeGeometry
                args={[curve, 20, isHighlighted ? 0.015 : 0.01, 8, false]}
              />
              <meshStandardMaterial
                color={conn.cableColor || '#3498db'}
                emissive={conn.cableColor || '#3498db'}
                emissiveIntensity={isHighlighted ? 0.5 : 0.2}
              />
            </mesh>
          );
        })}

        {/* 轨道控制器 */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2 - 0.1}
        />
      </>
    );
  },
);

DatacenterScene.displayName = 'DatacenterScene';

export default DatacenterScene;
