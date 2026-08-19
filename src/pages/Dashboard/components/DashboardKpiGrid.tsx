import { history } from '@umijs/max';
import { Col, Row, Skeleton, Tag } from 'antd';
import {
  AlertTriangle,
  Flame,
  Gauge,
  ServerOff,
  ShieldAlert,
  Warehouse,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { CabinetUsageRankItem } from '@/services/idc/dashboard';
import styles from '../index.less';
import type { EnergyOverview, Loadable } from '../useDashboardData';

interface DashboardKpiGridProps {
  stats: Loadable<IDC.DashboardStats>;
  energy: Loadable<EnergyOverview>;
  cabinetRank: Loadable<CabinetUsageRankItem[]>;
}

interface KpiItem {
  key: string;
  title: string;
  value: string | number;
  unit?: string;
  hint: string;
  tone: 'critical' | 'warning' | 'normal' | 'neutral';
  icon: ReactNode;
  target: string;
  loading: boolean;
  unavailable: boolean;
  hasData: boolean;
}

export function DashboardKpiGrid({
  stats,
  energy,
  cabinetRank,
}: DashboardKpiGridProps) {
  const unacknowledged = stats.data
    ? stats.data.recentAlerts.filter((alert) => !alert.acknowledged).length
    : null;
  const capacityRisks = cabinetRank.data
    ? cabinetRank.data.filter((cabinet) => cabinet.usage >= 0.85).length
    : null;
  const kpis: KpiItem[] = [
    {
      key: 'alerts',
      title: '待确认告警',
      value: unacknowledged ?? '--',
      unit: '条',
      hint: unacknowledged ? '需要值班人员确认' : '当前无待确认告警',
      tone:
        unacknowledged === null
          ? 'neutral'
          : unacknowledged
            ? 'critical'
            : 'normal',
      icon: <ShieldAlert size={20} />,
      target: '/monitor/alert?acknowledged=false',
      loading: stats.loading,
      unavailable: Boolean(stats.error && !stats.data),
      hasData: Boolean(stats.data),
    },
    {
      key: 'offline',
      title: '离线设备',
      value: stats.data?.offlineDevices ?? '--',
      unit: '台',
      hint: '点击查看离线资产',
      tone: !stats.data
        ? 'neutral'
        : stats.data.offlineDevices
          ? 'critical'
          : 'normal',
      icon: <ServerOff size={20} />,
      target: '/idc/device?status=offline',
      loading: stats.loading,
      unavailable: Boolean(stats.error && !stats.data),
      hasData: Boolean(stats.data),
    },
    {
      key: 'faults',
      title: '故障设备',
      value: stats.data?.errorDevices ?? '--',
      unit: '台',
      hint: '点击进入故障设备列表',
      tone: !stats.data
        ? 'neutral'
        : stats.data.errorDevices
          ? 'critical'
          : 'normal',
      icon: <AlertTriangle size={20} />,
      target: '/idc/device?status=error',
      loading: stats.loading,
      unavailable: Boolean(stats.error && !stats.data),
      hasData: Boolean(stats.data),
    },
    {
      key: 'capacity',
      title: '机柜容量风险',
      value: capacityRisks ?? '--',
      unit: '个',
      hint: '使用率达到 85% 的机柜',
      tone:
        capacityRisks === null
          ? 'neutral'
          : capacityRisks
            ? 'warning'
            : 'normal',
      icon: <Warehouse size={20} />,
      target: '/idc/cabinet?usageRisk=high',
      loading: cabinetRank.loading,
      unavailable: Boolean(cabinetRank.error && !cabinetRank.data),
      hasData: Boolean(cabinetRank.data),
    },
    {
      key: 'pue',
      title: '当前 PUE',
      value: energy.data?.avgPue.toFixed(2) || '--',
      hint: '建议基线 ≤ 1.50',
      tone: !energy.data
        ? 'neutral'
        : energy.data.avgPue > 1.8
          ? 'critical'
          : energy.data.avgPue > 1.5
            ? 'warning'
            : 'normal',
      icon: <Gauge size={20} />,
      target: '/monitor/environment?metric=pue',
      loading: energy.loading,
      unavailable: Boolean(energy.error && !energy.data),
      hasData: Boolean(energy.data),
    },
    {
      key: 'hotspot',
      title: '最高温度',
      value: energy.data?.maxTemperature.toFixed(1) || '--',
      unit: energy.data ? '°C' : undefined,
      hint: energy.data?.maxTemperatureCabinet || '暂无热点数据',
      tone: !energy.data
        ? 'neutral'
        : energy.data.maxTemperature > 28
          ? 'warning'
          : 'normal',
      icon: <Flame size={20} />,
      target: '/monitor/environment?metric=temperature',
      loading: energy.loading,
      unavailable: Boolean(energy.error && !energy.data),
      hasData: Boolean(energy.data),
    },
  ];

  return (
    <Row gutter={[12, 12]}>
      {kpis.map((kpi) => (
        <Col xs={12} md={8} xl={4} key={kpi.key}>
          <button
            type="button"
            className={`${styles.kpiCard} ${styles[kpi.tone]}`}
            onClick={() => history.push(kpi.target)}
            aria-label={`${kpi.title}：${kpi.value}${kpi.unit || ''}`}
          >
            <span className={styles.kpiHeader}>
              <span className={styles.kpiIcon}>{kpi.icon}</span>
              {kpi.unavailable && <Tag color="default">暂无数据</Tag>}
            </span>
            {kpi.loading && !kpi.hasData ? (
              <Skeleton.Input active size="small" />
            ) : (
              <strong className={styles.kpiValue}>
                {kpi.value}
                {kpi.unit && <small>{kpi.unit}</small>}
              </strong>
            )}
            <span className={styles.kpiTitle}>{kpi.title}</span>
            <span className={styles.kpiHint}>{kpi.hint}</span>
          </button>
        </Col>
      ))}
    </Row>
  );
}
