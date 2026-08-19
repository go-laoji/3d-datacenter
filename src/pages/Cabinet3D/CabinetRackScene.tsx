import {
  Grid,
  Html,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Device3D } from '@/components/3d/DeviceModels';
import { type CabinetViewPreset, findEmptyUSlots } from './cabinet3dModel';

const uHeightInMeters = 0.0445;

interface CameraPresetControllerProps {
  preset: CabinetViewPreset;
  cabinetHeight: number;
}

function CameraPresetController({
  preset,
  cabinetHeight,
}: CameraPresetControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    const distance = Math.max(cabinetHeight * 1.65, 3);
    const positions: Record<CabinetViewPreset, [number, number, number]> = {
      overview: [1.25, cabinetHeight * 0.72, distance],
      front: [0, cabinetHeight * 0.5, distance],
      rear: [0, cabinetHeight * 0.5, -distance],
      left: [-distance, cabinetHeight * 0.5, 0],
    };
    camera.position.set(...positions[preset]);
    camera.lookAt(0, cabinetHeight * 0.5, 0);
    camera.updateProjectionMatrix();
  }, [camera, cabinetHeight, preset]);

  return null;
}

interface CabinetRackSceneProps {
  cabinet: IDC.Cabinet;
  devices: IDC.Device[];
  allDevices: IDC.Device[];
  templates: IDC.DeviceTemplate[];
  devicePorts: Record<string, IDC.Port[]>;
  selectedDevice: IDC.Device | null;
  preset: CabinetViewPreset;
  showDoor: boolean;
  showEmptySlots: boolean;
  exploded: boolean;
  onDeviceSelect: (device: IDC.Device) => void;
}

export function CabinetRackScene({
  cabinet,
  devices,
  allDevices,
  templates,
  devicePorts,
  selectedDevice,
  preset,
  showDoor,
  showEmptySlots,
  exploded,
  onDeviceSelect,
}: CabinetRackSceneProps) {
  const width = 0.62;
  const depth = 0.5;
  const height = cabinet.uHeight * uHeightInMeters;
  const emptySlots = useMemo(
    () => findEmptyUSlots(cabinet.uHeight, allDevices),
    [allDevices, cabinet.uHeight],
  );
  const uLabels = useMemo(() => {
    const labels = Array.from(
      { length: Math.floor(cabinet.uHeight / 5) },
      (_, index) => index * 5 + 1,
    );
    if (!labels.includes(cabinet.uHeight)) labels.push(cabinet.uHeight);
    return labels;
  }, [cabinet.uHeight]);
  const showRear = preset === 'rear';

  return (
    <>
      <PerspectiveCamera makeDefault fov={42} />
      <CameraPresetController preset={preset} cabinetHeight={height} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 8, 8]} intensity={1.1} castShadow />
      <directionalLight position={[-4, 5, -5]} intensity={0.55} />

      <group>
        {[-1, 1].map((side) => (
          <mesh
            key={`post-${side}`}
            position={[side * (width / 2), height / 2, 0]}
            castShadow
          >
            <boxGeometry args={[0.035, height, depth]} />
            <meshStandardMaterial color="#344054" metalness={0.65} />
          </mesh>
        ))}
        {[0, height].map((y) => (
          <mesh key={`rail-${y}`} position={[0, y, 0]} castShadow>
            <boxGeometry args={[width, 0.04, depth]} />
            <meshStandardMaterial color="#344054" metalness={0.65} />
          </mesh>
        ))}

        {showDoor && (
          <mesh position={[0, height / 2, depth / 2 + 0.045]}>
            <boxGeometry args={[width - 0.06, height - 0.08, 0.025]} />
            <meshStandardMaterial
              color="#84a8c7"
              transparent
              opacity={0.22}
              metalness={0.4}
              roughness={0.2}
            />
          </mesh>
        )}

        {showEmptySlots &&
          emptySlots.map((slot) => {
            const slotHeight = (slot.endU - slot.startU + 1) * uHeightInMeters;
            const y = ((slot.startU + slot.endU) / 2 - 0.5) * uHeightInMeters;
            return (
              <mesh
                key={`${slot.startU}-${slot.endU}`}
                position={[0, y, depth / 2 + 0.012]}
              >
                <boxGeometry args={[width - 0.09, slotHeight - 0.006, 0.018]} />
                <meshStandardMaterial
                  color="#b8c4d2"
                  transparent
                  opacity={0.28}
                />
              </mesh>
            );
          })}

        {devices.map((device, index) => {
          const template = templates.find(
            (candidate) => candidate.id === device.templateId,
          );
          const deviceHeight =
            (device.endU - device.startU + 1) * uHeightInMeters;
          const deviceY =
            ((device.startU + device.endU) / 2 - 0.5) * uHeightInMeters;
          const offset = exploded ? 0.14 + index * 0.045 : 0;
          const abnormal =
            device.status === 'warning' || device.status === 'error';
          return (
            <group key={device.id}>
              <Device3D
                device={device}
                template={template}
                ports={devicePorts[device.id]}
                category={template?.category || 'other'}
                position={[
                  0,
                  deviceY,
                  (showRear ? -1 : 1) * (depth / 2 + 0.025 + offset),
                ]}
                height={Math.max(deviceHeight - 0.01, 0.03)}
                width={width - 0.1}
                depth={0.14}
                selected={selectedDevice?.id === device.id}
                showRear={showRear}
                showTooltip={false}
                onSelect={onDeviceSelect}
              />
              {(selectedDevice?.id === device.id || abnormal) && (
                <Html
                  center
                  position={[
                    0,
                    deviceY + deviceHeight / 2 + 0.08,
                    (showRear ? -1 : 1) * (depth / 2 + 0.2 + offset),
                  ]}
                >
                  <div
                    style={{
                      background: abnormal ? '#fff1f0' : '#e6f4ff',
                      border: `1px solid ${abnormal ? '#ff7875' : '#69b1ff'}`,
                      borderRadius: 4,
                      color: '#1f2937',
                      fontSize: 11,
                      padding: '3px 7px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {device.name} · U{device.startU}-U{device.endU}
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>

      {uLabels.map((u) => (
        <Html
          key={`u-${u}`}
          center
          position={[-width / 2 - 0.13, (u - 0.5) * uHeightInMeters, 0]}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.96)',
              border: '1px solid #d0d5dd',
              borderRadius: 4,
              color: '#475467',
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 6px',
            }}
          >
            U{u}
          </div>
        </Html>
      ))}

      <Grid
        position={[0, -0.04, 0]}
        args={[8, 8]}
        cellSize={0.25}
        sectionSize={1}
        fadeDistance={8}
        cellColor="#cbd5e1"
        sectionColor="#94a3b8"
      />
      <OrbitControls
        makeDefault
        target={[0, height / 2, 0]}
        enableDamping
        minDistance={1.6}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}
