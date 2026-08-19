import { Alert, Button, Card, Empty, Space } from 'antd';
import type { ReactNode } from 'react';

interface DashboardModuleCardProps {
  title: ReactNode;
  extra?: ReactNode;
  loading: boolean;
  error: string | null;
  hasData: boolean;
  onRetry: () => void;
  children: ReactNode;
}

export function DashboardModuleCard({
  title,
  extra,
  loading,
  error,
  hasData,
  onRetry,
  children,
}: DashboardModuleCardProps) {
  return (
    <Card title={title} extra={extra} loading={loading && !hasData}>
      {error && (
        <Alert
          type="warning"
          showIcon
          message={error}
          action={
            <Button size="small" onClick={onRetry}>
              重试
            </Button>
          }
          style={{ marginBottom: hasData ? 12 : 0 }}
        />
      )}
      {hasData
        ? children
        : error
          ? null
          : !loading && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无可展示数据"
              />
            )}
      {loading && hasData && (
        <Space size={4} style={{ marginTop: 8 }}>
          <span aria-hidden="true">···</span>
          <span>正在刷新，当前数据仍可查看</span>
        </Space>
      )}
    </Card>
  );
}
