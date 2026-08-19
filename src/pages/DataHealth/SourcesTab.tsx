import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { RefreshCw } from 'lucide-react';
import { DataFreshness, EntityLink } from '@/components/operations';
import type { DataSourceHealth } from '@/services/platform';

interface SourcesTabProps {
  sources: DataSourceHealth[];
  selectedId?: string;
  retryingId?: string;
  onRetry: (source: DataSourceHealth) => void;
}

export function SourcesTab({
  sources,
  selectedId,
  retryingId,
  onRetry,
}: SourcesTabProps) {
  return (
    <Row gutter={[16, 16]}>
      {sources.map((source) => (
        <Col xs={24} lg={12} key={source.id}>
          <Card
            title={
              <EntityLink type="source" id={source.id}>
                {source.name}
              </EntityLink>
            }
            className={
              source.id === selectedId
                ? 'ant-card-bordered ant-card-hoverable'
                : undefined
            }
            extra={<Tag>{source.type.toUpperCase()}</Tag>}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                {source.endpoint}
              </Typography.Text>
              <DataFreshness
                source={`${source.records} 条记录`}
                collectedAt={source.lastSyncedAt}
                quality={source.quality}
              />
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="采集延迟"
                    value={source.lagSeconds}
                    suffix="秒"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="7 天成功率"
                    value={source.successRate}
                    suffix="%"
                    precision={1}
                  />
                </Col>
              </Row>
              <Progress
                percent={source.successRate}
                showInfo={false}
                status={
                  source.quality === 'interrupted' ? 'exception' : 'active'
                }
              />
              <Button
                icon={<RefreshCw size={14} />}
                loading={retryingId === source.id}
                onClick={() => onRetry(source)}
                disabled={source.quality === 'good'}
              >
                立即重试同步
              </Button>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
