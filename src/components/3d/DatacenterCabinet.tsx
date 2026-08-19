import { Html } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  type SinePulseParams,
  useAnimationRegistry,
} from './AnimationRegistry';
import { Device3D } from './DeviceModels';
import type { InfoDensity } from './InfoDisplay';
import { LODLevel, MediumDetailDevice } from './LODManager';

const U_HEIGHT = 0.0445;
const CABINET_WIDTH = 0.6;
const CABINET_DEPTH = 1;

const statusColors: Record<string, string> = {
  normal: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  offline: '#8c8c8c',
};

interface DatacenterCabinetProps {
  cabinet: IDC.Cabinet;
  devices: IDC.Device[];
  templates: IDC.DeviceTemplate[];
  position: [number, number, number];
  rotationY?: number;
  selected: boolean;
  highlighted: boolean;
  selectedDeviceIds?: string[];
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
  lodLevel?: LODLevel;
  infoDensity?: InfoDensity;
  showLabel?: boolean;
}

export function DatacenterCabinet({
  cabinet,
  devices,
  templates,
  position,
  rotationY = 0,
  selected,
  highlighted,
  selectedDeviceIds = [],
  onSelect,
  onDoubleClick,
  onDeviceSelect,
  onDeviceDoubleClick,
  lodLevel = LODLevel.HIGH,
  infoDensity = 'normal',
  showLabel = true,
}: DatacenterCabinetProps) {
  const [hovered, setHovered] = useState(false);
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string>();
  const statusLightMaterialRef = useRef<THREE.MeshStandardMaterial | null>(
    null,
  );
  const animationIdRef = useRef<string | null>(null);
  const pulseParamsRef = useRef<SinePulseParams>({
    enabled: true,
    base: 0.8,
    amp: 0.7,
    speed: 2,
  });
  const registry = useAnimationRegistry();
  const templateMap = useMemo(
    () => new Map(templates.map((template) => [template.id, template])),
    [templates],
  );
  const cabinetHeight = cabinet.uHeight * U_HEIGHT;
  const usageRate = cabinet.usedU / cabinet.uHeight;
  const isWarning = cabinet.status === 'warning' || cabinet.status === 'error';
  const usageColor =
    usageRate > 0.9 ? '#f5222d' : usageRate > 0.7 ? '#faad14' : '#52c41a';

  useEffect(() => {
    const material = statusLightMaterialRef.current;
    if (!material) return;
    if (isWarning) {
      pulseParamsRef.current.speed = cabinet.status === 'error' ? 4 : 2;
      animationIdRef.current ??= registry.register(material, pulseParamsRef);
    } else {
      if (animationIdRef.current) registry.unregister(animationIdRef.current);
      animationIdRef.current = null;
      material.emissiveIntensity = 0.8;
    }
  }, [cabinet.status, isWarning, registry]);

  useEffect(
    () => () => {
      if (animationIdRef.current) registry.unregister(animationIdRef.current);
    },
    [registry],
  );

  const bodyColor = selected
    ? '#4096ff'
    : highlighted
      ? '#95de64'
      : hovered
        ? '#69b1ff'
        : isWarning
          ? statusColors[cabinet.status]
          : '#5b6c7d';

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect(cabinet);
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onDoubleClick(cabinet, position);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[CABINET_WIDTH, cabinetHeight, CABINET_DEPTH]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.3}
          roughness={0.6}
          transparent
          opacity={0.95}
        />
      </mesh>
      {(selected || highlighted) && (
        <lineSegments>
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(
                CABINET_WIDTH + 0.02,
                cabinetHeight + 0.02,
                CABINET_DEPTH + 0.02,
              ),
            ]}
          />
          <lineBasicMaterial color={selected ? '#4096ff' : '#52c41a'} />
        </lineSegments>
      )}
      <mesh position={[0, 0, CABINET_DEPTH / 2 + 0.01]}>
        <boxGeometry
          args={[CABINET_WIDTH - 0.02, cabinetHeight - 0.02, 0.02]}
        />
        <meshStandardMaterial
          color="#3d4852"
          metalness={0.5}
          roughness={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>
      <mesh position={[-CABINET_WIDTH / 2 - 0.02, 0, CABINET_DEPTH / 2]}>
        <boxGeometry args={[0.02, cabinetHeight * usageRate, 0.02]} />
        <meshStandardMaterial
          color={usageColor}
          emissive={usageColor}
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh
        position={[
          CABINET_WIDTH / 2 - 0.05,
          cabinetHeight / 2 + 0.02,
          CABINET_DEPTH / 2,
        ]}
      >
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial
          ref={statusLightMaterialRef}
          color={statusColors[cabinet.status]}
          emissive={statusColors[cabinet.status]}
          emissiveIntensity={0.8}
        />
      </mesh>
      <CabinetDeviceModels
        cabinetHeight={cabinetHeight}
        devices={devices}
        templateMap={templateMap}
        lodLevel={lodLevel}
        selectedDeviceIds={selectedDeviceIds}
        hoveredDeviceId={hoveredDeviceId}
        onSelect={(device) => {
          setHoveredDeviceId(device.id);
          onDeviceSelect(device);
        }}
        onDoubleClick={(device, localY) =>
          onDeviceDoubleClick(device, [
            position[0],
            position[1] + localY,
            position[2],
          ])
        }
      />
      {(showLabel || hovered) && (
        <CabinetLabel
          cabinet={cabinet}
          cabinetHeight={cabinetHeight}
          density={infoDensity}
        />
      )}
    </group>
  );
}

