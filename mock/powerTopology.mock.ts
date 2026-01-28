import type { Request, Response } from 'express';

// 数据中心列表 (模拟)
const datacenters = [
    { id: 'dc-001', name: '北京数据中心', code: 'BJ-DC1' },
    { id: 'dc-002', name: '上海数据中心', code: 'SH-DC1' },
];

// 电源拓扑节点 - 带数据中心标识
const powerNodes = [
    // 北京数据中心
    { id: 'utility-001', type: 'utility', name: '市电A路', status: 'online', capacity: 50000, datacenterId: 'dc-001' },
    { id: 'utility-002', type: 'utility', name: '市电B路', status: 'online', capacity: 50000, datacenterId: 'dc-001' },
    { id: 'ups-001', type: 'ups', name: 'UPS-A-01', status: 'online', load: 18000, capacity: 30000, datacenterId: 'dc-001' },
    { id: 'ups-002', type: 'ups', name: 'UPS-B-01', status: 'online', load: 16500, capacity: 30000, datacenterId: 'dc-001' },
    { id: 'pdu-001', type: 'pdu', name: 'PDU-A-01', status: 'online', load: 1800, capacity: 3000, datacenterId: 'dc-001' },
    { id: 'pdu-002', type: 'pdu', name: 'PDU-B-01', status: 'online', load: 1650, capacity: 3000, datacenterId: 'dc-001' },
    { id: 'pdu-003', type: 'pdu', name: 'PDU-A-02', status: 'online', load: 2400, capacity: 5000, datacenterId: 'dc-001' },
    { id: 'pdu-004', type: 'pdu', name: 'PDU-B-02', status: 'warning', load: 4200, capacity: 5000, datacenterId: 'dc-001' },
    { id: 'dev-001', type: 'device', name: 'Server-01', status: 'online', load: 300, datacenterId: 'dc-001' },
    { id: 'dev-002', type: 'device', name: 'Server-02', status: 'online', load: 350, datacenterId: 'dc-001' },
    { id: 'dev-003', type: 'device', name: 'Switch-01', status: 'online', load: 150, datacenterId: 'dc-001' },
    { id: 'dev-004', type: 'device', name: 'Storage-01', status: 'online', load: 400, datacenterId: 'dc-001' },

    // 上海数据中心
    { id: 'utility-101', type: 'utility', name: '市电A路', status: 'online', capacity: 40000, datacenterId: 'dc-002' },
    { id: 'utility-102', type: 'utility', name: '市电B路', status: 'warning', capacity: 40000, datacenterId: 'dc-002' },
    { id: 'ups-101', type: 'ups', name: 'UPS-A-01', status: 'online', load: 12000, capacity: 25000, datacenterId: 'dc-002' },
    { id: 'ups-102', type: 'ups', name: 'UPS-B-01', status: 'online', load: 10500, capacity: 25000, datacenterId: 'dc-002' },
    { id: 'pdu-101', type: 'pdu', name: 'PDU-A-01', status: 'online', load: 2000, capacity: 4000, datacenterId: 'dc-002' },
    { id: 'pdu-102', type: 'pdu', name: 'PDU-B-01', status: 'online', load: 1800, capacity: 4000, datacenterId: 'dc-002' },
    { id: 'dev-101', type: 'device', name: 'Server-101', status: 'online', load: 280, datacenterId: 'dc-002' },
    { id: 'dev-102', type: 'device', name: 'Server-102', status: 'warning', load: 320, datacenterId: 'dc-002' },
];

