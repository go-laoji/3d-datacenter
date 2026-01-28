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
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { Device3D } from './DeviceModels';
import { HeatmapOverlay } from './HeatmapOverlay';
import type { InfoDensity } from './InfoDisplay';
import { KeyboardController } from './KeyboardControls';
import {
  calculateLODLevel,
  DEFAULT_LOD_THRESHOLDS,
  LODLevel,
  LowDetailDevice,
  MediumDetailDevice,
} from './LODManager';
import {
  getRecommendedConfig,
  type RenderOptimizationConfig,
} from './performanceUtils';
import {
  type ActiveTool,
  BoxSelectDetector,
  createMeasurementLine,
  MeasurementController,
  type MeasurementLine,
  MeasurementManager,
  type MeasurementPoint,
  MeasurementPointIndicator,
  type SelectionBox,
} from './SelectionTools';

// 设备悬停Tooltip组件
const _DeviceTooltip: React.FC<{ device: IDC.Device; visible: boolean }> = ({
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
  // 性能优化配置
  // 性能优化配置
  lodEnabled?: boolean;
  lodThresholds?: { high: number; medium: number; low: number };
  // 信息密度
  infoDensity?: InfoDensity;
  // 框选区域
  selectionBox?: SelectionBox | null;
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
  lodEnabled = true,
  lodThresholds = DEFAULT_LOD_THRESHOLDS,
  infoDensity = 'normal',
}) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [hoveredDevice, setHoveredDevice] = useState<IDC.Device | null>(null);
  const [flashIntensity, setFlashIntensity] = useState(0.8);
  const [lodLevel, setLodLevel] = useState<LODLevel>(LODLevel.HIGH);
  const frameCount = useRef(0);
  const positionVec = useMemo(() => new THREE.Vector3(...position), [position]);

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

  // 使用useFrame实现LOD计算和闪烁动画
  useFrame(({ clock }) => {
    // LOD 计算（每10帧更新一次，减少开销）
    if (lodEnabled) {
      frameCount.current++;
      if (frameCount.current % 10 === 0) {
        const distance = camera.position.distanceTo(positionVec);
        const newLevel = calculateLODLevel(distance, lodThresholds);
        if (newLevel !== lodLevel) {
          setLodLevel(newLevel);
        }
      }
    }

    // 闪烁动画
    if (isWarning) {
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

      {/* 使用LOD优化的3D设备模型渲染 */}
      {devices.map((device) => {
        const deviceY =
          (device.startU - 1) * 0.0445 -
          cabinetHeight / 2 +
          ((device.endU - device.startU + 1) * 0.0445) / 2;
        const deviceHeight = (device.endU - device.startU + 1) * 0.0445;
        const template = templates.find((t) => t.id === device.templateId);
        const category = template?.category || 'other';
        const deviceWidth = cabinetWidth - 0.06;
        const deviceDepth = 0.08;
        const devicePosition: [number, number, number] = [
          0,
          deviceY,
          cabinetDepth / 2 - 0.05,
        ];

        // 根据LOD级别选择不同精度的模型
        if (lodEnabled && lodLevel === LODLevel.HIDDEN) {
          return null; // 超远距离，不渲染
        }

        if (lodEnabled && lodLevel === LODLevel.LOW) {
          // 低精度模型
          return (
            <LowDetailDevice
              key={device.id}
              position={devicePosition}
              width={deviceWidth}
              height={deviceHeight - 0.005}
              depth={deviceDepth}
              color={
                category === 'server'
                  ? '#5c6b7a'
                  : category === 'switch'
                    ? '#2d5a7b'
                    : '#6b7b8c'
              }
              status={device.status}
              onClick={(e) => {
                e.stopPropagation();
                setHoveredDevice(device);
                onDeviceSelect(device);
              }}
            />
          );
        }

        if (lodEnabled && lodLevel === LODLevel.MEDIUM) {
          // 中等精度模型
          return (
            <MediumDetailDevice
              key={device.id}
              position={devicePosition}
              width={deviceWidth}
              height={deviceHeight - 0.005}
              depth={deviceDepth}
              color={
                category === 'server'
                  ? '#5c6b7a'
                  : category === 'switch'
                    ? '#2d5a7b'
                    : '#6b7b8c'
              }
              panelColor="#222"
              status={device.status}
              onClick={(e) => {
                e.stopPropagation();
                setHoveredDevice(device);
                onDeviceSelect(device);
              }}
            />
          );
        }

        // 高精度模型（原始完整模型）
        return (
          <Device3D
            key={device.id}
            device={device}
            template={template}
            category={category}
            position={devicePosition}
            height={deviceHeight - 0.005}
            width={deviceWidth}
            depth={deviceDepth}
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

      {/* 机柜标签 - 根据信息密度显示不同内容 */}
      <Html
        position={[0, cabinetHeight / 2 + 0.1, cabinetDepth / 2]}
        center
        distanceFactor={8}
        zIndexRange={[100, 0]}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            padding: infoDensity === 'compact' ? '2px 6px' : '4px 8px',
            borderRadius: '4px',
            border: `1px solid ${statusColors[cabinet.status] || '#d9d9d9'}`,
            fontSize: '12px',
            whiteSpace: 'nowrap',
            color: '#333',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{cabinet.name}</div>

          {infoDensity !== 'compact' && (
            <div style={{ fontSize: '10px', color: '#666' }}>
              {cabinet.code}
            </div>
          )}

          {infoDensity === 'detailed' && (
            <div style={{ fontSize: '10px', display: 'flex', gap: '4px' }}>
              <span>
                使用率: {Math.round((cabinet.usedU / cabinet.uHeight) * 100)}%
              </span>
              <span style={{ color: statusColors[cabinet.status] }}>
                {cabinet.status === 'normal' ? '正常' : '异常'}
              </span>
            </div>
          )}
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
  // 性能优化配置
  optimizationConfig?: RenderOptimizationConfig;

  // 交互配置
  activeTool?: ActiveTool;
  measurements?: MeasurementLine[];
  onMeasurementsChange?: (measurements: MeasurementLine[]) => void;
  selectedDeviceIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  infoDensity?: InfoDensity;
  // 框选区域
  selectionBox?: SelectionBox | null;
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
      optimizationConfig,
      activeTool,
      measurements,
      onMeasurementsChange,
      selectedDeviceIds,
      onSelectionChange,
      infoDensity,
      selectionBox,
    },
    ref,
  ) => {
    const { camera } = useThree();
    const [cameraTarget, setCameraTarget] = useState<
      [number, number, number] | null
    >(null);

    // 测量工具状态
    const [pendingMeasurementPoint, setPendingMeasurementPoint] =
      useState<MeasurementPoint | null>(null);

    const handleAddMeasurementPoint = useCallback(
      (position: [number, number, number]) => {
        const point: MeasurementPoint = {
          id: `p-${Date.now()}`,
          position,
        };

        if (!pendingMeasurementPoint) {
          setPendingMeasurementPoint(point);
        } else {
          // Create line and call onChange
          const newLine = createMeasurementLine(pendingMeasurementPoint, point);
          onMeasurementsChange?.([...(measurements || []), newLine]);
          setPendingMeasurementPoint(null);
        }
      },
      [pendingMeasurementPoint, measurements, onMeasurementsChange],
    );

    // 清除未完成的测量点当工具切换时
    useEffect(() => {
      if (activeTool !== 'measure') {
        setPendingMeasurementPoint(null);
      }
    }, [activeTool]);

    // 根据设备数量计算推荐的优化配置
    const effectiveConfig = useMemo(() => {
      if (optimizationConfig) return optimizationConfig;
      return getRecommendedConfig(devices.length);
    }, [optimizationConfig, devices.length]);

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
        {/* 背景和氛围 - 恢复明亮风格 */}
        {/* 不需要color background，让Canvas透明透出父容器颜色或默认白色/浅灰 */}
        {/* <color attach="background" args={['#d0d8e0']} /> */}

        {/* 相机 */}
        <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={50} />

        {/* 相机动画控制器 */}
        <CameraController
          targetPosition={cameraTarget}
          onAnimationComplete={() => setCameraTarget(null)}
        />

        {/* 灯光 - 明亮风格 */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.0}
          castShadow
          shadow-mapSize={[2048, 2048]}
        >
          <orthographicCamera
            attach="shadow-camera"
            args={[-30, 30, 30, -30]}
          />
        </directionalLight>
        <hemisphereLight
          intensity={0.4}
          groundColor="#ffffff"
          color="#ffffff"
        />

        {/* 地板网格 */}
        <Grid
          renderOrder={-1}
          position={[0, -0.01, 0]}
          infiniteGrid
          cellSize={1}
          sectionSize={5}
          fadeDistance={50}
          fadeStrength={1}
          cellColor="#d9d9d9"
          sectionColor="#bfbfbf"
        />

        {/* 地面 - 浅灰色 */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.02, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial
            color="#f0f2f5"
            metalness={0.1}
            roughness={0.8}
          />
        </mesh>

        {/* 渲染机柜 - 使用性能优化配置 */}
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
            lodEnabled={effectiveConfig.enableLOD}
            lodThresholds={effectiveConfig.lodThresholds}
            infoDensity={infoDensity}
          />
        ))}

        {/* 交互工具 */}
        <KeyboardController
          onResetView={() => setCameraTarget([4, 1, 4])}
          onEscape={() => {
            onSelectCabinet(null);
            onSelectDevice(null);
            onSelectionChange?.([]);
            setPendingMeasurementPoint(null);
          }}
        />

        {measurements && onMeasurementsChange && (
          <MeasurementManager
            measurements={measurements}
            onRemove={(id) => {
              onMeasurementsChange(measurements.filter((m) => m.id !== id));
            }}
          />
        )}

        {/* 测量交互控制器 */}
        <MeasurementController
          enabled={activeTool === 'measure'}
          onAddPoint={handleAddMeasurementPoint}
        />

        {/* 未完成的测量点提示 */}
        {pendingMeasurementPoint && (
          <MeasurementPointIndicator point={pendingMeasurementPoint} />
        )}

        {/* 框选检测器 */}
        <BoxSelectDetector
          enabled={activeTool === 'boxSelect'}
          selectionBox={selectionBox || null}
          devicePositions={devices.reduce(
            (acc, dev) => {
              // 计算设备的世界坐标（简化版，实际应从 matrixWorld 获取或计算）
              // 这里仅作示意，实际需要精确坐标
              const cab = cabinets.find((c) => c.id === dev.cabinetId);
              if (cab && cabinetPositions[cab.id]) {
                const [cx, cy, cz] = cabinetPositions[cab.id];
                // 假设设备在机柜内的相对位置
                acc[dev.id] = [
                  cx,
                  cy + (dev as any).position * 0.0445,
                  cz + 0.3,
                ];
              }
              return acc;
            },
            {} as Record<string, [number, number, number]>,
          )}
          onSelectionComplete={(ids) => onSelectionChange?.(ids)}
        />

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
