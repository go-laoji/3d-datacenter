import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Badge, Space, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { formatMetricValue, type OperationalTone } from './operationsModel';

interface MetricValueProps {
  value: number | string | null | undefined;
  unit?: string;
  trend?: number;
  status?: OperationalTone;
  emptyText?: string;
}

export function MetricValue({
  value,
  unit,
  trend,
  status,
  emptyText,
}: MetricValueProps) {
  const formatted = formatMetricValue(value, unit);
  const unavailable = formatted === '--';
  const trendIcon =
    trend && trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
  return (
    <Space size={6}>
      {status && <Badge status={status} />}
      <Typography.Text
        type={unavailable ? 'secondary' : undefined}
        strong={!unavailable}
      >
        {unavailable && emptyText ? emptyText : formatted}
      </Typography.Text>
      {trend !== undefined && trend !== 0 && (
        <Typography.Text type={trend > 0 ? 'danger' : 'success'}>
          {trendIcon} {Math.abs(trend)}%
        </Typography.Text>
      )}
    </Space>
  );
}

export type DataQuality =
  | 'good'
  | 'delayed'
  | 'interrupted'
  | 'estimated'
  | 'invalid';

const qualityConfig: Record<
  DataQuality,
  { status: OperationalTone; label: string }
> = {
  good: { status: 'success', label: '数据正常' },
  delayed: { status: 'warning', label: '数据延迟' },
  interrupted: { status: 'error', label: '采集中断' },
  estimated: { status: 'processing', label: '估算数据' },
  invalid: { status: 'default', label: '数据无效' },
};

interface DataFreshnessProps {
  source: string;
  collectedAt?: string;
  quality?: DataQuality;
  suffix?: ReactNode;
}

export function DataFreshness({
  source,
  collectedAt,
  quality = collectedAt ? 'good' : 'invalid',
  suffix,
}: DataFreshnessProps) {
  const config = qualityConfig[quality];
  const time = collectedAt ? dayjs(collectedAt) : null;
  const tooltip = time
    ? `${source} · 采集于 ${time.format('YYYY-MM-DD HH:mm:ss')}`
    : `${source} · 尚无有效采集时间`;

  return (
    <Tooltip title={tooltip}>
      <Space size={6} aria-label={`${source} ${config.label}`}>
        <Badge status={config.status} />
        <Typography.Text type="secondary">
          {source} · {time ? `${time.format('HH:mm:ss')} 更新` : '等待数据'}
          {suffix}
        </Typography.Text>
      </Space>
    </Tooltip>
  );
}