// 电源链路 - 带数据中心标识
const powerLinks = [
    // 北京数据中心
    { id: 'link-001', source: 'utility-001', target: 'ups-001', powerPath: 'A', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-002', source: 'utility-002', target: 'ups-002', powerPath: 'B', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-003', source: 'ups-001', target: 'pdu-001', powerPath: 'A', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-004', source: 'ups-002', target: 'pdu-002', powerPath: 'B', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-005', source: 'ups-001', target: 'pdu-003', powerPath: 'A', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-006', source: 'ups-002', target: 'pdu-004', powerPath: 'B', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-007', source: 'pdu-001', target: 'dev-001', powerPath: 'A', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-008', source: 'pdu-002', target: 'dev-001', powerPath: 'B', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-009', source: 'pdu-001', target: 'dev-002', powerPath: 'A', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-010', source: 'pdu-002', target: 'dev-002', powerPath: 'B', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-011', source: 'pdu-003', target: 'dev-003', powerPath: 'A', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-012', source: 'pdu-003', target: 'dev-004', powerPath: 'A', status: 'active', datacenterId: 'dc-001' },
    { id: 'link-013', source: 'pdu-004', target: 'dev-004', powerPath: 'B', status: 'active', datacenterId: 'dc-001' },

    // 上海数据中心
    { id: 'link-101', source: 'utility-101', target: 'ups-101', powerPath: 'A', status: 'active', datacenterId: 'dc-002' },
    { id: 'link-102', source: 'utility-102', target: 'ups-102', powerPath: 'B', status: 'active', datacenterId: 'dc-002' },
    { id: 'link-103', source: 'ups-101', target: 'pdu-101', powerPath: 'A', status: 'active', datacenterId: 'dc-002' },
    { id: 'link-104', source: 'ups-102', target: 'pdu-102', powerPath: 'B', status: 'active', datacenterId: 'dc-002' },
    { id: 'link-105', source: 'pdu-101', target: 'dev-101', powerPath: 'A', status: 'active', datacenterId: 'dc-002' },
    { id: 'link-106', source: 'pdu-102', target: 'dev-101', powerPath: 'B', status: 'active', datacenterId: 'dc-002' },
    { id: 'link-107', source: 'pdu-101', target: 'dev-102', powerPath: 'A', status: 'active', datacenterId: 'dc-002' },
];

// 按数据中心过滤节点
const filterNodesByDatacenter = (datacenterId?: string) => {
    if (!datacenterId) return powerNodes;
    return powerNodes.filter(n => n.datacenterId === datacenterId);
};

// 按数据中心过滤链路
const filterLinksByDatacenter = (datacenterId?: string) => {
    if (!datacenterId) return powerLinks;
    return powerLinks.filter(l => l.datacenterId === datacenterId);
};

export default {
    // 获取电源拓扑
    'GET /api/power/topology': (req: Request, res: Response) => {
        const { datacenterId } = req.query;
        const nodes = filterNodesByDatacenter(datacenterId as string | undefined);
        const links = filterLinksByDatacenter(datacenterId as string | undefined);

        res.json({
            success: true,
            data: { nodes, links },
        });
    },

    // 获取电源冗余状态
    'GET /api/power/redundancy': (req: Request, res: Response) => {
        const { datacenterId } = req.query;
        const filteredNodes = filterNodesByDatacenter(datacenterId as string | undefined);
        const filteredLinks = filterLinksByDatacenter(datacenterId as string | undefined);

        // 统计每个设备的电源路径
        const devicePowerPaths = new Map<string, Set<string>>();

        filteredLinks.forEach((link) => {
            if (link.status === 'active' && link.target.startsWith('dev-')) {
                if (!devicePowerPaths.has(link.target)) {
                    devicePowerPaths.set(link.target, new Set());
                }
                devicePowerPaths.get(link.target)?.add(link.powerPath);
            }
        });

        const dualPowerDevices: any[] = [];
        const singlePowerDevices: any[] = [];

        devicePowerPaths.forEach((paths, deviceId) => {
            const device = filteredNodes.find(n => n.id === deviceId);
            if (device) {
                if (paths.size >= 2) {
                    dualPowerDevices.push({
                        ...device,
                        powerPaths: Array.from(paths),
                    });
                } else {
                    singlePowerDevices.push({
                        ...device,
                        powerPaths: Array.from(paths),
                        risk: 'single-point-failure',
                    });
                }
            }
        });

        res.json({
            success: true,
            data: {
                dualPower: dualPowerDevices,
                singlePower: singlePowerDevices,
                summary: {
                    totalDevices: devicePowerPaths.size,
                    dualPowerCount: dualPowerDevices.length,
                    singlePowerCount: singlePowerDevices.length,
                    redundancyRate: devicePowerPaths.size > 0
                        ? (dualPowerDevices.length / devicePowerPaths.size * 100).toFixed(2) + '%'
                        : '0%',
                },
            },
        });
    },

    // 获取负载均衡状态
    'GET /api/power/load-balance': (req: Request, res: Response) => {
        const { datacenterId } = req.query;
        const filteredNodes = filterNodesByDatacenter(datacenterId as string | undefined);
        const filteredLinks = filterLinksByDatacenter(datacenterId as string | undefined);

        // 计算A/B路负载
        const pathALoad = filteredLinks
            .filter(l => l.powerPath === 'A' && l.status === 'active')
            .reduce((sum, l) => {
                const target = filteredNodes.find(n => n.id === l.target);
                return sum + (target?.load || 0);
            }, 0);

        const pathBLoad = filteredLinks
            .filter(l => l.powerPath === 'B' && l.status === 'active')
            .reduce((sum, l) => {
                const target = filteredNodes.find(n => n.id === l.target);
                return sum + (target?.load || 0);
            }, 0);

        const totalLoad = pathALoad + pathBLoad;
        const balanceRate = totalLoad > 0
            ? Math.abs(pathALoad - pathBLoad) / totalLoad * 100
            : 0;

        res.json({
            success: true,
            data: {
                pathA: {
                    load: pathALoad,
                    percentage: totalLoad > 0 ? (pathALoad / totalLoad * 100).toFixed(2) + '%' : '0%',
                },
                pathB: {
                    load: pathBLoad,
                    percentage: totalLoad > 0 ? (pathBLoad / totalLoad * 100).toFixed(2) + '%' : '0%',
                },
                totalLoad,
                balanceRate: balanceRate.toFixed(2) + '%',
                status: balanceRate < 10 ? 'balanced' : balanceRate < 20 ? 'warning' : 'unbalanced',
            },
        });
    },
};
