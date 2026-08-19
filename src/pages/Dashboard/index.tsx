import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { App, Button, Col, Row, Select, Space, Tag, Typography } from 'antd';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { acknowledgeDashboardAlert } from '@/services/idc/dashboard';
import { CapacityRiskCard } from './components/CapacityRiskCard';
import { DashboardKpiGrid } from './components/DashboardKpiGrid';
import { DeviceTrendCard } from './components/DeviceTrendCard';
import { RecentActivityCard } from './components/RecentActivityCard';
import { RecentAlertsCard } from './components/RecentAlertsCard';
import styles from './index.less';
import { useDashboardData } from './useDashboardData';

const refreshOptions = [
  { value: 0, label: '暂停自动刷新' },
  { value: 30, label: '30 秒' },
  { value: 60, label: '1 分钟' },
  { value: 300, label: '5 分钟' },
];

const Dashboard: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const { message } = App.useApp();
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const {
    stats,
    trend,
    cabinetRank,
    operations,
    energy,
    lastUpdated,
    refreshSeconds,
    refreshing,
    loadStats,
    loadTrend,
    loadCabinetRank,
    loadOperations,
    refreshAll,
    setRefreshSeconds,
  } = useDashboardData();

  const isAdmin = initialState?.currentUser?.access === 'admin';

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      const response = await acknowledgeDashboardAlert(alertId);
      if (!response.success) {
        throw new Error(response.errorMessage || '告警确认失败');
      }
      message.success('告警已确认');
      await loadStats();
    } catch (_error) {
      message.error('告警确认失败，请稍后重试');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const attentionRow = (
    <Row gutter={[16, 16]} className={styles.moduleRow}>
      <Col xs={24} xl={16}>
        <RecentAlertsCard
          stats={stats}
          acknowledgingId={acknowledgingId}
          onAcknowledge={handleAcknowledge}
          onRetry={loadStats}
        />
      </Col>
      <Col xs={24} xl={8}>
        <CapacityRiskCard cabinetRank={cabinetRank} onRetry={loadCabinetRank} />
      </Col>
    </Row>
  );

  const analysisRow = (
    <Row gutter={[16, 16]} className={styles.moduleRow}>
      <Col xs={24} xl={16}>
        <DeviceTrendCard trend={trend} onRetry={loadTrend} />
      </Col>
      <Col xs={24} xl={8}>
        <RecentActivityCard operations={operations} onRetry={loadOperations} />
      </Col>
    </Row>
  );

  return (
    <PageContainer
      header={{
        title: '运维工作台',
        subTitle: isAdmin
          ? '管理员视图：关注全局风险与操作动态'
          : '值班视图：优先处理告警与容量风险',
      }}
      extra={[
        <Space key="freshness" wrap>
          <Tag color={refreshSeconds ? 'success' : 'default'}>
            {refreshSeconds ? 'Mock 自动刷新' : '自动刷新已暂停'}
          </Tag>
          <Typography.Text type="secondary">
            {lastUpdated
              ? `更新于 ${lastUpdated.toLocaleTimeString('zh-CN')}`
              : '等待首次加载'}
          </Typography.Text>
          <Select
            aria-label="选择工作台刷新频率"
            value={refreshSeconds}
            options={refreshOptions}
            onChange={setRefreshSeconds}
            style={{ width: 150 }}
          />
          <Button
            icon={<RefreshCw size={15} />}
            loading={refreshing}
            onClick={() => void refreshAll()}
          >
            立即刷新
          </Button>
        </Space>,
      ]}
    >
      <DashboardKpiGrid
        stats={stats}
        energy={energy}
        cabinetRank={cabinetRank}
      />
      {isAdmin ? analysisRow : attentionRow}
      {isAdmin ? attentionRow : analysisRow}
    </PageContainer>
  );
};

export default Dashboard;
