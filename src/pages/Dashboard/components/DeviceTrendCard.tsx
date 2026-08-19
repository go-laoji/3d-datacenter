import { Skeleton, Space } from 'antd';
import { Activity } from 'lucide-react';
import { lazy, Suspense, useMemo } from 'react';
import type { DashboardTrendPoint } from '@/services/idc/dashboard';
import type { Loadable } from '../useDashboardData';
import { DashboardModuleCard } from './DashboardModuleCard';

const Area = lazy(() =>
  import('@ant-design/charts').then((module) => ({ default: module.Area })),
);

interface DeviceTrendCardProps {
  trend: Loadable<DashboardTrendPoint[]>;
  onRetry: () => void;
}

export function DeviceTrendCard({ trend, onRetry }: DeviceTrendCardProps) {
  const chartData = useMemo(
    () =>
      (trend.data || []).flatMap((item) => [
        { date: item.date, value: item.online, type: '在线' },
        { date: item.date, value: item.warning, type: '告警' },
        { date: item.date, value: item.error, type: '故障' },
        { date: item.date, value: item.offline, type: '离线' },
      ]),
    [trend.data],
  );

  return (
    <DashboardModuleCard
      title={
        <Space>
          <Activity size={16} />
          设备状态趋势
        </Space>
      }
      loading={trend.loading}
      error={trend.error}
      hasData={chartData.length > 0}
      onRetry={onRetry}
    >
      <Suspense fallback={<Skeleton active paragraph={{ rows: 5 }} />}>
        <Area
          data={chartData}
          xField="date"
          yField="value"
          colorField="type"
          shapeField="smooth"
          scale={{
            color: {
              range: ['#52c41a', '#faad14', '#ff4d4f', '#8c8c8c'],
            },
          }}
          style={{ fillOpacity: 0.22 }}
          axis={{ x: { tickCount: 7 } }}
          legend={{ color: { position: 'top-right' } }}
          height={230}
        />
      </Suspense>
    </DashboardModuleCard>
  );
}
