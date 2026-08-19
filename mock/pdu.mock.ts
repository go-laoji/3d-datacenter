import type { Request, Response } from 'express';
import type { PDUDevice } from '../src/services/idc/pdu';

// PDU设备Mock数据
const pduDevices = [
    {
        id: 'pdu-001',
        name: 'PDU-A-01',
        category: 'pdu',
        cabinetId: 'cab-bj-001',
        startU: 1,
        endU: 2,
        uHeight: 2,
        assetCode: 'PDU-2024-001',
        status: 'online',
        managementIp: '192.168.1.101',
        pduData: {
            powerPath: 'A',
            inputVoltage: 220,
            outputPorts: 16,
            maxLoad: 3000,
            currentLoad: 1800,
            brand: 'APC',
            model: 'AP7921',
        },
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-28T10:00:00Z',
    },
    {
        id: 'pdu-002',
        name: 'PDU-B-01',
        category: 'pdu',
        cabinetId: 'cab-bj-001',
        startU: 3,
        endU: 4,
        uHeight: 2,
        assetCode: 'PDU-2024-002',
        status: 'online',
        managementIp: '192.168.1.102',
        pduData: {
            powerPath: 'B',
            inputVoltage: 220,
            outputPorts: 16,
            maxLoad: 3000,
            currentLoad: 1650,
            brand: 'APC',
            model: 'AP7921',
        },
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-28T10:00:00Z',
    },
    {
        id: 'pdu-003',
        name: 'PDU-A-02',
        category: 'pdu',
        cabinetId: 'cab-bj-002',
        startU: 1,
        endU: 2,
        uHeight: 2,
        assetCode: 'PDU-2024-003',
        status: 'online',
        managementIp: '192.168.1.103',
        pduData: {
            powerPath: 'A',
            inputVoltage: 220,
            outputPorts: 24,
            maxLoad: 5000,
            currentLoad: 2400,
            brand: 'Schneider',
            model: 'AP8941',
        },
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-28T10:00:00Z',
    },
    {
        id: 'pdu-004',
        name: 'PDU-B-02',
        category: 'pdu',
        cabinetId: 'cab-bj-002',
        startU: 3,
        endU: 4,
        uHeight: 2,
        assetCode: 'PDU-2024-004',
        status: 'warning',
        managementIp: '192.168.1.104',
        pduData: {
            powerPath: 'B',
            inputVoltage: 220,
            outputPorts: 24,
            maxLoad: 5000,
            currentLoad: 4200, // 高负载
            brand: 'Schneider',
            model: 'AP8941',
        },
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-28T10:00:00Z',
    },
];

// PDU设备模板
const pduTemplates = [
    {
        id: 'tpl-pdu-001',
        category: 'pdu',
        brand: 'APC',
        model: 'AP7921',
        uHeight: 2,
        powerConsumption: 0, // PDU本身不耗电
        specs: {
            inputVoltage: '220V',
            outputPorts: 16,
            maxLoad: '3000W',
            ratedCurrent: '16A',
        },
        phases: ['L1', 'L2', 'L3'],
        defaultThreshold: 80,
        portGroups: [],
    },
    {
        id: 'tpl-pdu-002',
        category: 'pdu',
        brand: 'Schneider',
        model: 'AP8941',
        uHeight: 2,
        powerConsumption: 0,
        specs: {
            inputVoltage: '220V',
            outputPorts: 24,
            maxLoad: '5000W',
            ratedCurrent: '32A',
        },
        phases: ['L1', 'L2', 'L3'],
        defaultThreshold: 80,
        portGroups: [],
    },
];

const deviceConnections: Record<string, Array<{ id: string; name: string }>> = {
    'pdu-001': [{ id: 'dev-003', name: '应用服务器-A1-1' }, { id: 'dev-005', name: '数据库服务器-A1-1' }],
    'pdu-002': [{ id: 'dev-004', name: '应用服务器-A1-2' }, { id: 'dev-005', name: '数据库服务器-A1-1' }],
    'pdu-003': [{ id: 'dev-006', name: '边界防火墙-1' }],
    'pdu-004': [{ id: 'dev-007', name: '负载均衡器-1' }],
};

const buildTrend = (currentLoad: number) =>
    Array.from({ length: 12 }, (_, index) => {
        const hour = index * 2;
        const offset = (index - 11) * Math.max(18, Math.round(currentLoad * 0.012));
        return {
            time: `${String(hour).padStart(2, '0')}:00`,
            load: Math.max(0, currentLoad + offset),
            comparison: Math.max(0, currentLoad + offset - 120 + (index % 3) * 35),
            isPeak: index === 11,
        };
    });

