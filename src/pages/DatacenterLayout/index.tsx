import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Segmented,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import {
  AirVent,
  Camera,
  DoorClosed,
  Download,
  FlameKindling,
  Package,
  Redo2,
  Ruler,
  Save,
  ScanEye,
  Square,
  Thermometer,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getCabinetsByDatacenter } from '@/services/idc/cabinet';
import { getAllDatacenters } from '@/services/idc/datacenter';
import {
  getDatacenterLayout,
  saveDatacenterLayout,
} from '@/services/idc/layout';
import styles from './index.less';
import {
  getLayoutContentFingerprint,
  isEditableKeyboardTarget,
} from './layoutEditorSession';

type ToolMode =
  | 'select'
  | 'zone'
  | 'hot_aisle'
  | 'cold_aisle'
  | IDC.LayoutFacilityType;

type Selected =
  | { type: 'cabinet'; cabinetId: string }
  | { type: 'zone'; id: string }
  | { type: 'facility'; id: string }
  | null;

type SelectionState = {
  cabinets: string[];
  zones: string[];
  facilities: string[];
};

type DistributeMode = 'start' | 'center' | 'end';
type DistributeAnchor = 'endpoints' | 'primary';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function snap(n: number, step: number) {
  return Math.round(n / step) * step;
}

function cloneLayout(layout: IDC.DatacenterLayout): IDC.DatacenterLayout {
  return JSON.parse(JSON.stringify(layout)) as IDC.DatacenterLayout;
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

type SnapCandidate = { value: number; label: string };

function smartSnapValue(
  value: number,
  candidates: SnapCandidate[],
  threshold: number,
): { value: number; snapped: boolean; label?: string } {
  let best = value;
  let bestLabel: string | undefined;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const d = Math.abs(c.value - value);
    if (d < bestDelta) {
      bestDelta = d;
      best = c.value;
      bestLabel = c.label;
    }
  }
  if (bestDelta <= threshold)
    return { value: best, snapped: true, label: bestLabel };
  return { value, snapped: false };
}

function bestSnapPosition(
  start: number,
  size: number | null,
  candidates: SnapCandidate[],
  threshold: number,
): { pos: number; guide?: number; label?: string } {
  if (!candidates.length) return { pos: start };
  if (!size || size <= 0) {
    const s = smartSnapValue(start, candidates, threshold);
    return s.snapped
      ? { pos: s.value, guide: s.value, label: s.label }
      : { pos: start };
  }

  const offsets = [0, size / 2, size];
  let bestPos = start;
  let bestGuide: number | undefined;
  let bestLabel: string | undefined;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let i = 0; i < offsets.length; i++) {
    const offset = offsets[i];
    const line = start + offset;
    const s = smartSnapValue(line, candidates, threshold);
    if (!s.snapped) continue;
    const pos = s.value - offset;
    const delta = Math.abs(pos - start);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestPos = pos;
      bestGuide = s.value;
      bestLabel = s.label;
    }
  }
  if (bestDelta <= threshold)
    return { pos: bestPos, guide: bestGuide, label: bestLabel };
  return { pos: start };
}

function facilityIcon(type: IDC.LayoutFacilityType) {
  const size = 18;
  switch (type) {
    case 'ups':
      return <Package size={size} />;
    case 'crac':
      return <AirVent size={size} />;
    case 'sensor':
      return <Thermometer size={size} />;
    case 'door':
      return <DoorClosed size={size} />;
    case 'camera':
      return <Camera size={size} />;
    case 'fire_extinguisher':
      return <FlameKindling size={size} />;
    case 'pdu':
      return <ScanEye size={size} />;
    default:
      return <Square size={size} />;
  }
}

const ZONE_COLORS: Record<IDC.LayoutZoneType, string> = {
  zone: 'rgba(82, 196, 26, 0.12)',
  hot_aisle: 'rgba(245, 34, 45, 0.10)',
  cold_aisle: 'rgba(22, 119, 255, 0.10)',
  restricted: 'rgba(250, 173, 20, 0.10)',
  other: 'rgba(0, 0, 0, 0.06)',
};

function zoneLabel(type: IDC.LayoutZoneType) {
  switch (type) {
    case 'hot_aisle':
      return '热通道';
    case 'cold_aisle':
      return '冷通道';
    case 'restricted':
      return '限制区';
    case 'zone':
      return '区域';
    default:
      return '其他';
  }
}

