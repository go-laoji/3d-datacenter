import { history } from '@umijs/max';
import type { TableColumnsType } from 'antd';
import { Badge, Button, Space, Table, Tag } from 'antd';
import { ArrowRight, Bell } from 'lucide-react';
import { alertLevelConfig } from '@/pages/AlertCenter/alertPresentation';
import type { Loadable } from '../useDashboardData';
import { DashboardModuleCard } from './DashboardModuleCard';

interface RecentAlertsCardProps {
  stats: Loadable<IDC.DashboardStats>;
  acknowledgingId: string | null;
  onAcknowledge: (alertId: string) => Promise<void>;
  onRetry: () => void;
}

export function RecentAlertsCard({
  stats,
  acknowledgingId,
  onAcknowledge,
  onRetry,
}: RecentAlertsCardProps) {
  const alerts = stats.data?.recentAlerts || [];
  const pendingCount = alerts.filter((alert) => !alert.acknowledged).length;
  const columns: TableColumnsType<IDC.Alert> = [
    {
      title: '级别',
      dataIndex: 'level',
      width: 76,
      render: (level: IDC.Alert['level']) => (
        <Tag color={alertLevelConfig[level].color}>
          {alertLevelConfig[level].text}
        </Tag>
      ),
    },
    {
      title: '对象',
      dataIndex: 'deviceName',
      width: 150,
      render: (name: string | undefined, alert) =>
        alert.deviceId ? (
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() =>
              history.push(`/idc/device?deviceId=${alert.deviceId}`)
            }
          >
            {name || alert.deviceId}
          </Button>
        ) : (
          name || '-'
        ),
    },
    { title: '告警内容', dataIndex: 'message', ellipsis: true },
    {
      title: '操作',
      width: 80,
      render: (_, alert) =>
        alert.acknowledged ? (
          <Tag color="success">已确认</Tag>
        ) : (
          <Button
            type="link"
            size="small"
            loading={acknowledgingId === alert.id}
            onClick={() => void onAcknowledge(alert.id)}
          >
            确认
          </Button>
        ),
    },
  ];

  return (
    <DashboardModuleCard
      title={
        <Space>
          <Bell size={16} />
          今日待处置
          {pendingCount > 0 && <Badge count={pendingCount} />}
        </Space>
      }
      extra={
        <Button type="link" onClick={() => history.push('/monitor/alert')}>
          查看全部 <ArrowRight size={14} />
        </Button>
      }
      loading={stats.loading}
      error={stats.error}
      hasData={alerts.length > 0}
      onRetry={onRetry}
    >
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={alerts}
        columns={columns}
        scroll={{ x: 560 }}
      />
    </DashboardModuleCard>
  );
}
