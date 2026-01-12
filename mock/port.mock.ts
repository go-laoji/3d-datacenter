import type { Request, Response } from 'express';

// Mock 端口数据 - 基于设备动态生成
const generatePorts = (deviceId: string, templateId: string): IDC.Port[] => {
    const ports: IDC.Port[] = [];

    // 根据模板ID生成不同的端口
    if (templateId === 'tpl-huawei-s5735-48t4x') {
        // 48个RJ45端口
        for (let i = 1; i <= 48; i++) {
            ports.push({
                id: `port-${deviceId}-rj45-${i}`,
                deviceId,
                portGroupId: 'pg-1',
                portNumber: `GE1/0/${i}`,
                portAlias: i <= 24 ? `Server-${i}` : undefined,
                portType: 'RJ45',
                speed: '1G',
                status: i % 5 === 0 ? 'disabled' : 'up',
                linkStatus: i <= 30 ? 'connected' : 'disconnected',
                vlanConfig: {
                    mode: i <= 24 ? 'access' : 'trunk',
                    pvid: i <= 24 ? 100 + Math.floor(i / 6) : 1,
                    allowedVlans: i > 24 ? [1, 100, 101, 102, 103, 104, 200, 300] : undefined,
                },
                qosConfig: {
                    trustMode: 'dscp',
                    defaultPriority: 0,
                    ingressRateLimit: i <= 24 ? 1000 : undefined,
                },
                lastUpdated: '2024-12-01T10:00:00Z',
                description: i <= 24 ? `连接服务器${i}` : undefined,
            });
        }
        // 4个SFP+端口
        for (let i = 1; i <= 4; i++) {
            ports.push({
                id: `port-${deviceId}-sfp-${i}`,
                deviceId,
                portGroupId: 'pg-2',
                portNumber: `XGE1/0/${i}`,
                portAlias: i <= 2 ? `Uplink-${i}` : undefined,
                portType: 'SFP+',
                speed: '10G',
                status: 'up',
                linkStatus: i <= 2 ? 'connected' : 'disconnected',
                vlanConfig: {
                    mode: 'trunk',
                    pvid: 1,
                    allowedVlans: [1, 100, 101, 102, 103, 104, 200, 300],
                },
                lastUpdated: '2024-12-01T10:00:00Z',
                description: i <= 2 ? `上联核心交换机-${i}` : undefined,
            });
        }
    } else if (templateId === 'tpl-huawei-s6730-48x6c') {
        // 48个SFP+端口
        for (let i = 1; i <= 48; i++) {
            ports.push({
                id: `port-${deviceId}-sfp-${i}`,
                deviceId,
                portGroupId: 'pg-1',
                portNumber: `XGE1/0/${i}`,
                portType: 'SFP+',
                speed: '10G',
                status: 'up',
                linkStatus: i <= 36 ? 'connected' : 'disconnected',
                vlanConfig: {
                    mode: 'trunk',
                    pvid: 1,
                    allowedVlans: [1, 100, 101, 102, 103, 104, 200, 300],
                },
                lastUpdated: '2024-12-01T10:00:00Z',
            });
        }
        // 6个QSFP28端口
        for (let i = 1; i <= 6; i++) {
            ports.push({
                id: `port-${deviceId}-qsfp-${i}`,
                deviceId,
                portGroupId: 'pg-2',
                portNumber: `100GE1/0/${i}`,
                portType: 'QSFP28',
                speed: '100G',
                status: 'up',
                linkStatus: i <= 2 ? 'connected' : 'disconnected',
                lastUpdated: '2024-12-01T10:00:00Z',
            });
        }
    } else if (templateId.includes('server') || templateId.includes('2288') || templateId.includes('r750') || templateId.includes('dl380') || templateId.includes('nf5280')) {
        // 服务器端口
        ports.push({
            id: `port-${deviceId}-mgmt`,
            deviceId,
            portGroupId: 'pg-1',
            portNumber: 'Mgmt',
            portAlias: 'IPMI管理口',
            portType: 'RJ45',
            speed: '1G',
            status: 'up',
            linkStatus: 'connected',
            lastUpdated: '2024-12-01T10:00:00Z',
            description: 'IPMI/iLO/iDRAC管理口',
        });
        for (let i = 1; i <= 4; i++) {
            ports.push({
                id: `port-${deviceId}-eth-${i}`,
                deviceId,
                portGroupId: 'pg-2',
                portNumber: `eth${i}`,
                portType: 'RJ45',
                speed: '1G',
                status: 'up',
                linkStatus: i <= 2 ? 'connected' : 'disconnected',
                vlanConfig: i <= 2 ? {
                    mode: 'access',
                    pvid: i === 1 ? 100 : 200,
                } : undefined,
                lastUpdated: '2024-12-01T10:00:00Z',
                description: i === 1 ? '业务网络' : (i === 2 ? '管理网络' : undefined),
            });
        }
        // 电源接口
        for (let i = 1; i <= 2; i++) {
            ports.push({
                id: `port-${deviceId}-pwr-${i}`,
                deviceId,
                portGroupId: 'pg-3',
                portNumber: `PWR${i}`,
                portType: 'Power',
                speed: 'N/A',
                status: 'up',
                linkStatus: 'connected',
                lastUpdated: '2024-12-01T10:00:00Z',
                description: `电源模块${i}`,
            });
        }
    } else {
        // 默认生成一些端口
        for (let i = 1; i <= 8; i++) {
            ports.push({
                id: `port-${deviceId}-${i}`,
                deviceId,
                portGroupId: 'pg-1',
                portNumber: `Port${i}`,
                portType: 'RJ45',
                speed: '1G',
                status: 'up',
                linkStatus: i <= 4 ? 'connected' : 'disconnected',
                lastUpdated: '2024-12-01T10:00:00Z',
            });
        }
    }

    return ports;
};

