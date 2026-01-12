import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Mock 设备模板数据 - 预置主流品牌设备
let deviceTemplates: IDC.DeviceTemplate[] = [
    // ==================== 华为交换机 ====================
    {
        id: 'tpl-huawei-s5735-48t4x',
        name: '华为S5735-L48T4X-A',
        category: 'switch',
        brand: '华为',
        model: 'S5735-L48T4X-A',
        uHeight: 1,
        portGroups: [
            { id: 'pg-1', name: '千兆电口', portType: 'RJ45', count: 48, speed: '1G', poe: false },
            { id: 'pg-2', name: '万兆光口', portType: 'SFP+', count: 4, speed: '10G', poe: false },
        ],
        frontColor: '#1a1a1a',
        isBuiltin: true,
        description: '华为S5735系列企业级接入交换机，48个千兆电口+4个万兆上行口',
        specs: {
            '交换容量': '176Gbps',
            '包转发率': '131Mpps',
            'MAC地址表': '16K',
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },
    {
        id: 'tpl-huawei-s6730-48x6c',
        name: '华为S6730-H48X6C',
        category: 'switch',
        brand: '华为',
        model: 'S6730-H48X6C',
        uHeight: 1,
        portGroups: [
            { id: 'pg-1', name: '万兆光口', portType: 'SFP+', count: 48, speed: '10G', poe: false },
            { id: 'pg-2', name: '100G光口', portType: 'QSFP28', count: 6, speed: '100G', poe: false },
        ],
        frontColor: '#1a1a1a',
        isBuiltin: true,
        description: '华为S6730系列数据中心级交换机，48个万兆光口+6个100G上行口',
        specs: {
            '交换容量': '2.56Tbps',
            '包转发率': '1080Mpps',
            'MAC地址表': '196K',
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },
    {
        id: 'tpl-huawei-ce6881-48s6cq',
        name: '华为CE6881-48S6CQ',
        category: 'switch',
        brand: '华为',
        model: 'CE6881-48S6CQ',
        uHeight: 1,
        portGroups: [
            { id: 'pg-1', name: '25G光口', portType: 'SFP+', count: 48, speed: '25G', poe: false },
            { id: 'pg-2', name: '100G光口', portType: 'QSFP28', count: 6, speed: '100G', poe: false },
        ],
        frontColor: '#2d2d2d',
        isBuiltin: true,
        description: '华为CloudEngine 6800系列数据中心交换机',
        specs: {
            '交换容量': '3.6Tbps',
            '包转发率': '2160Mpps',
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },

    // ==================== 思科交换机 ====================
    {
        id: 'tpl-cisco-c9300-48p',
        name: 'Cisco Catalyst 9300-48P',
        category: 'switch',
        brand: '思科',
        model: 'C9300-48P',
        uHeight: 1,
        portGroups: [
            { id: 'pg-1', name: '千兆PoE+电口', portType: 'RJ45', count: 48, speed: '1G', poe: true },
            { id: 'pg-2', name: '上行模块槽', portType: 'SFP+', count: 4, speed: '10G', poe: false },
        ],
        frontColor: '#1e3a5f',
        isBuiltin: true,
        description: 'Cisco Catalyst 9300系列企业级交换机，支持PoE+',
        specs: {
            '交换容量': '208Gbps',
            '堆叠带宽': '480Gbps',
            'PoE功率': '437W',
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },
    {
        id: 'tpl-cisco-n9k-93180yc',
        name: 'Cisco Nexus 93180YC-FX',
        category: 'switch',
        brand: '思科',
        model: 'N9K-C93180YC-FX',
        uHeight: 1,
        portGroups: [
            { id: 'pg-1', name: '25G光口', portType: 'SFP+', count: 48, speed: '25G', poe: false },
            { id: 'pg-2', name: '100G光口', portType: 'QSFP28', count: 6, speed: '100G', poe: false },
        ],
        frontColor: '#1e3a5f',
        isBuiltin: true,
        description: 'Cisco Nexus 9000系列数据中心交换机',
        specs: {
            '交换容量': '3.6Tbps',
            '延迟': '<1μs',
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },

    // ==================== H3C交换机 ====================
    {
        id: 'tpl-h3c-s6850-56hf',
        name: 'H3C S6850-56HF',
        category: 'switch',
        brand: 'H3C',
        model: 'S6850-56HF',
        uHeight: 1,
        portGroups: [
            { id: 'pg-1', name: '万兆光口', portType: 'SFP+', count: 48, speed: '10G', poe: false },
            { id: 'pg-2', name: '40G光口', portType: 'QSFP+', count: 8, speed: '40G', poe: false },
        ],
        frontColor: '#e63946',
        isBuiltin: true,
        description: 'H3C S6850系列数据中心交换机',
        specs: {
            '交换容量': '1.76Tbps',
            '包转发率': '1080Mpps',
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },

    // ==================== 锐捷交换机 ====================
    {
        id: 'tpl-ruijie-s6220-48xs6qxs',
        name: '锐捷RG-S6220-48XS6QXS',
        category: 'switch',
        brand: '锐捷',
        model: 'RG-S6220-48XS6QXS',
        uHeight: 1,
        portGroups: [
            { id: 'pg-1', name: '万兆光口', portType: 'SFP+', count: 48, speed: '10G', poe: false },
            { id: 'pg-2', name: '40G光口', portType: 'QSFP+', count: 6, speed: '40G', poe: false },
        ],
        frontColor: '#0066cc',
        isBuiltin: true,
        description: '锐捷S6220系列数据中心交换机',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },

    // ==================== 服务器 ====================
    {
        id: 'tpl-huawei-2288h-v6',
        name: '华为FusionServer 2288H V6',
        category: 'server',
        brand: '华为',
        model: '2288H V6',
        uHeight: 2,
        portGroups: [
            { id: 'pg-1', name: '管理口', portType: 'RJ45', count: 1, speed: '1G', poe: false },
            { id: 'pg-2', name: '业务网口', portType: 'RJ45', count: 4, speed: '1G', poe: false },
            { id: 'pg-3', name: '电源接口', portType: 'Power', count: 2, speed: 'N/A', poe: false },
        ],
        frontColor: '#2d2d2d',
        isBuiltin: true,
        description: '华为2U双路服务器，支持第三代Intel Xeon可扩展处理器',
        specs: {
            'CPU': '2×Intel Xeon Gold 6348',
            '内存': '最大6TB DDR4',
            '存储': '25×2.5寸硬盘',
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },
    {
        id: 'tpl-dell-r750',
        name: 'Dell PowerEdge R750',
        category: 'server',
        brand: 'Dell',
        model: 'PowerEdge R750',
        uHeight: 2,
        portGroups: [
            { id: 'pg-1', name: 'iDRAC管理口', portType: 'RJ45', count: 1, speed: '1G', poe: false },
            { id: 'pg-2', name: '业务网口', portType: 'RJ45', count: 4, speed: '1G', poe: false },
            { id: 'pg-3', name: '电源接口', portType: 'Power', count: 2, speed: 'N/A', poe: false },
        ],
        frontColor: '#1a1a1a',
        isBuiltin: true,
        description: 'Dell 2U双路服务器',
        specs: {
            'CPU': '2×Intel Xeon Gold',
            '内存': '最大4TB DDR4',
            '存储': '24×2.5寸或12×3.5寸',
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },
    {
        id: 'tpl-hpe-dl380-gen10',
        name: 'HPE ProLiant DL380 Gen10',
        category: 'server',
        brand: 'HPE',
        model: 'DL380 Gen10',
        uHeight: 2,
        portGroups: [
            { id: 'pg-1', name: 'iLO管理口', portType: 'RJ45', count: 1, speed: '1G', poe: false },
            { id: 'pg-2', name: '业务网口', portType: 'RJ45', count: 4, speed: '1G', poe: false },
            { id: 'pg-3', name: '电源接口', portType: 'Power', count: 2, speed: 'N/A', poe: false },
        ],
        frontColor: '#4a4a4a',
        isBuiltin: true,
        description: 'HPE 2U双路服务器',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },
    {
        id: 'tpl-inspur-nf5280m6',
        name: '浪潮NF5280M6',
        category: 'server',
        brand: '浪潮',
        model: 'NF5280M6',
        uHeight: 2,
        portGroups: [
            { id: 'pg-1', name: 'BMC管理口', portType: 'RJ45', count: 1, speed: '1G', poe: false },
            { id: 'pg-2', name: '业务网口', portType: 'RJ45', count: 4, speed: '1G', poe: false },
            { id: 'pg-3', name: '电源接口', portType: 'Power', count: 2, speed: 'N/A', poe: false },
        ],
        frontColor: '#003366',
        isBuiltin: true,
        description: '浪潮2U双路服务器',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },

    // ==================== 路由器 ====================
    {
        id: 'tpl-huawei-ne40e-x8',
        name: '华为NE40E-X8',
        category: 'router',
        brand: '华为',
        model: 'NE40E-X8',
        uHeight: 14,
        portGroups: [
            { id: 'pg-1', name: '业务板卡槽位', portType: 'SFP+', count: 8, speed: '10G', poe: false },
        ],
        frontColor: '#2d2d2d',
        isBuiltin: true,
        description: '华为NE40E系列高端路由器',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },
    {
        id: 'tpl-cisco-asr-9000',
        name: 'Cisco ASR 9006',
        category: 'router',
        brand: '思科',
        model: 'ASR 9006',
        uHeight: 13,
        portGroups: [
            { id: 'pg-1', name: '线卡槽位', portType: 'SFP+', count: 6, speed: '10G', poe: false },
        ],
        frontColor: '#1e3a5f',
        isBuiltin: true,
        description: 'Cisco ASR 9000系列运营商级路由器',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },

    // ==================== 存储 ====================
    {
        id: 'tpl-huawei-oceanstor-5500',
        name: '华为OceanStor 5500 V5',
        category: 'storage',
        brand: '华为',
        model: 'OceanStor 5500 V5',
        uHeight: 4,
        portGroups: [
            { id: 'pg-1', name: '管理口', portType: 'RJ45', count: 2, speed: '1G', poe: false },
            { id: 'pg-2', name: 'FC存储口', portType: 'FC', count: 8, speed: '10G', poe: false },
            { id: 'pg-3', name: 'iSCSI口', portType: 'RJ45', count: 4, speed: '10G', poe: false },
        ],
        frontColor: '#1a1a1a',
        isBuiltin: true,
        description: '华为OceanStor企业级全闪存存储',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },

    // ==================== 防火墙 ====================
    {
        id: 'tpl-huawei-usg6680',
        name: '华为USG6680',
        category: 'firewall',
        brand: '华为',
        model: 'USG6680',
        uHeight: 2,
        portGroups: [
            { id: 'pg-1', name: '管理口', portType: 'RJ45', count: 1, speed: '1G', poe: false },
            { id: 'pg-2', name: '业务电口', portType: 'RJ45', count: 8, speed: '1G', poe: false },
            { id: 'pg-3', name: '业务光口', portType: 'SFP+', count: 4, speed: '10G', poe: false },
        ],
        frontColor: '#8b0000',
        isBuiltin: true,
        description: '华为下一代防火墙',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
    },

    // ==================== 负载均衡 ====================
    {
        id: 'tpl-f5-big-ip-i5800',
        name: 'F5 BIG-IP i5800',
        category: 'loadbalancer',
        brand: 'F5',
        model: 'BIG-IP i5800',
        uHeight: 1,
        portGroups: [
            { id: 'pg-1', name: '管理口', portType: 'RJ45', count: 1, speed: '1G', poe: false },
            { id: 'pg-2', name: '业务口', portType: 'SFP+', count: 8, speed: '10G', poe: false },
        ],
        frontColor: '#cc0000',
        isBuiltin: true,
        description: 'F5 BIG-IP应用交付控制器',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
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
    // 获取所有设备模板（用于下拉选择）- 必须放在 /:id 之前
    'GET /api/idc/device-templates/all': async (req: Request, res: Response) => {
        await waitTime(100);
        const { category } = req.query;

        let data = deviceTemplates;
        if (category) {
            data = data.filter(t => t.category === category);
        }

        // 返回完整的模板数据（包含portGroups）
        res.json({
            success: true,
            data: data,
        });
    },

    // 获取设备模板列表
    'GET /api/idc/device-templates': async (req: Request, res: Response) => {
        await waitTime(300);
        const { current = 1, pageSize = 10, category, brand, name, isBuiltin } = req.query;

        let filteredData = [...deviceTemplates];

        if (category) {
            filteredData = filteredData.filter(t => t.category === category);
        }
        if (brand) {
            filteredData = filteredData.filter(t => t.brand.includes(brand as string));
        }
        if (name) {
            filteredData = filteredData.filter(t =>
                t.name.includes(name as string) || t.model.includes(name as string)
            );
        }
        if (isBuiltin !== undefined) {
            filteredData = filteredData.filter(t => t.isBuiltin === (isBuiltin === 'true'));
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

    // 获取单个设备模板
    'GET /api/idc/device-templates/:id': async (req: Request, res: Response) => {
        await waitTime(200);
        const { id } = req.params;
        const template = deviceTemplates.find(t => t.id === id);

        if (template) {
            res.json({ success: true, data: template });
        } else {
            res.status(404).json({ success: false, errorMessage: '设备模板不存在' });
        }
    },

    // 创建设备模板（自定义设备）
    'POST /api/idc/device-templates': async (req: Request, res: Response) => {
        await waitTime(500);
        const body = req.body as IDC.DeviceTemplateCreateParams;

        const newTemplate: IDC.DeviceTemplate = {
            id: `tpl-custom-${uuidv4().slice(0, 8)}`,
            name: body.name,
            category: body.category,
            brand: body.brand,
            model: body.model,
            uHeight: body.uHeight,
            portGroups: body.portGroups.map((pg, i) => ({
                ...pg,
                id: `pg-${i + 1}`,
            })),
            frontColor: body.frontColor || '#3d3d3d',
            isBuiltin: false,
            description: body.description,
            specs: body.specs,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        deviceTemplates.push(newTemplate);
        res.json({ success: true, data: newTemplate });
    },

    // 更新设备模板
    'PUT /api/idc/device-templates/:id': async (req: Request, res: Response) => {
        await waitTime(400);
        const { id } = req.params;
        const body = req.body;

        const index = deviceTemplates.findIndex(t => t.id === id);
        if (index === -1) {
            res.status(404).json({ success: false, errorMessage: '设备模板不存在' });
            return;
        }

        // 内置模板不能修改
        if (deviceTemplates[index].isBuiltin) {
            res.status(403).json({ success: false, errorMessage: '内置模板不能修改' });
            return;
        }

        deviceTemplates[index] = {
            ...deviceTemplates[index],
            ...body,
            updatedAt: new Date().toISOString(),
        };

        res.json({ success: true, data: deviceTemplates[index] });
    },

    // 删除设备模板
    'DELETE /api/idc/device-templates/:id': async (req: Request, res: Response) => {
        await waitTime(300);
        const { id } = req.params;

        const index = deviceTemplates.findIndex(t => t.id === id);
        if (index === -1) {
            res.status(404).json({ success: false, errorMessage: '设备模板不存在' });
            return;
        }

        // 内置模板不能删除
        if (deviceTemplates[index].isBuiltin) {
            res.status(403).json({ success: false, errorMessage: '内置模板不能删除' });
            return;
        }

        deviceTemplates.splice(index, 1);
        res.json({ success: true });
    },

    // 获取设备类别
    'GET /api/idc/device-categories': async (_req: Request, res: Response) => {
        await waitTime(100);
        res.json({
            success: true,
            data: [
                { value: 'switch', label: '交换机' },
                { value: 'router', label: '路由器' },
                { value: 'server', label: '服务器' },
                { value: 'storage', label: '存储' },
                { value: 'firewall', label: '防火墙' },
                { value: 'loadbalancer', label: '负载均衡' },
                { value: 'other', label: '其他' },
            ],
        });
    },

    // 获取品牌列表
    'GET /api/idc/device-brands': async (_req: Request, res: Response) => {
        await waitTime(100);
        const brands = [...new Set(deviceTemplates.map(t => t.brand))];
        res.json({
            success: true,
            data: brands.map(b => ({ value: b, label: b })),
        });
    },
};
