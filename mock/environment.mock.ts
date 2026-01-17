import type { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });
};

// 模拟机柜ID列表
const cabinetIds = ['cab-bj-001', 'cab-bj-002', 'cab-bj-003', 'cab-sh-001', 'cab-sh-002', 'cab-sz-001'];
const cabinetNames = ['A区1排1号', 'A区1排2号', 'A区1排3号', 'B区1排1号', 'B区1排2号', 'C区1排1号'];

// 生成随机温度数据
const generateTemperature = (base: number = 24, variance: number = 4) => {
    return Math.round((base + (Math.random() - 0.5) * variance * 2) * 10) / 10;
};

// 生成随机湿度数据
const generateHumidity = (base: number = 45, variance: number = 10) => {
    return Math.round((base + (Math.random() - 0.5) * variance * 2) * 10) / 10;
};

// Mock 环境监控数据
export default {
    // 获取所有机柜环境数据
    'GET /api/idc/environment/cabinets': async (_req: Request, res: Response) => {
        await waitTime(300);

        const data: IDC.CabinetEnvironment[] = cabinetIds.map((id, index) => {
            const avgTemp = generateTemperature(24);
            const maxTemp = avgTemp + Math.random() * 3;
            const minTemp = avgTemp - Math.random() * 2;
            const status = avgTemp > 28 ? 'critical' : avgTemp > 26 ? 'warning' : 'normal';

            return {
                cabinetId: id,
                cabinetName: cabinetNames[index],
                datacenterId: index < 3 ? 'dc-001' : index < 5 ? 'dc-002' : 'dc-003',
                datacenterName: index < 3 ? '北京亦庄' : index < 5 ? '上海嘉定' : '深圳坪山',
                avgTemperature: Math.round(avgTemp * 10) / 10,
                maxTemperature: Math.round(maxTemp * 10) / 10,
                minTemperature: Math.round(minTemp * 10) / 10,
                avgHumidity: generateHumidity(),
                status,
            };
        });

        res.json({ success: true, data });
    },

    // 获取单个机柜传感器详细数据
    'GET /api/idc/environment/cabinet/:cabinetId': async (req: Request, res: Response) => {
        await waitTime(200);
        const { cabinetId } = req.params;
        const index = cabinetIds.indexOf(cabinetId);

        const sensors: IDC.EnvironmentSensor[] = [
            {
                id: `sensor-${cabinetId}-front`,
                cabinetId,
                cabinetName: cabinetNames[index] || '未知机柜',
                position: 'front',
                temperature: generateTemperature(23),
                humidity: generateHumidity(45),
                lastUpdated: new Date().toISOString(),
            },
            {
                id: `sensor-${cabinetId}-rear`,
                cabinetId,
                cabinetName: cabinetNames[index] || '未知机柜',
                position: 'rear',
                temperature: generateTemperature(28),
                humidity: generateHumidity(40),
                lastUpdated: new Date().toISOString(),
            },
            {
                id: `sensor-${cabinetId}-top`,
                cabinetId,
                cabinetName: cabinetNames[index] || '未知机柜',
                position: 'top',
                temperature: generateTemperature(26),
                humidity: generateHumidity(42),
                lastUpdated: new Date().toISOString(),
            },
        ];

        res.json({ success: true, data: sensors });
    },

    // 获取温度趋势数据
    'GET /api/idc/environment/temperature-trend': async (req: Request, res: Response) => {
        await waitTime(300);
        const { hours = 24 } = req.query;

        const data: IDC.TemperatureTrend[] = [];
        const now = new Date();

        for (let i = Number(hours); i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
            // 模拟日间温度稍高
            const hour = timestamp.getHours();
            const baseTemp = hour >= 9 && hour <= 18 ? 25 : 23;

            data.push({
                timestamp: timestamp.toISOString(),
                avgTemperature: generateTemperature(baseTemp, 2),
                maxTemperature: generateTemperature(baseTemp + 3, 2),
                minTemperature: generateTemperature(baseTemp - 2, 1),
            });
        }

        res.json({ success: true, data });
    },

    // 获取PUE趋势数据
    'GET /api/idc/environment/pue-trend': async (req: Request, res: Response) => {
        await waitTime(300);
        const { days = 30, datacenterId } = req.query;

        const data: IDC.PueData[] = [];
        const dcId = datacenterId as string || 'dc-001';
        const dcNames: Record<string, string> = {
            'dc-001': '北京亦庄',
            'dc-002': '上海嘉定',
            'dc-003': '深圳坪山',
        };

        for (let i = Number(days); i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const itPower = 150 + Math.random() * 50;
            const coolingPower = itPower * (0.3 + Math.random() * 0.2);
            const totalPower = itPower + coolingPower + 20 + Math.random() * 10;

            data.push({
                datacenterId: dcId,
                datacenterName: dcNames[dcId] || '未知数据中心',
                date: date.toISOString().split('T')[0],
                pue: Math.round((totalPower / itPower) * 100) / 100,
                itPower: Math.round(itPower * 10) / 10,
                totalPower: Math.round(totalPower * 10) / 10,
                coolingPower: Math.round(coolingPower * 10) / 10,
            });
        }

        res.json({ success: true, data });
    },

    // 获取能耗统计
    'GET /api/idc/environment/energy-stats': async (_req: Request, res: Response) => {
        await waitTime(200);

        const stats: IDC.EnergyStats = {
            totalEnergy: 125680,         // kWh
            totalCost: 87976,            // 元
            avgPue: 1.42,
            carbonEmission: 62840,       // kg CO2
            comparedLastMonth: -3.2,     // 环比下降3.2%
        };

        res.json({ success: true, data: stats });
    },

    // 获取机柜能耗数据
    'GET /api/idc/environment/power': async (req: Request, res: Response) => {
        await waitTime(300);
        const { cabinetId } = req.query;

        const data: IDC.PowerConsumption[] = cabinetIds
            .filter(id => !cabinetId || id === cabinetId)
            .map((id, index) => ({
                id: `power-${id}`,
                cabinetId: id,
                cabinetName: cabinetNames[index],
                datacenterId: index < 3 ? 'dc-001' : index < 5 ? 'dc-002' : 'dc-003',
                datacenterName: index < 3 ? '北京亦庄' : index < 5 ? '上海嘉定' : '深圳坪山',
                timestamp: new Date().toISOString(),
                activePower: Math.round((3 + Math.random() * 4) * 100) / 100,
                apparentPower: Math.round((3.5 + Math.random() * 4.5) * 100) / 100,
                powerFactor: Math.round((0.85 + Math.random() * 0.1) * 100) / 100,
                energy: Math.round((1500 + Math.random() * 500) * 10) / 10,
                current: Math.round((10 + Math.random() * 5) * 10) / 10,
                voltage: Math.round((220 + Math.random() * 5) * 10) / 10,
            }));

        res.json({ success: true, data });
    },

    // 获取环境监控概览
    'GET /api/idc/environment/overview': async (_req: Request, res: Response) => {
        await waitTime(200);

        const overview = {
            totalCabinets: 53,
            normalCabinets: 48,
            warningCabinets: 4,
            criticalCabinets: 1,
            avgTemperature: 24.5,
            avgHumidity: 45.2,
            maxTemperature: 29.8,
            maxTemperatureCabinet: 'A区1排3号',
            minTemperature: 21.2,
            totalPower: 186.5,      // kW
            avgPue: 1.42,
        };

        res.json({ success: true, data: overview });
    },
};
