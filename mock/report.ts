import type { Request, Response } from 'express';
import type { ReportSnapshot } from '../src/services/platform/report';

const assets = [
  { datacenterId: 'dc-001', datacenterName: '北京亦庄数据中心', devices: 168, onlineRate: 98.8, expiringWarranty: 12, unknownOwner: 3 },
  { datacenterId: 'dc-002', datacenterName: '上海嘉定数据中心', devices: 126, onlineRate: 97.6, expiringWarranty: 8, unknownOwner: 6 },
  { datacenterId: 'dc-003', datacenterName: '深圳坪山数据中心', devices: 142, onlineRate: 99.3, expiringWarranty: 5, unknownOwner: 1 },
];
const capacity = [
  { datacenterId: 'dc-001', datacenterName: '北京亦庄数据中心', uUsage: 78, powerUsage: 72, coolingUsage: 69, networkUsage: 64 },
  { datacenterId: 'dc-002', datacenterName: '上海嘉定数据中心', uUsage: 65, powerUsage: 68, coolingUsage: 62, networkUsage: 71 },
  { datacenterId: 'dc-003', datacenterName: '深圳坪山数据中心', uUsage: 73, powerUsage: 63, coolingUsage: 58, networkUsage: 67 },
];
const energyTrend = ['03', '04', '05', '06', '07', '08'].flatMap((month, index) => [
  { month: `2026-${month}`, value: [812, 798, 826, 851, 879, 864][index], series: '能耗 MWh' as const },
  { month: `2026-${month}`, value: [1.42, 1.4, 1.39, 1.41, 1.38, 1.36][index], series: 'PUE' as const },
]);
const sla = [
  { priority: 'P1', total: 18, acknowledgedInTime: 17, resolvedInTime: 15, averageAckMinutes: 4.8, averageResolveMinutes: 42 },
  { priority: 'P2', total: 43, acknowledgedInTime: 41, resolvedInTime: 40, averageAckMinutes: 11.2, averageResolveMinutes: 138 },
  { priority: 'P3', total: 76, acknowledgedInTime: 74, resolvedInTime: 73, averageAckMinutes: 24.6, averageResolveMinutes: 310 },
];

export default {
  'GET /api/platform/reports': async (req: Request, res: Response) => {
    await new Promise((resolve) => setTimeout(resolve, 280));
    const datacenterId = String(req.query.datacenterId ?? 'all');
    const filter = <T extends { datacenterId: string }>(items: T[]) => datacenterId === 'all' ? items : items.filter((item) => item.datacenterId === datacenterId);
    const data: ReportSnapshot = {
      generatedAt: new Date().toISOString(),
      kpis: [
        { key: 'assets', label: '在管设备', value: filter(assets).reduce((sum, item) => sum + item.devices, 0), unit: '台', trend: 3.2, status: 'processing' },
        { key: 'capacity', label: '平均 U 位使用率', value: Math.round(filter(capacity).reduce((sum, item) => sum + item.uUsage, 0) / Math.max(filter(capacity).length, 1)), unit: '%', trend: 1.8, status: 'warning' },
        { key: 'energy', label: '本月能耗', value: 864, unit: 'MWh', trend: -1.7, status: 'success' },
        { key: 'sla', label: '告警 SLA 达成率', value: 94.2, unit: '%', trend: 2.1, status: 'success' },
      ],
      assets: filter(assets), capacity: filter(capacity), energyTrend, sla,
      datacenters: assets.map((item) => ({ id: item.datacenterId, name: item.datacenterName })),
    };
    res.json({ success: true, data });
  },
};
