import { Line } from '@ant-design/charts';
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import type {
  EnvironmentQuery,
  EnvironmentThresholds,
  PuePoint,
  TemperaturePoint,
} from '@/services/idc/environment';
import { formatMetric, qualityPresentation } from '../environmentPresentation';
import styles from '../index.less';

interface Props {
  metric: string;
  range: NonNullable<EnvironmentQuery['range']>;
  granularity: NonNullable<EnvironmentQuery['granularity']>;
  temperature: TemperaturePoint[];
  pue: PuePoint[];
  thresholds?: EnvironmentThresholds;
  onRangeChange: (value: NonNullable<EnvironmentQuery['range']>) => void;
  onGranularityChange: (
    value: NonNullable<EnvironmentQuery['granularity']>,
  ) => void;
  onOpenAnomaly: (cabinetId: string, time: string) => void;
}

const timeLabel = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));

export const EnvironmentTrendPanel = ({
  metric,
  range,
  granularity,
  temperature,
  pue,
  thresholds,
  onRangeChange,
  onGranularityChange,
  onOpenAnomaly,
}: Props) => {
  const isPue = metric === 'pue';
  const metricConfig = {
    temperature: {
      label: '温度',
      unit: '℃',
      average: 'avgTemperature',
      peak: 'maxTemperature',
      threshold: thresholds?.temperatureCritical,
    },
    humidity: {
      label: '湿度',
      unit: '%',
      average: 'avgHumidity',
      peak: 'maxHumidity',
      threshold: thresholds?.humidityHigh,
    },
    power: {
      label: 'IT 总功率',
      unit: ' kW',
      average: 'power',
      peak: 'power',
      threshold: undefined,
    },
  }[metric] || {
    label: '温度',
    unit: '℃',
    average: 'avgTemperature',
    peak: 'maxTemperature',
    threshold: thresholds?.temperatureCritical,
  };
  const temperatureData = temperature.flatMap((point) => {
    const averageValue = point[metricConfig.average as 'avgTemperature'];
    const peakValue = point[metricConfig.peak as 'maxTemperature'];
    return averageValue === null
      ? []
      : [
          {
            time: timeLabel(point.timestamp),
            value: averageValue,
            series: '平均值',
          },
          {
            time: timeLabel(point.timestamp),
            value: peakValue,
            series: '峰值',
          },
          ...(metric === 'temperature'
            ? [
                {
                  time: timeLabel(point.timestamp),
                  value: point.baseline,
                  series: '基线',
                },
              ]
            : []),
        ];
  });
  const chartData = isPue
    ? pue.flatMap((point) => [
        { time: timeLabel(point.date), value: point.pue, series: 'PUE' },
        { time: timeLabel(point.date), value: point.target, series: '目标' },
      ])
    : temperatureData;
  const anomaly = temperature.find((point) => point.cabinetId);
  const average = isPue
    ? pue.length
      ? pue.reduce((sum, item) => sum + item.pue, 0) / pue.length
      : null
    : temperature.filter(
          (item) => item[metricConfig.average as 'avgTemperature'] !== null,
        ).length
      ? temperature.reduce(
          (sum, item) =>
            sum + (item[metricConfig.average as 'avgTemperature'] ?? 0),
          0,
        ) /
        temperature.filter(
          (item) => item[metricConfig.average as 'avgTemperature'] !== null,
        ).length
      : null;
  const peak = isPue
    ? Math.max(...pue.map((item) => item.pue), Number.NEGATIVE_INFINITY)
    : Math.max(
        ...temperature.map(
          (item) =>
            item[metricConfig.peak as 'maxTemperature'] ??
            Number.NEGATIVE_INFINITY,
        ),
      );

  return (
    <Card
      id={`environment-${isPue ? 'pue' : 'temperature'}`}
      className={styles.trendCard}
      title={isPue ? 'PUE 趋势' : `${metricConfig.label}趋势`}
      extra={
        <Space wrap>
          <Segmented
            value={range}
            options={[
              { label: '24小时', value: '24h' },
              { label: '7天', value: '7d' },
              { label: '30天', value: '30d' },
            ]}
            onChange={(value) =>
              onRangeChange(value as NonNullable<EnvironmentQuery['range']>)
            }
          />
          <Segmented
            value={granularity}
            options={[
              { label: '1小时', value: '1h' },
              { label: '6小时', value: '6h' },
              { label: '1天', value: '1d' },
            ]}
            onChange={(value) =>
              onGranularityChange(
                value as NonNullable<EnvironmentQuery['granularity']>,
              )
            }
          />
        </Space>
      }
    >
      <Row gutter={16} className={styles.trendSummary}>
        <Col>
          <Typography.Text type="secondary">平均 </Typography.Text>
          <strong>
            {formatMetric(
              average,
              isPue ? '' : metricConfig.unit,
              isPue ? 2 : 1,
            )}
          </strong>
        </Col>
        <Col>
          <Typography.Text type="secondary">峰值 </Typography.Text>
          <strong>
            {Number.isFinite(peak)
              ? formatMetric(
                  peak,
                  isPue ? '' : metricConfig.unit,
                  isPue ? 2 : 1,
                )
              : '—'}
          </strong>
        </Col>
        <Col>
          <Typography.Text type="secondary">阈值 </Typography.Text>
          <strong>
            {isPue
              ? thresholds?.pueWarning.toFixed(2)
              : metricConfig.threshold === undefined
                ? '未配置'
                : formatMetric(metricConfig.threshold, metricConfig.unit)}
          </strong>
        </Col>
        <Col>
          <Tag>{isPue ? 'PUE' : metricConfig.label} · Asia/Shanghai</Tag>
        </Col>
      </Row>
      {chartData.length ? (
        <Line
          data={chartData}
          xField="time"
          yField="value"
          colorField="series"
          height={330}
          smooth
          axis={{
            y: {
              title: isPue
                ? 'PUE'
                : `${metricConfig.label}（${metricConfig.unit.trim()}）`,
            },
          }}
          scale={{ color: { range: ['#1677ff', '#ff4d4f', '#8c8c8c'] } }}
        />
      ) : (
        <Empty description="该时间范围暂无有效采样，不以 0 展示" />
      )}
      {metric === 'temperature' && anomaly && anomaly.cabinetId && (
        <div className={styles.anomalyCallout}>
          <Space wrap>
            <Tag color="error">峰值异常</Tag>
            <Typography.Text>
              {timeLabel(anomaly.timestamp)} ·{' '}
              {formatMetric(anomaly.maxTemperature, '℃')}
            </Typography.Text>
            <Tag color={qualityPresentation[anomaly.quality].color}>
              {qualityPresentation[anomaly.quality].label}
            </Tag>
            <Button
              size="small"
              onClick={() =>
                anomaly.cabinetId &&
                onOpenAnomaly(anomaly.cabinetId, anomaly.timestamp)
              }
            >
              定位机柜与传感器
            </Button>
          </Space>
        </div>
      )}
    </Card>
  );
};
