import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Mock 数据存储
let datacenters: IDC.Datacenter[] = [
    {
        id: 'dc-001',
        name: '北京亦庄数据中心',
        code: 'BJ-YZ-DC01',
        address: '北京市大兴区亦庄经济开发区科创十一街',
        area: 5000,
        totalCabinets: 200,
        usedCabinets: 156,
        status: 'active',
        description: '一级数据中心，承载核心业务系统',
        contact: '张运维',
        phone: '13800138001',
        createdAt: '2023-01-15T08:00:00Z',
        updatedAt: '2024-12-01T10:30:00Z',
    },
    {
        id: 'dc-002',
        name: '上海嘉定数据中心',
        code: 'SH-JD-DC01',
        address: '上海市嘉定区安亭镇墨玉南路888号',
        area: 3500,
        totalCabinets: 150,
        usedCabinets: 98,
        status: 'active',
        description: '二级数据中心，承载备份和测试环境',
        contact: '李运维',
        phone: '13900139002',
        createdAt: '2023-06-20T09:00:00Z',
        updatedAt: '2024-11-15T14:20:00Z',
    },
    {
        id: 'dc-003',
        name: '深圳坪山数据中心',
        code: 'SZ-PS-DC01',
        address: '深圳市坪山区坪山大道2007号',
        area: 4200,
        totalCabinets: 180,
        usedCabinets: 132,
        status: 'active',
        description: '华南区域核心数据中心',
        contact: '王运维',
        phone: '13700137003',
        createdAt: '2023-03-10T10:00:00Z',
        updatedAt: '2024-10-20T16:45:00Z',
    },
    {
        id: 'dc-004',
        name: '成都天府数据中心',
        code: 'CD-TF-DC01',
        address: '成都市天府新区华阳街道正南街',
        area: 2800,
        totalCabinets: 120,
        usedCabinets: 45,
        status: 'maintenance',
        description: '西南区域数据中心，扩容中',
        contact: '赵运维',
        phone: '13600136004',
        createdAt: '2024-01-08T11:00:00Z',
        updatedAt: '2024-12-05T09:15:00Z',
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
    // 获取所有数据中心（用于下拉选择）- 必须放在 /:id 之前
    'GET /api/idc/datacenters/all': async (_req: Request, res: Response) => {
        await waitTime(100);
        res.json({
            success: true,
            data: datacenters.map(d => ({ id: d.id, name: d.name, code: d.code })),
        });
    },

    // 获取数据中心列表
    'GET /api/idc/datacenters': async (req: Request, res: Response) => {
        await waitTime(300);
        const { current = 1, pageSize = 10, name, status, code } = req.query;

        let filteredData = [...datacenters];

        if (name) {
            filteredData = filteredData.filter(d => d.name.includes(name as string));
        }
        if (status) {
            filteredData = filteredData.filter(d => d.status === status);
        }
        if (code) {
            filteredData = filteredData.filter(d => d.code.includes(code as string));
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

    // 获取单个数据中心
    'GET /api/idc/datacenters/:id': async (req: Request, res: Response) => {
        await waitTime(200);
        const { id } = req.params;
        const datacenter = datacenters.find(d => d.id === id);

        if (datacenter) {
            res.json({ success: true, data: datacenter });
        } else {
            res.status(404).json({ success: false, errorMessage: '数据中心不存在' });
        }
    },

    // 创建数据中心
    'POST /api/idc/datacenters': async (req: Request, res: Response) => {
        await waitTime(500);
        const body = req.body as IDC.DatacenterCreateParams;

        const newDatacenter: IDC.Datacenter = {
            id: `dc-${uuidv4().slice(0, 8)}`,
            name: body.name,
            code: body.code,
            address: body.address,
            area: body.area || 0,
            totalCabinets: 0,
            usedCabinets: 0,
            status: 'active',
            description: body.description,
            contact: body.contact,
            phone: body.phone,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        datacenters.push(newDatacenter);
        res.json({ success: true, data: newDatacenter });
    },

    // 更新数据中心
    'PUT /api/idc/datacenters/:id': async (req: Request, res: Response) => {
        await waitTime(400);
        const { id } = req.params;
        const body = req.body;

        const index = datacenters.findIndex(d => d.id === id);
        if (index === -1) {
            res.status(404).json({ success: false, errorMessage: '数据中心不存在' });
            return;
        }

        datacenters[index] = {
            ...datacenters[index],
            ...body,
            updatedAt: new Date().toISOString(),
        };

        res.json({ success: true, data: datacenters[index] });
    },

    // 删除数据中心
    'DELETE /api/idc/datacenters/:id': async (req: Request, res: Response) => {
        await waitTime(300);
        const { id } = req.params;

        const index = datacenters.findIndex(d => d.id === id);
        if (index === -1) {
            res.status(404).json({ success: false, errorMessage: '数据中心不存在' });
            return;
        }

        datacenters.splice(index, 1);
        res.json({ success: true });
    },
};
