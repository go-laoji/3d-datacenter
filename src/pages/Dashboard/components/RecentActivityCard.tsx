import { List, Space, Tag, Typography } from 'antd';
import { History } from 'lucide-react';
import type { RecentOperation } from '@/services/idc/dashboard';
import type { Loadable } from '../useDashboardData';
import { DashboardModuleCard } from './DashboardModuleCard';

interface RecentActivityCardProps {
  operations: Loadable<RecentOperation[]>;
  onRetry: () => void;
}

const operationLabels: Record<string, string> = {
  device_mount: '设备上架',
  port_config: '端口配置',
  connection_create: '创建连线',
  device_update: '更新设备',
  cabinet_create: '新增机柜',
};

export function RecentActivityCard({
  operations,
  onRetry,
}: RecentActivityCardProps) {
  const items = operations.data || [];
  return (
    <DashboardModuleCard
      title={
        <Space>
          <History size={16} />
          最近动态
          <Tag>Mock</Tag>
        </Space>
      }
      loading={operations.loading}
      error={operations.error}
      hasData={items.length > 0}
      onRetry={onRetry}
    >
      <List
        dataSource={items}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space size={6}>
                  <Tag color="blue">
                    {operationLabels[item.type] || item.type}
                  </Tag>
                  <span>{item.target}</span>
                </Space>
              }
              description={item.description}
            />
            <Space direction="vertical" size={0} align="end">
              <Typography.Text type="secondary">
                {item.operator}
              </Typography.Text>
              <Typography.Text type="secondary">
                {new Date(item.createdAt).toLocaleString('zh-CN')}
              </Typography.Text>
            </Space>
          </List.Item>
        )}
      />
    </DashboardModuleCard>
  );
}
