import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { DEFAULT_LOD_THRESHOLDS, LODLevel } from './LODManager';
import {
  getRecommendedConfig,
  type RenderOptimizationConfig,
} from './performanceUtils';
import { getDeviceWorldPosition } from './sceneCoordinates';

export function useDatacenterSceneModel({
  cabinets,
  devices,
  layout,
  highlightedCabinetId,
  highlightedDeviceId,
  optimizationConfig,
}: {
  cabinets: IDC.Cabinet[];
  devices: IDC.Device[];
  layout?: IDC.DatacenterLayout;
  highlightedCabinetId: string | null;
  highlightedDeviceId: string | null;
  optimizationConfig?: RenderOptimizationConfig;
}) {
  const { camera } = useThree();
  const effectiveConfig = useMemo(
    () => optimizationConfig || getRecommendedConfig(devices.length),
    [devices.length, optimizationConfig],
  );
  const cabinetPositions = useMemo(() => {
    const positions: Record<string, [number, number, number]> = {};
    for (const cabinet of cabinets) {
      const layoutCabinet = layout?.cabinets?.find(
        (item) => item.cabinetId === cabinet.id,
      );
      positions[cabinet.id] = [
        layoutCabinet ? layoutCabinet.x : (cabinet.column - 1) * 0.8,
        (cabinet.uHeight * 0.0445) / 2,
        layoutCabinet ? layoutCabinet.y : (cabinet.row - 1) * 1.5,
      ];
    }
    return positions;
  }, [cabinets, layout]);
  const cabinetRotations = useMemo(() => {
    const rotations: Record<string, number> = {};
    for (const cabinet of cabinets) {
      const rotation = layout?.cabinets?.find(
        (item) => item.cabinetId === cabinet.id,
      )?.rotation;
      rotations[cabinet.id] = rotation ? (rotation * Math.PI) / 180 : 0;
    }
    return rotations;
  }, [cabinets, layout]);
  const cabinetById = useMemo(
    () => new Map(cabinets.map((cabinet) => [cabinet.id, cabinet])),
    [cabinets],
  );
  const deviceById = useMemo(
    () => new Map(devices.map((device) => [device.id, device])),
    [devices],
  );
  const devicesByCabinet = useMemo(() => {
    const result = new Map<string, IDC.Device[]>();
    for (const device of devices) {
      if (!device.cabinetId) continue;
      const items = result.get(device.cabinetId) || [];
      items.push(device);
      result.set(device.cabinetId, items);
    }
    return result;
  }, [devices]);
  const getDevicesByCabinet = useCallback(
    (cabinetId: string) => devicesByCabinet.get(cabinetId) || [],
    [devicesByCabinet],
  );
  const devicePositions = useMemo(() => {
    const result: Record<string, [number, number, number]> = {};
    for (const device of devices) {
      const cabinet = cabinetById.get(device.cabinetId);
      const position = cabinetPositions[device.cabinetId];
      if (cabinet && position) {
        result[device.id] = getDeviceWorldPosition(position, cabinet, device);
      }
    }
    return result;
  }, [cabinetById, cabinetPositions, devices]);
  const effectiveHighlightedCabinetId =
    highlightedCabinetId ||
    (highlightedDeviceId
      ? deviceById.get(highlightedDeviceId)?.cabinetId || null
      : null);

  const [cabinetLODById, setCabinetLODById] = useState<
    Record<string, LODLevel>
  >({});
  const cabinetLODRef = useRef<Record<string, LODLevel>>({});
  const frameRef = useRef(0);
  const vectorRef = useRef(new THREE.Vector3());
  const lastCameraPositionRef = useRef(new THREE.Vector3());
  const lastCameraQuaternionRef = useRef(new THREE.Quaternion());

  useEffect(() => {
    const initial = Object.fromEntries(
      cabinets.map((cabinet) => [cabinet.id, LODLevel.HIGH]),
    );
    cabinetLODRef.current = initial;
    setCabinetLODById(initial);
  }, [cabinets]);

  useFrame(() => {
    frameRef.current += 1;
    if (frameRef.current % 10 !== 0) return;
    const cameraMoved =
      lastCameraPositionRef.current.distanceToSquared(camera.position) >= 1e-4;
    const cameraRotated =
      1 - Math.abs(lastCameraQuaternionRef.current.dot(camera.quaternion)) >=
      1e-6;
    if (!cameraMoved && !cameraRotated) return;
    lastCameraPositionRef.current.copy(camera.position);
    lastCameraQuaternionRef.current.copy(camera.quaternion);
    const thresholds = effectiveConfig.lodThresholds || DEFAULT_LOD_THRESHOLDS;
    const next: Record<string, LODLevel> = {};
    let changed = false;
    for (const cabinet of cabinets) {
      const position = cabinetPositions[cabinet.id];
      const level = position
        ? getStableLODLevel(
            camera.position.distanceTo(vectorRef.current.set(...position)),
            cabinetLODRef.current[cabinet.id],
            thresholds,
          )
        : LODLevel.HIDDEN;
      next[cabinet.id] = level;
      changed ||= cabinetLODRef.current[cabinet.id] !== level;
    }
    if (changed) {
      cabinetLODRef.current = next;
      setCabinetLODById(next);
    }
  });

  const farCabinetInstances = useMemo(
    () =>
      cabinets
        .filter((cabinet) => cabinetLODById[cabinet.id] === LODLevel.LOW)
        .map((cabinet) => ({
          id: cabinet.id,
          position: cabinetPositions[cabinet.id],
          rotationY: cabinetRotations[cabinet.id] || 0,
          width: 0.6,
          height: cabinet.uHeight * 0.0445,
          depth: 1,
          status: cabinet.status,
        }))
        .filter(
          (
            item,
          ): item is typeof item & {
            position: [number, number, number];
          } => Boolean(item.position),
        ),
    [cabinets, cabinetLODById, cabinetPositions, cabinetRotations],
  );

  return {
    cabinetById,
    cabinetLODById,
    cabinetPositions,
    cabinetRotations,
    deviceById,
    devicePositions,
    effectiveHighlightedCabinetId,
    farCabinetInstances,
    getDevicesByCabinet,
  };
}

function getStableLODLevel(
  distance: number,
  previous: LODLevel | undefined,
  thresholds: typeof DEFAULT_LOD_THRESHOLDS,
) {
  const margin = 0.12;
  if (
    previous === LODLevel.HIGH &&
    distance <= thresholds.high * (1 + margin)
  ) {
    return previous;
  }
  if (
    previous === LODLevel.MEDIUM &&
    distance >= thresholds.high * (1 - margin) &&
    distance <= thresholds.medium * (1 + margin)
  ) {
    return previous;
  }
  if (
    previous === LODLevel.LOW &&
    distance >= thresholds.medium * (1 - margin) &&
    distance <= thresholds.low * (1 + margin)
  ) {
    return previous;
  }
  return distance <= thresholds.high
    ? LODLevel.HIGH
    : distance <= thresholds.medium
      ? LODLevel.MEDIUM
      : distance <= thresholds.low
        ? LODLevel.LOW
        : LODLevel.HIDDEN;
}
