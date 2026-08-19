import { Alert, Button, List, Space, Tag, Typography } from 'antd';
import type { BatchResultItem } from './operationsModel';
import { summarizeBatchResults } from './operationsModel';

interface BatchResultPanelProps {
  items: BatchResultItem[];
  onRetryFailed?: (items: BatchResultItem[]) => void;
}

export function BatchResultPanel({
  items,
  onRetryFailed,
}: BatchResultPanelProps) {
  const summary = summarizeBatchResults(items);
  const failedItems = items.filter((item) => !item.success);
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type={summary.failed ? 'warning' : 'success'}
        showIcon
        message={`共 ${summary.total} 项，成功 ${summary.succeeded} 项，失败 ${summary.failed} 项`}
        action={
          failedItems.length && onRetryFailed ? (
            <Button size="small" onClick={() => onRetryFailed(failedItems)}>
              仅重试失败项
            </Button>
          ) : undefined
        }
      />
      <List
        size="small"
        dataSource={items}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space>
                  <Tag color={item.success ? 'success' : 'error'}>
                    {item.success ? '成功' : '失败'}
                  </Tag>
                  <Typography.Text>{item.name}</Typography.Text>
                </Space>
              }
              description={
                !item.success ? item.reason || '未知错误' : undefined
              }
            />
          </List.Item>
        )}
      />
    </Space>
  );
}
