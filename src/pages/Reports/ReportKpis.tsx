import { Card, Col, Row, Statistic } from 'antd';
import { MetricValue } from '@/components/operations';
import type { ReportKpi } from '@/services/platform';

export function ReportKpis({ kpis }: { kpis: ReportKpi[] }) {
  return (
    <Row gutter={[16, 16]}>
      {kpis.map((kpi) => (
        <Col xs={12} xl={6} key={kpi.key}>
          <Card size="small">
            <Statistic
              title={kpi.label}
              valueRender={() => (
                <MetricValue
                  value={kpi.value}
                  unit={kpi.unit}
                  trend={kpi.trend}
                  status={kpi.status}
                />
              )}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
