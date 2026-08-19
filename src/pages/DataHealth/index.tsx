import { PageContainer } from '@ant-design/pro-components';
import { App, Card, Col, Row, Skeleton, Statistic, Tabs } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { DataFreshness, EntityStatus } from '@/components/operations';
import {
  acknowledgeQualityIssue,
  type DataHealthWorkspace,
  getDataHealthWorkspace,
  retryDataSource,
} from '@/services/platform';
import { getOverallDataHealth, summarizeDataHealth } from './dataHealthModel';
import { QualityTab } from './QualityTab';
import { SourcesTab } from './SourcesTab';
import { SystemHealthTab } from './SystemHealthTab';

export default function DataHealthPage() {
  const { message } = App.useApp();
  const [workspace, setWorkspace] = useState<DataHealthWorkspace>();
  const [retryingId, setRetryingId] = useState<string>();
  const sourceId = useMemo(
    () => new URLSearchParams(location.search).get('sourceId') ?? undefined,
    [],
  );
  const refresh = async () => {
    const response = await getDataHealthWorkspace();
    setWorkspace(response.data);
  };
  useEffect(() => {
    void refresh();
  }, []);
  if (!workspace)
    return (
      <PageContainer title="数据与系统健康">
        <Card>
          <Skeleton active />
        </Card>
      </PageContainer>
    );
  const summary = summarizeDataHealth(workspace);

  return (
    <PageContainer
      title="数据与系统健康"
      subTitle="识别采集中断、数据延迟和拓扑可信度问题，并保留人工确认闭环"
      extra={
        <DataFreshness
          source="Mock 健康快照"
          collectedAt={new Date().toISOString()}
        />
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="总体状态"
              valueRender={() => (
                <EntityStatus
                  status={getOverallDataHealth(workspace)}
                  label={
                    getOverallDataHealth(workspace) === 'error'
                      ? '存在阻断'
                      : '可用'
                  }
                />
              )}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="健康采集源"
              value={summary.healthySources}
              suffix={`/ ${workspace.sources.length}`}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="降级采集源"
              value={summary.degradedSources}
              valueStyle={{
                color: summary.degradedSources ? '#fa8c16' : undefined,
              }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="待处理质量问题"
              value={summary.openIssues}
              valueStyle={{
                color: summary.criticalIssues ? '#cf1322' : undefined,
              }}
            />
          </Card>
        </Col>
      </Row>
      <Card>
        <Tabs
          defaultActiveKey={sourceId ? 'sources' : 'quality'}
          items={[
            {
              key: 'sources',
              label: '采集源与同步',
              children: (
                <SourcesTab
                  sources={workspace.sources}
                  selectedId={sourceId}
                  retryingId={retryingId}
                  onRetry={(source) => {
                    setRetryingId(source.id);
                    void retryDataSource(source.id)
                      .then(async () => {
                        message.success(`${source.name} 同步已恢复`);
                        await refresh();
                      })
                      .finally(() => setRetryingId(undefined));
                  }}
                />
              ),
            },
            {
              key: 'quality',
              label: `数据质量 ${summary.openIssues}`,
              children: (
                <QualityTab
                  issues={workspace.issues}
                  onAcknowledge={(issue) =>
                    void acknowledgeQualityIssue(issue.id).then(async () => {
                      message.success('质量问题已确认并进入跟进队列');
                      await refresh();
                    })
                  }
                />
              ),
            },
            {
              key: 'system',
              label: '系统运行态',
              children: <SystemHealthTab items={workspace.system} />,
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
}