const enrichDevice = (device: (typeof pduDevices)[number]): PDUDevice => {
    const connections = deviceConnections[device.id] ?? [];
    return {
        ...device,
        pduData: {
            ...device.pduData,
            inputCurrent: Number((device.pduData.currentLoad / device.pduData.inputVoltage).toFixed(1)),
            phase: device.pduData.powerPath === 'A' ? 'L1' : 'L2',
            peakLoad: Math.round(device.pduData.currentLoad * 1.12),
            loadThreshold: 80,
        },
        metric: {
            collectedAt: device.id === 'pdu-004' ? '2026-08-20 09:42:10' : '2026-08-20 10:02:36',
            source: 'SNMP / power-collector-01',
            quality: device.id === 'pdu-004' ? 'delayed' : 'good',
        },
        outlets: Array.from({ length: device.pduData.outputPorts }, (_, index) => ({
            id: `${device.id}-outlet-${index + 1}`,
            number: index + 1,
            phase: (['L1', 'L2', 'L3'] as const)[index % 3],
            status: index === 5 && device.id === 'pdu-004' ? 'warning' : connections[index] ? 'on' : 'off',
            current: connections[index] ? Number((1.2 + index * 0.7).toFixed(1)) : 0,
            deviceId: connections[index]?.id,
            deviceName: connections[index]?.name,
        })),
        loadTrend: buildTrend(device.pduData.currentLoad),
    } as PDUDevice;
};

export default {
    // 获取PDU设备列表
    'GET /api/pdu/devices': (req: Request, res: Response) => {
        const { cabinetId, powerPath, status, risk, keyword } = req.query;

        let filteredDevices = [...pduDevices];

        if (cabinetId) {
            filteredDevices = filteredDevices.filter(d => d.cabinetId === cabinetId);
        }

        if (powerPath) {
            filteredDevices = filteredDevices.filter(d => d.pduData.powerPath === powerPath);
        }

        if (status) filteredDevices = filteredDevices.filter(d => d.status === status);
        if (keyword) {
            const query = String(keyword).toLowerCase();
            filteredDevices = filteredDevices.filter(d => `${d.name} ${d.assetCode} ${d.managementIp}`.toLowerCase().includes(query));
        }
        if (risk === 'highLoad') filteredDevices = filteredDevices.filter(d => d.pduData.currentLoad / d.pduData.maxLoad >= 0.8);
        if (risk === 'stale') filteredDevices = filteredDevices.filter(d => enrichDevice(d).metric.quality !== 'good');
        if (risk === 'singlePath') filteredDevices = filteredDevices.filter(d => (deviceConnections[d.id] ?? []).length <= 1);

        res.json({
            success: true,
            data: filteredDevices.map(enrichDevice),
            total: filteredDevices.length,
        });
    },

    // 获取PDU设备详情
    'GET /api/pdu/devices/:id': (req: Request, res: Response) => {
        const { id } = req.params;
        const device = pduDevices.find(d => d.id === id);

        if (device) {
            res.json({
                success: true,
                data: enrichDevice(device),
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'PDU设备不存在',
            });
        }
    },

    // 获取PDU设备模板
    'GET /api/pdu/templates': (_req: Request, res: Response) => {
        res.json({
            success: true,
            data: pduTemplates,
            total: pduTemplates.length,
        });
    },

    // 创建PDU设备
    'POST /api/pdu/devices': (req: Request, res: Response) => {
        const newDevice = {
            id: `pdu-${Date.now()}`,
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        pduDevices.push(newDevice as any);

        res.json({
            success: true,
            data: enrichDevice(newDevice as (typeof pduDevices)[number]),
        });
    },

    // 更新PDU设备
    'PUT /api/pdu/devices/:id': (req: Request, res: Response) => {
        const { id } = req.params;
        const index = pduDevices.findIndex(d => d.id === id);

        if (index !== -1) {
            pduDevices[index] = {
                ...pduDevices[index],
                ...req.body,
                updatedAt: new Date().toISOString(),
            };

            res.json({
                success: true,
                data: enrichDevice(pduDevices[index]),
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'PDU设备不存在',
            });
        }
    },

    // 删除PDU设备
    'DELETE /api/pdu/devices/:id': (req: Request, res: Response) => {
        const { id } = req.params;
        const index = pduDevices.findIndex(d => d.id === id);

        if (index !== -1) {
            pduDevices.splice(index, 1);
            res.json({
                success: true,
                message: 'PDU设备已删除',
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'PDU设备不存在',
            });
        }
    },
};
