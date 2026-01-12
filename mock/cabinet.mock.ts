import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Mock 机柜数据
const cabinets: IDC.Cabinet[] = [
    // 北京亦庄数据中心机柜
    ...Array.from({ length: 20 }, (_, i) => ({
        id: `cab-bj-${String(i + 1).padStart(3, '0')}`,
        datacenterId: 'dc-001',
        datacenterName: '北京亦庄数据中心',
        name: `A区${Math.floor(i / 5) + 1}排${(i % 5) + 1}号机柜`,
        code: `BJ-YZ-A${Math.floor(i / 5) + 1}-${String((i % 5) + 1).padStart(2, '0')}`,
        row: Math.floor(i / 5) + 1,
        column: (i % 5) + 1,
        uHeight: 42,
        usedU: Math.floor(Math.random() * 35) + 5,
        maxPower: 10000,
        currentPower: Math.floor(Math.random() * 6000) + 2000,
        status: (i % 10 === 0 ? 'warning' : 'normal') as IDC.Cabinet['status'],
        description: `A区标准机柜`,
        createdAt: '2023-01-20T08:00:00Z',
        updatedAt: '2024-12-01T10:30:00Z',
    }) as IDC.Cabinet),
    // 上海嘉定数据中心机柜
    ...Array.from({ length: 15 }, (_, i) => ({
        id: `cab-sh-${String(i + 1).padStart(3, '0')}`,
        datacenterId: 'dc-002',
        datacenterName: '上海嘉定数据中心',
        name: `B区${Math.floor(i / 5) + 1}排${(i % 5) + 1}号机柜`,
        code: `SH-JD-B${Math.floor(i / 5) + 1}-${String((i % 5) + 1).padStart(2, '0')}`,
        row: Math.floor(i / 5) + 1,
        column: (i % 5) + 1,
        uHeight: 42,
        usedU: Math.floor(Math.random() * 30) + 8,
        maxPower: 10000,
        currentPower: Math.floor(Math.random() * 5500) + 1500,
        status: (i % 8 === 0 ? 'warning' : 'normal') as IDC.Cabinet['status'],
        description: `B区标准机柜`,
        createdAt: '2023-06-25T09:00:00Z',
        updatedAt: '2024-11-15T14:20:00Z',
    }) as IDC.Cabinet),
    // 深圳坪山数据中心机柜
    ...Array.from({ length: 18 }, (_, i) => ({
        id: `cab-sz-${String(i + 1).padStart(3, '0')}`,
        datacenterId: 'dc-003',
        datacenterName: '深圳坪山数据中心',
        name: `C区${Math.floor(i / 6) + 1}排${(i % 6) + 1}号机柜`,
        code: `SZ-PS-C${Math.floor(i / 6) + 1}-${String((i % 6) + 1).padStart(2, '0')}`,
        row: Math.floor(i / 6) + 1,
        column: (i % 6) + 1,
        uHeight: 47,
        usedU: Math.floor(Math.random() * 38) + 6,
        maxPower: 12000,
        currentPower: Math.floor(Math.random() * 7000) + 2500,
        status: 'normal' as IDC.Cabinet['status'],
        description: `C区高密度机柜`,
        createdAt: '2023-03-15T10:00:00Z',
        updatedAt: '2024-10-20T16:45:00Z',
    }) as IDC.Cabinet),
    // 成都天府数据中心机柜
    ...Array.from({ length: 12 }, (_, i) => ({
        id: `cab-cd-${String(i + 1).padStart(3, '0')}`,
        datacenterId: 'dc-004',
        datacenterName: '成都天府数据中心',
        name: `D区${Math.floor(i / 4) + 1}排${(i % 4) + 1}号机柜`,
        code: `CD-TF-D${Math.floor(i / 4) + 1}-${String((i % 4) + 1).padStart(2, '0')}`,
        row: Math.floor(i / 4) + 1,
        column: (i % 4) + 1,
        uHeight: 42,
        usedU: Math.floor(Math.random() * 20) + 3,
        maxPower: 10000,
        currentPower: Math.floor(Math.random() * 4000) + 1000,
        status: (i % 6 === 0 ? 'warning' : 'normal') as IDC.Cabinet['status'],
        description: `D区标准机柜`,
        createdAt: '2024-01-08T11:00:00Z',
        updatedAt: '2024-12-05T09:15:00Z',
    }) as IDC.Cabinet),
];

