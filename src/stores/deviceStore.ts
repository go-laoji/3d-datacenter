import { create } from 'zustand';

interface DeviceState {
  // 选中的设备
  selectedDevice: IDC.Device | null;
  // 悬停的设备ID
  hoveredDeviceId: string | null;
  // 设备列表
  devices: IDC.Device[];

  // Actions
  selectDevice: (device: IDC.Device | null) => void;
  setHoveredDeviceId: (deviceId: string | null) => void;
  clearHoveredDevice: () => void;
  setDevices: (devices: IDC.Device[]) => void;
  updateDevice: (deviceId: string, updates: Partial<IDC.Device>) => void;
  getDeviceById: (deviceId: string) => IDC.Device | undefined;
  getDevicesByCabinet: (cabinetId: string) => IDC.Device[];
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  selectedDevice: null,
  hoveredDeviceId: null,
  devices: [],

  selectDevice: (device) => set({ selectedDevice: device }),

  setHoveredDeviceId: (deviceId) => set({ hoveredDeviceId: deviceId }),

  clearHoveredDevice: () => set({ hoveredDeviceId: null }),

  setDevices: (devices) => set({ devices }),

  updateDevice: (deviceId, updates) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === deviceId ? { ...device, ...updates } : device,
      ),
      selectedDevice:
        state.selectedDevice?.id === deviceId
          ? { ...state.selectedDevice, ...updates }
          : state.selectedDevice,
    })),

  getDeviceById: (deviceId) => {
    return get().devices.find((d) => d.id === deviceId);
  },

  getDevicesByCabinet: (cabinetId) => {
    return get().devices.filter((d) => d.cabinetId === cabinetId);
  },
}));