// 缓存已生成的端口数据
const portsCache: Map<string, IDC.Port[]> = new Map();

const getDevicePorts = (deviceId: string, templateId: string): IDC.Port[] => {
    const cacheKey = `${deviceId}-${templateId}`;
    if (!portsCache.has(cacheKey)) {
        portsCache.set(cacheKey, generatePorts(deviceId, templateId));
    }
    return portsCache.get(cacheKey)!;
};

const waitTime = (time: number = 100) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });
};

// 设备ID到模板ID的映射（简化）
const deviceTemplateMap: Record<string, string> = {
    'dev-001': 'tpl-huawei-s6730-48x6c',
    'dev-002': 'tpl-huawei-s5735-48t4x',
    'dev-003': 'tpl-huawei-2288h-v6',
    'dev-004': 'tpl-huawei-2288h-v6',
    'dev-005': 'tpl-dell-r750',
    'dev-006': 'tpl-huawei-usg6680',
    'dev-007': 'tpl-f5-big-ip-i5800',
    'dev-008': 'tpl-huawei-oceanstor-5500',
    'dev-009': 'tpl-cisco-c9300-48p',
    'dev-010': 'tpl-cisco-n9k-93180yc',
    'dev-011': 'tpl-h3c-s6850-56hf',
    'dev-012': 'tpl-inspur-nf5280m6',
};

