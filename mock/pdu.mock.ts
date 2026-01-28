import type { Request, Response } from 'express';

// PDU设备Mock数据
const pduDevices = [
    {
        id: 'pdu-001',
        name: 'PDU-A-01',
        category: 'pdu',
        cabinetId: 'cab-001',
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
        cabinetId: 'cab-001',
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
        cabinetId: 'cab-002',
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
        cabinetId: 'cab-002',
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
        portGroups: [],
    },
];

export default {
    // 获取PDU设备列表
    'GET /api/pdu/devices': (req: Request, res: Response) => {
        const { cabinetId, powerPath } = req.query;

        let filteredDevices = [...pduDevices];

        if (cabinetId) {
            filteredDevices = filteredDevices.filter(d => d.cabinetId === cabinetId);
        }

        if (powerPath) {
            filteredDevices = filteredDevices.filter(d => d.pduData.powerPath === powerPath);
        }

        res.json({
            success: true,
            data: filteredDevices,
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
                data: device,
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
            data: newDevice,
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
                data: pduDevices[index],
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
