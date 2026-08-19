import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { AnimationRegistryProvider } from './AnimationRegistry';
import { Cabinet3D } from './DatacenterCabinet';
import {
  CameraController,
  ConnectionMeshes,
  SceneEnvironment,
} from './DatacenterScenePrimitives';
import { HeatmapOverlay } from './HeatmapOverlay';
import type { InfoDensity } from './InfoDisplay';
import { InstancedCabinets } from './InstancedCabinets';
import { KeyboardController } from './KeyboardControls';
import { LODLevel } from './LODManager';
import type { RenderOptimizationConfig } from './performanceUtils';
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
import { useDatacenterSceneModel } from './useDatacenterSceneModel';

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
  templates: IDC.DeviceTemplate[];
  layout?: IDC.DatacenterLayout;
  selectedCabinet: IDC.Cabinet | null;
  selectedDevice: IDC.Device | null;
  highlightedCabinetId: string | null;
  highlightedDeviceId: string | null;
  onSelectCabinet: (cabinet: IDC.Cabinet | null) => void;
  onSelectDevice: (device: IDC.Device | null) => void;
  showHeatmap?: boolean;
  cabinetTemperatures?: CabinetTemperature[];
  optimizationConfig?: RenderOptimizationConfig;
  activeTool?: ActiveTool;
  measurements?: MeasurementLine[];
  onMeasurementsChange?: (measurements: MeasurementLine[]) => void;
  selectedDeviceIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  infoDensity?: InfoDensity;
  selectionBox?: SelectionBox | null;
}

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
      layout,
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
      measurements = [],
      onMeasurementsChange,
      selectedDeviceIds = [],
      onSelectionChange,
      infoDensity,
      selectionBox,
    },
    ref,
  ) => {
    const [cameraTarget, setCameraTarget] = useState<
      [number, number, number] | null
    >(null);
    const [pendingMeasurementPoint, setPendingMeasurementPoint] =
      useState<MeasurementPoint | null>(null);
    const scene = useDatacenterSceneModel({
      cabinets,
      devices,
      layout,
      highlightedCabinetId,
      highlightedDeviceId,
      optimizationConfig,
    });
    const cabinetHeights = useMemo(
      () =>
        Object.fromEntries(
          cabinets.map((cabinet) => [cabinet.id, cabinet.uHeight * 0.0445]),
        ),
      [cabinets],
    );

    const handleAddMeasurementPoint = useCallback(
      (position: [number, number, number]) => {
        const point: MeasurementPoint = {
          id: `p-${Date.now()}`,
          position,
        };
        if (!pendingMeasurementPoint) {
          setPendingMeasurementPoint(point);
          return;
        }
        onMeasurementsChange?.([
          ...measurements,
          createMeasurementLine(pendingMeasurementPoint, point),
        ]);
        setPendingMeasurementPoint(null);
      },
      [measurements, onMeasurementsChange, pendingMeasurementPoint],
    );

    useEffect(() => {
      if (activeTool !== 'measure') setPendingMeasurementPoint(null);
    }, [activeTool]);

    useImperativeHandle(ref, () => ({
      focusOnPosition: setCameraTarget,
      resetCamera: () => setCameraTarget([4, 1, 4]),
    }));

    return (
      <AnimationRegistryProvider>
        <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={50} />
        <CameraController
          targetPosition={cameraTarget}
          onAnimationComplete={() => setCameraTarget(null)}
        />
        <SceneEnvironment layout={layout} />
        <InstancedCabinets
          instances={scene.farCabinetInstances}
          selectedId={selectedCabinet?.id || null}
          highlightedId={scene.effectiveHighlightedCabinetId}
          onClickCabinet={(cabinetId) => {
            const cabinet = scene.cabinetById.get(cabinetId);
            if (cabinet) onSelectCabinet(cabinet);
          }}
          onDoubleClickCabinet={(cabinetId) => {
            const position = scene.cabinetPositions[cabinetId];
            if (position) setCameraTarget(position);
          }}
        />
        {cabinets.map((cabinet) => {
          const lodLevel = scene.cabinetLODById[cabinet.id] || LODLevel.HIGH;
          if (lodLevel === LODLevel.LOW || lodLevel === LODLevel.HIDDEN) {
            return null;
          }
          const highlighted =
            scene.effectiveHighlightedCabinetId === cabinet.id;
          return (
            <Cabinet3D
              key={cabinet.id}
              cabinet={cabinet}
              devices={scene.getDevicesByCabinet(cabinet.id)}
              templates={templates}
              position={scene.cabinetPositions[cabinet.id] || [0, 0, 0]}
              rotationY={scene.cabinetRotations[cabinet.id] || 0}
              selected={selectedCabinet?.id === cabinet.id}
              highlighted={highlighted}
              selectedDeviceIds={selectedDeviceIds}
              onSelect={onSelectCabinet}
              onDoubleClick={(_item, position) => setCameraTarget(position)}
              onDeviceSelect={onSelectDevice}
              onDeviceDoubleClick={(_item, position) =>
                setCameraTarget(position)
              }
              lodLevel={lodLevel}
              infoDensity={infoDensity}
              showLabel={selectedCabinet?.id === cabinet.id || highlighted}
            />
          );
        })}
        <KeyboardController
          onResetView={() => setCameraTarget([4, 1, 4])}
          onEscape={() => {
            onSelectCabinet(null);
            onSelectDevice(null);
            onSelectionChange?.([]);
            setPendingMeasurementPoint(null);
          }}
        />
        {onMeasurementsChange && (
          <MeasurementManager
            measurements={measurements}
            onRemove={(id) =>
              onMeasurementsChange(
                measurements.filter((measurement) => measurement.id !== id),
              )
            }
          />
        )}
        <MeasurementController
          enabled={activeTool === 'measure'}
          onAddPoint={handleAddMeasurementPoint}
        />
        {pendingMeasurementPoint && (
          <MeasurementPointIndicator point={pendingMeasurementPoint} />
        )}
        <BoxSelectDetector
          enabled={activeTool === 'boxSelect'}
          selectionBox={selectionBox || null}
          devicePositions={scene.devicePositions}
          onSelectionComplete={(ids) => onSelectionChange?.(ids)}
        />
        <HeatmapOverlay
          cabinetPositions={scene.cabinetPositions}
          cabinetTemperatures={cabinetTemperatures}
          cabinetHeights={cabinetHeights}
          visible={showHeatmap}
        />
        <ConnectionMeshes
          connections={connections}
          deviceById={scene.deviceById}
          cabinetPositions={scene.cabinetPositions}
          selectedDeviceId={selectedDevice?.id}
          highlightedDeviceId={highlightedDeviceId}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2 - 0.1}
        />
      </AnimationRegistryProvider>
    );
  },
);

DatacenterScene.displayName = 'DatacenterScene';

export { Cabinet3D } from './DatacenterCabinet';
export default DatacenterScene;
