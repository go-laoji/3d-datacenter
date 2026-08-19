import { Card, Col, Row, Typography } from 'antd';
import styles from '../index.less';

interface Props {
  stats: IDC.AlertStats | null;
  onFilter: (status?: IDC.AlertDetail['workflowStatus']) => void;
}

export const AlertMetricStrip = ({ stats, onFilter }: Props) => {
  const items = [
    {
      label: '活动告警',
      value:
        (stats?.critical || 0) +
        (stats?.error || 0) +
        (stats?.warning || 0) +
        (stats?.info || 0),
      status: undefined,
    },
    { label: 'SLA 已超时', value: stats?.slaBreached, status: 'new' as const },
    { label: '待指派', value: stats?.unassigned, status: 'new' as const },
    { label: '已升级', value: stats?.escalated, status: 'processing' as const },
  ];
  return (
    <Card size="small" className={styles.metricStrip}>
      <Row>
        {items.map((item) => (
          <Col xs={12} lg={6} key={item.label}>
            <button
              type="button"
              className={styles.metricButton}
              onClick={() => onFilter(item.status)}
            >
              <Typography.Text type="secondary">{item.label}</Typography.Text>
              <strong>{item.value ?? '—'}</strong>
            </button>
          </Col>
        ))}
      </Row>
    </Card>
  );
};
