import { Grid } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const U_HEIGHT = 0.0445;

export function CameraController({
  targetPosition,
  onAnimationComplete,
}: {
  targetPosition: [number, number, number] | null;
  onAnimationComplete: () => void;
}) {
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
    if (!isAnimating.current || !targetRef.current) return;
    camera.position.lerp(targetRef.current, 0.05);
    if (camera.position.distanceTo(targetRef.current) < 0.1) {
      isAnimating.current = false;
      targetRef.current = null;
      onAnimationComplete();
    }
  });
  return null;
}

export function SceneEnvironment({
  layout,
}: {
  layout?: IDC.DatacenterLayout;
}) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      >
        <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30]} />
      </directionalLight>
      <hemisphereLight intensity={0.4} groundColor="#ffffff" color="#ffffff" />
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
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#f0f2f5" metalness={0.1} roughness={0.8} />
      </mesh>
      {(layout?.zones || []).map((zone) => {
        const color =
          zone.color ||
          (zone.type === 'hot_aisle'
            ? '#f5222d'
            : zone.type === 'cold_aisle'
              ? '#1677ff'
              : zone.type === 'restricted'
                ? '#faad14'
                : '#52c41a');
        return (
          <mesh
            key={zone.id}
            rotation={[-Math.PI / 2, ((zone.rotation || 0) * Math.PI) / 180, 0]}
            position={[
              zone.x + zone.width / 2,
              -0.019,
              zone.y + zone.height / 2,
            ]}
            receiveShadow
          >
            <planeGeometry args={[zone.width, zone.height]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.24}
              roughness={1}
            />
          </mesh>
        );
      })}
    </>
  );
}

export function ConnectionMeshes({
  connections,
  deviceById,
  cabinetPositions,
  selectedDeviceId,
  highlightedDeviceId,
}: {
  connections: IDC.Connection[];
  deviceById: Map<string, IDC.Device>;
  cabinetPositions: Record<string, [number, number, number]>;
  selectedDeviceId?: string;
  highlightedDeviceId?: string | null;
}) {
  return (
    <>
      {connections.map((connection) => {
        const source = deviceById.get(connection.sourceDeviceId);
        const target = deviceById.get(connection.targetDeviceId);
        if (!source || !target) return null;
        const sourceCabinet = cabinetPositions[source.cabinetId];
        const targetCabinet = cabinetPositions[target.cabinetId];
        if (!sourceCabinet || !targetCabinet) return null;
        const sourceY = source.startU * U_HEIGHT;
        const targetY = target.startU * U_HEIGHT;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sourceCabinet[0], sourceY, sourceCabinet[2] + 0.6),
          new THREE.Vector3(sourceCabinet[0], sourceY, sourceCabinet[2] + 0.8),
          new THREE.Vector3(targetCabinet[0], targetY, targetCabinet[2] + 0.8),
          new THREE.Vector3(targetCabinet[0], targetY, targetCabinet[2] + 0.6),
        ]);
        const highlighted =
          selectedDeviceId === connection.sourceDeviceId ||
          selectedDeviceId === connection.targetDeviceId ||
          highlightedDeviceId === connection.sourceDeviceId ||
          highlightedDeviceId === connection.targetDeviceId;
        return (
          <mesh key={connection.id}>
            <tubeGeometry
              args={[curve, 20, highlighted ? 0.015 : 0.01, 8, false]}
            />
            <meshStandardMaterial
              color={connection.cableColor || '#3498db'}
              emissive={connection.cableColor || '#3498db'}
              emissiveIntensity={highlighted ? 0.5 : 0.2}
            />
          </mesh>
        );
      })}
    </>
  );
}
