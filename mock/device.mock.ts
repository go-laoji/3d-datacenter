import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Mock 设备数据
let devices: IDC.Device[] = [
    // 北京亦庄 - A区1排1号机柜设备
    {
        id: 'dev-001',
        templateId: 'tpl-huawei-s6730-48x6c',
        cabinetId: 'cab-bj-001',
        assetCode: 'BJ-NET-SW-001',
        name: '核心交换机-A1',
        serialNumber: 'HW21035678901',
        startU: 40,
        endU: 40,
        managementIp: '10.0.1.1',
        status: 'online',
        purchaseDate: '2023-02-15',
        warrantyExpiry: '2026-02-15',
        vendor: '华为技术服务商',
        owner: '张运维',
        department: '网络运维部',
        description: 'A区核心交换机',
        createdAt: '2023-02-20T08:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z',
    },
    {
        id: 'dev-002',
        templateId: 'tpl-huawei-s5735-48t4x',
        cabinetId: 'cab-bj-001',
        assetCode: 'BJ-NET-SW-002',
        name: '接入交换机-A1-1',
        serialNumber: 'HW21035678902',
        startU: 38,
        endU: 38,
        managementIp: '10.0.1.2',
        status: 'online',
        purchaseDate: '2023-02-15',
        warrantyExpiry: '2026-02-15',
        vendor: '华为技术服务商',
        owner: '张运维',
        department: '网络运维部',
        createdAt: '2023-02-20T08:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z',
    },
    {
        id: 'dev-003',
        templateId: 'tpl-huawei-2288h-v6',
        cabinetId: 'cab-bj-001',
        assetCode: 'BJ-SRV-001',
        name: '应用服务器-A1-1',
        serialNumber: 'HW2188SRV001',
        startU: 35,
        endU: 36,
        managementIp: '10.0.10.1',
        status: 'online',
        purchaseDate: '2023-03-10',
        warrantyExpiry: '2026-03-10',
        vendor: '华为技术服务商',
        owner: '李开发',
        department: '应用开发部',
        createdAt: '2023-03-15T08:00:00Z',
        updatedAt: '2024-11-20T14:00:00Z',
    },
    {
        id: 'dev-004',
        templateId: 'tpl-huawei-2288h-v6',
        cabinetId: 'cab-bj-001',
        assetCode: 'BJ-SRV-002',
        name: '应用服务器-A1-2',
        serialNumber: 'HW2188SRV002',
        startU: 33,
        endU: 34,
        managementIp: '10.0.10.2',
        status: 'online',
        purchaseDate: '2023-03-10',
        warrantyExpiry: '2026-03-10',
        vendor: '华为技术服务商',
        owner: '李开发',
        department: '应用开发部',
        createdAt: '2023-03-15T08:00:00Z',
        updatedAt: '2024-11-20T14:00:00Z',
    },
    {
        id: 'dev-005',
        templateId: 'tpl-dell-r750',
        cabinetId: 'cab-bj-001',
        assetCode: 'BJ-SRV-003',
        name: '数据库服务器-A1-1',
        serialNumber: 'DELL750DB001',
        startU: 30,
        endU: 31,
        managementIp: '10.0.20.1',
        status: 'online',
        purchaseDate: '2023-04-01',
        warrantyExpiry: '2026-04-01',
        vendor: 'Dell企业服务',
        owner: '王DBA',
        department: '数据库运维部',
        createdAt: '2023-04-05T08:00:00Z',
        updatedAt: '2024-10-15T16:00:00Z',
    },
    // 更多设备...
    {
        id: 'dev-006',
        templateId: 'tpl-huawei-usg6680',
        cabinetId: 'cab-bj-002',
        assetCode: 'BJ-SEC-FW-001',
        name: '边界防火墙-1',
        serialNumber: 'HWUSG6680001',
        startU: 40,
        endU: 41,
        managementIp: '10.0.254.1',
        status: 'online',
        purchaseDate: '2023-01-20',
        warrantyExpiry: '2026-01-20',
        vendor: '华为安全服务商',
        owner: '赵安全',
        department: '安全运维部',
        createdAt: '2023-01-25T08:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z',
    },
    {
        id: 'dev-007',
        templateId: 'tpl-f5-big-ip-i5800',
        cabinetId: 'cab-bj-002',
        assetCode: 'BJ-NET-LB-001',
        name: '负载均衡器-1',
        serialNumber: 'F5BIGIP001',
        startU: 38,
        endU: 38,
        managementIp: '10.0.253.1',
        status: 'online',
        purchaseDate: '2023-02-01',
        warrantyExpiry: '2026-02-01',
        vendor: 'F5中国',
        owner: '张运维',
        department: '网络运维部',
        createdAt: '2023-02-05T08:00:00Z',
        updatedAt: '2024-11-28T11:00:00Z',
    },
    {
        id: 'dev-008',
        templateId: 'tpl-huawei-oceanstor-5500',
        cabinetId: 'cab-bj-003',
        assetCode: 'BJ-STG-001',
        name: '核心存储-1',
        serialNumber: 'HWOCEAN5500001',
        startU: 35,
        endU: 38,
        managementIp: '10.0.30.1',
        status: 'online',
        purchaseDate: '2023-05-01',
        warrantyExpiry: '2028-05-01',
        vendor: '华为存储服务商',
        owner: '周存储',
        department: '存储运维部',
        createdAt: '2023-05-10T08:00:00Z',
        updatedAt: '2024-09-20T09:00:00Z',
    },
    // 上海数据中心设备
    {
        id: 'dev-009',
        templateId: 'tpl-cisco-c9300-48p',
        cabinetId: 'cab-sh-001',
        assetCode: 'SH-NET-SW-001',
        name: '接入交换机-B1-1',
        serialNumber: 'CISCO9300001',
        startU: 40,
        endU: 40,
        managementIp: '10.1.1.1',
        status: 'online',
        purchaseDate: '2023-07-01',
        warrantyExpiry: '2026-07-01',
        vendor: '思科中国',
        owner: '李运维',
        department: '网络运维部',
        createdAt: '2023-07-10T08:00:00Z',
        updatedAt: '2024-11-15T14:00:00Z',
    },
    {
        id: 'dev-010',
        templateId: 'tpl-cisco-n9k-93180yc',
        cabinetId: 'cab-sh-001',
        assetCode: 'SH-NET-SW-002',
        name: '核心交换机-B1',
        serialNumber: 'CISCON9K001',
        startU: 38,
        endU: 38,
        managementIp: '10.1.1.2',
        status: 'warning',
        purchaseDate: '2023-07-01',
        warrantyExpiry: '2026-07-01',
        vendor: '思科中国',
        owner: '李运维',
        department: '网络运维部',
        description: '端口利用率过高',
        createdAt: '2023-07-10T08:00:00Z',
        updatedAt: '2024-12-05T09:00:00Z',
    },
    // 深圳数据中心设备
    {
        id: 'dev-011',
        templateId: 'tpl-h3c-s6850-56hf',
        cabinetId: 'cab-sz-001',
        assetCode: 'SZ-NET-SW-001',
        name: '汇聚交换机-C1',
        serialNumber: 'H3CS6850001',
        startU: 45,
        endU: 45,
        managementIp: '10.2.1.1',
        status: 'online',
        purchaseDate: '2023-04-01',
        warrantyExpiry: '2026-04-01',
        vendor: 'H3C华三',
        owner: '王运维',
        department: '网络运维部',
        createdAt: '2023-04-10T08:00:00Z',
        updatedAt: '2024-10-20T16:00:00Z',
    },
    {
        id: 'dev-012',
        templateId: 'tpl-inspur-nf5280m6',
        cabinetId: 'cab-sz-001',
        assetCode: 'SZ-SRV-001',
        name: 'GPU服务器-C1-1',
        serialNumber: 'INSPURNF001',
        startU: 42,
        endU: 43,
        managementIp: '10.2.10.1',
        status: 'online',
        purchaseDate: '2024-01-15',
        warrantyExpiry: '2027-01-15',
        vendor: '浪潮信息',
        owner: '钱AI',
        department: 'AI研发部',
        description: 'GPU计算节点',
        createdAt: '2024-01-20T08:00:00Z',
        updatedAt: '2024-11-10T10:00:00Z',
    },
];

