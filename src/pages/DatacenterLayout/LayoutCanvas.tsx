import { Badge } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.less';
import type { LayoutLayers } from './LayoutAssetPanel';
import type { LayoutSelection } from './layoutEditorModel';

const zoneColors: Record<IDC.LayoutZoneType, string> = {
  zone: '#95de64',
  hot_aisle: '#ff7875',
  cold_aisle: '#69b1ff',
  restricted: '#ffc53d',
  other: '#bfbfbf',
};

const facilityIcons: Record<IDC.LayoutFacilityType, string> = {
  ups: '⚡',
  crac: '❄',
  pdu: '🔌',
  sensor: '◉',
  door: '🚪',
  camera: '◈',
  fire_extinguisher: '🧯',
  other: '◆',
};

interface LayoutCanvasProps {
  layout: IDC.DatacenterLayout;
  previewLayout: IDC.DatacenterLayout | null;
  cabinets: IDC.Cabinet[];
  selection: LayoutSelection | null;
  layers: LayoutLayers;
  zoom: number;
  centerNonce: number;
  onSelect: (selection: LayoutSelection | null) => void;
  onMove: (selection: LayoutSelection, x: number, y: number) => void;
  onCanvasActiveChange: (active: boolean) => void;
}

export function LayoutCanvas({
  layout,
  previewLayout,
  cabinets,
  selection,
  layers,
  zoom,
  centerNonce,
  onSelect,
  onMove,
  onCanvasActiveChange,
}: LayoutCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayLayout = previewLayout || layout;
  const unit = 32 * zoom;
  const cabinetById = useMemo(
    () => new Map(cabinets.map((cabinet) => [cabinet.id, cabinet] as const)),
    [cabinets],
  );

  useEffect(() => {
    if (!selection || !centerNonce || !scrollRef.current) return;
    const item =
      selection.kind === 'cabinet'
        ? displayLayout.cabinets.find(
            (candidate) => candidate.cabinetId === selection.id,
          )
        : selection.kind === 'zone'
          ? displayLayout.zones.find(
              (candidate) => candidate.id === selection.id,
            )
          : displayLayout.facilities.find(
              (candidate) => candidate.id === selection.id,
            );
    if (!item) return;
    scrollRef.current.scrollTo({
      left: Math.max(0, item.x * unit - scrollRef.current.clientWidth / 2),
      top: Math.max(0, item.y * unit - scrollRef.current.clientHeight / 2),
      behavior: 'smooth',
    });
  }, [centerNonce, displayLayout, selection, unit]);

  return (
    <section className={styles.canvasCard} aria-label="布局画布区域">
      <div
        ref={scrollRef}
        className={styles.canvasScroll}
        role="application"
        aria-label="可编辑数据中心布局画布"
        onFocus={() => onCanvasActiveChange(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            onCanvasActiveChange(false);
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) onSelect(null);
        }}
      >
        <button type="button" className={styles.canvasActivation}>
          激活画布快捷键
        </button>
        <div
          className={`${styles.canvasViewport} ${
            previewLayout ? styles.previewViewport : ''
          } ${layers.grid ? styles.gridVisible : ''}`}
          style={{
            width: displayLayout.canvasWidth * unit,
            height: displayLayout.canvasHeight * unit,
            backgroundSize: `${unit}px ${unit}px`,
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onSelect(null);
          }}
        >
          {layers.zones &&
            displayLayout.zones.map((zone) => (
              <DraggableObject
                key={zone.id}
                selection={{ kind: 'zone', id: zone.id }}
                selected={
                  selection?.kind === 'zone' && selection.id === zone.id
                }
                x={zone.x}
                y={zone.y}
                unit={unit}
                disabled={Boolean(previewLayout)}
                className={styles.zone}
                style={{
                  width: Math.max(34, zone.width * unit),
                  height: Math.max(30, zone.height * unit),
                  background: `${zone.color || zoneColors[zone.type]}33`,
                  borderColor: zone.color || zoneColors[zone.type],
                  transform: `rotate(${zone.rotation || 0}deg)`,
                }}
                onSelect={onSelect}
                onMove={onMove}
              >
                <span>{zone.name || zone.type}</span>
                <small>
                  {zone.width.toFixed(1)} × {zone.height.toFixed(1)}m
                </small>
              </DraggableObject>
            ))}

          {layers.cabinets &&
            displayLayout.cabinets.map((item) => {
              const cabinet = cabinetById.get(item.cabinetId);
              return (
                <DraggableObject
                  key={item.cabinetId}
                  selection={{ kind: 'cabinet', id: item.cabinetId }}
                  selected={
                    selection?.kind === 'cabinet' &&
                    selection.id === item.cabinetId
                  }
                  x={item.x}
                  y={item.y}
                  unit={unit}
                  disabled={Boolean(previewLayout)}
                  className={styles.cabinet}
                  style={{ transform: `rotate(${item.rotation || 0}deg)` }}
                  onSelect={onSelect}
                  onMove={onMove}
                >
                  <Badge
                    status={
                      cabinet?.status === 'normal'
                        ? 'success'
                        : cabinet?.status === 'offline'
                          ? 'default'
                          : 'warning'
                    }
                  />
                  <strong>{cabinet?.code || item.cabinetId}</strong>
                  <small>{cabinet?.usedU ?? '-'}U</small>
                </DraggableObject>
              );
            })}

          {layers.facilities &&
            displayLayout.facilities.map((facility) => (
              <DraggableObject
                key={facility.id}
                selection={{ kind: 'facility', id: facility.id }}
                selected={
                  selection?.kind === 'facility' && selection.id === facility.id
                }
                x={facility.x}
                y={facility.y}
                unit={unit}
                disabled={Boolean(previewLayout)}
                className={styles.facility}
                style={{ transform: `rotate(${facility.rotation || 0}deg)` }}
                onSelect={onSelect}
                onMove={onMove}
              >
                <span aria-hidden>{facilityIcons[facility.type]}</span>
                <small>{facility.name || facility.type}</small>
              </DraggableObject>
            ))}
        </div>
      </div>
      <LayoutMiniMap layout={displayLayout} />
      <div className={styles.canvasHint}>
        {previewLayout
          ? '自动布局预览中：确认后才会写入工作副本'
          : '拖动对象调整坐标 · 方向键微调 · 点击空白取消选择 · 快捷键仅在画布聚焦时生效'}
      </div>
    </section>
  );
}

