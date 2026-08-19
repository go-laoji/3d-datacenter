import { Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import type { LoadBalanceStatus, RedundancyStatus } from '@/services/idc/power';
import styles from '../index.less';

interface Props {
  nodes: number;
  links: number;
  redundancy: RedundancyStatus | null;
  load: LoadBalanceStatus | null;
}

export const PowerMetricStrip = ({ nodes, links, redundancy, load }: Props) => (
  <Card size="small" className={styles.metricStrip}>
    <Row gutter={[0, 12]}>
      <Col xs={12} lg={6}>
        <div className={styles.metricItem}>
          <Typography.Text type="secondary">电源对象 / 链路</Typography.Text>
          <strong>
            {nodes} / {links}
          </strong>
          <span>统一电源对象模型</span>
        </div>
      </Col>
      <Col xs={12} lg={6}>
        <div className={styles.metricItem}>
          <Typography.Text type="secondary">设备冗余率</Typography.Text>
          <strong>{redundancy?.summary.redundancyRate || '—'}</strong>
          <span>{redundancy?.summary.singlePowerCount || 0} 台单路风险</span>
        </div>
      </Col>
      <Col xs={12} lg={6}>
        <div className={styles.metricItem}>
          <Typography.Text type="secondary">A / B 路负载</Typography.Text>
          <strong>
            {load ? `${load.pathA.load} / ${load.pathB.load} W` : '—'}
          </strong>
          <Progress
            size="small"
            showInfo={false}
            percent={load ? Number.parseFloat(load.pathA.percentage) : 0}
          />
        </div>
      </Col>
      <Col xs={12} lg={6}>
        <div className={styles.metricItem}>
          <Typography.Text type="secondary">负载平衡</Typography.Text>
          <strong>{load?.balanceRate || '—'}</strong>
          <Space>
            <Tag color={load?.status === 'balanced' ? 'success' : 'warning'}>
              {load?.status === 'balanced' ? '均衡' : '需关注'}
            </Tag>
            <span>
              {load?.collectedAt
                ? new Date(load.collectedAt).toLocaleTimeString('zh-CN')
                : '—'}
            </span>
          </Space>
        </div>
      </Col>
    </Row>
  </Card>
);
