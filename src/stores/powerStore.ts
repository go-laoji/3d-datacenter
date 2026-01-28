import { create } from 'zustand';

// PDU设备接口
export interface PDUDevice extends IDC.Device {
  // PDU特有属性
  inputVoltage?: number; // 输入电压
  outputPorts?: number; // 输出端口数
  maxLoad?: number; // 最大负载(W)
  currentLoad?: number; // 当前负载(W)
  powerPath?: 'A' | 'B'; // 电源路径
}

// 电源链路节点
export interface PowerNode {
  id: string;
  type: 'utility' | 'ups' | 'pdu' | 'device'; // 市电/UPS/PDU/设备
  name: string;
  status: 'online' | 'offline' | 'warning';
  load?: number; // 负载(W)
  capacity?: number; // 容量(W)
}

// 电源链路连接
export interface PowerLink {
  id: string;
  source: string; // 源节点ID
  target: string; // 目标节点ID
  powerPath: 'A' | 'B'; // 电源路径
  status: 'active' | 'inactive' | 'fault';
}

// 电源拓扑结构
export interface PowerTopology {
  nodes: PowerNode[];
  links: PowerLink[];
}

// 负载均衡状态
export interface LoadBalance {
  pathALinks: number;
  pathBLinks: number;
  pathALoad: number;
  pathBLoad: number;
  balanceRate: number; // 0-1, 1表示完全均衡
}

// 冗余状态
export interface RedundancyStatus {
  dualPowerDevices: string[]; // 双路电源设备ID列表
  singlePowerDevices: string[]; // 单路电源设备ID列表
  redundancyRate: number; // 冗余率 0-1
}

interface PowerState {
  // PDU设备列表
  pduDevices: PDUDevice[];
  // 电源拓扑
  powerTopology: PowerTopology;
  // 是否显示电源流向
  showPowerFlow: boolean;

  // Actions
  setPDUDevices: (devices: PDUDevice[]) => void;
  addPDUDevice: (device: PDUDevice) => void;
  updatePDUDevice: (deviceId: string, updates: Partial<PDUDevice>) => void;
  removePDUDevice: (deviceId: string) => void;
  setPowerTopology: (topology: PowerTopology) => void;
  togglePowerFlow: () => void;

  // Selectors
  getPDUsByPath: (path: 'A' | 'B') => PDUDevice[];
  getPDUsByCabinet: (cabinetId: string) => PDUDevice[];
  getLoadBalance: () => LoadBalance;
  getRedundancyStatus: () => RedundancyStatus;
}

export const usePowerStore = create<PowerState>((set, get) => ({
  pduDevices: [],
  powerTopology: { nodes: [], links: [] },
  showPowerFlow: false,

  setPDUDevices: (devices) => set({ pduDevices: devices }),

  addPDUDevice: (device) =>
    set((state) => ({
      pduDevices: [...state.pduDevices, device],
    })),

  updatePDUDevice: (deviceId, updates) =>
    set((state) => ({
      pduDevices: state.pduDevices.map((device) =>
        device.id === deviceId ? { ...device, ...updates } : device,
      ),
    })),

  removePDUDevice: (deviceId) =>
    set((state) => ({
      pduDevices: state.pduDevices.filter((device) => device.id !== deviceId),
    })),

  setPowerTopology: (topology) => set({ powerTopology: topology }),

  togglePowerFlow: () =>
    set((state) => ({
      showPowerFlow: !state.showPowerFlow,
    })),

  getPDUsByPath: (path) => {
    return get().pduDevices.filter((pdu) => pdu.powerPath === path);
  },

  getPDUsByCabinet: (cabinetId) => {
    return get().pduDevices.filter((pdu) => pdu.cabinetId === cabinetId);
  },

  getLoadBalance: () => {
    const { powerTopology } = get();
    const { links } = powerTopology;

    const pathALinks = links.filter(
      (l) => l.powerPath === 'A' && l.status === 'active',
    ).length;
    const pathBLinks = links.filter(
      (l) => l.powerPath === 'B' && l.status === 'active',
    ).length;

    // 计算负载(简化版,实际应从nodes计算)
    const pathALoad = pathALinks * 500; // 假设每个链路500W
    const pathBLoad = pathBLinks * 500;

    const total = pathALoad + pathBLoad;
    const diff = Math.abs(pathALoad - pathBLoad);
    const balanceRate = total > 0 ? 1 - diff / total : 1;

    return {
      pathALinks,
      pathBLinks,
      pathALoad,
      pathBLoad,
      balanceRate,
    };
  },

  getRedundancyStatus: () => {
    const { powerTopology } = get();
    const { links } = powerTopology;
    const devicePowerPaths = new Map<string, Set<'A' | 'B'>>();

    // 统计每个设备的电源路径
    links.forEach((link) => {
      if (link.status === 'active') {
        if (!devicePowerPaths.has(link.target)) {
          devicePowerPaths.set(link.target, new Set());
        }
        devicePowerPaths.get(link.target)?.add(link.powerPath);
      }
    });

    const dualPowerDevices: string[] = [];
    const singlePowerDevices: string[] = [];

    devicePowerPaths.forEach((paths, deviceId) => {
      if (paths.size >= 2) {
        dualPowerDevices.push(deviceId);
      } else {
        singlePowerDevices.push(deviceId);
      }
    });

    const total = dualPowerDevices.length + singlePowerDevices.length;
    const redundancyRate = total > 0 ? dualPowerDevices.length / total : 0;

    return { dualPowerDevices, singlePowerDevices, redundancyRate };
  },
}));
