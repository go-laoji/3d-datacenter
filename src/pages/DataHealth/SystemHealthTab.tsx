import { Alert, List, Space, Tag, Typography } from 'antd';
import { EntityStatus } from '@/components/operations';
import type { SystemHealthItem } from '@/services/platform';

export function SystemHealthTab({ items }: { items: SystemHealthItem[] }) {
  return (
    <>
      <Alert
        type="info"
        showIcon
        message="本页展示的是前端 Mock 运行态；生产环境需由独立后端仓库接入服务探针、采集器和存储监控。"
        style={{ marginBottom: 16 }}
      />
      <List
        bordered
        dataSource={items}
        renderItem={(item) => (
          <List.Item
            extra={
              <Space>
                <Tag>{item.latencyMs ? `${item.latencyMs} ms` : 'N/A'}</Tag>
                <EntityStatus status={item.status} />
              </Space>
            }
          >
            <List.Item.Meta
              title={item.name}
              description={
                <Typography.Text type="secondary">
                  {item.detail}
                </Typography.Text>
              }
            />
          </List.Item>
        )}
      />
    </>
  );
}
