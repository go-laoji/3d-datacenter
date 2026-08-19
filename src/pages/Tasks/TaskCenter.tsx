import { Button, Progress, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { Download, RotateCcw } from 'lucide-react';
import {
  DangerAction,
  EntityLink,
  EntityStatus,
} from '@/components/operations';
import type { PlatformTask } from '@/services/platform';
import { getTaskActions } from './taskModel';

interface TaskCenterProps {
  tasks: PlatformTask[];
  selectedId?: string;
  onAction: (task: PlatformTask, action: 'retry' | 'cancel') => Promise<void>;
}

export function TaskCenter({ tasks, selectedId, onAction }: TaskCenterProps) {
  return (
    <Table
      rowKey="id"
      dataSource={tasks}
      pagination={false}
      rowClassName={(task) =>
        task.id === selectedId ? 'ant-table-row-selected' : ''
      }
      columns={[
        {
          title: '任务',
          render: (_, task) => (
            <Space direction="vertical" size={0}>
              <EntityLink type="task" id={task.id}>
                {task.name}
              </EntityLink>
              <Typography.Text type="secondary">
                {task.id} · {dayjs(task.createdAt).format('MM-DD HH:mm')}
              </Typography.Text>
            </Space>
          ),
        },
        {
          title: '状态',
          width: 100,
          render: (_, task) => <EntityStatus status={task.status} />,
        },
        {
          title: '进度',
          width: 180,
          render: (_, task) => (
            <Progress
              percent={task.progress}
              size="small"
              status={
                task.status === 'failed'
                  ? 'exception'
                  : task.status === 'completed'
                    ? 'success'
                    : 'active'
              }
            />
          ),
        },
        {
          title: '结果',
          width: 150,
          render: (_, task) => (
            <Space>
              <Tag color="success">成功 {task.succeeded}</Tag>
              {task.failed > 0 && <Tag color="error">失败 {task.failed}</Tag>}
            </Space>
          ),
        },
        { title: '创建人', dataIndex: 'createdBy', width: 100 },
        {
          title: '操作',
          width: 220,
          render: (_, task) => {
            const actions = getTaskActions(task);
            return (
              <Space>
                {actions.canRetry && (
                  <Button
                    type="link"
                    icon={<RotateCcw size={14} />}
                    onClick={() => void onAction(task, 'retry')}
                  >
                    重试失败项
                  </Button>
                )}
                {actions.canCancel && (
                  <DangerAction
                    title="取消后台任务"
                    impact="已成功处理的数据不会回滚，任务会停止处理剩余对象。"
                    onConfirm={() => onAction(task, 'cancel')}
                    buttonProps={{ type: 'link', size: 'small' }}
                  >
                    取消
                  </DangerAction>
                )}
                {actions.hasErrorFile && (
                  <Button
                    type="link"
                    icon={<Download size={14} />}
                    onClick={() => {
                      const blob = new Blob(['row,error\n5,invalid cabinet'], {
                        type: 'text/csv',
                      });
                      const url = URL.createObjectURL(blob);
                      const anchor = document.createElement('a');
                      anchor.href = url;
                      anchor.download = task.errorFile ?? 'errors.csv';
                      anchor.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    错误结果
                  </Button>
                )}
              </Space>
            );
          },
        },
      ]}
    />
  );
}
