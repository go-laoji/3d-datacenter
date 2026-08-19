import { Card, Col, Row, Statistic, Tag, Typography } from 'antd';
import { AlertTriangle, Gauge, Zap } from 'lucide-react';
import type { PDUStats } from '../pduPresentation';

interface Props {
  stats: PDUStats;
}

const PDUMetricStrip: React.FC<Props> = ({ stats }) => (
  <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
    <Col xs={12} md={6} xl={4}>
      <Card size="small">
        <Statistic
          title="PDU"
          value={stats.total}
          suffix="台"
          prefix={<Zap size={16} />}
        />
      </Card>
    </Col>
    <Col xs={12} md={6} xl={4}>
      <Card size="small">
        <Statistic
          title="A / B 路"
          value={`${stats.pathA} / ${stats.pathB}`}
          prefix={<Tag color="blue">2N</Tag>}
        />
      </Card>
    </Col>
    <Col xs={12} md={6} xl={4}>
      <Card size="small">
        <Statistic
          title="平均负载"
          value={stats.averageLoad}
          suffix="%"
          prefix={<Gauge size={16} />}
        />
      </Card>
    </Col>
    <Col xs={12} md={6} xl={4}>
      <Card size="small">
        <Statistic
          title="高负载"
          value={stats.highLoad}
          suffix="台"
          valueStyle={{ color: stats.highLoad ? '#cf1322' : '#389e0d' }}
          prefix={<AlertTriangle size={16} />}
        />
      </Card>
    </Col>
    <Col xs={24} xl={8}>
      <Card size="small">
        <Statistic
          title="A/B 平均负载差"
          value={stats.imbalance}
          suffix="%"
          valueStyle={{ color: stats.imbalance > 15 ? '#cf1322' : '#389e0d' }}
        />
        <Typography.Text type="secondary">
          阈值 15%，超过后建议检查单路接入与相位分配
        </Typography.Text>
      </Card>
    </Col>
  </Row>
);

export default PDUMetricStrip;
