import type { Request, Response } from 'express';

const wait = (delay = 80) => new Promise((resolve) => setTimeout(resolve, delay));
const observedAt = new Date('2026-08-20T02:00:00.000Z');

const thresholds = {
  temperatureWarning: 26,
  temperatureCritical: 28,
  humidityLow: 35,
  humidityHigh: 65,
  pueTarget: 1.4,
  pueWarning: 1.55,
  hysteresis: 0.5,
  durationMinutes: 10,
  source: '环境告警规则 / ENV-TEMP-01',
  maintenanceWindow: '每周日 02:00-03:00（Asia/Shanghai）',
};

const cabinets = [
  ['cab-bj-001', 'A区1排1号', 'dc-001', '北京亦庄', 23.8, 25.2, 44.2, 'normal', 'good'],
  ['cab-bj-002', 'A区1排2号', 'dc-001', '北京亦庄', 25.4, 26.6, 48.5, 'warning', 'good'],
  ['cab-bj-003', 'A区1排3号', 'dc-001', '北京亦庄', 28.7, 30.1, 52.1, 'critical', 'delayed'],
  ['cab-sh-001', 'B区1排1号', 'dc-002', '上海嘉定', 24.2, 25.3, 43.8, 'normal', 'estimated'],
  ['cab-sh-002', 'B区1排2号', 'dc-002', '上海嘉定', null, null, null, 'unavailable', 'interrupted'],
  ['cab-sz-001', 'C区1排1号', 'dc-003', '深圳坪山', 25.1, 26.1, 67.2, 'warning', 'invalid'],
] as const;

const cabinetViews = cabinets.map((item, index) => ({
  cabinetId: item[0],
  cabinetName: item[1],
  datacenterId: item[2],
  datacenterName: item[3],
  avgTemperature: item[4],
  maxTemperature: item[5],
  minTemperature: item[4] === null ? null : Number((item[4] - 1.4).toFixed(1)),
  avgHumidity: item[6],
  status: item[7],
  quality: item[8],
  source: index === 3 ? '边缘网关估算' : 'Modbus / ENV-GW-01',
  collectedAt: new Date(observedAt.getTime() - (index === 2 ? 18 : index === 4 ? 95 : 2) * 60_000).toISOString(),
  sensorCount: 3,
  anomalyReason:
    item[7] === 'critical'
      ? '持续 18 分钟超过 28℃'
      : item[7] === 'warning'
        ? item[6] !== null && item[6] > 65
          ? '湿度超过 65%'
          : '最高温度超过 26℃'
        : item[7] === 'unavailable'
          ? '采集链路中断 95 分钟'
          : undefined,
}));

const rangeHours: Record<string, number> = { '24h': 24, '7d': 168, '30d': 720 };
const stepHours: Record<string, number> = { '1h': 1, '6h': 6, '1d': 24 };

const resolveSeries = (req: Request) => {
  const range = String(req.query.range || '24h');
  const granularity = String(req.query.granularity || (range === '24h' ? '1h' : '6h'));
  return {
    hours: rangeHours[range] || 24,
    step: stepHours[granularity] || 1,
  };
};

