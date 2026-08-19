import { history } from '@umijs/max';
import { Badge, Button, List, Progress, Space, Typography } from 'antd';
import { Warehouse } from 'lucide-react';
import type { CabinetUsageRankItem } from '@/services/idc/dashboard';
import type { Loadable } from '../useDashboardData';
import { DashboardModuleCard } from './DashboardModuleCard';

interface CapacityRiskCardProps {
  cabinetRank: Loadable<CabinetUsageRankItem[]>;
  onRetry: () => void;
}

export function CapacityRiskCard({
  cabinetRank,
  onRetry,
}: CapacityRiskCardProps) {
  const items = cabinetRank.data || [];
  return (
    <DashboardModuleCard
      title={
        <Space>
          <Warehouse size={16} />
          机柜容量风险
        </Space>
      }
      loading={cabinetRank.loading}
      error={cabinetRank.error}
      hasData={items.length > 0}
      onRetry={onRetry}
    >
      <List
        dataSource={items}
        renderItem={(item, index) => (
          <List.Item
            actions={[
              <Button
                key="view"
                type="link"
                onClick={() =>
                  history.push(`/idc/cabinet?cabinetId=${item.cabinetId}`)
                }
              >
                查看
              </Button>,
            ]}
          >
            <div style={{ width: '100%' }}>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <span>
                  <Badge count={index + 1} color={index < 3 ? 'red' : 'gray'} />
                  <span style={{ marginLeft: 8 }}>{item.cabinetName}</span>
                </span>
                <Typography.Text strong>
                  {(item.usage * 100).toFixed(1)}%
                </Typography.Text>
              </Space>
              <Progress
                percent={item.usage * 100}
                size="small"
                status={item.usage >= 0.9 ? 'exception' : 'normal'}
                strokeColor={item.usage >= 0.85 ? '#faad14' : '#52c41a'}
                showInfo={false}
              />
            </div>
          </List.Item>
        )}
      />
    </DashboardModuleCard>
  );
}
