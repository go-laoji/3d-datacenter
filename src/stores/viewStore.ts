import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { InfoDensity } from '../components/3d/InfoDisplay';

// LOD级别定义
export enum LODLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  HIDDEN = 'hidden',
}

// 视图状态类型
export type ViewMode = 'datacenter' | 'cabinet' | 'device';

interface ViewState {
  // 视图模式
  viewMode: ViewMode;
  // 选中的机柜
  selectedCabinet: IDC.Cabinet | null;
  // 选中的设备
  selectedDevice: IDC.Device | null;
  // 悬停的机柜ID
  hoveredCabinetId: string | null;
  // 悬停的设备ID
  hoveredDeviceId: string | null;
  // 高亮的机柜ID(搜索结果)
  highlightedCabinetId: string | null;
  // 高亮的设备ID(搜索结果)
  highlightedDeviceId: string | null;
  // 多选设备IDs(框选)
  selectedDeviceIds: string[];
  // 信息密度
  infoDensity: InfoDensity;
  // LOD级别
  lodLevel: LODLevel;
  // 显示热力图
  showHeatmap: boolean;
  // 相机目标位置
  cameraTarget: [number, number, number] | null;
  // 机柜旋转角度
  cabinetRotationY: number;
  // 设备旋转角度
  deviceRotationY: number;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  selectCabinet: (cabinet: IDC.Cabinet | null) => void;
  selectDevice: (device: IDC.Device | null) => void;
  setHoveredCabinet: (id: string | null) => void;
  setHoveredDevice: (id: string | null) => void;
  highlightCabinet: (id: string | null) => void;
  highlightDevice: (id: string | null) => void;
  setSelectedDeviceIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setInfoDensity: (density: InfoDensity) => void;
  setLodLevel: (level: LODLevel) => void;
  toggleHeatmap: () => void;
  setCameraTarget: (target: [number, number, number] | null) => void;
  setCabinetRotationY: (angle: number) => void;
  setDeviceRotationY: (angle: number) => void;
  resetView: () => void;
}

export const useViewStore = create<ViewState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    viewMode: 'datacenter',
    selectedCabinet: null,
    selectedDevice: null,
    hoveredCabinetId: null,
    hoveredDeviceId: null,
    highlightedCabinetId: null,
    highlightedDeviceId: null,
    selectedDeviceIds: [],
    infoDensity: 'normal',
    lodLevel: LODLevel.HIGH,
    showHeatmap: false,
    cameraTarget: null,
    cabinetRotationY: 0,
    deviceRotationY: 0,

    // Actions
    setViewMode: (mode) => set({ viewMode: mode }),

    selectCabinet: (cabinet) =>
      set({
        selectedCabinet: cabinet,
        // 选中机柜时清除设备选中
        selectedDevice: cabinet ? get().selectedDevice : null,
      }),

    selectDevice: (device) => set({ selectedDevice: device }),

    setHoveredCabinet: (id) => set({ hoveredCabinetId: id }),

    setHoveredDevice: (id) => set({ hoveredDeviceId: id }),

    highlightCabinet: (id) => set({ highlightedCabinetId: id }),

    highlightDevice: (id) => set({ highlightedDeviceId: id }),

    setSelectedDeviceIds: (ids) => set({ selectedDeviceIds: ids }),

    addToSelection: (id) =>
      set((state) => ({
        selectedDeviceIds: state.selectedDeviceIds.includes(id)
          ? state.selectedDeviceIds
          : [...state.selectedDeviceIds, id],
      })),

    removeFromSelection: (id) =>
      set((state) => ({
        selectedDeviceIds: state.selectedDeviceIds.filter((i) => i !== id),
      })),

    clearSelection: () =>
      set({
        selectedDeviceIds: [],
        selectedCabinet: null,
        selectedDevice: null,
        highlightedCabinetId: null,
        highlightedDeviceId: null,
      }),

    setInfoDensity: (density) => set({ infoDensity: density }),

    setLodLevel: (level) => set({ lodLevel: level }),

    toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),

    setCameraTarget: (target) => set({ cameraTarget: target }),

    setCabinetRotationY: (angle) => set({ cabinetRotationY: angle }),

    setDeviceRotationY: (angle) => set({ deviceRotationY: angle }),

    resetView: () =>
      set({
        viewMode: 'datacenter',
        selectedCabinet: null,
        selectedDevice: null,
        hoveredCabinetId: null,
        hoveredDeviceId: null,
        highlightedCabinetId: null,
        highlightedDeviceId: null,
        selectedDeviceIds: [],
        cameraTarget: null,
        cabinetRotationY: 0,
        deviceRotationY: 0,
      }),
  })),
);

// 便捷选择器hooks
export const useSelectedCabinet = () =>
  useViewStore((state) => state.selectedCabinet);
export const useSelectedDevice = () =>
  useViewStore((state) => state.selectedDevice);
export const useViewMode = () => useViewStore((state) => state.viewMode);
export const useInfoDensity = () => useViewStore((state) => state.infoDensity);
export const useShowHeatmap = () => useViewStore((state) => state.showHeatmap);