const waitTime = (time: number = 100) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });
};

export default {
    // 获取机柜列表
    'GET /api/idc/cabinets': async (req: Request, res: Response) => {
        await waitTime(300);
        const { current = 1, pageSize = 10, datacenterId, name, status, code } = req.query;

        let filteredData = [...cabinets];

        if (datacenterId) {
            filteredData = filteredData.filter(c => c.datacenterId === datacenterId);
        }
        if (name) {
            filteredData = filteredData.filter(c => c.name.includes(name as string));
        }
        if (status) {
            filteredData = filteredData.filter(c => c.status === status);
        }
        if (code) {
            filteredData = filteredData.filter(c => c.code.includes(code as string));
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

    // 获取单个机柜
    'GET /api/idc/cabinets/:id': async (req: Request, res: Response) => {
        await waitTime(200);
        const { id } = req.params;
        const cabinet = cabinets.find(c => c.id === id);

        if (cabinet) {
            res.json({ success: true, data: cabinet });
        } else {
            res.status(404).json({ success: false, errorMessage: '机柜不存在' });
        }
    },

    // 创建机柜
    'POST /api/idc/cabinets': async (req: Request, res: Response) => {
        await waitTime(500);
        const body = req.body as IDC.CabinetCreateParams;

        const newCabinet: IDC.Cabinet = {
            id: `cab-${uuidv4().slice(0, 8)}`,
            datacenterId: body.datacenterId,
            datacenterName: '',
            name: body.name,
            code: body.code,
            row: body.row,
            column: body.column,
            uHeight: body.uHeight || 42,
            usedU: 0,
            maxPower: body.maxPower || 10000,
            currentPower: 0,
            status: 'normal',
            description: body.description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        cabinets.push(newCabinet);
        res.json({ success: true, data: newCabinet });
    },

    // 更新机柜
    'PUT /api/idc/cabinets/:id': async (req: Request, res: Response) => {
        await waitTime(400);
        const { id } = req.params;
        const body = req.body;

        const index = cabinets.findIndex(c => c.id === id);
        if (index === -1) {
            res.status(404).json({ success: false, errorMessage: '机柜不存在' });
            return;
        }

        cabinets[index] = {
            ...cabinets[index],
            ...body,
            updatedAt: new Date().toISOString(),
        };

        res.json({ success: true, data: cabinets[index] });
    },

    // 删除机柜
    'DELETE /api/idc/cabinets/:id': async (req: Request, res: Response) => {
        await waitTime(300);
        const { id } = req.params;

        const index = cabinets.findIndex(c => c.id === id);
        if (index === -1) {
            res.status(404).json({ success: false, errorMessage: '机柜不存在' });
            return;
        }

        cabinets.splice(index, 1);
        res.json({ success: true });
    },

    // 获取数据中心下的所有机柜（3D视图用）
    'GET /api/idc/cabinets/by-datacenter/:datacenterId': async (req: Request, res: Response) => {
        await waitTime(200);
        const { datacenterId } = req.params;
        const dcCabinets = cabinets.filter(c => c.datacenterId === datacenterId);

        res.json({
            success: true,
            data: dcCabinets,
        });
    },

    // 获取机柜U位使用情况
    'GET /api/idc/cabinets/:id/u-usage': async (req: Request, res: Response) => {
        await waitTime(200);
        const { id } = req.params;
        const cabinet = cabinets.find(c => c.id === id);

        if (!cabinet) {
            res.status(404).json({ success: false, errorMessage: '机柜不存在' });
            return;
        }

        // 生成U位使用详情（模拟数据）
        const uSlots = Array.from({ length: cabinet.uHeight }, (_, i) => ({
            u: i + 1,
            deviceId: Math.random() > 0.6 ? `dev-${uuidv4().slice(0, 8)}` : null,
            deviceName: Math.random() > 0.6 ? `设备-${i + 1}` : null,
        }));

        res.json({
            success: true,
            data: {
                cabinetId: id,
                uHeight: cabinet.uHeight,
                usedU: cabinet.usedU,
                availableU: cabinet.uHeight - cabinet.usedU,
                uSlots,
            },
        });
    },
};