export default {
    // 获取设备的端口列表
    'GET /api/idc/ports/by-device/:deviceId': async (req: Request, res: Response) => {
        await waitTime(300);
        const { deviceId } = req.params;
        const { portType, status, linkStatus } = req.query;

        const templateId = deviceTemplateMap[deviceId] || 'default';
        let ports = getDevicePorts(deviceId, templateId);

        if (portType) {
            ports = ports.filter(p => p.portType === portType);
        }
        if (status) {
            ports = ports.filter(p => p.status === status);
        }
        if (linkStatus) {
            ports = ports.filter(p => p.linkStatus === linkStatus);
        }

        res.json({
            success: true,
            data: ports,
            total: ports.length,
        });
    },

    // 获取单个端口
    'GET /api/idc/ports/:id': async (req: Request, res: Response) => {
        await waitTime(200);
        const { id } = req.params;

        // 从缓存中查找端口
        for (const [, ports] of portsCache) {
            const port = ports.find(p => p.id === id);
            if (port) {
                res.json({ success: true, data: port });
                return;
            }
        }

        res.status(404).json({ success: false, errorMessage: '端口不存在' });
    },

    // 更新端口配置
    'PUT /api/idc/ports/:id': async (req: Request, res: Response) => {
        await waitTime(400);
        const { id } = req.params;
        const body = req.body as IDC.PortUpdateParams;

        // 从缓存中查找并更新端口
        for (const [cacheKey, ports] of portsCache) {
            const index = ports.findIndex(p => p.id === id);
            if (index !== -1) {
                ports[index] = {
                    ...ports[index],
                    ...body,
                    lastUpdated: new Date().toISOString(),
                };
                portsCache.set(cacheKey, ports);
                res.json({ success: true, data: ports[index] });
                return;
            }
        }

        res.status(404).json({ success: false, errorMessage: '端口不存在' });
    },

    // 批量更新端口VLAN配置
    'POST /api/idc/ports/batch-vlan': async (req: Request, res: Response) => {
        await waitTime(500);
        const { portIds, vlanConfig } = req.body;

        const updatedPorts: IDC.Port[] = [];

        for (const [cacheKey, ports] of portsCache) {
            let modified = false;
            ports.forEach((port, index) => {
                if (portIds.includes(port.id)) {
                    ports[index] = {
                        ...port,
                        vlanConfig,
                        lastUpdated: new Date().toISOString(),
                    };
                    updatedPorts.push(ports[index]);
                    modified = true;
                }
            });
            if (modified) {
                portsCache.set(cacheKey, ports);
            }
        }

        res.json({
            success: true,
            data: updatedPorts,
            message: `成功更新 ${updatedPorts.length} 个端口的VLAN配置`,
        });
    },

    // 批量更新端口状态
    'POST /api/idc/ports/batch-status': async (req: Request, res: Response) => {
        await waitTime(400);
        const { portIds, status } = req.body;

        let updatedCount = 0;

        for (const [cacheKey, ports] of portsCache) {
            let modified = false;
            ports.forEach((port, index) => {
                if (portIds.includes(port.id)) {
                    ports[index] = {
                        ...port,
                        status,
                        lastUpdated: new Date().toISOString(),
                    };
                    updatedCount++;
                    modified = true;
                }
            });
            if (modified) {
                portsCache.set(cacheKey, ports);
            }
        }

        res.json({
            success: true,
            message: `成功更新 ${updatedCount} 个端口的状态`,
        });
    },

    // 获取端口统计
    'GET /api/idc/ports/stats/:deviceId': async (req: Request, res: Response) => {
        await waitTime(200);
        const { deviceId } = req.params;

        const templateId = deviceTemplateMap[deviceId] || 'default';
        const ports = getDevicePorts(deviceId, templateId);

        const stats = {
            total: ports.length,
            up: ports.filter(p => p.status === 'up').length,
            down: ports.filter(p => p.status === 'down').length,
            disabled: ports.filter(p => p.status === 'disabled').length,
            error: ports.filter(p => p.status === 'error').length,
            connected: ports.filter(p => p.linkStatus === 'connected').length,
            disconnected: ports.filter(p => p.linkStatus === 'disconnected').length,
            byType: {} as Record<string, number>,
        };

        ports.forEach(p => {
            stats.byType[p.portType] = (stats.byType[p.portType] || 0) + 1;
        });

        res.json({ success: true, data: stats });
    },

    // 获取端口类型选项
    'GET /api/idc/port-types': async (_req: Request, res: Response) => {
        await waitTime(100);
        res.json({
            success: true,
            data: [
                { value: 'RJ45', label: 'RJ45电口' },
                { value: 'SFP', label: 'SFP光口' },
                { value: 'SFP+', label: 'SFP+万兆光口' },
                { value: 'QSFP+', label: 'QSFP+ 40G光口' },
                { value: 'QSFP28', label: 'QSFP28 100G光口' },
                { value: 'FC', label: 'FC光纤通道口' },
                { value: 'USB', label: 'USB接口' },
                { value: 'Console', label: 'Console控制台' },
                { value: 'Power', label: '电源接口' },
            ],
        });
    },

    // 获取速率选项
    'GET /api/idc/port-speeds': async (_req: Request, res: Response) => {
        await waitTime(100);
        res.json({
            success: true,
            data: [
                { value: '100M', label: '100Mbps' },
                { value: '1G', label: '1Gbps' },
                { value: '10G', label: '10Gbps' },
                { value: '25G', label: '25Gbps' },
                { value: '40G', label: '40Gbps' },
                { value: '100G', label: '100Gbps' },
                { value: 'N/A', label: '不适用' },
            ],
        });
    },

    // VLAN模式选项
    'GET /api/idc/vlan-modes': async (_req: Request, res: Response) => {
        await waitTime(100);
        res.json({
            success: true,
            data: [
                { value: 'access', label: 'Access' },
                { value: 'trunk', label: 'Trunk' },
                { value: 'hybrid', label: 'Hybrid' },
            ],
        });
    },
};