interface DraggableObjectProps {
  selection: LayoutSelection;
  selected: boolean;
  x: number;
  y: number;
  unit: number;
  disabled: boolean;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onSelect: (selection: LayoutSelection) => void;
  onMove: (selection: LayoutSelection, x: number, y: number) => void;
}

function DraggableObject({
  selection,
  selected,
  x,
  y,
  unit,
  disabled,
  className,
  style,
  children,
  onSelect,
  onMove,
}: DraggableObjectProps) {
  const [drag, setDrag] = useState<{
    pointerId: number;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  }>();
  const currentX = drag?.x ?? x;
  const currentY = drag?.y ?? y;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${selection.kind} ${selection.id}`}
      className={`${className} ${selected ? styles.objectSelected : ''}`}
      style={{
        ...style,
        left: currentX * unit,
        top: currentY * unit,
      }}
      onClick={() => onSelect(selection)}
      onPointerDown={(event) => {
        if (disabled) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDrag({
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          x,
          y,
        });
        onSelect(selection);
      }}
      onPointerMove={(event) => {
        if (!drag || drag.pointerId !== event.pointerId) return;
        setDrag({
          ...drag,
          x: Math.max(
            0,
            Math.round((x + (event.clientX - drag.clientX) / unit) * 10) / 10,
          ),
          y: Math.max(
            0,
            Math.round((y + (event.clientY - drag.clientY) / unit) * 10) / 10,
          ),
        });
      }}
      onPointerUp={(event) => {
        if (!drag || drag.pointerId !== event.pointerId) return;
        event.currentTarget.releasePointerCapture(event.pointerId);
        if (drag.x !== x || drag.y !== y) onMove(selection, drag.x, drag.y);
        setDrag(undefined);
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        const step = event.shiftKey ? 1 : 0.1;
        const delta = {
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, -step],
          ArrowDown: [0, step],
        }[event.key];
        if (!delta) return;
        event.preventDefault();
        onMove(
          selection,
          Math.max(0, Math.round((x + delta[0]) * 10) / 10),
          Math.max(0, Math.round((y + delta[1]) * 10) / 10),
        );
      }}
    >
      {children}
    </button>
  );
}

function LayoutMiniMap({ layout }: { layout: IDC.DatacenterLayout }) {
  const scale = Math.min(150 / layout.canvasWidth, 90 / layout.canvasHeight);
  return (
    <aside className={styles.miniMap} aria-label="布局缩略图">
      <div
        className={styles.miniMapCanvas}
        style={{
          width: layout.canvasWidth * scale,
          height: layout.canvasHeight * scale,
        }}
      >
        {layout.zones.map((zone) => (
          <span
            key={zone.id}
            className={styles.miniZone}
            style={{
              left: zone.x * scale,
              top: zone.y * scale,
              width: zone.width * scale,
              height: zone.height * scale,
            }}
          />
        ))}
        {layout.cabinets.map((cabinet) => (
          <span
            key={cabinet.cabinetId}
            className={styles.miniCabinet}
            style={{ left: cabinet.x * scale, top: cabinet.y * scale }}
          />
        ))}
      </div>
    </aside>
  );
}
