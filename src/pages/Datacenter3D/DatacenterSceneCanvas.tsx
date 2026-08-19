import { Canvas } from '@react-three/fiber';
import { Button, Card, Empty, Space, Spin, Tag } from 'antd';
import { Suspense, useMemo, useState } from 'react';
import {
  DatacenterScene,
  type DatacenterSceneRef,
} from '@/components/3d/DatacenterScene';
import { HeatmapLegend } from '@/components/3d/HeatmapOverlay';
import type { InfoDensity } from '@/components/3d/InfoDisplay';
import {
  type ActiveTool,
  BoxSelectOverlay,
  type MeasurementLine,
  type SelectionBox,
  SelectionToolbar,
} from '@/components/3d/SelectionTools';
import type {
  SceneLodProfile,
  SceneStatusFilter,
  SceneViewMode,
} from './datacenter3dModel';
import styles from './index.less';
import type { CabinetTemperature } from './useDatacenter3DData';

const optimizationProfiles = {
  detail: {
    enableLOD: true,
    enableInstancing: true,
    lodThresholds: { high: 5, medium: 12, low: 22 },
    enableFrustumCulling: true,
    enableOcclusionCulling: true,
    maxVisibleDevices: 1000,
    updateFrequency: 5,
  },
  balanced: {
    enableLOD: true,
    enableInstancing: true,
    lodThresholds: { high: 3, medium: 8, low: 15 },
    enableFrustumCulling: true,
    enableOcclusionCulling: true,
    maxVisibleDevices: 600,
    updateFrequency: 10,
  },
  performance: {
    enableLOD: true,
    enableInstancing: true,
    lodThresholds: { high: 2, medium: 5, low: 10 },
    enableFrustumCulling: true,
    enableOcclusionCulling: true,
    maxVisibleDevices: 250,
    updateFrequency: 15,
  },
} as const;

interface DatacenterSceneCanvasProps {
  sceneRef: React.RefObject<DatacenterSceneRef | null>;
  sceneKey: string;
  cabinets: IDC.Cabinet[];
  devices: IDC.Device[];
  connections: IDC.Connection[];
  templates: IDC.DeviceTemplate[];
  layout: IDC.DatacenterLayout | null;
  temperatures: CabinetTemperature[];
  selectedCabinet: IDC.Cabinet | null;
  selectedDevice: IDC.Device | null;
  highlightedCabinetId: string | null;
  highlightedDeviceId: string | null;
  mode: SceneViewMode;
  statusFilter: SceneStatusFilter;
  infoDensity: InfoDensity;
  lodProfile: SceneLodProfile;
  loading: boolean;
  onCabinetSelect: (cabinet: IDC.Cabinet | null) => void;
  onDeviceSelect: (device: IDC.Device | null) => void;
  onClearFilter: () => void;
}

export function DatacenterSceneCanvas({
  sceneRef,
  sceneKey,
  cabinets,
  devices,
  connections,
  templates,
  layout,
  temperatures,
  selectedCabinet,
  selectedDevice,
  highlightedCabinetId,
  highlightedDeviceId,
  mode,
  statusFilter,
  infoDensity,
  lodProfile,
  loading,
  onCabinetSelect,
  onDeviceSelect,
  onClearFilter,
}: DatacenterSceneCanvasProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementLine[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const visibleDeviceIds = useMemo(
    () => new Set(devices.map((device) => device.id)),
    [devices],
  );
  const visibleConnections = useMemo(
    () =>
      connections.filter(
        (connection) =>
          visibleDeviceIds.has(connection.sourceDeviceId) &&
          visibleDeviceIds.has(connection.targetDeviceId),
      ),
    [connections, visibleDeviceIds],
  );
  const showHeatmap = mode === 'temperature';

  if (loading && cabinets.length === 0) {
    return (
      <div className={styles.canvasContainer}>
        <div className={styles.loading}>
          <Spin size="large" />
          <span>正在加载 3D 场景</span>
        </div>
      </div>
    );
  }

  if (cabinets.length === 0) {
    return (
      <div className={styles.canvasContainer}>
        <Empty
          className={styles.emptyScene}
          description={
            statusFilter === 'all'
              ? '该数据中心暂无可展示的机柜'
              : '当前状态筛选下没有机柜或设备'
          }
        >
          {statusFilter !== 'all' && (
            <Button onClick={onClearFilter}>查看全部状态</Button>
          )}
        </Empty>
      </div>
    );
  }

  return (
    <div className={styles.canvasContainer}>
      <div className={styles.sceneModeBadge} aria-live="polite">
        <Tag
          color={
            showHeatmap ? 'volcano' : mode === 'capacity' ? 'cyan' : 'blue'
          }
        >
          {showHeatmap
            ? '温度热力'
            : mode === 'capacity'
              ? '容量视图'
              : '运行视图'}
        </Tag>
        <Tag>
          {lodProfile === 'detail'
            ? '精细 LOD'
            : lodProfile === 'performance'
              ? '流畅 LOD'
              : '均衡 LOD'}
        </Tag>
      </div>

      {showHeatmap && (
        <div className={styles.heatmapLegend}>
          <HeatmapLegend />
        </div>
      )}

      <BoxSelectOverlay
        enabled={activeTool === 'boxSelect'}
        onSelectionBox={setSelectionBox}
      />
      <SelectionToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        measurementCount={measurements.length}
        onClearMeasurements={() => setMeasurements([])}
      />

      {selectedDeviceIds.length > 0 && (
        <Card size="small" className={styles.selectionSummary}>
          <Space>
            <span>已选 {selectedDeviceIds.length} 台设备</span>
            <Button size="small" onClick={() => setSelectedDeviceIds([])}>
              清除选择
            </Button>
          </Space>
        </Card>
      )}

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [8, 8, 8], fov: 45 }}
        style={{ height: '100%', width: '100%' }}
      >
        <Suspense fallback={null}>
          <DatacenterScene
            key={sceneKey}
            ref={sceneRef}
            cabinets={cabinets}
            devices={devices}
            templates={templates}
            layout={layout || undefined}
            selectedCabinet={selectedCabinet}
            selectedDevice={selectedDevice}
            connections={visibleConnections}
            showHeatmap={showHeatmap}
            cabinetTemperatures={temperatures}
            onSelectCabinet={onCabinetSelect}
            onSelectDevice={onDeviceSelect}
            highlightedDeviceId={highlightedDeviceId}
            highlightedCabinetId={highlightedCabinetId}
            optimizationConfig={optimizationProfiles[lodProfile]}
            activeTool={activeTool}
            measurements={measurements}
            onMeasurementsChange={setMeasurements}
            selectedDeviceIds={selectedDeviceIds}
            selectionBox={selectionBox}
            onSelectionChange={setSelectedDeviceIds}
            infoDensity={infoDensity}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
