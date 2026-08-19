import type {
  CabinetEnvironmentView,
  EnvironmentDataQuality,
  EnvironmentOverview,
} from '@/services/idc/environment';

export const qualityPresentation: Record<
  EnvironmentDataQuality,
  { label: string; color: string }
> = {
  good: { label: '正常', color: 'success' },
  delayed: { label: '延迟', color: 'warning' },
  interrupted: { label: '中断', color: 'error' },
  estimated: { label: '估算', color: 'processing' },
  invalid: { label: '无效', color: 'magenta' },
};

export const statusPresentation = {
  normal: { label: '正常', color: 'success', weight: 0 },
  warning: { label: '警告', color: 'warning', weight: 2 },
  critical: { label: '严重', color: 'error', weight: 3 },
  unavailable: { label: '不可用', color: 'default', weight: 4 },
} as const;

export const formatMetric = (
  value: number | null | undefined,
  unit = '',
  precision = 1,
) =>
  value === null || value === undefined
    ? '—'
    : `${value.toFixed(precision)}${unit}`;

export const sortCabinetsByRisk = (items: CabinetEnvironmentView[]) =>
  [...items].sort((a, b) => {
    const statusDelta =
      statusPresentation[b.status].weight - statusPresentation[a.status].weight;
    if (statusDelta) return statusDelta;
    return (b.maxTemperature ?? -1) - (a.maxTemperature ?? -1);
  });

export const getEnvironmentMetricCards = (
  overview: EnvironmentOverview | null,
) => [
  {
    key: 'temperature',
    label: '平均温度',
    value: formatMetric(overview?.avgTemperature, '℃'),
    detail: `峰值 ${formatMetric(overview?.maxTemperature, '℃')} · ${overview?.maxTemperatureCabinet || '—'}`,
    tone:
      (overview?.maxTemperature ?? 0) >=
      (overview?.thresholds.temperatureCritical ?? Number.POSITIVE_INFINITY)
        ? 'danger'
        : 'normal',
  },
  {
    key: 'humidity',
    label: '平均湿度',
    value: formatMetric(overview?.avgHumidity, '%'),
    detail: `${overview?.warningCabinets ?? 0} 警告 · ${overview?.criticalCabinets ?? 0} 严重`,
    tone: (overview?.warningCabinets ?? 0) > 0 ? 'warning' : 'normal',
  },
  {
    key: 'power',
    label: 'IT 总功率',
    value: formatMetric(overview?.totalPower, ' kW'),
    detail: `${overview?.totalCabinets ?? 0} 个机柜 · ${overview?.unavailableCabinets ?? 0} 无数据`,
    tone: (overview?.unavailableCabinets ?? 0) > 0 ? 'warning' : 'normal',
  },
  {
    key: 'pue',
    label: '平均 PUE',
    value: formatMetric(overview?.avgPue, '', 2),
    detail: `目标 ≤ ${overview?.thresholds.pueTarget.toFixed(2) ?? '—'}`,
    tone:
      (overview?.avgPue ?? 0) >
      (overview?.thresholds.pueWarning ?? Number.POSITIVE_INFINITY)
        ? 'danger'
        : 'normal',
  },
];

export const formatObservedAt = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(value))
    : '—';
