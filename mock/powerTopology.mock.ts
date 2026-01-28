import type { Request, Response } from 'express';

// 电源拓扑节点
const powerNodes = [
    // 市电
    { id: 'utility-001', type: 'utility', name: '市电A路', status: 'online', capacity: 50000 },
    { id: 'utility-002', type: 'utility', name: '市电B路', status: 'online', capacity: 50000 },

    // UPS
    { id: 'ups-001', type: 'ups', name: 'UPS-A-01', status: 'online', load: 18000, capacity: 30000 },
    { id: 'ups-002', type: 'ups', name: 'UPS-B-01', status: 'online', load: 16500, capacity: 30000 },

    // PDU
    { id: 'pdu-001', type: 'pdu', name: 'PDU-A-01', status: 'online', load: 1800, capacity: 3000 },
    { id: 'pdu-002', type: 'pdu', name: 'PDU-B-01', status: 'online', load: 1650, capacity: 3000 },
    { id: 'pdu-003', type: 'pdu', name: 'PDU-A-02', status: 'online', load: 2400, capacity: 5000 },
    { id: 'pdu-004', type: 'pdu', name: 'PDU-B-02', status: 'warning', load: 4200, capacity: 5000 },

    // 设备(示例)
    { id: 'dev-001', type: 'device', name: 'Server-01', status: 'online', load: 300 },
    { id: 'dev-002', type: 'device', name: 'Server-02', status: 'online', load: 350 },
    { id: 'dev-003', type: 'device', name: 'Switch-01', status: 'online', load: 150 },
    { id: 'dev-004', type: 'device', name: 'Storage-01', status: 'online', load: 400 },
];

// 电源链路
const powerLinks = [
    // 市电 → UPS
    { id: 'link-001', source: 'utility-001', target: 'ups-001', powerPath: 'A', status: 'active' },
    { id: 'link-002', source: 'utility-002', target: 'ups-002', powerPath: 'B', status: 'active' },

    // UPS → PDU
    { id: 'link-003', source: 'ups-001', target: 'pdu-001', powerPath: 'A', status: 'active' },
    { id: 'link-004', source: 'ups-002', target: 'pdu-002', powerPath: 'B', status: 'active' },
    { id: 'link-005', source: 'ups-001', target: 'pdu-003', powerPath: 'A', status: 'active' },
    { id: 'link-006', source: 'ups-002', target: 'pdu-004', powerPath: 'B', status: 'active' },

    // PDU → 设备(双路电源)
    { id: 'link-007', source: 'pdu-001', target: 'dev-001', powerPath: 'A', status: 'active' },
    { id: 'link-008', source: 'pdu-002', target: 'dev-001', powerPath: 'B', status: 'active' },

    { id: 'link-009', source: 'pdu-001', target: 'dev-002', powerPath: 'A', status: 'active' },
    { id: 'link-010', source: 'pdu-002', target: 'dev-002', powerPath: 'B', status: 'active' },

    // PDU → 设备(单路电源)
    { id: 'link-011', source: 'pdu-003', target: 'dev-003', powerPath: 'A', status: 'active' },

    { id: 'link-012', source: 'pdu-003', target: 'dev-004', powerPath: 'A', status: 'active' },
    { id: 'link-013', source: 'pdu-004', target: 'dev-004', powerPath: 'B', status: 'active' },
];

export default {
    // 获取电源拓扑
    'GET /api/power/topology': (_req: Request, res: Response) => {
        res.json({
            success: true,
            data: {
                nodes: powerNodes,
                links: powerLinks,
            },
        });
    },

    // 获取电源冗余状态
    'GET /api/power/redundancy': (_req: Request, res: Response) => {
        // 统计每个设备的电源路径
        const devicePowerPaths = new Map<string, Set<string>>();

        powerLinks.forEach((link) => {
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
            const device = powerNodes.find(n => n.id === deviceId);
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
                    redundancyRate: (dualPowerDevices.length / devicePowerPaths.size * 100).toFixed(2) + '%',
                },
            },
        });
    },

    // 获取负载均衡状态
    'GET /api/power/load-balance': (_req: Request, res: Response) => {
        // 计算A/B路负载
        const pathALoad = powerLinks
            .filter(l => l.powerPath === 'A' && l.status === 'active')
            .reduce((sum, l) => {
                const target = powerNodes.find(n => n.id === l.target);
                return sum + (target?.load || 0);
            }, 0);

        const pathBLoad = powerLinks
            .filter(l => l.powerPath === 'B' && l.status === 'active')
            .reduce((sum, l) => {
                const target = powerNodes.find(n => n.id === l.target);
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
