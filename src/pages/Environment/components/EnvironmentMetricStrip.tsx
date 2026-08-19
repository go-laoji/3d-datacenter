import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import type { EnvironmentOverview } from '@/services/idc/environment';
import {
  formatObservedAt,
  getEnvironmentMetricCards,
  qualityPresentation,
} from '../environmentPresentation';
import styles from '../index.less';

interface Props {
  overview: EnvironmentOverview | null;
  activeMetric: string;
  onMetricChange: (metric: string) => void;
}

export const EnvironmentMetricStrip = ({
  overview,
  activeMetric,
  onMetricChange,
}: Props) => (
  <Card className={styles.metricStrip} size="small">
    <Row gutter={[0, 12]}>
      {getEnvironmentMetricCards(overview).map((metric) => (
        <Col xs={12} lg={6} key={metric.key}>
          <button
            type="button"
            className={`${styles.metricButton} ${activeMetric === metric.key ? styles.activeMetric : ''}`}
            onClick={() => onMetricChange(metric.key)}
          >
            <Typography.Text type="secondary">{metric.label}</Typography.Text>
            <strong className={styles.metricValue}>{metric.value}</strong>
            <span className={metric.tone === 'danger' ? styles.dangerText : ''}>
              {metric.detail}
            </span>
          </button>
        </Col>
      ))}
    </Row>
    {overview && (
      <Space wrap className={styles.sourceLine}>
        <Tag color={qualityPresentation[overview.quality].color}>
          数据{qualityPresentation[overview.quality].label}
        </Tag>
        <Typography.Text type="secondary">
          {overview.source} · {formatObservedAt(overview.collectedAt)}
          （Asia/Shanghai）
        </Typography.Text>
      </Space>
    )}
  </Card>
);
