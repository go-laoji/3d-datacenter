import { type ThreeEvent, useFrame } from '@react-three/fiber';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

type CabinetInstance = {
  id: string;
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
  depth: number;
  status: string;
};

export function InstancedCabinets({
  instances,
  selectedId,
  highlightedId,
  onClickCabinet,
  onDoubleClickCabinet,
}: {
  instances: CabinetInstance[];
  selectedId?: string | null;
  highlightedId?: string | null;
  onClickCabinet?: (id: string) => void;
  onDoubleClickCabinet?: (
    id: string,
    position: [number, number, number],
  ) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const normalStatusMeshRef = useRef<THREE.InstancedMesh>(null);
  const warningStatusMeshRef = useRef<THREE.InstancedMesh>(null);
  const errorStatusMeshRef = useRef<THREE.InstancedMesh>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const prevSelectedIdRef = useRef<string | null>(null);
  const prevHighlightedIdRef = useRef<string | null>(null);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const statusGeometry = useMemo(
    () => new THREE.SphereGeometry(0.02, 10, 10),
    [],
  );
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.6,
        transparent: true,
        opacity: 0.95,
        vertexColors: true,
      }),
    [],
  );

  const normalStatusMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#52c41a'),
        emissive: new THREE.Color('#52c41a'),
        emissiveIntensity: 0.8,
      }),
    [],
  );
  const warningStatusMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#faad14'),
        emissive: new THREE.Color('#faad14'),
        emissiveIntensity: 0.8,
      }),
    [],
  );
  const errorStatusMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f5222d'),
        emissive: new THREE.Color('#f5222d'),
        emissiveIntensity: 0.8,
      }),
    [],
  );

  const statusColors = useMemo(
    () => ({
      normal: new THREE.Color('#5b6c7d'),
      warning: new THREE.Color('#faad14'),
      error: new THREE.Color('#f5222d'),
      offline: new THREE.Color('#8c8c8c'),
    }),
    [],
  );

  const baseColor = useMemo(() => new THREE.Color('#5b6c7d'), []);
  const hoverColor = useMemo(() => new THREE.Color('#69b1ff'), []);
  const selectedOutlineColor = useMemo(() => new THREE.Color('#4096ff'), []);
  const highlightedOutlineColor = useMemo(() => new THREE.Color('#95de64'), []);

  const idToIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < instances.length; i++) map.set(instances[i].id, i);
    return map;
  }, [instances]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      statusGeometry.dispose();
      material.dispose();
      normalStatusMaterial.dispose();
      warningStatusMaterial.dispose();
      errorStatusMaterial.dispose();
    };
  }, [
    errorStatusMaterial,
    geometry,
    material,
    normalStatusMaterial,
    statusGeometry,
    warningStatusMaterial,
  ]);

  const statusCounts = useMemo(() => {
    let normal = 0;
    let warning = 0;
    let error = 0;
    for (const inst of instances) {
      if (inst.status === 'error') error++;
      else if (inst.status === 'warning') warning++;
      else normal++;
    }
    return { normal, warning, error };
  }, [instances]);

  useEffect(() => {
    if (!meshRef.current) return;
    const tempMatrix = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const statusPos = new THREE.Vector3();
    const oneScale = new THREE.Vector3(1, 1, 1);
    const pos = new THREE.Vector3();
    let normalIdx = 0;
    let warningIdx = 0;
    let errorIdx = 0;

    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      euler.set(0, inst.rotationY, 0);
      q.setFromEuler(euler);
      tempMatrix.compose(
        pos.set(inst.position[0], inst.position[1], inst.position[2]),
        q,
        new THREE.Vector3(inst.width, inst.height, inst.depth),
      );
      meshRef.current.setMatrixAt(i, tempMatrix);

      statusPos.set(
        inst.position[0] + inst.width / 2 - 0.05,
        inst.position[1] + inst.height / 2 + 0.02,
        inst.position[2] + inst.depth / 2,
      );
      tempMatrix.compose(statusPos, q, oneScale);
      if (inst.status === 'error') {
        errorStatusMeshRef.current?.setMatrixAt(errorIdx++, tempMatrix);
      } else if (inst.status === 'warning') {
        warningStatusMeshRef.current?.setMatrixAt(warningIdx++, tempMatrix);
      } else {
        normalStatusMeshRef.current?.setMatrixAt(normalIdx++, tempMatrix);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (normalStatusMeshRef.current) {
      normalStatusMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (warningStatusMeshRef.current) {
      warningStatusMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (errorStatusMeshRef.current) {
      errorStatusMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [
    instances,
    statusCounts.error,
    statusCounts.normal,
    statusCounts.warning,
  ]);

  const frameRef = useRef(0);
  useFrame(({ clock }) => {
    frameRef.current++;
    if (frameRef.current % 2 !== 0) return;
    const t = clock.getElapsedTime();
    if (statusCounts.warning > 0) {
      warningStatusMaterial.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.7;
    }
    if (statusCounts.error > 0) {
      errorStatusMaterial.emissiveIntensity = 0.8 + Math.sin(t * 4) * 0.7;
    }
  });

  const setColorAt = useCallback((i: number, color: THREE.Color) => {
    if (!meshRef.current) return;
    meshRef.current.setColorAt(i, color);
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
  }, []);

  const applyBaseColorAt = useCallback(
    (i: number) => {
      const inst = instances[i];
      if (!inst) return;
      const c =
        statusColors[inst.status as keyof typeof statusColors] || baseColor;
      setColorAt(i, c);
    },
    [baseColor, instances, setColorAt, statusColors],
  );

  useEffect(() => {
    if (!meshRef.current) return;
    const tempColor = new THREE.Color();
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      tempColor.copy(
        statusColors[inst.status as keyof typeof statusColors] || baseColor,
      );
      meshRef.current.setColorAt(i, tempColor);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }

    prevSelectedIdRef.current = null;
    prevHighlightedIdRef.current = null;

    if (selectedId) {
      const idx = idToIndex.get(selectedId);
      if (idx !== undefined) setColorAt(idx, selectedOutlineColor);
      prevSelectedIdRef.current = selectedId;
    }
    if (highlightedId) {
      const idx = idToIndex.get(highlightedId);
      if (idx !== undefined) setColorAt(idx, highlightedOutlineColor);
      prevHighlightedIdRef.current = highlightedId;
    }
  }, [
    baseColor,
    highlightedId,
    highlightedOutlineColor,
    idToIndex,
    instances,
    selectedId,
    selectedOutlineColor,
    setColorAt,
    statusColors,
  ]);

  useEffect(() => {
    const prevSelected = prevSelectedIdRef.current;
    if (prevSelected && prevSelected !== selectedId) {
      const idx = idToIndex.get(prevSelected);
      if (idx !== undefined) {
        if (prevSelected === highlightedId)
          setColorAt(idx, highlightedOutlineColor);
        else applyBaseColorAt(idx);
      }
    }
    if (selectedId && selectedId !== prevSelected) {
      const idx = idToIndex.get(selectedId);
      if (idx !== undefined) setColorAt(idx, selectedOutlineColor);
    }
    prevSelectedIdRef.current = selectedId || null;
  }, [
    applyBaseColorAt,
    highlightedId,
    highlightedOutlineColor,
    idToIndex,
    selectedId,
    selectedOutlineColor,
    setColorAt,
  ]);

  useEffect(() => {
    const prevHighlighted = prevHighlightedIdRef.current;
    if (prevHighlighted && prevHighlighted !== highlightedId) {
      const idx = idToIndex.get(prevHighlighted);
      if (idx !== undefined) {
        if (prevHighlighted === selectedId)
          setColorAt(idx, selectedOutlineColor);
        else applyBaseColorAt(idx);
      }
    }
    if (highlightedId && highlightedId !== prevHighlighted) {
      const idx = idToIndex.get(highlightedId);
      if (idx !== undefined) setColorAt(idx, highlightedOutlineColor);
    }
    prevHighlightedIdRef.current = highlightedId || null;
  }, [
    applyBaseColorAt,
    highlightedId,
    highlightedOutlineColor,
    idToIndex,
    selectedId,
    selectedOutlineColor,
    setColorAt,
  ]);

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (e.instanceId === undefined) return;
      const prev = hoveredIndexRef.current;
      const next = e.instanceId;
      if (prev === next) return;

      if (prev !== null && instances[prev]) {
        const inst = instances[prev];
        const isSelected = inst.id === selectedId;
        const isHighlighted = inst.id === highlightedId;
        if (isSelected) setColorAt(prev, selectedOutlineColor);
        else if (isHighlighted) setColorAt(prev, highlightedOutlineColor);
        else
          setColorAt(
            prev,
            statusColors[inst.status as keyof typeof statusColors] || baseColor,
          );
      }

      if (instances[next]) setColorAt(next, hoverColor);
      hoveredIndexRef.current = next;
    },
    [
      baseColor,
      highlightedId,
      highlightedOutlineColor,
      hoverColor,
      instances,
      selectedId,
      selectedOutlineColor,
      setColorAt,
      statusColors,
    ],
  );

  const handlePointerOut = useCallback(() => {
    const prev = hoveredIndexRef.current;
    hoveredIndexRef.current = null;
    if (prev === null || !instances[prev]) return;
    const inst = instances[prev];
    const isSelected = inst.id === selectedId;
    const isHighlighted = inst.id === highlightedId;
    if (isSelected) setColorAt(prev, selectedOutlineColor);
    else if (isHighlighted) setColorAt(prev, highlightedOutlineColor);
    else
      setColorAt(
        prev,
        statusColors[inst.status as keyof typeof statusColors] || baseColor,
      );
  }, [
    baseColor,
    highlightedId,
    highlightedOutlineColor,
    instances,
    selectedId,
    selectedOutlineColor,
    setColorAt,
    statusColors,
  ]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId === undefined) return;
      const inst = instances[e.instanceId];
      if (!inst) return;
      onClickCabinet?.(inst.id);
    },
    [instances, onClickCabinet],
  );

  const handleDoubleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId === undefined) return;
      const inst = instances[e.instanceId];
      if (!inst) return;
      onDoubleClickCabinet?.(inst.id, inst.position);
    },
    [instances, onDoubleClickCabinet],
  );

  if (instances.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, instances.length]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
      {statusCounts.normal > 0 && (
        <instancedMesh
          ref={normalStatusMeshRef}
          args={[statusGeometry, normalStatusMaterial, statusCounts.normal]}
        />
      )}
      {statusCounts.warning > 0 && (
        <instancedMesh
          ref={warningStatusMeshRef}
          args={[statusGeometry, warningStatusMaterial, statusCounts.warning]}
        />
      )}
      {statusCounts.error > 0 && (
        <instancedMesh
          ref={errorStatusMeshRef}
          args={[statusGeometry, errorStatusMaterial, statusCounts.error]}
        />
      )}
    </group>
  );
}