const DatacenterLayoutPage: React.FC = () => {
  const [datacenters, setDatacenters] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);
  const [selectedDc, setSelectedDc] = useState<string>();
  const [cabinets, setCabinets] = useState<IDC.Cabinet[]>([]);
  const [layout, setLayout] = useState<IDC.DatacenterLayout | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [tool, setTool] = useState<ToolMode>('select');
  const [selected, setSelected] = useState<Selected>(null);
  const [selection, setSelection] = useState<SelectionState>({
    cabinets: [],
    zones: [],
    facilities: [],
  });

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 20, y: 20 });
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridStep, setGridStep] = useState(0.1);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [_historyTick, setHistoryTick] = useState(0);
  const [selectBox, setSelectBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [guides, setGuides] = useState<{ x?: number; y?: number } | null>(null);
  const [snapHint, setSnapHint] = useState<string | null>(null);
  const [layers, setLayers] = useState({
    showCabinets: true,
    showZones: true,
    showFacilities: true,
    lockCabinets: false,
    lockZones: false,
    lockFacilities: false,
  });
  const [distributeModeX, setDistributeModeX] =
    useState<DistributeMode>('center');
  const [distributeModeY, setDistributeModeY] =
    useState<DistributeMode>('center');
  const [distributeAnchor, setDistributeAnchor] =
    useState<DistributeAnchor>('endpoints');

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<IDC.DatacenterLayout | null>(null);
  const clipboardRef = useRef<{
    zones: IDC.DatacenterLayoutZoneItem[];
    facilities: IDC.DatacenterLayoutFacilityItem[];
  } | null>(null);
  const historyRef = useRef<{
    past: IDC.DatacenterLayout[];
    future: IDC.DatacenterLayout[];
  }>({ past: [], future: [] });
  const savedFingerprintRef = useRef<string | undefined>(undefined);
  const navigationConfirmOpenRef = useRef(false);
  const loadVersionRef = useRef(0);
  const dragRef = useRef<{
    kind:
      | 'pan'
      | 'cabinet'
      | 'zone'
      | 'facility'
      | 'draw_zone'
      | 'zone_resize'
      | 'box_select';
    id?: string;
    cabinetId?: string;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
    startX?: number;
    startY?: number;
    startW?: number;
    startH?: number;
    corner?: 'nw' | 'ne' | 'sw' | 'se';
    zoneType?: IDC.LayoutZoneType;
    startWorldX?: number;
    startWorldY?: number;
    snapshot?: {
      cabinets: Record<string, { x: number; y: number }>;
      zones: Record<string, { x: number; y: number }>;
      facilities: Record<string, { x: number; y: number }>;
    };
    beforeLayout?: IDC.DatacenterLayout;
  } | null>(null);

  const pxPerMeter = layout?.pxPerMeter || 50;
  const cabinetW = 0.6;
  const cabinetD = 1.0;

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  useEffect(() => {
    setSelection((prev) => ({
      cabinets: layers.showCabinets ? prev.cabinets : [],
      zones: layers.showZones ? prev.zones : [],
      facilities: layers.showFacilities ? prev.facilities : [],
    }));
    setSelected((prev) => {
      if (!prev) return prev;
      if (prev.type === 'cabinet' && !layers.showCabinets) return null;
      if (prev.type === 'zone' && !layers.showZones) return null;
      if (prev.type === 'facility' && !layers.showFacilities) return null;
      return prev;
    });
  }, [layers.showCabinets, layers.showFacilities, layers.showZones]);

  useEffect(() => {
    getAllDatacenters().then((res) => {
      if (res.success && res.data) {
        setDatacenters(res.data);
        const id = res.data[0]?.id;
        if (id) setSelectedDc(id);
      }
    });
  }, []);

  const load = useCallback(async (dcId: string) => {
    const loadVersion = loadVersionRef.current + 1;
    loadVersionRef.current = loadVersion;
    setLoading(true);
    setLoadError(undefined);
    setIsDirty(false);
    savedFingerprintRef.current = undefined;
    historyRef.current = { past: [], future: [] };
    clipboardRef.current = null;
    setHistoryTick((tick) => tick + 1);
    setCabinets([]);
    setLayout(null);
    setSelected(null);
    setSelection({ cabinets: [], zones: [], facilities: [] });
    try {
      const [cabRes, layoutRes] = await Promise.all([
        getCabinetsByDatacenter(dcId),
        getDatacenterLayout(dcId),
      ]);
      if (loadVersion !== loadVersionRef.current) return;
      if (cabRes.success && cabRes.data) setCabinets(cabRes.data);
      if (layoutRes.success && layoutRes.data) {
        savedFingerprintRef.current = getLayoutContentFingerprint(
          layoutRes.data,
        );
        setLayout(layoutRes.data);
      } else {
        savedFingerprintRef.current = undefined;
        setLayout(null);
      }
    } catch (_error) {
      if (loadVersion === loadVersionRef.current) {
        setLoadError('布局加载失败，未创建空白草稿。');
      }
    } finally {
      if (loadVersion === loadVersionRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDc) load(selectedDc);
  }, [selectedDc, load]);

  const cabinetMap = useMemo(() => {
    const map = new Map<string, IDC.Cabinet>();
    for (const c of cabinets) {
      map.set(c.id, c);
    }
    return map;
  }, [cabinets]);

  const cabinetItems = useMemo(() => {
    const items = layout?.cabinets || [];
    const known = new Set(items.map((i) => i.cabinetId));
    const missing = cabinets.filter((c) => !known.has(c.id));
    if (!missing.length) return items;
    return [
      ...items,
      ...missing.map((c) => {
        const { row, column } = c;
        const x = typeof column === 'number' ? column * 1.2 : 0;
        const y = typeof row === 'number' ? row * 1.4 : 0;
        return { cabinetId: c.id, x, y, rotation: 0 };
      }),
    ];
  }, [layout?.cabinets, cabinets]);

  useEffect(() => {
    if (!layout) {
      setIsDirty(false);
      return;
    }
    const currentFingerprint = getLayoutContentFingerprint(
      layout,
      cabinetItems,
    );
    setIsDirty(currentFingerprint !== savedFingerprintRef.current);
  }, [cabinetItems, layout]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const unblock = history.block((transition) => {
      if (navigationConfirmOpenRef.current) return;
      navigationConfirmOpenRef.current = true;
      Modal.confirm({
        title: '布局尚未保存',
        content: '离开编辑器将丢失当前修改，是否继续？',
        okText: '放弃修改并离开',
        okButtonProps: { danger: true },
        cancelText: '继续编辑',
        onOk: () => {
          navigationConfirmOpenRef.current = false;
          unblock();
          transition.retry();
        },
        onCancel: () => {
          navigationConfirmOpenRef.current = false;
        },
      });
    });
    return unblock;
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!layout) return;
    const known = new Set(layout.cabinets.map((i) => i.cabinetId));
    const missing = cabinets.filter((c) => !known.has(c.id));
    if (!missing.length) return;
    setLayout((prev) => {
      if (!prev) return prev;
      const known2 = new Set(prev.cabinets.map((i) => i.cabinetId));
      const append = cabinets
        .filter((c) => !known2.has(c.id))
        .map((c) => {
          const { row, column } = c;
          const x = typeof column === 'number' ? column * 1.2 : 0;
          const y = typeof row === 'number' ? row * 1.4 : 0;
          return { cabinetId: c.id, x, y, rotation: 0 };
        });
      if (!append.length) return prev;
      return { ...prev, cabinets: [...prev.cabinets, ...append] };
    });
  }, [layout, cabinets]);

  const zones = layout?.zones || [];
  const facilities = layout?.facilities || [];

  const viewportStyle = useMemo(() => {
    return {
      transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
      width: layout ? `${layout.canvasWidth * pxPerMeter}px` : '2000px',
      height: layout ? `${layout.canvasHeight * pxPerMeter}px` : '1400px',
      position: 'relative' as const,
    };
  }, [offset.x, offset.y, scale, layout, pxPerMeter]);

  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const wrap = wrapRef.current;
      if (!wrap) return { x: 0, y: 0 };
      const rect = wrap.getBoundingClientRect();
      const x = (clientX - rect.left - offset.x) / scale / pxPerMeter;
      const y = (clientY - rect.top - offset.y) / scale / pxPerMeter;
      return { x, y };
    },
    [offset.x, offset.y, scale, pxPerMeter],
  );

  const setCabinetItem = useCallback(
    (cabinetId: string, next: Partial<IDC.DatacenterLayoutCabinetItem>) => {
      setLayout((prev) => {
        if (!prev) return prev;
        const cabinetsNext = cabinetItems.map((i) =>
          i.cabinetId === cabinetId ? { ...i, ...next } : i,
        );
        return { ...prev, cabinets: cabinetsNext };
      });
    },
    [cabinetItems],
  );

  const setZoneItem = useCallback(
    (id: string, next: Partial<IDC.DatacenterLayoutZoneItem>) => {
      setLayout((prev) => {
        if (!prev) return prev;
        const zonesNext = prev.zones.map((z) =>
          z.id === id ? { ...z, ...next } : z,
        );
        return { ...prev, zones: zonesNext };
      });
    },
    [],
  );

  const setFacilityItem = useCallback(
    (id: string, next: Partial<IDC.DatacenterLayoutFacilityItem>) => {
      setLayout((prev) => {
        if (!prev) return prev;
        const facilitiesNext = prev.facilities.map((f) =>
          f.id === id ? { ...f, ...next } : f,
        );
        return { ...prev, facilities: facilitiesNext };
      });
    },
    [],
  );

  const ensureLayout = useCallback(() => {
    setLayout((prev) => {
      if (prev?.datacenterId) return prev;
      if (!selectedDc) return prev;
      const base: IDC.DatacenterLayout = {
        datacenterId: selectedDc,
        version: 1,
        canvasWidth: 60,
        canvasHeight: 40,
        pxPerMeter: 50,
        cabinets: [],
        zones: [],
        facilities: [],
        updatedAt: new Date().toISOString(),
      };
      return base;
    });
  }, [selectedDc]);

  useEffect(() => {
    if (!loading && !loadError && !layout && selectedDc) ensureLayout();
  }, [loadError, loading, layout, selectedDc, ensureLayout]);

  const pushHistory = useCallback((before: IDC.DatacenterLayout) => {
    const ref = historyRef.current;
    ref.past.push(cloneLayout(before));
    if (ref.past.length > 50) ref.past.shift();
    ref.future = [];
    setHistoryTick((t) => t + 1);
  }, []);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  const undo = useCallback(() => {
    const ref = historyRef.current;
    const current = layoutRef.current;
    if (!current) return;
    const prev = ref.past.pop();
    if (!prev) return;
    ref.future.push(cloneLayout(current));
    setLayout(prev);
    setHistoryTick((t) => t + 1);
  }, []);

  const redo = useCallback(() => {
    const ref = historyRef.current;
    const current = layoutRef.current;
    if (!current) return;
    const next = ref.future.pop();
    if (!next) return;
    ref.past.push(cloneLayout(current));
    setLayout(next);
    setHistoryTick((t) => t + 1);
  }, []);

  const setSelectionOnly = useCallback((next: Selected) => {
    setSelected(next);
    if (!next) {
      setSelection({ cabinets: [], zones: [], facilities: [] });
      return;
    }
    if (next.type === 'cabinet') {
      setSelection({ cabinets: [next.cabinetId], zones: [], facilities: [] });
    }
    if (next.type === 'zone') {
      setSelection({ cabinets: [], zones: [next.id], facilities: [] });
    }
    if (next.type === 'facility') {
      setSelection({ cabinets: [], zones: [], facilities: [next.id] });
    }
  }, []);

  const toggleSelection = useCallback((next: Exclude<Selected, null>) => {
    setSelected(next);
    setSelection((prev) => {
      const set = new Set(
        next.type === 'cabinet'
          ? prev.cabinets
          : next.type === 'zone'
            ? prev.zones
            : prev.facilities,
      );
      const id = next.type === 'cabinet' ? next.cabinetId : next.id;
      if (set.has(id)) set.delete(id);
      else set.add(id);
      const arr = Array.from(set);
      if (next.type === 'cabinet') return { ...prev, cabinets: arr };
      if (next.type === 'zone') return { ...prev, zones: arr };
      return { ...prev, facilities: arr };
    });
  }, []);

  const selectionCount =
    selection.cabinets.length +
    selection.zones.length +
    selection.facilities.length;

  const isLayerLocked = useCallback(
    (type: NonNullable<Selected>['type']) => {
      if (type === 'cabinet') return layers.lockCabinets;
      if (type === 'zone') return layers.lockZones;
      return layers.lockFacilities;
    },
    [layers.lockCabinets, layers.lockFacilities, layers.lockZones],
  );

  const buildSnapshot = useCallback(() => {
    const cur = layoutRef.current;
    if (!cur) {
      return {
        cabinets: {} as Record<string, { x: number; y: number }>,
        zones: {} as Record<string, { x: number; y: number }>,
        facilities: {} as Record<string, { x: number; y: number }>,
      };
    }
    const cabinetsSnapshot: Record<string, { x: number; y: number }> = {};
    const zonesSnapshot: Record<string, { x: number; y: number }> = {};
    const facilitiesSnapshot: Record<string, { x: number; y: number }> = {};

    for (const id of selection.cabinets) {
      const item = cabinetItems.find((c) => c.cabinetId === id);
      if (item) cabinetsSnapshot[id] = { x: item.x, y: item.y };
    }
    for (const id of selection.zones) {
      const z = cur.zones.find((z0) => z0.id === id);
      if (z) zonesSnapshot[id] = { x: z.x, y: z.y };
    }
    for (const id of selection.facilities) {
      const f = cur.facilities.find((f0) => f0.id === id);
      if (f) facilitiesSnapshot[id] = { x: f.x, y: f.y };
    }
    return {
      cabinets: cabinetsSnapshot,
      zones: zonesSnapshot,
      facilities: facilitiesSnapshot,
    };
  }, [selection.cabinets, selection.zones, selection.facilities, cabinetItems]);

  const onPointerDownWrap = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      const isCanvas = target.dataset?.role === 'canvas';

      if (tool !== 'select' && isCanvas) {
        const zoneType: IDC.LayoutZoneType =
          tool === 'zone' || tool === 'hot_aisle' || tool === 'cold_aisle'
            ? (tool as IDC.LayoutZoneType)
            : 'zone';

        if (tool === 'zone' || tool === 'hot_aisle' || tool === 'cold_aisle') {
          if (!layers.showZones) {
            message.info('区域图层已隐藏');
            return;
          }
          if (layers.lockZones) {
            message.info('区域图层已锁定');
            return;
          }
          const before = layoutRef.current;
          if (before) pushHistory(before);
          const pos = toWorld(e.clientX, e.clientY);
          const id = uid('zone');
          setSelectionOnly({ type: 'zone', id });
          setLayout((prev) => {
            if (!prev) return prev;
            const z: IDC.DatacenterLayoutZoneItem = {
              id,
              type: zoneType,
              name: zoneLabel(zoneType),
              x: snapEnabled ? snap(pos.x, gridStep) : pos.x,
              y: snapEnabled ? snap(pos.y, gridStep) : pos.y,
              width: gridStep,
              height: gridStep,
              rotation: 0,
              color: ZONE_COLORS[zoneType],
            };
            return { ...prev, zones: [...prev.zones, z] };
          });
          dragRef.current = {
            kind: 'draw_zone',
            id,
            startClientX: e.clientX,
            startClientY: e.clientY,
            startOffsetX: offset.x,
            startOffsetY: offset.y,
            startX: pos.x,
            startY: pos.y,
            zoneType,
          };
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          return;
        }

        const before = layoutRef.current;
        if (before) pushHistory(before);
        if (!layers.showFacilities) {
          message.info('设施图层已隐藏');
          return;
        }
        if (layers.lockFacilities) {
          message.info('设施图层已锁定');
          return;
        }
        const pos = toWorld(e.clientX, e.clientY);
        const id = uid('facility');
        setSelectionOnly({ type: 'facility', id });
        setLayout((prev) => {
          if (!prev) return prev;
          const f: IDC.DatacenterLayoutFacilityItem = {
            id,
            type: tool as IDC.LayoutFacilityType,
            name: tool,
            x: snapEnabled ? snap(pos.x, gridStep) : pos.x,
            y: snapEnabled ? snap(pos.y, gridStep) : pos.y,
            rotation: 0,
          };
          return { ...prev, facilities: [...prev.facilities, f] };
        });
        setTool('select');
        return;
      }

      if (tool === 'select' && isCanvas) {
        if (e.shiftKey) {
          const wrap = wrapRef.current;
          if (!wrap) return;
          const rect = wrap.getBoundingClientRect();
          const left = e.clientX - rect.left;
          const top = e.clientY - rect.top;
          setSelectBox({ left, top, width: 0, height: 0 });
          const start = toWorld(e.clientX, e.clientY);
          dragRef.current = {
            kind: 'box_select',
            startClientX: e.clientX,
            startClientY: e.clientY,
            startOffsetX: offset.x,
            startOffsetY: offset.y,
            startWorldX: start.x,
            startWorldY: start.y,
          };
        } else {
          setSelectionOnly(null);
          dragRef.current = {
            kind: 'pan',
            startClientX: e.clientX,
            startClientY: e.clientY,
            startOffsetX: offset.x,
            startOffsetY: offset.y,
          };
        }
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      }
    },
    [
      tool,
      toWorld,
      offset.x,
      offset.y,
      gridStep,
      ensureLayout,
      pushHistory,
      snapEnabled,
      setSelectionOnly,
      layers.lockFacilities,
      layers.lockZones,
      layers.showFacilities,
      layers.showZones,
    ],
  );

  const onPointerMoveWrap = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.kind === 'pan') {
        setGuides(null);
        setSnapHint(null);
        const dx = e.clientX - drag.startClientX;
        const dy = e.clientY - drag.startClientY;
        setOffset({ x: drag.startOffsetX + dx, y: drag.startOffsetY + dy });
        return;
      }

      if (drag.kind === 'box_select') {
        setSnapHint(null);
        const wrap = wrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const curLeft = e.clientX - rect.left;
        const curTop = e.clientY - rect.top;
        const left = Math.min(curLeft, drag.startClientX - rect.left);
        const top = Math.min(curTop, drag.startClientY - rect.top);
        const width = Math.abs(curLeft - (drag.startClientX - rect.left));
        const height = Math.abs(curTop - (drag.startClientY - rect.top));
        setSelectBox({ left, top, width, height });
        return;
      }

      const curLayout = layoutRef.current;
      const snapThreshold = 0.15;
      const candidatesX: SnapCandidate[] = [];
      const candidatesY: SnapCandidate[] = [];
      if (snapEnabled && curLayout) {
        const addX = (value: number, label: string) =>
          candidatesX.push({ value, label });
        const addY = (value: number, label: string) =>
          candidatesY.push({ value, label });

        addX(0, '画布左边缘');
        addX(curLayout.canvasWidth / 2, '画布水平中心');
        addX(curLayout.canvasWidth, '画布右边缘');
        addY(0, '画布上边缘');
        addY(curLayout.canvasHeight / 2, '画布垂直中心');
        addY(curLayout.canvasHeight, '画布下边缘');

        if (layers.showCabinets) {
          for (let i = 0; i < cabinetItems.length; i++) {
            const c = cabinetItems[i];
            if (selection.cabinets.includes(c.cabinetId)) continue;
            const name = cabinetMap.get(c.cabinetId)?.code || c.cabinetId;
            addX(c.x, `机柜 ${name} 左边缘`);
            addX(c.x + cabinetW / 2, `机柜 ${name} 中心`);
            addX(c.x + cabinetW, `机柜 ${name} 右边缘`);
            addY(c.y, `机柜 ${name} 上边缘`);
            addY(c.y + cabinetD / 2, `机柜 ${name} 中心`);
            addY(c.y + cabinetD, `机柜 ${name} 下边缘`);
          }
        }

        if (layers.showZones) {
          for (let i = 0; i < curLayout.zones.length; i++) {
            const z = curLayout.zones[i];
            if (selection.zones.includes(z.id)) continue;
            const name = z.name || zoneLabel(z.type);
            addX(z.x, `区域 ${name} 左边缘`);
            addX(z.x + z.width / 2, `区域 ${name} 中心`);
            addX(z.x + z.width, `区域 ${name} 右边缘`);
            addY(z.y, `区域 ${name} 上边缘`);
            addY(z.y + z.height / 2, `区域 ${name} 中心`);
            addY(z.y + z.height, `区域 ${name} 下边缘`);
          }
        }

        if (layers.showFacilities) {
          for (let i = 0; i < curLayout.facilities.length; i++) {
            const f = curLayout.facilities[i];
            if (selection.facilities.includes(f.id)) continue;
            const name = f.name || f.type;
            addX(f.x, `设施 ${name} X`);
            addY(f.y, `设施 ${name} Y`);
          }
        }
      }

      if (drag.kind === 'cabinet' && drag.cabinetId) {
        const dx = (e.clientX - drag.startClientX) / scale / pxPerMeter;
        const dy = (e.clientY - drag.startClientY) / scale / pxPerMeter;
        if (drag.snapshot) {
          let dx2 = dx;
          let dy2 = dy;
          const anchor = drag.snapshot.cabinets[drag.cabinetId];
          if (snapEnabled && anchor) {
            const snapX = bestSnapPosition(
              anchor.x + dx,
              cabinetW,
              candidatesX,
              snapThreshold,
            );
            const snapY = bestSnapPosition(
              anchor.y + dy,
              cabinetD,
              candidatesY,
              snapThreshold,
            );
            dx2 = snapX.pos - anchor.x;
            dy2 = snapY.pos - anchor.y;
            setGuides({
              x: snapX.guide,
              y: snapY.guide,
            });
            const parts: string[] = [];
            if (snapX.guide !== undefined && snapX.label)
              parts.push(`X吸附：${snapX.label}`);
            if (snapY.guide !== undefined && snapY.label)
              parts.push(`Y吸附：${snapY.label}`);
            setSnapHint(parts.length ? parts.join('；') : null);
          } else {
            setGuides(null);
            setSnapHint(null);
          }
          setLayout((prev) => {
            if (!prev) return prev;
            const cabinetsNext = prev.cabinets.map((c) => {
              const snap0 = drag.snapshot?.cabinets[c.cabinetId];
              if (!snap0) return c;
              const x = snap0.x + dx2;
              const y = snap0.y + dy2;
              return {
                ...c,
                x: snapEnabled ? snap(x, gridStep) : x,
                y: snapEnabled ? snap(y, gridStep) : y,
              };
            });
            const zonesNext = prev.zones.map((z) => {
              const snap0 = drag.snapshot?.zones[z.id];
              if (!snap0) return z;
              const x = snap0.x + dx2;
              const y = snap0.y + dy2;
              return {
                ...z,
                x: snapEnabled ? snap(x, gridStep) : x,
                y: snapEnabled ? snap(y, gridStep) : y,
              };
            });
            const facilitiesNext = prev.facilities.map((f) => {
              const snap0 = drag.snapshot?.facilities[f.id];
              if (!snap0) return f;
              const x = snap0.x + dx2;
              const y = snap0.y + dy2;
              return {
                ...f,
                x: snapEnabled ? snap(x, gridStep) : x,
                y: snapEnabled ? snap(y, gridStep) : y,
              };
            });
            return {
              ...prev,
              cabinets: cabinetsNext,
              zones: zonesNext,
              facilities: facilitiesNext,
            };
          });
        } else {
          const rawX = (drag.startX || 0) + dx;
          const rawY = (drag.startY || 0) + dy;
          if (snapEnabled && candidatesX.length) {
            const snapX = bestSnapPosition(
              rawX,
              cabinetW,
              candidatesX,
              snapThreshold,
            );
            const snapY = bestSnapPosition(
              rawY,
              cabinetD,
              candidatesY,
              snapThreshold,
            );
            const nextX = snapEnabled ? snap(snapX.pos, gridStep) : snapX.pos;
            const nextY = snapEnabled ? snap(snapY.pos, gridStep) : snapY.pos;
            setGuides({
              x: snapX.guide,
              y: snapY.guide,
            });
            const parts: string[] = [];
            if (snapX.guide !== undefined && snapX.label)
              parts.push(`X吸附：${snapX.label}`);
            if (snapY.guide !== undefined && snapY.label)
              parts.push(`Y吸附：${snapY.label}`);
            setSnapHint(parts.length ? parts.join('；') : null);
            setCabinetItem(drag.cabinetId, { x: nextX, y: nextY });
          } else {
            setGuides(null);
            setSnapHint(null);
            const nextX = snapEnabled ? snap(rawX, gridStep) : rawX;
            const nextY = snapEnabled ? snap(rawY, gridStep) : rawY;
            setCabinetItem(drag.cabinetId, { x: nextX, y: nextY });
          }
        }
        return;
      }

      if (drag.kind === 'facility' && drag.id) {
        const dx = (e.clientX - drag.startClientX) / scale / pxPerMeter;
        const dy = (e.clientY - drag.startClientY) / scale / pxPerMeter;
        if (drag.snapshot) {
          let dx2 = dx;
          let dy2 = dy;
          const anchor = drag.snapshot.facilities[drag.id];
          if (snapEnabled && anchor) {
            const snapX = bestSnapPosition(
              anchor.x + dx,
              null,
              candidatesX,
              snapThreshold,
            );
            const snapY = bestSnapPosition(
              anchor.y + dy,
              null,
              candidatesY,
              snapThreshold,
            );
            dx2 = snapX.pos - anchor.x;
            dy2 = snapY.pos - anchor.y;
            setGuides({
              x: snapX.guide,
              y: snapY.guide,
            });
            const parts: string[] = [];
            if (snapX.guide !== undefined && snapX.label)
              parts.push(`X吸附：${snapX.label}`);
            if (snapY.guide !== undefined && snapY.label)
              parts.push(`Y吸附：${snapY.label}`);
            setSnapHint(parts.length ? parts.join('；') : null);
          } else {
            setGuides(null);
            setSnapHint(null);
          }
          setLayout((prev) => {
            if (!prev) return prev;
            const cabinetsNext = prev.cabinets.map((c) => {
              const snap0 = drag.snapshot?.cabinets[c.cabinetId];
              if (!snap0) return c;
              const x = snap0.x + dx2;
              const y = snap0.y + dy2;
              return {
                ...c,
                x: snapEnabled ? snap(x, gridStep) : x,
                y: snapEnabled ? snap(y, gridStep) : y,
              };
            });
            const zonesNext = prev.zones.map((z) => {
              const snap0 = drag.snapshot?.zones[z.id];
              if (!snap0) return z;
              const x = snap0.x + dx2;
              const y = snap0.y + dy2;
              return {
                ...z,
                x: snapEnabled ? snap(x, gridStep) : x,
                y: snapEnabled ? snap(y, gridStep) : y,
              };
            });
            const facilitiesNext = prev.facilities.map((f) => {
              const snap0 = drag.snapshot?.facilities[f.id];
              if (!snap0) return f;
              const x = snap0.x + dx2;
              const y = snap0.y + dy2;
              return {
                ...f,
                x: snapEnabled ? snap(x, gridStep) : x,
                y: snapEnabled ? snap(y, gridStep) : y,
              };
            });
            return {
              ...prev,
              cabinets: cabinetsNext,
              zones: zonesNext,
              facilities: facilitiesNext,
            };
          });
        } else {
          const rawX = (drag.startX || 0) + dx;
          const rawY = (drag.startY || 0) + dy;
          if (snapEnabled && candidatesX.length) {
            const snapX = bestSnapPosition(
              rawX,
              null,
              candidatesX,
              snapThreshold,
            );
            const snapY = bestSnapPosition(
              rawY,
              null,
              candidatesY,
              snapThreshold,
            );
            const nextX = snapEnabled ? snap(snapX.pos, gridStep) : snapX.pos;
            const nextY = snapEnabled ? snap(snapY.pos, gridStep) : snapY.pos;
            setGuides({
              x: snapX.guide,
              y: snapY.guide,
            });
            const parts: string[] = [];
            if (snapX.guide !== undefined && snapX.label)
              parts.push(`X吸附：${snapX.label}`);
            if (snapY.guide !== undefined && snapY.label)
              parts.push(`Y吸附：${snapY.label}`);
            setSnapHint(parts.length ? parts.join('；') : null);
            setFacilityItem(drag.id, { x: nextX, y: nextY });
          } else {
            setGuides(null);
            setSnapHint(null);
            const nextX = snapEnabled ? snap(rawX, gridStep) : rawX;
            const nextY = snapEnabled ? snap(rawY, gridStep) : rawY;
            setFacilityItem(drag.id, { x: nextX, y: nextY });
          }
        }
        return;
      }

      if (drag.kind === 'zone' && drag.id) {
        const dx = (e.clientX - drag.startClientX) / scale / pxPerMeter;
        const dy = (e.clientY - drag.startClientY) / scale / pxPerMeter;
        if (drag.snapshot) {
          let dx2 = dx;
          let dy2 = dy;
          const anchor = drag.snapshot.zones[drag.id];
          if (snapEnabled && anchor) {
            const w = drag.startW || gridStep;
            const h = drag.startH || gridStep;
            const snapX = bestSnapPosition(
              anchor.x + dx,
              w,
              candidatesX,
              snapThreshold,
            );
            const snapY = bestSnapPosition(
              anchor.y + dy,
              h,
              candidatesY,
              snapThreshold,
            );
            dx2 = snapX.pos - anchor.x;
            dy2 = snapY.pos - anchor.y;
            setGuides({
              x: snapX.guide,
              y: snapY.guide,
            });
            const parts: string[] = [];
            if (snapX.guide !== undefined && snapX.label)
              parts.push(`X吸附：${snapX.label}`);
            if (snapY.guide !== undefined && snapY.label)
              parts.push(`Y吸附：${snapY.label}`);
            setSnapHint(parts.length ? parts.join('；') : null);
          } else {
            setGuides(null);
            setSnapHint(null);
          }
          setLayout((prev) => {
            if (!prev) return prev;
            const cabinetsNext = prev.cabinets.map((c) => {
              const snap0 = drag.snapshot?.cabinets[c.cabinetId];
              if (!snap0) return c;
              const x = snap0.x + dx2;
              const y = snap0.y + dy2;
              return {
                ...c,
                x: snapEnabled ? snap(x, gridStep) : x,
                y: snapEnabled ? snap(y, gridStep) : y,
              };
            });
            const zonesNext = prev.zones.map((z) => {
              const snap0 = drag.snapshot?.zones[z.id];
              if (!snap0) return z;
              const x = snap0.x + dx2;
              const y = snap0.y + dy2;
              return {
                ...z,
                x: snapEnabled ? snap(x, gridStep) : x,
                y: snapEnabled ? snap(y, gridStep) : y,
              };
            });
            const facilitiesNext = prev.facilities.map((f) => {
              const snap0 = drag.snapshot?.facilities[f.id];
              if (!snap0) return f;
              const x = snap0.x + dx2;
              const y = snap0.y + dy2;
              return {
                ...f,
                x: snapEnabled ? snap(x, gridStep) : x,
                y: snapEnabled ? snap(y, gridStep) : y,
              };
            });
            return {
              ...prev,
              cabinets: cabinetsNext,
              zones: zonesNext,
              facilities: facilitiesNext,
            };
          });
        } else {
          const rawX = (drag.startX || 0) + dx;
          const rawY = (drag.startY || 0) + dy;
          if (snapEnabled && candidatesX.length) {
            const w = drag.startW || gridStep;
            const h = drag.startH || gridStep;
            const snapX = bestSnapPosition(rawX, w, candidatesX, snapThreshold);
            const snapY = bestSnapPosition(rawY, h, candidatesY, snapThreshold);
            const nextX = snapEnabled ? snap(snapX.pos, gridStep) : snapX.pos;
            const nextY = snapEnabled ? snap(snapY.pos, gridStep) : snapY.pos;
            setGuides({
              x: snapX.guide,
              y: snapY.guide,
            });
            const parts: string[] = [];
            if (snapX.guide !== undefined && snapX.label)
              parts.push(`X吸附：${snapX.label}`);
            if (snapY.guide !== undefined && snapY.label)
              parts.push(`Y吸附：${snapY.label}`);
            setSnapHint(parts.length ? parts.join('；') : null);
            setZoneItem(drag.id, { x: nextX, y: nextY });
          } else {
            setGuides(null);
            setSnapHint(null);
            const nextX = snapEnabled ? snap(rawX, gridStep) : rawX;
            const nextY = snapEnabled ? snap(rawY, gridStep) : rawY;
            setZoneItem(drag.id, { x: nextX, y: nextY });
          }
        }
        return;
      }

      if (drag.kind === 'zone_resize' && drag.id && drag.corner) {
        setGuides(null);
        setSnapHint(null);
        const startX = drag.startX || 0;
        const startY = drag.startY || 0;
        const startW = drag.startW || gridStep;
        const startH = drag.startH || gridStep;
        const dx = (e.clientX - drag.startClientX) / scale / pxPerMeter;
        const dy = (e.clientY - drag.startClientY) / scale / pxPerMeter;

        let x = startX;
        let y = startY;
        let w = startW;
        let h = startH;

        if (drag.corner === 'se') {
          w = startW + dx;
          h = startH + dy;
        }
        if (drag.corner === 'sw') {
          x = startX + dx;
          w = startW - dx;
          h = startH + dy;
        }
        if (drag.corner === 'ne') {
          y = startY + dy;
          w = startW + dx;
          h = startH - dy;
        }
        if (drag.corner === 'nw') {
          x = startX + dx;
          y = startY + dy;
          w = startW - dx;
          h = startH - dy;
        }

        const nextX = snapEnabled ? snap(x, gridStep) : x;
        const nextY = snapEnabled ? snap(y, gridStep) : y;
        const nextW = Math.max(gridStep, snapEnabled ? snap(w, gridStep) : w);
        const nextH = Math.max(gridStep, snapEnabled ? snap(h, gridStep) : h);

        setZoneItem(drag.id, {
          x: nextX,
          y: nextY,
          width: nextW,
          height: nextH,
        });
        return;
      }

      if (drag.kind === 'draw_zone' && drag.id) {
        const start = { x: drag.startX || 0, y: drag.startY || 0 };
        const cur = toWorld(e.clientX, e.clientY);
        const x = snapEnabled
          ? snap(Math.min(start.x, cur.x), gridStep)
          : Math.min(start.x, cur.x);
        const y = snapEnabled
          ? snap(Math.min(start.y, cur.y), gridStep)
          : Math.min(start.y, cur.y);
        const width = snapEnabled
          ? snap(Math.abs(cur.x - start.x), gridStep)
          : Math.abs(cur.x - start.x);
        const height = snapEnabled
          ? snap(Math.abs(cur.y - start.y), gridStep)
          : Math.abs(cur.y - start.y);
        setZoneItem(drag.id, {
          x,
          y,
          width: Math.max(gridStep, width),
          height: Math.max(gridStep, height),
        });
      }
    },
    [
      scale,
      pxPerMeter,
      gridStep,
      toWorld,
      setCabinetItem,
      setZoneItem,
      setFacilityItem,
      snapEnabled,
      cabinetItems,
      cabinetMap,
      cabinetW,
      cabinetD,
      selection.cabinets,
      selection.zones,
      selection.facilities,
      layers.showCabinets,
      layers.showZones,
      layers.showFacilities,
    ],
  );

  const onPointerUpWrap = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.kind === 'box_select') {
        setSelectBox(null);
        setGuides(null);
        setSnapHint(null);
        const cur = layoutRef.current;
        if (cur) {
          const end = toWorld(e.clientX, e.clientY);
          const x1 = Math.min(drag.startWorldX || 0, end.x);
          const x2 = Math.max(drag.startWorldX || 0, end.x);
          const y1 = Math.min(drag.startWorldY || 0, end.y);
          const y2 = Math.max(drag.startWorldY || 0, end.y);

          const intersects = (
            ax1: number,
            ay1: number,
            ax2: number,
            ay2: number,
          ) =>
            Math.max(ax1, x1) <= Math.min(ax2, x2) &&
            Math.max(ay1, y1) <= Math.min(ay2, y2);

          const selectedCabinets = layers.showCabinets
            ? cabinetItems
                .filter((ci) =>
                  intersects(ci.x, ci.y, ci.x + cabinetW, ci.y + cabinetD),
                )
                .map((ci) => ci.cabinetId)
            : [];
          const selectedZones = layers.showZones
            ? cur.zones
                .filter((z) =>
                  intersects(z.x, z.y, z.x + z.width, z.y + z.height),
                )
                .map((z) => z.id)
            : [];
          const selectedFacilities = layers.showFacilities
            ? cur.facilities
                .filter((f) =>
                  intersects(f.x - 0.4, f.y - 0.4, f.x + 0.4, f.y + 0.4),
                )
                .map((f) => f.id)
            : [];

          setSelection({
            cabinets: selectedCabinets,
            zones: selectedZones,
            facilities: selectedFacilities,
          });

          if (selectedCabinets.length) {
            setSelected({ type: 'cabinet', cabinetId: selectedCabinets[0] });
          } else if (selectedZones.length) {
            setSelected({ type: 'zone', id: selectedZones[0] });
          } else if (selectedFacilities.length) {
            setSelected({ type: 'facility', id: selectedFacilities[0] });
          } else {
            setSelected(null);
          }
        }
      }

      setGuides(null);
      setSnapHint(null);
      if (drag.beforeLayout) pushHistory(drag.beforeLayout);
      dragRef.current = null;
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {}
    },
    [
      pushHistory,
      toWorld,
      cabinetItems,
      cabinetW,
      cabinetD,
      layers.showCabinets,
      layers.showFacilities,
      layers.showZones,
      setSnapHint,
    ],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const next = clamp(scale + (e.deltaY > 0 ? -0.08 : 0.08), 0.3, 3);
      setScale(next);
    },
    [scale],
  );

  const selectedCabinetItem = useMemo(() => {
    if (!selected || selected.type !== 'cabinet') return null;
    return cabinetItems.find((i) => i.cabinetId === selected.cabinetId) || null;
  }, [selected, cabinetItems]);

  const selectedZone = useMemo(() => {
    if (!selected || selected.type !== 'zone') return null;
    return zones.find((z) => z.id === selected.id) || null;
  }, [selected, zones]);

  const selectedFacility = useMemo(() => {
    if (!selected || selected.type !== 'facility') return null;
    return facilities.find((f) => f.id === selected.id) || null;
  }, [selected, facilities]);

  const fitToView = useCallback(() => {
    const wrap = wrapRef.current;
    const cur = layoutRef.current;
    if (!wrap || !cur) return;
    const items = [
      ...cabinetItems.map((c) => ({
        x1: c.x,
        y1: c.y,
        x2: c.x + cabinetW,
        y2: c.y + cabinetD,
      })),
      ...cur.zones.map((z) => ({
        x1: z.x,
        y1: z.y,
        x2: z.x + z.width,
        y2: z.y + z.height,
      })),
      ...cur.facilities.map((f) => ({
        x1: f.x - 0.4,
        y1: f.y - 0.4,
        x2: f.x + 0.4,
        y2: f.y + 0.4,
      })),
    ];
    if (!items.length) {
      setScale(1);
      setOffset({ x: 20, y: 20 });
      return;
    }
    const minX = Math.min(...items.map((i) => i.x1));
    const minY = Math.min(...items.map((i) => i.y1));
    const maxX = Math.max(...items.map((i) => i.x2));
    const maxY = Math.max(...items.map((i) => i.y2));
    const rect = wrap.getBoundingClientRect();
    const padding = 48;
    const contentW = Math.max(1, (maxX - minX) * pxPerMeter);
    const contentH = Math.max(1, (maxY - minY) * pxPerMeter);
    const s = clamp(
      Math.min(
        (rect.width - padding * 2) / contentW,
        (rect.height - padding * 2) / contentH,
      ),
      0.2,
      3,
    );
    const tx = padding - minX * pxPerMeter * s;
    const ty = padding - minY * pxPerMeter * s;
    setScale(s);
    setOffset({ x: tx, y: ty });
  }, [cabinetItems, cabinetW, cabinetD, pxPerMeter]);

  const exportJson = useCallback(async () => {
    const cur = layoutRef.current;
    if (!cur) return;
    const payload: IDC.DatacenterLayout = {
      ...cur,
      cabinets: cabinetItems,
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板');
    } catch {
      setImportText(text);
      setImportOpen(true);
      message.info('无法写入剪贴板，已在导入窗口中展示');
    }
  }, [cabinetItems]);

  const applyImport = useCallback(() => {
    const cur = layoutRef.current;
    if (!cur) return;
    let parsed: any;
    try {
      parsed = JSON.parse(importText);
    } catch {
      message.error('JSON 格式错误');
      return;
    }
    if (!parsed || typeof parsed !== 'object') {
      message.error('JSON 内容不合法');
      return;
    }
    pushHistory(cur);
    setLayout({
      ...cur,
      canvasWidth: Number(parsed.canvasWidth || cur.canvasWidth),
      canvasHeight: Number(parsed.canvasHeight || cur.canvasHeight),
      pxPerMeter: Number(parsed.pxPerMeter || cur.pxPerMeter),
      cabinets: Array.isArray(parsed.cabinets) ? parsed.cabinets : cur.cabinets,
      zones: Array.isArray(parsed.zones) ? parsed.zones : cur.zones,
      facilities: Array.isArray(parsed.facilities)
        ? parsed.facilities
        : cur.facilities,
    });
    setImportOpen(false);
    message.success('已导入到当前布局（未保存）');
  }, [importText, pushHistory]);

  const copySelectionToClipboard = useCallback(() => {
    const cur = layoutRef.current;
    if (!cur) return;
    const zonesCopy = cur.zones.filter((z) => selection.zones.includes(z.id));
    const facilitiesCopy = cur.facilities.filter((f) =>
      selection.facilities.includes(f.id),
    );
    clipboardRef.current = { zones: zonesCopy, facilities: facilitiesCopy };
    if (!zonesCopy.length && !facilitiesCopy.length) {
      message.info('未选择可复制对象（区域/设施）');
      return;
    }
    message.success('已复制选中对象（区域/设施）');
  }, [selection.zones, selection.facilities]);

  const pasteSelectionFromClipboard = useCallback(() => {
    const cur = layoutRef.current;
    const clip = clipboardRef.current;
    if (!cur || !clip) return;
    if (!clip.zones.length && !clip.facilities.length) return;

    pushHistory(cur);

    const offsetM = 0.5;
    const newZoneIds: string[] = [];
    const newFacilityIds: string[] = [];

    const zonesNext = [
      ...cur.zones,
      ...clip.zones.map((z) => {
        const id = uid('zone');
        newZoneIds.push(id);
        return {
          ...z,
          id,
          x: z.x + offsetM,
          y: z.y + offsetM,
        };
      }),
    ];

    const facilitiesNext = [
      ...cur.facilities,
      ...clip.facilities.map((f) => {
        const id = uid('facility');
        newFacilityIds.push(id);
        return {
          ...f,
          id,
          x: f.x + offsetM,
          y: f.y + offsetM,
        };
      }),
    ];

    setLayout({ ...cur, zones: zonesNext, facilities: facilitiesNext });
    setSelection({
      cabinets: [],
      zones: newZoneIds,
      facilities: newFacilityIds,
    });
    if (newZoneIds.length) setSelected({ type: 'zone', id: newZoneIds[0] });
    else if (newFacilityIds.length)
      setSelected({ type: 'facility', id: newFacilityIds[0] });
  }, [pushHistory]);

  const alignSelection = useCallback(
    (axis: 'x' | 'y', mode: 'start' | 'center' | 'end') => {
      const cur = layoutRef.current;
      if (!cur) return;
      if (
        (layers.lockCabinets && selection.cabinets.length) ||
        (layers.lockZones && selection.zones.length) ||
        (layers.lockFacilities && selection.facilities.length)
      ) {
        message.info('选中对象包含锁定图层，无法对齐');
        return;
      }

      const bounds: Array<{
        type: 'cabinet' | 'zone' | 'facility';
        id: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        w: number;
        h: number;
      }> = [];

      for (const id of selection.cabinets) {
        const c = cur.cabinets.find((x) => x.cabinetId === id);
        if (!c) continue;
        bounds.push({
          type: 'cabinet',
          id,
          x1: c.x,
          y1: c.y,
          x2: c.x + cabinetW,
          y2: c.y + cabinetD,
          w: cabinetW,
          h: cabinetD,
        });
      }
      for (const id of selection.zones) {
        const z = cur.zones.find((x) => x.id === id);
        if (!z) continue;
        bounds.push({
          type: 'zone',
          id,
          x1: z.x,
          y1: z.y,
          x2: z.x + z.width,
          y2: z.y + z.height,
          w: z.width,
          h: z.height,
        });
      }
      for (const id of selection.facilities) {
        const f = cur.facilities.find((x) => x.id === id);
        if (!f) continue;
        bounds.push({
          type: 'facility',
          id,
          x1: f.x,
          y1: f.y,
          x2: f.x,
          y2: f.y,
          w: 0,
          h: 0,
        });
      }

      if (bounds.length < 2) return;

      let anchor = bounds[0];
      if (selected) {
        const key =
          selected.type === 'cabinet'
            ? `cabinet:${selected.cabinetId}`
            : `${selected.type}:${selected.id}`;
        const found = bounds.find((b) => `${b.type}:${b.id}` === key);
        if (found) anchor = found;
      }

      const targetLine = (() => {
        if (axis === 'x') {
          if (mode === 'start') return anchor.x1;
          if (mode === 'end') return anchor.x2;
          return (anchor.x1 + anchor.x2) / 2;
        }
        if (mode === 'start') return anchor.y1;
        if (mode === 'end') return anchor.y2;
        return (anchor.y1 + anchor.y2) / 2;
      })();

      const nextX = new Map<string, number>();
      const nextY = new Map<string, number>();

      for (const b of bounds) {
        if (axis === 'x') {
          const x =
            mode === 'start'
              ? targetLine
              : mode === 'end'
                ? targetLine - b.w
                : targetLine - b.w / 2;
          nextX.set(`${b.type}:${b.id}`, snapEnabled ? snap(x, gridStep) : x);
        } else {
          const y =
            mode === 'start'
              ? targetLine
              : mode === 'end'
                ? targetLine - b.h
                : targetLine - b.h / 2;
          nextY.set(`${b.type}:${b.id}`, snapEnabled ? snap(y, gridStep) : y);
        }
      }

      pushHistory(cur);
      setLayout({
        ...cur,
        cabinets: cur.cabinets.map((c) => {
          const k = `cabinet:${c.cabinetId}`;
          if (axis === 'x') {
            const x = nextX.get(k);
            return typeof x === 'number' ? { ...c, x } : c;
          }
          const y = nextY.get(k);
          return typeof y === 'number' ? { ...c, y } : c;
        }),
        zones: cur.zones.map((z) => {
          const k = `zone:${z.id}`;
          if (axis === 'x') {
            const x = nextX.get(k);
            return typeof x === 'number' ? { ...z, x } : z;
          }
          const y = nextY.get(k);
          return typeof y === 'number' ? { ...z, y } : z;
        }),
        facilities: cur.facilities.map((f) => {
          const k = `facility:${f.id}`;
          if (axis === 'x') {
            const x = nextX.get(k);
            return typeof x === 'number' ? { ...f, x } : f;
          }
          const y = nextY.get(k);
          return typeof y === 'number' ? { ...f, y } : f;
        }),
      });
    },
    [
      cabinetD,
      cabinetW,
      gridStep,
      layers.lockCabinets,
      layers.lockFacilities,
      layers.lockZones,
      pushHistory,
      selected,
      selection.cabinets,
      selection.facilities,
      selection.zones,
      snapEnabled,
    ],
  );

  const alignSelectionLeft = useCallback(() => {
    alignSelection('x', 'start');
  }, [alignSelection]);

  const alignSelectionCenterX = useCallback(() => {
    alignSelection('x', 'center');
  }, [alignSelection]);

  const alignSelectionRight = useCallback(() => {
    alignSelection('x', 'end');
  }, [alignSelection]);

  const alignSelectionTop = useCallback(() => {
    alignSelection('y', 'start');
  }, [alignSelection]);

  const alignSelectionMiddleY = useCallback(() => {
    alignSelection('y', 'center');
  }, [alignSelection]);

  const alignSelectionBottom = useCallback(() => {
    alignSelection('y', 'end');
  }, [alignSelection]);

  const distributeSelectionHorizontal = useCallback(() => {
    const cur = layoutRef.current;
    if (!cur) return;
    if (
      (layers.lockCabinets && selection.cabinets.length) ||
      (layers.lockZones && selection.zones.length) ||
      (layers.lockFacilities && selection.facilities.length)
    ) {
      message.info('选中对象包含锁定图层，无法分布');
      return;
    }
    const items: {
      type: 'cabinet' | 'zone' | 'facility';
      id: string;
      x1: number;
      x2: number;
      w: number;
    }[] = [];
    selection.cabinets.forEach((id) => {
      const c = cur.cabinets.find((x) => x.cabinetId === id);
      if (!c) return;
      items.push({
        type: 'cabinet',
        id,
        x1: c.x,
        x2: c.x + cabinetW,
        w: cabinetW,
      });
    });
    selection.zones.forEach((id) => {
      const z = cur.zones.find((x) => x.id === id);
      if (!z) return;
      items.push({
        type: 'zone',
        id,
        x1: z.x,
        x2: z.x + z.width,
        w: z.width,
      });
    });
    selection.facilities.forEach((id) => {
      const f = cur.facilities.find((x) => x.id === id);
      if (!f) return;
      items.push({
        type: 'facility',
        id,
        x1: f.x,
        x2: f.x,
        w: 0,
      });
    });
    if (items.length < 3) return;
    const sorted = [...items].sort((a, b) => a.x1 - b.x1);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const span = (d: { x1: number; x2: number; w: number }) => {
      if (distributeModeX === 'start') return d.x1;
      if (distributeModeX === 'end') return d.x2;
      return d.x1 + d.w / 2;
    };

    const start = span(first);
    const end = span(last);
    let primaryIdx = -1;
    let primaryLine = 0;
    if (distributeAnchor === 'primary' && selected) {
      const key =
        selected.type === 'cabinet'
          ? `cabinet:${selected.cabinetId}`
          : `${selected.type}:${selected.id}`;
      primaryIdx = sorted.findIndex((it) => `${it.type}:${it.id}` === key);
      if (primaryIdx >= 0) primaryLine = span(sorted[primaryIdx]);
    }
    const step = (end - start) / (sorted.length - 1 || 1);
    const leftStep = primaryIdx > 0 ? (primaryLine - start) / primaryIdx : 0;
    const rightStep =
      primaryIdx >= 0 && primaryIdx < sorted.length - 1
        ? (end - primaryLine) / (sorted.length - 1 - primaryIdx || 1)
        : 0;

    const nextX = new Map<string, number>();
    for (let idx = 0; idx < sorted.length; idx++) {
      const it = sorted[idx];
      const target =
        primaryIdx >= 0
          ? idx <= primaryIdx
            ? start + leftStep * idx
            : primaryLine + rightStep * (idx - primaryIdx)
          : start + step * idx;
      let x = it.x1;
      if (distributeModeX === 'start') x = target;
      else if (distributeModeX === 'end') x = target - it.w;
      else x = target - it.w / 2;
      nextX.set(`${it.type}:${it.id}`, snapEnabled ? snap(x, gridStep) : x);
    }
    pushHistory(cur);
    setLayout({
      ...cur,
      cabinets: cur.cabinets.map((c) => {
        const k = `cabinet:${c.cabinetId}`;
        const x = nextX.get(k);
        return typeof x === 'number' ? { ...c, x } : c;
      }),
      zones: cur.zones.map((z) => {
        const k = `zone:${z.id}`;
        const x = nextX.get(k);
        return typeof x === 'number' ? { ...z, x } : z;
      }),
      facilities: cur.facilities.map((f) => {
        const k = `facility:${f.id}`;
        const x = nextX.get(k);
        return typeof x === 'number' ? { ...f, x } : f;
      }),
    });
  }, [
    cabinetW,
    gridStep,
    distributeAnchor,
    distributeModeX,
    pushHistory,
    selected,
    selection.cabinets,
    selection.zones,
    selection.facilities,
    layers.lockCabinets,
    layers.lockFacilities,
    layers.lockZones,
    snapEnabled,
  ]);

  const distributeSelectionVertical = useCallback(() => {
    const cur = layoutRef.current;
    if (!cur) return;
    if (
      (layers.lockCabinets && selection.cabinets.length) ||
      (layers.lockZones && selection.zones.length) ||
      (layers.lockFacilities && selection.facilities.length)
    ) {
      message.info('选中对象包含锁定图层，无法分布');
      return;
    }
    const items: {
      type: 'cabinet' | 'zone' | 'facility';
      id: string;
      y1: number;
      y2: number;
      h: number;
    }[] = [];
    selection.cabinets.forEach((id) => {
      const c = cur.cabinets.find((x) => x.cabinetId === id);
      if (!c) return;
      items.push({
        type: 'cabinet',
        id,
        y1: c.y,
        y2: c.y + cabinetD,
        h: cabinetD,
      });
    });
    selection.zones.forEach((id) => {
      const z = cur.zones.find((x) => x.id === id);
      if (!z) return;
      items.push({
        type: 'zone',
        id,
        y1: z.y,
        y2: z.y + z.height,
        h: z.height,
      });
    });
    selection.facilities.forEach((id) => {
      const f = cur.facilities.find((x) => x.id === id);
      if (!f) return;
      items.push({
        type: 'facility',
        id,
        y1: f.y,
        y2: f.y,
        h: 0,
      });
    });
    if (items.length < 3) return;
    const sorted = [...items].sort((a, b) => a.y1 - b.y1);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const span = (d: { y1: number; y2: number; h: number }) => {
      if (distributeModeY === 'start') return d.y1;
      if (distributeModeY === 'end') return d.y2;
      return d.y1 + d.h / 2;
    };

    const start = span(first);
    const end = span(last);
    let primaryIdx = -1;
    let primaryLine = 0;
    if (distributeAnchor === 'primary' && selected) {
      const key =
        selected.type === 'cabinet'
          ? `cabinet:${selected.cabinetId}`
          : `${selected.type}:${selected.id}`;
      primaryIdx = sorted.findIndex((it) => `${it.type}:${it.id}` === key);
      if (primaryIdx >= 0) primaryLine = span(sorted[primaryIdx]);
    }
    const step = (end - start) / (sorted.length - 1 || 1);
    const leftStep = primaryIdx > 0 ? (primaryLine - start) / primaryIdx : 0;
    const rightStep =
      primaryIdx >= 0 && primaryIdx < sorted.length - 1
        ? (end - primaryLine) / (sorted.length - 1 - primaryIdx || 1)
        : 0;

    const nextY = new Map<string, number>();
    for (let idx = 0; idx < sorted.length; idx++) {
      const it = sorted[idx];
      const target =
        primaryIdx >= 0
          ? idx <= primaryIdx
            ? start + leftStep * idx
            : primaryLine + rightStep * (idx - primaryIdx)
          : start + step * idx;
      let y = it.y1;
      if (distributeModeY === 'start') y = target;
      else if (distributeModeY === 'end') y = target - it.h;
      else y = target - it.h / 2;
      nextY.set(`${it.type}:${it.id}`, snapEnabled ? snap(y, gridStep) : y);
    }
    pushHistory(cur);
    setLayout({
      ...cur,
      cabinets: cur.cabinets.map((c) => {
        const k = `cabinet:${c.cabinetId}`;
        const y = nextY.get(k);
        return typeof y === 'number' ? { ...c, y } : c;
      }),
      zones: cur.zones.map((z) => {
        const k = `zone:${z.id}`;
        const y = nextY.get(k);
        return typeof y === 'number' ? { ...z, y } : z;
      }),
      facilities: cur.facilities.map((f) => {
        const k = `facility:${f.id}`;
        const y = nextY.get(k);
        return typeof y === 'number' ? { ...f, y } : f;
      }),
    });
  }, [
    cabinetD,
    distributeAnchor,
    distributeModeY,
    gridStep,
    pushHistory,
    selected,
    selection.cabinets,
    selection.zones,
    selection.facilities,
    layers.lockCabinets,
    layers.lockFacilities,
    layers.lockZones,
    snapEnabled,
  ]);

  const autoLayout = useCallback(() => {
    if (!layout) return;
    if (layoutRef.current) pushHistory(layoutRef.current);
    const placed = new Set(layout.cabinets.map((c) => c.cabinetId));
    const next = [...layout.cabinets];
    const cols = Math.max(1, Math.ceil(Math.sqrt(cabinets.length)));
    let idx = 0;
    cabinets.forEach((c) => {
      if (placed.has(c.id)) return;
      const x = (idx % cols) * (cabinetW + 0.8);
      const y = Math.floor(idx / cols) * (cabinetD + 0.9);
      next.push({ cabinetId: c.id, x, y, rotation: 0 });
      idx += 1;
    });
    setLayout({ ...layout, cabinets: next });
    message.success('已生成默认布局');
  }, [layout, cabinets]);

  const save = useCallback(async () => {
    if (!selectedDc || !layout) return;
    setSaving(true);
    try {
      const res = await saveDatacenterLayout(selectedDc, {
        version: layout.version,
        canvasWidth: layout.canvasWidth,
        canvasHeight: layout.canvasHeight,
        pxPerMeter: layout.pxPerMeter,
        cabinets: cabinetItems,
        zones: layout.zones,
        facilities: layout.facilities,
      });
      if (res.success && res.data) {
        savedFingerprintRef.current = getLayoutContentFingerprint(res.data);
        setLayout(res.data);
        setIsDirty(false);
        message.success('保存成功');
      } else {
        message.error('保存失败');
      }
    } finally {
      setSaving(false);
    }
  }, [selectedDc, layout, cabinetItems]);

  const go3D = useCallback(() => {
    if (!selectedDc) return;
    history.push(`/datacenter3d?id=${selectedDc}`);
  }, [selectedDc]);

  const toolOptions = useMemo(() => {
    return [
      { label: '选择', value: 'select', icon: <ScanEye size={20} /> },
      { label: '区域', value: 'zone', icon: <Square size={20} /> },
      { label: '热通道', value: 'hot_aisle', icon: <Thermometer size={20} /> },
      { label: '冷通道', value: 'cold_aisle', icon: <Ruler size={20} /> },
      { label: 'UPS', value: 'ups', icon: <Package size={20} /> },
      { label: '空调', value: 'crac', icon: <AirVent size={20} /> },
      { label: '传感器', value: 'sensor', icon: <Thermometer size={20} /> },
      { label: '门禁', value: 'door', icon: <DoorClosed size={20} /> },
      { label: '摄像头', value: 'camera', icon: <Camera size={20} /> },
      {
        label: '灭火器',
        value: 'fire_extinguisher',
        icon: <FlameKindling size={20} />,
      },
    ];
  }, []);

  const rotateSelection = useCallback(
    (delta: number) => {
      const cur = layoutRef.current;
      if (!cur) return;
      if (
        (layers.lockCabinets && selection.cabinets.length) ||
        (layers.lockZones && selection.zones.length) ||
        (layers.lockFacilities && selection.facilities.length)
      ) {
        message.info('选中对象包含锁定图层，无法旋转');
        return;
      }
      if (!selectionCount) return;
      pushHistory(cur);
      setLayout({
        ...cur,
        cabinets: cur.cabinets.map((c) =>
          selection.cabinets.includes(c.cabinetId)
            ? { ...c, rotation: (c.rotation || 0) + delta }
            : c,
        ),
        zones: cur.zones.map((z) =>
          selection.zones.includes(z.id)
            ? { ...z, rotation: (z.rotation || 0) + delta }
            : z,
        ),
        facilities: cur.facilities.map((f) =>
          selection.facilities.includes(f.id)
            ? { ...f, rotation: (f.rotation || 0) + delta }
            : f,
        ),
      });
    },
    [
      layers.lockCabinets,
      layers.lockFacilities,
      layers.lockZones,
      pushHistory,
      selection.cabinets,
      selection.facilities,
      selection.zones,
      selectionCount,
    ],
  );

  const onDeleteSelected = useCallback(() => {
    if (!layout) return;
    if (layers.lockZones && layers.lockFacilities) {
      message.info('区域/设施图层已锁定');
      return;
    }
    const before = layoutRef.current;
    if (before) pushHistory(before);
    const zonesToDelete = layers.lockZones
      ? new Set<string>()
      : new Set(selection.zones);
    const facilitiesToDelete = layers.lockFacilities
      ? new Set<string>()
      : new Set(selection.facilities);
    if (!zonesToDelete.size && !facilitiesToDelete.size) {
      message.info('机柜不支持删除（请在机柜管理中删除）');
      return;
    }

    setLayout({
      ...layout,
      zones: layout.zones.filter((z) => !zonesToDelete.has(z.id)),
      facilities: layout.facilities.filter(
        (f) => !facilitiesToDelete.has(f.id),
      ),
    });
    setSelection({ cabinets: selection.cabinets, zones: [], facilities: [] });
    setSelected(null);
  }, [
    layout,
    pushHistory,
    selection.cabinets,
    selection.zones,
    selection.facilities,
    layers.lockFacilities,
    layers.lockZones,
  ]);

  const infoText = useMemo(() => {
    if (!layout) return '';
    return `画布：${layout.canvasWidth}m × ${layout.canvasHeight}m，比例：${layout.pxPerMeter}px/m`;
  }, [layout]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableKeyboardTarget(e.target)) return;
      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      if (mod && key === 's') {
        e.preventDefault();
        save();
        return;
      }

      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if (mod && key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (mod && key === 'c') {
        e.preventDefault();
        copySelectionToClipboard();
        return;
      }

      if (mod && key === 'v') {
        e.preventDefault();
        pasteSelectionFromClipboard();
        return;
      }

      if (mod && key === 'd') {
        e.preventDefault();
        copySelectionToClipboard();
        pasteSelectionFromClipboard();
        return;
      }

      if (key === 'escape') {
        setTool('select');
        setSelectionOnly(null);
        return;
      }

      if (key === 'delete' || key === 'backspace') {
        if (selectionCount > 0) {
          e.preventDefault();
          onDeleteSelected();
        }
        return;
      }

      const moveKey =
        key === 'arrowup' ||
        key === 'arrowdown' ||
        key === 'arrowleft' ||
        key === 'arrowright';
      if (!moveKey || !selected) return;
      if (isLayerLocked(selected.type)) return;

      e.preventDefault();
      const step = e.shiftKey ? gridStep * 10 : gridStep;
      const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
      const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;

      const before = layoutRef.current;
      if (before) pushHistory(before);

      if (selected.type === 'cabinet') {
        const item = cabinetItems.find(
          (c) => c.cabinetId === selected.cabinetId,
        );
        if (!item) return;
        const x = item.x + dx;
        const y = item.y + dy;
        setCabinetItem(selected.cabinetId, {
          x: snapEnabled ? snap(x, gridStep) : x,
          y: snapEnabled ? snap(y, gridStep) : y,
        });
      }
      if (selected.type === 'zone') {
        const z = zones.find((z0) => z0.id === selected.id);
        if (!z) return;
        const x = z.x + dx;
        const y = z.y + dy;
        setZoneItem(selected.id, {
          x: snapEnabled ? snap(x, gridStep) : x,
          y: snapEnabled ? snap(y, gridStep) : y,
        });
      }
      if (selected.type === 'facility') {
        const f = facilities.find((f0) => f0.id === selected.id);
        if (!f) return;
        const x = f.x + dx;
        const y = f.y + dy;
        setFacilityItem(selected.id, {
          x: snapEnabled ? snap(x, gridStep) : x,
          y: snapEnabled ? snap(y, gridStep) : y,
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    save,
    undo,
    redo,
    copySelectionToClipboard,
    pasteSelectionFromClipboard,
    onDeleteSelected,
    selected,
    selectionCount,
    cabinetItems,
    zones,
    facilities,
    gridStep,
    snapEnabled,
    pushHistory,
    setSelectionOnly,
    isLayerLocked,
    setCabinetItem,
    setZoneItem,
    setFacilityItem,
  ]);

  return (
    <PageContainer
      header={{
        title: (
          <Space>
            机房布局编辑器
            {isDirty && (
              <Typography.Text type="warning">未保存</Typography.Text>
            )}
          </Space>
        ),
        subTitle: infoText,
      }}
    >
      <div className={styles.layoutPage}>
        <div className={styles.sidebar}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Text type="secondary">数据中心</Typography.Text>
              <Select
                value={selectedDc}
                onChange={(value) => {
                  if (!isDirty) {
                    setSelectedDc(value);
                    return;
                  }
                  Modal.confirm({
                    title: '切换数据中心？',
                    content: '当前布局尚未保存，切换后修改将丢失。',
                    okText: '放弃修改并切换',
                    okButtonProps: { danger: true },
                    cancelText: '取消',
                    onOk: () => setSelectedDc(value),
                  });
                }}
                options={datacenters.map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
                loading={loading}
                style={{ width: '100%' }}
              />
              <Space wrap>
                <Button
                  icon={<Save size={16} />}
                  type="primary"
                  onClick={save}
                  loading={saving}
                  disabled={!isDirty}
                >
                  保存
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedDc) return;
                    if (!isDirty) {
                      load(selectedDc);
                      return;
                    }
                    Modal.confirm({
                      title: '重新加载布局？',
                      content: '当前未保存修改将被服务端版本覆盖。',
                      okText: '放弃修改并刷新',
                      okButtonProps: { danger: true },
                      cancelText: '取消',
                      onOk: () => load(selectedDc),
                    });
                  }}
                >
                  刷新
                </Button>
                <Button onClick={go3D}>打开3D</Button>
              </Space>
              {loadError && (
                <Alert
                  type="error"
                  showIcon
                  message={loadError}
                  action={
                    <Button
                      size="small"
                      onClick={() => selectedDc && load(selectedDc)}
                    >
                      重试
                    </Button>
                  }
                />
              )}
            </Space>
          </Card>

          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Text type="secondary">工具</Typography.Text>
              <div className={styles.toolModeGrid}>
                {(toolOptions as any[]).map((o) => (
                  <Button
                    key={o.value}
                    className={`${styles.toolModeButton} ${
                      styles[`toolMode_${o.value}` as keyof typeof styles] || ''
                    } ${tool === o.value ? styles.toolModeActive : ''}`}
                    type="default"
                    size="large"
                    icon={o.icon}
                    onClick={() => setTool(o.value as ToolMode)}
                  >
                    <span className={styles.toolModeLabel}>{o.label}</span>
                  </Button>
                ))}
              </div>
              <Alert
                type="info"
                showIcon
                message={
                  tool === 'select'
                    ? '拖拽物体移动；Shift+点击多选；Shift+拖拽框选；拖拽空白区域平移；滚轮缩放；图层锁定可防止误移动'
                    : '在画布空白处点击/拖拽创建或放置'
                }
              />
              <div className={styles.toolIconGrid}>
                <Tooltip title="放大">
                  <Button
                    size="large"
                    className={styles.toolIconButton}
                    icon={<ZoomIn size={20} />}
                    onClick={() => setScale((s) => clamp(s + 0.1, 0.3, 3))}
                  />
                </Tooltip>
                <Tooltip title="缩小">
                  <Button
                    size="large"
                    className={styles.toolIconButton}
                    icon={<ZoomOut size={20} />}
                    onClick={() => setScale((s) => clamp(s - 0.1, 0.3, 3))}
                  />
                </Tooltip>
                <Tooltip title="重置视图">
                  <Button
                    size="large"
                    className={styles.toolIconButton}
                    icon={<Undo2 size={20} />}
                    onClick={() => {
                      setScale(1);
                      setOffset({ x: 20, y: 20 });
                    }}
                  />
                </Tooltip>
                <Tooltip title="适配视图">
                  <Button
                    size="large"
                    className={styles.toolIconButton}
                    onClick={fitToView}
                    icon={<Ruler size={20} />}
                  />
                </Tooltip>
                <Tooltip title="撤销 (Ctrl+Z)">
                  <Button
                    size="large"
                    className={styles.toolIconButton}
                    disabled={!canUndo}
                    icon={<Undo2 size={20} />}
                    onClick={undo}
                  />
                </Tooltip>
                <Tooltip title="重做 (Ctrl+Y)">
                  <Button
                    size="large"
                    className={styles.toolIconButton}
                    disabled={!canRedo}
                    icon={<Redo2 size={20} />}
                    onClick={redo}
                  />
                </Tooltip>
                <Tooltip title="导出JSON（复制到剪贴板）">
                  <Button
                    size="large"
                    className={styles.toolIconButton}
                    icon={<Download size={20} />}
                    onClick={exportJson}
                  />
                </Tooltip>
                <Tooltip title="导入JSON">
                  <Button
                    size="large"
                    className={styles.toolIconButton}
                    icon={<Upload size={20} />}
                    onClick={() => {
                      setImportText('');
                      setImportOpen(true);
                    }}
                  />
                </Tooltip>
              </div>
              <Space wrap style={{ alignItems: 'center' }}>
                <Typography.Text type="secondary">吸附</Typography.Text>
                <Switch checked={snapEnabled} onChange={setSnapEnabled} />
                <Typography.Text type="secondary">网格(m)</Typography.Text>
                <InputNumber
                  min={0.05}
                  step={0.05}
                  value={gridStep}
                  onChange={(v) =>
                    setGridStep(Math.max(0.05, Number(v || 0.1)))
                  }
                />
              </Space>
              <Divider style={{ margin: '12px 0' }} />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text type="secondary">图层</Typography.Text>
                <Space
                  wrap
                  style={{ justifyContent: 'space-between', width: '100%' }}
                >
                  <Typography.Text>机柜</Typography.Text>
                  <Space>
                    <Tooltip title="显示/隐藏">
                      <Switch
                        checked={layers.showCabinets}
                        onChange={(v) =>
                          setLayers((p) => ({ ...p, showCabinets: v }))
                        }
                      />
                    </Tooltip>
                    <Tooltip title="锁定（禁止移动/旋转/键盘微调）">
                      <Switch
                        checked={layers.lockCabinets}
                        onChange={(v) =>
                          setLayers((p) => ({ ...p, lockCabinets: v }))
                        }
                      />
                    </Tooltip>
                  </Space>
                </Space>
                <Space
                  wrap
                  style={{ justifyContent: 'space-between', width: '100%' }}
                >
                  <Typography.Text>区域</Typography.Text>
                  <Space>
                    <Tooltip title="显示/隐藏">
                      <Switch
                        checked={layers.showZones}
                        onChange={(v) =>
                          setLayers((p) => ({ ...p, showZones: v }))
                        }
                      />
                    </Tooltip>
                    <Tooltip title="锁定（禁止移动/缩放/旋转）">
                      <Switch
                        checked={layers.lockZones}
                        onChange={(v) =>
                          setLayers((p) => ({ ...p, lockZones: v }))
                        }
                      />
                    </Tooltip>
                  </Space>
                </Space>
                <Space
                  wrap
                  style={{ justifyContent: 'space-between', width: '100%' }}
                >
                  <Typography.Text>设施</Typography.Text>
                  <Space>
                    <Tooltip title="显示/隐藏">
                      <Switch
                        checked={layers.showFacilities}
                        onChange={(v) =>
                          setLayers((p) => ({ ...p, showFacilities: v }))
                        }
                      />
                    </Tooltip>
                    <Tooltip title="锁定（禁止移动/旋转）">
                      <Switch
                        checked={layers.lockFacilities}
                        onChange={(v) =>
                          setLayers((p) => ({ ...p, lockFacilities: v }))
                        }
                      />
                    </Tooltip>
                  </Space>
                </Space>
              </Space>
              <Divider style={{ margin: '12px 0' }} />
              <Space wrap>
                <Button onClick={autoLayout}>生成默认布局</Button>
                <Button danger onClick={onDeleteSelected} disabled={!selected}>
                  删除选中
                </Button>
              </Space>
              <Space wrap>
                <Button
                  onClick={() => rotateSelection(-90)}
                  disabled={selectionCount === 0}
                >
                  左转90°
                </Button>
                <Button
                  onClick={() => rotateSelection(90)}
                  disabled={selectionCount === 0}
                >
                  右转90°
                </Button>
              </Space>
              <Space wrap>
                <Button
                  onClick={alignSelectionLeft}
                  disabled={selectionCount < 2}
                >
                  左对齐
                </Button>
                <Button
                  onClick={alignSelectionCenterX}
                  disabled={selectionCount < 2}
                >
                  水平居中
                </Button>
                <Button
                  onClick={alignSelectionRight}
                  disabled={selectionCount < 2}
                >
                  右对齐
                </Button>
              </Space>
              <Space wrap>
                <Button
                  onClick={alignSelectionTop}
                  disabled={selectionCount < 2}
                >
                  顶对齐
                </Button>
                <Button
                  onClick={alignSelectionMiddleY}
                  disabled={selectionCount < 2}
                >
                  垂直居中
                </Button>
                <Button
                  onClick={alignSelectionBottom}
                  disabled={selectionCount < 2}
                >
                  底对齐
                </Button>
              </Space>
              <Space wrap style={{ alignItems: 'center' }}>
                <Typography.Text type="secondary">分布锚点</Typography.Text>
                <Segmented
                  value={distributeAnchor}
                  onChange={(v) => setDistributeAnchor(v as DistributeAnchor)}
                  options={[
                    { label: '固定两端', value: 'endpoints' },
                    { label: '主选中', value: 'primary' },
                  ]}
                />
              </Space>
              <Space wrap>
                <Button
                  onClick={distributeSelectionHorizontal}
                  disabled={selectionCount < 3}
                >
                  水平等距
                </Button>
                <Segmented
                  value={distributeModeX}
                  onChange={(v) => setDistributeModeX(v as DistributeMode)}
                  options={[
                    { label: '按左', value: 'start' },
                    { label: '按中', value: 'center' },
                    { label: '按右', value: 'end' },
                  ]}
                />
                <Button
                  onClick={distributeSelectionVertical}
                  disabled={selectionCount < 3}
                >
                  垂直等距
                </Button>
                <Segmented
                  value={distributeModeY}
                  onChange={(v) => setDistributeModeY(v as DistributeMode)}
                  options={[
                    { label: '按上', value: 'start' },
                    { label: '按中', value: 'center' },
                    { label: '按下', value: 'end' },
                  ]}
                />
              </Space>
            </Space>
          </Card>
        </div>

        <Card
          className={styles.canvasCard}
          loading={loading}
          bodyStyle={{ height: '100%' }}
        >
          <div
            className={styles.canvasWrap}
            ref={wrapRef}
            onPointerDown={onPointerDownWrap}
            onPointerMove={onPointerMoveWrap}
            onPointerUp={onPointerUpWrap}
            onWheel={onWheel}
          >
            {guides?.x !== undefined && (
              <div
                className={styles.guideV}
                style={{
                  left: offset.x + guides.x * pxPerMeter * scale,
                }}
              />
            )}
            {guides?.y !== undefined && (
              <div
                className={styles.guideH}
                style={{
                  top: offset.y + guides.y * pxPerMeter * scale,
                }}
              />
            )}
            {selectBox && (
              <div
                className={styles.selectBox}
                style={{
                  left: selectBox.left,
                  top: selectBox.top,
                  width: selectBox.width,
                  height: selectBox.height,
                }}
              />
            )}
            {snapHint && <div className={styles.snapHint}>{snapHint}</div>}
            <div
              className={styles.viewport}
              style={viewportStyle}
              data-role="canvas"
            >
              {layers.showZones &&
                zones.map((z) => {
                  const left = z.x * pxPerMeter;
                  const top = z.y * pxPerMeter;
                  const width = z.width * pxPerMeter;
                  const height = z.height * pxPerMeter;
                  const isSelected = selection.zones.includes(z.id);
                  const isPrimary =
                    selected?.type === 'zone' && selected.id === z.id;
                  return (
                    <div
                      key={z.id}
                      className={`${styles.zone} ${isSelected ? styles.zoneSelected : ''}`}
                      style={{
                        left,
                        top,
                        width,
                        height,
                        background: z.color || ZONE_COLORS[z.type],
                        transform: `rotate(${z.rotation || 0}deg)`,
                        transformOrigin: 'center',
                        opacity: layers.lockZones ? 0.7 : 1,
                        cursor: layers.lockZones ? 'not-allowed' : 'grab',
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        if (e.shiftKey) {
                          toggleSelection({ type: 'zone', id: z.id });
                          return;
                        }

                        const inSelection = selection.zones.includes(z.id);
                        if (!inSelection) {
                          setSelectionOnly({ type: 'zone', id: z.id });
                        } else {
                          setSelected({ type: 'zone', id: z.id });
                        }

                        if (layers.lockZones) {
                          message.info('区域图层已锁定');
                          return;
                        }

                        const snapshot =
                          selectionCount > 1 && inSelection
                            ? buildSnapshot()
                            : undefined;
                        dragRef.current = {
                          kind: 'zone',
                          id: z.id,
                          startClientX: e.clientX,
                          startClientY: e.clientY,
                          startOffsetX: offset.x,
                          startOffsetY: offset.y,
                          startX: z.x,
                          startY: z.y,
                          startW: z.width,
                          startH: z.height,
                          snapshot,
                          beforeLayout: layoutRef.current
                            ? cloneLayout(layoutRef.current)
                            : undefined,
                        };
                        (wrapRef.current as HTMLDivElement).setPointerCapture(
                          e.pointerId,
                        );
                      }}
                    >
                      <div
                        style={{
                          padding: 8,
                          fontSize: 12,
                          color: 'rgba(0,0,0,0.75)',
                        }}
                      >
                        {z.name || zoneLabel(z.type)}
                      </div>
                      {isPrimary && (
                        <>
                          <div
                            className={`${styles.resizeHandle} ${styles.resizeHandleNw}`}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              if (layers.lockZones) return;
                              const before = layoutRef.current;
                              dragRef.current = {
                                kind: 'zone_resize',
                                id: z.id,
                                corner: 'nw',
                                startClientX: e.clientX,
                                startClientY: e.clientY,
                                startOffsetX: offset.x,
                                startOffsetY: offset.y,
                                startX: z.x,
                                startY: z.y,
                                startW: z.width,
                                startH: z.height,
                                beforeLayout: before
                                  ? cloneLayout(before)
                                  : undefined,
                              };
                              (
                                wrapRef.current as HTMLDivElement
                              ).setPointerCapture(e.pointerId);
                            }}
                          />
                          <div
                            className={`${styles.resizeHandle} ${styles.resizeHandleNe}`}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              if (layers.lockZones) return;
                              const before = layoutRef.current;
                              dragRef.current = {
                                kind: 'zone_resize',
                                id: z.id,
                                corner: 'ne',
                                startClientX: e.clientX,
                                startClientY: e.clientY,
                                startOffsetX: offset.x,
                                startOffsetY: offset.y,
                                startX: z.x,
                                startY: z.y,
                                startW: z.width,
                                startH: z.height,
                                beforeLayout: before
                                  ? cloneLayout(before)
                                  : undefined,
                              };
                              (
                                wrapRef.current as HTMLDivElement
                              ).setPointerCapture(e.pointerId);
                            }}
                          />
                          <div
                            className={`${styles.resizeHandle} ${styles.resizeHandleSw}`}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              if (layers.lockZones) return;
                              const before = layoutRef.current;
                              dragRef.current = {
                                kind: 'zone_resize',
                                id: z.id,
                                corner: 'sw',
                                startClientX: e.clientX,
                                startClientY: e.clientY,
                                startOffsetX: offset.x,
                                startOffsetY: offset.y,
                                startX: z.x,
                                startY: z.y,
                                startW: z.width,
                                startH: z.height,
                                beforeLayout: before
                                  ? cloneLayout(before)
                                  : undefined,
                              };
                              (
                                wrapRef.current as HTMLDivElement
                              ).setPointerCapture(e.pointerId);
                            }}
                          />
                          <div
                            className={`${styles.resizeHandle} ${styles.resizeHandleSe}`}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              if (layers.lockZones) return;
                              const before = layoutRef.current;
                              dragRef.current = {
                                kind: 'zone_resize',
                                id: z.id,
                                corner: 'se',
                                startClientX: e.clientX,
                                startClientY: e.clientY,
                                startOffsetX: offset.x,
                                startOffsetY: offset.y,
                                startX: z.x,
                                startY: z.y,
                                startW: z.width,
                                startH: z.height,
                                beforeLayout: before
                                  ? cloneLayout(before)
                                  : undefined,
                              };
                              (
                                wrapRef.current as HTMLDivElement
                              ).setPointerCapture(e.pointerId);
                            }}
                          />
                        </>
                      )}
                    </div>
                  );
                })}

              {layers.showCabinets &&
                cabinetItems.map((ci) => {
                  const c = cabinetMap.get(ci.cabinetId);
                  const name = c?.code || c?.name || ci.cabinetId;
                  const left = ci.x * pxPerMeter;
                  const top = ci.y * pxPerMeter;
                  const w = cabinetW * pxPerMeter;
                  const h = cabinetD * pxPerMeter;
                  const isSelected = selection.cabinets.includes(ci.cabinetId);
                  return (
                    <div
                      key={ci.cabinetId}
                      className={`${styles.cabinet} ${
                        isSelected ? styles.cabinetSelected : ''
                      }`}
                      style={{
                        left,
                        top,
                        width: w,
                        height: h,
                        transform: `rotate(${ci.rotation || 0}deg)`,
                        transformOrigin: 'center',
                        opacity: layers.lockCabinets ? 0.7 : 1,
                        cursor: layers.lockCabinets ? 'not-allowed' : 'grab',
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        if (e.shiftKey) {
                          toggleSelection({
                            type: 'cabinet',
                            cabinetId: ci.cabinetId,
                          });
                          return;
                        }

                        const inSelection = selection.cabinets.includes(
                          ci.cabinetId,
                        );
                        if (!inSelection) {
                          setSelectionOnly({
                            type: 'cabinet',
                            cabinetId: ci.cabinetId,
                          });
                        } else {
                          setSelected({
                            type: 'cabinet',
                            cabinetId: ci.cabinetId,
                          });
                        }

                        if (layers.lockCabinets) {
                          message.info('机柜图层已锁定');
                          return;
                        }

                        const snapshot =
                          selectionCount > 1 && inSelection
                            ? buildSnapshot()
                            : undefined;
                        dragRef.current = {
                          kind: 'cabinet',
                          cabinetId: ci.cabinetId,
                          startClientX: e.clientX,
                          startClientY: e.clientY,
                          startOffsetX: offset.x,
                          startOffsetY: offset.y,
                          startX: ci.x,
                          startY: ci.y,
                          snapshot,
                          beforeLayout: layoutRef.current
                            ? cloneLayout(layoutRef.current)
                            : undefined,
                        };
                        (wrapRef.current as HTMLDivElement).setPointerCapture(
                          e.pointerId,
                        );
                      }}
                    >
                      {name}
                    </div>
                  );
                })}

              {layers.showFacilities &&
                facilities.map((f) => {
                  const left = f.x * pxPerMeter - 17;
                  const top = f.y * pxPerMeter - 17;
                  const isSelected = selection.facilities.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      className={`${styles.facility} ${
                        isSelected ? styles.facilitySelected : ''
                      }`}
                      style={{
                        left,
                        top,
                        transform: `rotate(${f.rotation || 0}deg)`,
                        transformOrigin: 'center',
                        opacity: layers.lockFacilities ? 0.75 : 1,
                        cursor: layers.lockFacilities ? 'not-allowed' : 'grab',
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        if (e.shiftKey) {
                          toggleSelection({ type: 'facility', id: f.id });
                          return;
                        }

                        const inSelection = selection.facilities.includes(f.id);
                        if (!inSelection) {
                          setSelectionOnly({ type: 'facility', id: f.id });
                        } else {
                          setSelected({ type: 'facility', id: f.id });
                        }

                        if (layers.lockFacilities) {
                          message.info('设施图层已锁定');
                          return;
                        }

                        const snapshot =
                          selectionCount > 1 && inSelection
                            ? buildSnapshot()
                            : undefined;
                        dragRef.current = {
                          kind: 'facility',
                          id: f.id,
                          startClientX: e.clientX,
                          startClientY: e.clientY,
                          startOffsetX: offset.x,
                          startOffsetY: offset.y,
                          startX: f.x,
                          startY: f.y,
                          snapshot,
                          beforeLayout: layoutRef.current
                            ? cloneLayout(layoutRef.current)
                            : undefined,
                        };
                        (wrapRef.current as HTMLDivElement).setPointerCapture(
                          e.pointerId,
                        );
                      }}
                    >
                      {facilityIcon(f.type)}
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      </div>

      <Drawer
        title="属性"
        placement="right"
        open={!!selected}
        width={360}
        mask={false}
        onClose={() => setSelectionOnly(null)}
      >
        {selected && (
          <>
            {selected.type === 'cabinet' ? (
              <Form layout="vertical">
                <Form.Item label="机柜">
                  <Input
                    value={
                      cabinetMap.get(selected.cabinetId)?.name ||
                      selected.cabinetId
                    }
                    disabled
                  />
                </Form.Item>
                <Form.Item label="X(m)">
                  <InputNumber
                    value={selectedCabinetItem?.x || 0}
                    step={gridStep}
                    onChange={(v) => {
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      const raw = Number(v || 0);
                      setCabinetItem(selected.cabinetId, {
                        x: snapEnabled ? snap(raw, gridStep) : raw,
                      });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Y(m)">
                  <InputNumber
                    value={selectedCabinetItem?.y || 0}
                    step={gridStep}
                    onChange={(v) => {
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      const raw = Number(v || 0);
                      setCabinetItem(selected.cabinetId, {
                        y: snapEnabled ? snap(raw, gridStep) : raw,
                      });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="旋转(°)">
                  <InputNumber
                    value={selectedCabinetItem?.rotation || 0}
                    step={90}
                    onChange={(v) => {
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      setCabinetItem(selected.cabinetId, {
                        rotation: Number(v || 0),
                      });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Form>
            ) : selected.type === 'zone' ? (
              <Form layout="vertical">
                <Form.Item label="类型">
                  <Select
                    value={selectedZone?.type}
                    options={[
                      { value: 'zone', label: '区域' },
                      { value: 'hot_aisle', label: '热通道' },
                      { value: 'cold_aisle', label: '冷通道' },
                      { value: 'restricted', label: '限制区' },
                      { value: 'other', label: '其他' },
                    ]}
                    onChange={(v) => {
                      if (!selectedZone) return;
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      setZoneItem(selectedZone.id, { type: v as any });
                    }}
                  />
                </Form.Item>
                <Form.Item label="名称">
                  <Input
                    value={selectedZone?.name}
                    onChange={(e) =>
                      selectedZone &&
                      setZoneItem(selectedZone.id, { name: e.target.value })
                    }
                  />
                </Form.Item>
                <Form.Item label="X(m)">
                  <InputNumber
                    value={selectedZone?.x || 0}
                    step={gridStep}
                    onChange={(v) => {
                      if (!selectedZone) return;
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      const raw = Number(v || 0);
                      setZoneItem(selectedZone.id, {
                        x: snapEnabled ? snap(raw, gridStep) : raw,
                      });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Y(m)">
                  <InputNumber
                    value={selectedZone?.y || 0}
                    step={gridStep}
                    onChange={(v) => {
                      if (!selectedZone) return;
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      const raw = Number(v || 0);
                      setZoneItem(selectedZone.id, {
                        y: snapEnabled ? snap(raw, gridStep) : raw,
                      });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="宽(m)">
                  <InputNumber
                    value={selectedZone?.width || 0}
                    step={gridStep}
                    min={gridStep}
                    onChange={(v) => {
                      if (!selectedZone) return;
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      const raw = Math.max(gridStep, Number(v || 0));
                      setZoneItem(selectedZone.id, {
                        width: snapEnabled
                          ? Math.max(gridStep, snap(raw, gridStep))
                          : raw,
                      });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="高(m)">
                  <InputNumber
                    value={selectedZone?.height || 0}
                    step={gridStep}
                    min={gridStep}
                    onChange={(v) => {
                      if (!selectedZone) return;
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      const raw = Math.max(gridStep, Number(v || 0));
                      setZoneItem(selectedZone.id, {
                        height: snapEnabled
                          ? Math.max(gridStep, snap(raw, gridStep))
                          : raw,
                      });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="旋转(°)">
                  <InputNumber
                    value={selectedZone?.rotation || 0}
                    step={90}
                    onChange={(v) => {
                      if (!selectedZone) return;
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      setZoneItem(selectedZone.id, {
                        rotation: Number(v || 0),
                      });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Form>
            ) : (
              <Form layout="vertical">
                <Form.Item label="类型">
                  <Input value={selectedFacility?.type} disabled />
                </Form.Item>
                <Form.Item label="名称">
                  <Input
                    value={selectedFacility?.name}
                    onChange={(e) =>
                      selectedFacility &&
                      setFacilityItem(selectedFacility.id, {
                        name: e.target.value,
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label="X(m)">
                  <InputNumber
                    value={selectedFacility?.x || 0}
                    step={gridStep}
                    onChange={(v) => {
                      if (!selectedFacility) return;
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      const raw = Number(v || 0);
                      setFacilityItem(selectedFacility.id, {
                        x: snapEnabled ? snap(raw, gridStep) : raw,
                      });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Y(m)">
                  <InputNumber
                    value={selectedFacility?.y || 0}
                    step={gridStep}
                    onChange={(v) => {
                      if (!selectedFacility) return;
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      const raw = Number(v || 0);
                      setFacilityItem(selectedFacility.id, {
                        y: snapEnabled ? snap(raw, gridStep) : raw,
                      });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="旋转(°)">
                  <InputNumber
                    value={selectedFacility?.rotation || 0}
                    step={90}
                    onChange={(v) => {
                      if (!selectedFacility) return;
                      const before = layoutRef.current;
                      if (before) pushHistory(before);
                      setFacilityItem(selectedFacility.id, {
                        rotation: Number(v || 0),
                      });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Form>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title="导入/导出布局 JSON"
        open={importOpen}
        okText="导入覆盖"
        cancelText="关闭"
        onOk={applyImport}
        onCancel={() => setImportOpen(false)}
        okButtonProps={{ disabled: !importText.trim() }}
        width={820}
      >
        <Alert
          type="info"
          showIcon
          message="导入会覆盖当前未保存的布局（可先用撤销恢复）。导出建议先保存。"
          style={{ marginBottom: 12 }}
        />
        <Input.TextArea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          autoSize={{ minRows: 12, maxRows: 20 }}
          placeholder="粘贴布局 JSON 到这里"
        />
      </Modal>
    </PageContainer>
  );
};

export default DatacenterLayoutPage;