const waitTime = (time: number = 100) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });
};

export default {
    // 获取设备列表
    'GET /api/idc/devices': async (req: Request, res: Response) => {
        await waitTime(300);
        const {
            current = 1,
            pageSize = 10,
            cabinetId,
            templateId,
            name,
            status,
            assetCode,
            managementIp,
            department,
        } = req.query;

        let filteredData = [...devices];

        if (cabinetId) {
            filteredData = filteredData.filter(d => d.cabinetId === cabinetId);
        }
        if (templateId) {
            filteredData = filteredData.filter(d => d.templateId === templateId);
        }
        if (name) {
            filteredData = filteredData.filter(d => d.name.includes(name as string));
        }
        if (status) {
            filteredData = filteredData.filter(d => d.status === status);
        }
        if (assetCode) {
            filteredData = filteredData.filter(d => d.assetCode.includes(assetCode as string));
        }
        if (managementIp) {
            filteredData = filteredData.filter(d => d.managementIp?.includes(managementIp as string));
        }
        if (department) {
            filteredData = filteredData.filter(d => d.department === department);
        }

        const start = (Number(current) - 1) * Number(pageSize);
        const end = start + Number(pageSize);
        const paginatedData = filteredData.slice(start, end);

        res.json({
            success: true,
            data: paginatedData,
            total: filteredData.length,
            current: Number(current),
            pageSize: Number(pageSize),
        });
    },

    // 获取单个设备详情
    'GET /api/idc/devices/:id': async (req: Request, res: Response) => {
        await waitTime(200);
        const { id } = req.params;
        const device = devices.find(d => d.id === id);

        if (device) {
            res.json({ success: true, data: device });
        } else {
            res.status(404).json({ success: false, errorMessage: '设备不存在' });
        }
    },

    // 创建设备（上架）
    'POST /api/idc/devices': async (req: Request, res: Response) => {
        await waitTime(500);
        const body = req.body as IDC.DeviceCreateParams;

        // 这里应该根据模板获取uHeight来计算endU
        const newDevice: IDC.Device = {
            id: `dev-${uuidv4().slice(0, 8)}`,
            templateId: body.templateId,
            cabinetId: body.cabinetId,
            assetCode: body.assetCode,
            name: body.name,
            serialNumber: body.serialNumber,
            startU: body.startU,
            endU: body.startU + 1, // 假设所有设备都是2U，实际应根据模板计算
            managementIp: body.managementIp,
            status: 'online',
            purchaseDate: body.purchaseDate,
            warrantyExpiry: body.warrantyExpiry,
            vendor: body.vendor,
            owner: body.owner,
            department: body.department,
            description: body.description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        devices.push(newDevice);
        res.json({ success: true, data: newDevice });
    },

    // 更新设备
    'PUT /api/idc/devices/:id': async (req: Request, res: Response) => {
        await waitTime(400);
        const { id } = req.params;
        const body = req.body;

        const index = devices.findIndex(d => d.id === id);
        if (index === -1) {
            res.status(404).json({ success: false, errorMessage: '设备不存在' });
            return;
        }

        devices[index] = {
            ...devices[index],
            ...body,
            updatedAt: new Date().toISOString(),
        };

        res.json({ success: true, data: devices[index] });
    },

    // 删除设备（下架）
    'DELETE /api/idc/devices/:id': async (req: Request, res: Response) => {
        await waitTime(300);
        const { id } = req.params;

        const index = devices.findIndex(d => d.id === id);
        if (index === -1) {
            res.status(404).json({ success: false, errorMessage: '设备不存在' });
            return;
        }

        devices.splice(index, 1);
        res.json({ success: true });
    },

    // 获取机柜内的设备（3D视图用）
    'GET /api/idc/devices/by-cabinet/:cabinetId': async (req: Request, res: Response) => {
        await waitTime(200);
        const { cabinetId } = req.params;
        const cabinetDevices = devices.filter(d => d.cabinetId === cabinetId);

        res.json({
            success: true,
            data: cabinetDevices,
        });
    },

    // 批量更新设备状态
    'POST /api/idc/devices/batch-status': async (req: Request, res: Response) => {
        await waitTime(400);
        const { ids, status } = req.body;

        ids.forEach((id: string) => {
            const device = devices.find(d => d.id === id);
            if (device) {
                device.status = status;
                device.updatedAt = new Date().toISOString();
            }
        });

        res.json({ success: true });
    },

    // 获取设备统计
    'GET /api/idc/devices/stats': async (_req: Request, res: Response) => {
        await waitTime(200);

        const stats = {
            total: devices.length,
            online: devices.filter(d => d.status === 'online').length,
            offline: devices.filter(d => d.status === 'offline').length,
            warning: devices.filter(d => d.status === 'warning').length,
            error: devices.filter(d => d.status === 'error').length,
            maintenance: devices.filter(d => d.status === 'maintenance').length,
            byCategory: {} as Record<string, number>,
            byDepartment: {} as Record<string, number>,
        };

        // 这里需要关联模板来统计分类，简化处理
        stats.byCategory = {
            switch: 6,
            server: 4,
            storage: 1,
            firewall: 1,
            loadbalancer: 1,
        };

        devices.forEach(d => {
            if (d.department) {
                stats.byDepartment[d.department] = (stats.byDepartment[d.department] || 0) + 1;
            }
        });

        res.json({ success: true, data: stats });
    },
};