export default {
  'GET /api/idc/environment/thresholds': async (_req: Request, res: Response) => {
    await wait();
    res.json({ success: true, data: thresholds });
  },

  'GET /api/idc/environment/cabinets': async (req: Request, res: Response) => {
    await wait();
    const datacenterId = String(req.query.datacenterId || '');
    res.json({
      success: true,
      data: cabinetViews.filter((item) => !datacenterId || item.datacenterId === datacenterId),
    });
  },

  'GET /api/idc/environment/cabinet/:cabinetId': async (req: Request, res: Response) => {
    await wait();
    const cabinet = cabinetViews.find((item) => item.cabinetId === req.params.cabinetId);
    const positions = ['front', 'rear', 'top'] as const;
    const data = positions.map((position, index) => ({
      id: `sensor-${req.params.cabinetId}-${position}`,
      cabinetId: req.params.cabinetId,
      cabinetName: cabinet?.cabinetName || '未知机柜',
      position,
      temperature: cabinet?.avgTemperature === null ? null : Number(((cabinet?.avgTemperature || 24) + index * 0.8).toFixed(1)),
      humidity: cabinet?.avgHumidity === null ? null : Number(((cabinet?.avgHumidity || 45) - index * 1.2).toFixed(1)),
      lastUpdated: cabinet?.collectedAt || observedAt.toISOString(),
      quality: cabinet?.quality || 'invalid',
      source: cabinet?.source || '未知数据源',
    }));
    res.json({ success: true, data });
  },

  'GET /api/idc/environment/temperature-trend': async (req: Request, res: Response) => {
    await wait();
    const { hours, step } = resolveSeries(req);
    const points = Math.min(Math.floor(hours / step), 120);
    const data = Array.from({ length: points + 1 }, (_, index) => {
      const offset = points - index;
      const timestamp = new Date(observedAt.getTime() - offset * step * 3_600_000);
      const wave = Math.sin(index / 3) * 1.3;
      const incident = index === points - 3 ? 4.8 : 0;
      const average = Number((24 + wave + incident * 0.45).toFixed(1));
      return {
        timestamp: timestamp.toISOString(),
        avgTemperature: average,
        maxTemperature: Number((average + 1.6 + incident).toFixed(1)),
        minTemperature: Number((average - 1.4).toFixed(1)),
        avgHumidity: Number((47 + Math.cos(index / 4) * 5).toFixed(1)),
        maxHumidity: Number((54 + Math.cos(index / 4) * 6).toFixed(1)),
        power: Number((181 + Math.sin(index / 5) * 13 + incident * 1.8).toFixed(1)),
        baseline: 24,
        threshold: thresholds.temperatureCritical,
        quality: index === points - 2 ? 'delayed' : 'good',
        cabinetId: incident ? 'cab-bj-003' : undefined,
        sensorId: incident ? 'sensor-cab-bj-003-rear' : undefined,
      };
    });
    res.json({ success: true, data });
  },

  'GET /api/idc/environment/pue-trend': async (req: Request, res: Response) => {
    await wait();
    const { hours, step } = resolveSeries(req);
    const points = Math.min(Math.floor(hours / Math.max(step, 6)), 120);
    const datacenterId = String(req.query.datacenterId || 'dc-001');
    const names: Record<string, string> = { 'dc-001': '北京亦庄', 'dc-002': '上海嘉定', 'dc-003': '深圳坪山' };
    const data = Array.from({ length: points + 1 }, (_, index) => {
      const offsetHours = (points - index) * Math.max(step, 6);
      const timestamp = new Date(observedAt.getTime() - offsetHours * 3_600_000);
      const itPower = Number((172 + Math.sin(index / 4) * 12).toFixed(1));
      const pue = Number((1.42 + Math.cos(index / 5) * 0.08 + (index === points - 4 ? 0.18 : 0)).toFixed(2));
      return {
        datacenterId,
        datacenterName: names[datacenterId] || '未知数据中心',
        date: timestamp.toISOString(),
        pue,
        itPower,
        totalPower: Number((itPower * pue).toFixed(1)),
        coolingPower: Number((itPower * (pue - 1)).toFixed(1)),
        target: thresholds.pueTarget,
        threshold: thresholds.pueWarning,
        quality: index === points - 1 ? 'estimated' : 'good',
      };
    });
    res.json({ success: true, data });
  },

  'GET /api/idc/environment/energy-stats': async (_req: Request, res: Response) => {
    await wait();
    res.json({ success: true, data: { totalEnergy: 125680, totalCost: 87976, avgPue: 1.42, carbonEmission: 62840, comparedLastMonth: -3.2 } });
  },

  'GET /api/idc/environment/power': async (req: Request, res: Response) => {
    await wait();
    const cabinetId = String(req.query.cabinetId || '');
    const data = cabinetViews.filter((item) => !cabinetId || item.cabinetId === cabinetId).map((item, index) => ({
      id: `power-${item.cabinetId}`,
      cabinetId: item.cabinetId,
      cabinetName: item.cabinetName,
      datacenterId: item.datacenterId,
      datacenterName: item.datacenterName,
      timestamp: item.collectedAt,
      activePower: Number((4.2 + index * 0.35).toFixed(2)),
      apparentPower: Number((4.8 + index * 0.38).toFixed(2)),
      powerFactor: 0.92,
      energy: 1660 + index * 42,
      current: 12.4 + index,
      voltage: 220.5,
    }));
    res.json({ success: true, data });
  },

  'GET /api/idc/environment/overview': async (req: Request, res: Response) => {
    await wait();
    const datacenterId = String(req.query.datacenterId || '');
    const scope = cabinetViews.filter((item) => !datacenterId || item.datacenterId === datacenterId);
    const valid = scope.filter((item) => item.avgTemperature !== null);
    const average = (values: number[]) => values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : null;
    const hottest = valid.toSorted((a, b) => (b.maxTemperature || 0) - (a.maxTemperature || 0))[0];
    res.json({
      success: true,
      data: {
        totalCabinets: scope.length,
        normalCabinets: scope.filter((item) => item.status === 'normal').length,
        warningCabinets: scope.filter((item) => item.status === 'warning').length,
        criticalCabinets: scope.filter((item) => item.status === 'critical').length,
        unavailableCabinets: scope.filter((item) => item.status === 'unavailable').length,
        avgTemperature: average(valid.map((item) => item.avgTemperature as number)),
        avgHumidity: average(valid.map((item) => item.avgHumidity as number)),
        maxTemperature: hottest?.maxTemperature ?? null,
        maxTemperatureCabinet: hottest?.cabinetName || '—',
        minTemperature: valid.length ? Math.min(...valid.map((item) => item.minTemperature as number)) : null,
        totalPower: valid.length ? Number((valid.length * 31.1).toFixed(1)) : null,
        avgPue: valid.length ? 1.42 : null,
        collectedAt: observedAt.toISOString(),
        source: thresholds.source,
        quality: scope.some((item) => item.quality !== 'good') ? 'estimated' : 'good',
        thresholds,
      },
    });
  },
};
