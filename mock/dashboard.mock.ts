import type { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });
};

// Mock 仪表板数据
export default {
    // 获取仪表板统计数据
    'GET /api/idc/dashboard/stats': async (_req: Request, res: Response) => {
        await waitTime(300);

        const stats: IDC.DashboardStats = {
            datacenterCount: 4,
            cabinetCount: 53,
            deviceCount: 12,
            connectionCount: 10,
            onlineDevices: 10,
            offlineDevices: 0,
            warningDevices: 1,
            errorDevices: 0,
            cabinetUsageRate: 0.78,
            uUsageRate: 0.65,
            recentAlerts: [
                {
                    id: 'alert-001',
                    level: 'warning',
                    type: 'port_usage',
                    deviceId: 'dev-010',
                    deviceName: '核心交换机-B1',
                    message: '端口利用率超过80%',
                    createdAt: '2024-12-05T09:00:00Z',
                    acknowledged: false,
                },
                {
                    id: 'alert-002',
                    level: 'info',
                    type: 'maintenance',
                    deviceId: 'dev-008',
                    deviceName: '核心存储-1',
                    message: '计划维护：存储系统固件升级',
                    createdAt: '2024-12-04T14:30:00Z',
                    acknowledged: true,
                    acknowledgedAt: '2024-12-04T15:00:00Z',
                    acknowledgedBy: '周存储',
                },
                {
                    id: 'alert-003',
                    level: 'warning',
                    type: 'warranty',
                    deviceId: 'dev-001',
                    deviceName: '核心交换机-A1',
                    message: '设备质保将于90天后到期',
                    createdAt: '2024-12-03T08:00:00Z',
                    acknowledged: false,
                },
                {
                    id: 'alert-004',
                    level: 'info',
                    type: 'device_online',
                    deviceId: 'dev-012',
                    deviceName: 'GPU服务器-C1-1',
                    message: '设备上线',
                    createdAt: '2024-12-02T10:20:00Z',
                    acknowledged: true,
                    acknowledgedAt: '2024-12-02T10:25:00Z',
                    acknowledgedBy: '钱AI',
                },
            ],
        };

        res.json({ success: true, data: stats });
    },

    // 获取设备状态趋势
    'GET /api/idc/dashboard/device-trend': async (req: Request, res: Response) => {
        await waitTime(300);
        const { days = 7 } = req.query;

        const data = Array.from({ length: Number(days) }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (Number(days) - 1 - i));
            return {
                date: date.toISOString().split('T')[0],
                online: 10 + Math.floor(Math.random() * 2),
                offline: Math.floor(Math.random() * 2),
                warning: Math.floor(Math.random() * 2),
                error: 0,
            };
        });

        res.json({ success: true, data });
    },

    // 获取机柜使用率排行
    'GET /api/idc/dashboard/cabinet-usage-rank': async (req: Request, res: Response) => {
        await waitTime(300);
        const { limit = 10 } = req.query;

        const data = [
            { cabinetId: 'cab-bj-001', cabinetName: 'A区1排1号', usage: 0.92 },
            { cabinetId: 'cab-bj-003', cabinetName: 'A区1排3号', usage: 0.88 },
            { cabinetId: 'cab-sz-001', cabinetName: 'C区1排1号', usage: 0.85 },
            { cabinetId: 'cab-bj-002', cabinetName: 'A区1排2号', usage: 0.82 },
            { cabinetId: 'cab-sh-001', cabinetName: 'B区1排1号', usage: 0.78 },
            { cabinetId: 'cab-sz-002', cabinetName: 'C区1排2号', usage: 0.75 },
            { cabinetId: 'cab-bj-004', cabinetName: 'A区1排4号', usage: 0.72 },
            { cabinetId: 'cab-sh-002', cabinetName: 'B区1排2号', usage: 0.68 },
            { cabinetId: 'cab-bj-005', cabinetName: 'A区1排5号', usage: 0.65 },
            { cabinetId: 'cab-sz-003', cabinetName: 'C区1排3号', usage: 0.60 },
        ].slice(0, Number(limit));

        res.json({ success: true, data });
    },

    // 获取设备分类统计
    'GET /api/idc/dashboard/device-category': async (_req: Request, res: Response) => {
        await waitTime(200);

        const data = [
            { category: 'switch', label: '交换机', count: 6, color: '#1890ff' },
            { category: 'server', label: '服务器', count: 3, color: '#52c41a' },
            { category: 'storage', label: '存储', count: 1, color: '#faad14' },
            { category: 'firewall', label: '防火墙', count: 1, color: '#f5222d' },
            { category: 'loadbalancer', label: '负载均衡', count: 1, color: '#722ed1' },
        ];

        res.json({ success: true, data });
    },

    // 获取数据中心负载
    'GET /api/idc/dashboard/datacenter-load': async (_req: Request, res: Response) => {
        await waitTime(200);

        const data = [
            {
                datacenterId: 'dc-001',
                name: '北京亦庄',
                cabinetUsage: 0.78,
                powerUsage: 0.65,
                deviceCount: 8,
            },
            {
                datacenterId: 'dc-002',
                name: '上海嘉定',
                cabinetUsage: 0.65,
                powerUsage: 0.58,
                deviceCount: 2,
            },
            {
                datacenterId: 'dc-003',
                name: '深圳坪山',
                cabinetUsage: 0.73,
                powerUsage: 0.62,
                deviceCount: 2,
            },
            {
                datacenterId: 'dc-004',
                name: '成都天府',
                cabinetUsage: 0.38,
                powerUsage: 0.25,
                deviceCount: 0,
            },
        ];

        res.json({ success: true, data });
    },

    // 获取最近操作记录
    'GET /api/idc/dashboard/recent-operations': async (req: Request, res: Response) => {
        await waitTime(200);
        const { limit = 10 } = req.query;

        const data = [
            {
                id: 'op-001',
                type: 'device_mount',
                operator: '钱AI',
                target: 'GPU服务器-C1-1',
                description: '设备上架',
                createdAt: '2024-12-05T10:30:00Z',
            },
            {
                id: 'op-002',
                type: 'port_config',
                operator: '张运维',
                target: '接入交换机-A1-1 GE1/0/24',
                description: 'VLAN配置变更: Access VLAN 100 -> 102',
                createdAt: '2024-12-05T09:15:00Z',
            },
            {
                id: 'op-003',
                type: 'connection_create',
                operator: '张运维',
                target: 'BJ-CAT6A-005',
                description: '创建网络连线',
                createdAt: '2024-12-04T16:20:00Z',
            },
            {
                id: 'op-004',
                type: 'device_update',
                operator: '李运维',
                target: '核心交换机-B1',
                description: '更新设备管理IP',
                createdAt: '2024-12-04T14:00:00Z',
            },
            {
                id: 'op-005',
                type: 'cabinet_create',
                operator: '王运维',
                target: 'C区2排3号',
                description: '新增机柜',
                createdAt: '2024-12-03T11:00:00Z',
            },
        ].slice(0, Number(limit));

        res.json({ success: true, data });
    },

    // 确认告警
    'POST /api/idc/dashboard/alerts/:id/acknowledge': async (req: Request, res: Response) => {
        await waitTime(300);
        const { id } = req.params;

        res.json({
            success: true,
            message: `告警 ${id} 已确认`,
        });
    },

    // 获取拓扑数据
    'GET /api/idc/topology/:datacenterId': async (req: Request, res: Response) => {
        await waitTime(500);
        const { datacenterId } = req.params;

        // 简化的拓扑数据
        const nodes = [
            { id: 'dev-001', label: '核心交换机-A1', type: 'switch', status: 'online', x: 400, y: 100 },
            { id: 'dev-002', label: '接入交换机-A1-1', type: 'switch', status: 'online', x: 200, y: 250 },
            { id: 'dev-006', label: '边界防火墙-1', type: 'firewall', status: 'online', x: 600, y: 250 },
            { id: 'dev-007', label: '负载均衡器-1', type: 'loadbalancer', status: 'online', x: 600, y: 400 },
            { id: 'dev-003', label: '应用服务器-A1-1', type: 'server', status: 'online', x: 100, y: 400 },
            { id: 'dev-004', label: '应用服务器-A1-2', type: 'server', status: 'online', x: 200, y: 400 },
            { id: 'dev-005', label: '数据库服务器-A1-1', type: 'server', status: 'online', x: 300, y: 400 },
            { id: 'dev-008', label: '核心存储-1', type: 'storage', status: 'online', x: 300, y: 550 },
        ];

        const edges = [
            { source: 'dev-001', target: 'dev-002', type: 'network' },
            { source: 'dev-001', target: 'dev-006', type: 'network' },
            { source: 'dev-006', target: 'dev-007', type: 'network' },
            { source: 'dev-002', target: 'dev-003', type: 'network' },
            { source: 'dev-002', target: 'dev-004', type: 'network' },
            { source: 'dev-002', target: 'dev-005', type: 'network' },
            { source: 'dev-005', target: 'dev-008', type: 'storage' },
        ];

        res.json({
            success: true,
            data: {
                datacenterId,
                nodes,
                edges,
            },
        });
    },
};
