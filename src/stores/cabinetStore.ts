import { create } from 'zustand';

interface CabinetState {
  // 当前选中的机柜
  selectedCabinet: IDC.Cabinet | null;
  // 机柜列表
  cabinets: IDC.Cabinet[];
  // 机柜旋转角度(Y轴)
  cabinetRotationY: number;
  // 放大设备旋转角度(Y轴)
  deviceRotationY: number;
  // 是否显示后面板
  showRear: boolean;

  // Actions
  selectCabinet: (cabinet: IDC.Cabinet | null) => void;
  setCabinets: (cabinets: IDC.Cabinet[]) => void;
  setCabinetRotation: (rotation: number) => void;
  setDeviceRotation: (rotation: number) => void;
  toggleRearView: () => void;
  setShowRear: (show: boolean) => void;
}

export const useCabinetStore = create<CabinetState>((set) => ({
  selectedCabinet: null,
  cabinets: [],
  cabinetRotationY: 0,
  deviceRotationY: 0,
  showRear: false,

  selectCabinet: (cabinet) => set({ selectedCabinet: cabinet }),

  setCabinets: (cabinets) => set({ cabinets }),

  setCabinetRotation: (rotation) => set({ cabinetRotationY: rotation }),

  setDeviceRotation: (rotation) => set({ deviceRotationY: rotation }),

  toggleRearView: () => set((state) => ({ showRear: !state.showRear })),

  setShowRear: (show) => set({ showRear: show }),
}));
