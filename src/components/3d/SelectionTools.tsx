import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type {
  MeasurementLine,
  MeasurementPoint,
} from './MeasurementTools';
export {
  calculateDistance,
  createMeasurementLine,
  MeasurementController,
  MeasurementManager,
  MeasurementPointIndicator,
} from './MeasurementTools';

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function BoxSelectOverlay({
  enabled,
  onSelectionBox,
}: {
  enabled: boolean;
  onSelectionBox: (box: SelectionBox | null) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [box, setBox] = useState<SelectionBox | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!enabled) return;
      event.preventDefault();
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      setIsDragging(true);
      setBox({ startX: x, startY: y, endX: x, endY: y });
    },
    [enabled],
  );
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDragging || !box) return;
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      setBox({
        ...box,
        endX: event.clientX - bounds.left,
        endY: event.clientY - bounds.top,
      });
    },
    [box, isDragging],
  );
  const handleMouseUp = useCallback(() => {
    if (isDragging && box) onSelectionBox(box);
    setIsDragging(false);
    setBox(null);
  }, [box, isDragging, onSelectionBox]);

  if (!enabled) return null;
  const selectionStyle = box
    ? {
        left: Math.min(box.startX, box.endX),
        top: Math.min(box.startY, box.endY),
        width: Math.abs(box.endX - box.startX),
        height: Math.abs(box.endY - box.startY),
      }
    : null;
  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="3D 设备框选区域"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        cursor: 'crosshair',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {selectionStyle && (
        <div
          style={{
            position: 'absolute',
            ...selectionStyle,
            border: '2px dashed #4096ff',
            background: 'rgba(64, 150, 255, 0.1)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

export function BoxSelectDetector({
  enabled,
  selectionBox,
  onSelectionComplete,
  devicePositions,
}: {
  enabled: boolean;
  selectionBox: SelectionBox | null;
  onSelectionComplete: (selectedIds: string[]) => void;
  devicePositions: Record<string, [number, number, number]>;
}) {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!enabled || !selectionBox) return;
    const minX =
      (Math.min(selectionBox.startX, selectionBox.endX) / size.width) * 2 - 1;
    const maxX =
      (Math.max(selectionBox.startX, selectionBox.endX) / size.width) * 2 - 1;
    const minY =
      -(Math.max(selectionBox.startY, selectionBox.endY) / size.height) * 2 + 1;
    const maxY =
      -(Math.min(selectionBox.startY, selectionBox.endY) / size.height) * 2 + 1;
    const selectedIds = Object.entries(devicePositions)
      .filter(([, position]) => {
        const projected = new THREE.Vector3(...position).project(camera);
        return (
          projected.x >= minX &&
          projected.x <= maxX &&
          projected.y >= minY &&
          projected.y <= maxY &&
          projected.z < 1
        );
      })
      .map(([id]) => id);
    onSelectionComplete(selectedIds);
  }, [
    camera,
    devicePositions,
    enabled,
    onSelectionComplete,
    selectionBox,
    size,
  ]);
  return null;
}

export type ActiveTool = 'select' | 'boxSelect' | 'measure' | null;

export function SelectionToolbar({
  activeTool,
  onToolChange,
  measurementCount,
  onClearMeasurements,
}: {
  activeTool: ActiveTool;
  onToolChange: (tool: ActiveTool) => void;
  measurementCount: number;
  onClearMeasurements: () => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="3D 场景工具"
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <ToolButton
        icon="👆"
        label="选择"
        active={activeTool === 'select'}
        onClick={() => onToolChange(activeTool === 'select' ? null : 'select')}
      />
      <ToolButton
        icon="⬜"
        label="框选"
        active={activeTool === 'boxSelect'}
        onClick={() =>
          onToolChange(activeTool === 'boxSelect' ? null : 'boxSelect')
        }
      />
      <ToolButton
        icon="📏"
        label="测量"
        active={activeTool === 'measure'}
        onClick={() =>
          onToolChange(activeTool === 'measure' ? null : 'measure')
        }
        badge={measurementCount > 0 ? String(measurementCount) : undefined}
      />
      {measurementCount > 0 && (
        <ToolButton
          icon="🗑️"
          label="清除测量"
          active={false}
          onClick={onClearMeasurements}
        />
      )}
    </div>
  );
}

function ToolButton({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={badge ? `${label}，${badge}` : label}
      aria-pressed={active}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        border: active
          ? '2px solid #4096ff'
          : '1px solid rgba(255,255,255,0.2)',
        borderRadius: 8,
        background: active ? 'rgba(64, 150, 255, 0.3)' : 'rgba(0, 0, 0, 0.6)',
        color: '#fff',
        cursor: 'pointer',
        fontSize: 18,
      }}
    >
      <span aria-hidden="true">{icon}</span>
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#ff4d4f',
            color: '#fff',
            fontSize: 10,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
