import { Html, Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

export interface MeasurementPoint {
  id: string;
  position: [number, number, number];
  label?: string;
}

export interface MeasurementLine {
  id: string;
  start: MeasurementPoint;
  end: MeasurementPoint;
  distance: number;
}

export function calculateDistance(
  first: [number, number, number],
  second: [number, number, number],
) {
  const dx = second[0] - first[0];
  const dy = second[1] - first[1];
  const dz = second[2] - first[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function createMeasurementLine(
  start: MeasurementPoint,
  end: MeasurementPoint,
): MeasurementLine {
  return {
    id: `measurement-${Date.now()}`,
    start,
    end,
    distance: calculateDistance(start.position, end.position),
  };
}

export function MeasurementController({
  enabled,
  onAddPoint,
}: {
  enabled: boolean;
  onAddPoint: (position: [number, number, number]) => void;
}) {
  const { camera, gl, scene, raycaster } = useThree();
  useEffect(() => {
    if (!enabled) return;
    const canvas = gl.domElement;
    const onPointerUp = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster
        .intersectObjects(scene.children, true)
        .find(
          (intersection) =>
            intersection.object.visible && intersection.object.type === 'Mesh',
        );
      if (hit) onAddPoint(hit.point.toArray());
    };
    canvas.addEventListener('pointerup', onPointerUp);
    return () => canvas.removeEventListener('pointerup', onPointerUp);
  }, [camera, enabled, gl, onAddPoint, raycaster, scene]);
  return null;
}

function MeasurementLineRenderer({
  measurement,
  onRemove,
}: {
  measurement: MeasurementLine;
  onRemove: (id: string) => void;
}) {
  const center: [number, number, number] = [
    (measurement.start.position[0] + measurement.end.position[0]) / 2,
    (measurement.start.position[1] + measurement.end.position[1]) / 2,
    (measurement.start.position[2] + measurement.end.position[2]) / 2,
  ];
  return (
    <group>
      <Line
        points={[measurement.start.position, measurement.end.position]}
        color="#ff6b6b"
        lineWidth={2}
        dashed
        dashScale={10}
      />
      {[measurement.start.position, measurement.end.position].map(
        (position) => (
          <mesh key={position.join('-')} position={position}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#ff6b6b" />
          </mesh>
        ),
      )}
      <Html position={center} center distanceFactor={8}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            borderRadius: 4,
            background: 'rgba(255, 107, 107, 0.95)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          <span>{measurement.distance.toFixed(2)}m</span>
          <button
            type="button"
            onClick={() => onRemove(measurement.id)}
            aria-label={`删除 ${measurement.distance.toFixed(2)} 米的测量结果`}
            style={{
              width: 18,
              height: 18,
              padding: 0,
              border: 'none',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      </Html>
    </group>
  );
}

export function MeasurementManager({
  measurements,
  onRemove,
}: {
  measurements: MeasurementLine[];
  onRemove: (id: string) => void;
}) {
  return (
    <group>
      {measurements.map((measurement) => (
        <MeasurementLineRenderer
          key={measurement.id}
          measurement={measurement}
          onRemove={onRemove}
        />
      ))}
    </group>
  );
}

export function MeasurementPointIndicator({
  point,
}: {
  point: MeasurementPoint;
}) {
  return (
    <group position={point.position}>
      <mesh>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#4096ff" transparent opacity={0.8} />
      </mesh>
      <Html center distanceFactor={6}>
        <div
          style={{
            padding: '2px 6px',
            borderRadius: 3,
            background: '#4096ff',
            color: '#fff',
            fontSize: 10,
            whiteSpace: 'nowrap',
          }}
        >
          起点
        </div>
      </Html>
    </group>
  );
}