function CabinetDeviceModels({
  cabinetHeight,
  devices,
  templateMap,
  lodLevel,
  selectedDeviceIds,
  hoveredDeviceId,
  onSelect,
  onDoubleClick,
}: {
  cabinetHeight: number;
  devices: IDC.Device[];
  templateMap: Map<string, IDC.DeviceTemplate>;
  lodLevel: LODLevel;
  selectedDeviceIds: string[];
  hoveredDeviceId?: string;
  onSelect: (device: IDC.Device) => void;
  onDoubleClick: (device: IDC.Device, localY: number) => void;
}) {
  return (
    <>
      {devices.map((device) => {
        const localY =
          (device.startU - 1) * U_HEIGHT -
          cabinetHeight / 2 +
          ((device.endU - device.startU + 1) * U_HEIGHT) / 2;
        const height = (device.endU - device.startU + 1) * U_HEIGHT - 0.005;
        const template = templateMap.get(device.templateId);
        const category = template?.category || 'other';
        const position: [number, number, number] = [
          0,
          localY,
          CABINET_DEPTH / 2 - 0.05,
        ];
        if (lodLevel === LODLevel.MEDIUM) {
          return (
            <MediumDetailDevice
              key={device.id}
              position={position}
              width={CABINET_WIDTH - 0.06}
              height={height}
              depth={0.08}
              color={
                category === 'server'
                  ? '#5c6b7a'
                  : category === 'switch'
                    ? '#2d5a7b'
                    : '#6b7b8c'
              }
              panelColor="#222"
              status={device.status}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(device);
              }}
            />
          );
        }
        if (lodLevel !== LODLevel.HIGH) return null;
        return (
          <Device3D
            key={device.id}
            device={device}
            template={template}
            category={category}
            position={position}
            height={height}
            width={CABINET_WIDTH - 0.06}
            depth={0.08}
            selected={
              hoveredDeviceId === device.id ||
              selectedDeviceIds.includes(device.id)
            }
            onSelect={onSelect}
            onDoubleClick={(selectedDevice) =>
              onDoubleClick(selectedDevice, localY)
            }
          />
        );
      })}
    </>
  );
}

function CabinetLabel({
  cabinet,
  cabinetHeight,
  density,
}: {
  cabinet: IDC.Cabinet;
  cabinetHeight: number;
  density: InfoDensity;
}) {
  return (
    <Html
      position={[0, cabinetHeight / 2 + 0.1, CABINET_DEPTH / 2]}
      center
      distanceFactor={8}
      zIndexRange={[100, 0]}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          padding: density === 'compact' ? '2px 6px' : '4px 8px',
          border: `1px solid ${statusColors[cabinet.status] || '#d9d9d9'}`,
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#333',
          fontSize: 12,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        <strong>{cabinet.name}</strong>
        {density !== 'compact' && (
          <span style={{ color: '#666', fontSize: 10 }}>{cabinet.code}</span>
        )}
        {density === 'detailed' && (
          <span style={{ fontSize: 10 }}>
            使用率 {Math.round((cabinet.usedU / cabinet.uHeight) * 100)}% ·{' '}
            <span style={{ color: statusColors[cabinet.status] }}>
              {cabinet.status === 'normal' ? '正常' : '异常'}
            </span>
          </span>
        )}
      </div>
    </Html>
  );
}

export const Cabinet3D = DatacenterCabinet;
