import type { ReportSnapshot } from '@/services/platform';

export type ReportSection = 'assets' | 'capacity' | 'energy' | 'sla';

export function normalizeReportSection(value?: string | null): ReportSection {
  return ['assets', 'capacity', 'energy', 'sla'].includes(value ?? '')
    ? (value as ReportSection)
    : 'assets';
}

export function serializeReportSection(
  snapshot: ReportSnapshot,
  section: ReportSection,
) {
  if (section === 'assets') {
    return [
      '数据中心,设备数,在线率,质保即将到期,责任人缺失',
      ...snapshot.assets.map((row) =>
        [
          row.datacenterName,
          row.devices,
          row.onlineRate,
          row.expiringWarranty,
          row.unknownOwner,
        ].join(','),
      ),
    ].join('\n');
  }
  if (section === 'capacity') {
    return [
      '数据中心,U位使用率,功率使用率,制冷使用率,网络端口使用率',
      ...snapshot.capacity.map((row) =>
        [
          row.datacenterName,
          row.uUsage,
          row.powerUsage,
          row.coolingUsage,
          row.networkUsage,
        ].join(','),
      ),
    ].join('\n');
  }
  if (section === 'sla') {
    return [
      '优先级,告警数,按时确认,按时解决,平均确认分钟,平均解决分钟',
      ...snapshot.sla.map((row) => Object.values(row).join(',')),
    ].join('\n');
  }
  return [
    '月份,指标,值',
    ...snapshot.energyTrend.map((row) =>
      [row.month, row.series, row.value].join(','),
    ),
  ].join('\n');
}
