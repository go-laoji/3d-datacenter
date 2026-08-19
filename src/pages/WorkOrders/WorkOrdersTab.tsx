import { Button, Progress, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { Eye, Plus } from 'lucide-react';
import { EntityLink, EntityStatus } from '@/components/operations';
import type { WorkOrder } from '@/services/platform';
import { getSlaState } from './workOrderModel';

interface WorkOrdersTabProps {
  items: WorkOrder[];
  selectedId?: string;
  onCreate: () => void;
  onSelect: (item: WorkOrder) => void;
}

export function WorkOrdersTab({
  items,
  selectedId,
  onCreate,
  onSelect,
}: WorkOrdersTabProps) {
  return (
    <>
      <Button
        type="primary"
        icon={<Plus size={15} />}
        onClick={onCreate}
        style={{ marginBottom: 16 }}
      >
        新建工单
      </Button>
      <Table
        rowKey="id"
        dataSource={items}
        pagination={false}
        rowClassName={(item) =>
          item.id === selectedId ? 'ant-table-row-selected' : ''
        }
        columns={[
          {
            title: '工单',
            render: (_, item) => (
              <Space direction="vertical" size={0}>
                <EntityLink type="workOrder" id={item.id}>
                  {item.title}
                </EntityLink>
                <Typography.Text type="secondary">{item.id}</Typography.Text>
              </Space>
            ),
          },
          {
            title: '优先级',
            width: 90,
            render: (_, item) => (
              <Tag
                color={
                  item.priority === 'P1'
                    ? 'error'
                    : item.priority === 'P2'
                      ? 'warning'
                      : 'default'
                }
              >
                {item.priority}
              </Tag>
            ),
          },
          {
            title: '状态',
            width: 100,
            render: (_, item) => <EntityStatus status={item.status} />,
          },
          { title: '负责人', dataIndex: 'assignee', width: 100 },
          {
            title: 'SLA',
            width: 170,
            render: (_, item) => {
              const state = getSlaState(item);
              const percent =
                state === 'met'
                  ? 100
                  : state === 'breached'
                    ? 100
                    : state === 'risk'
                      ? 85
                      : 45;
              return (
                <Space direction="vertical" size={0}>
                  <Progress
                    percent={percent}
                    showInfo={false}
                    status={
                      state === 'breached'
                        ? 'exception'
                        : state === 'met'
                          ? 'success'
                          : 'active'
                    }
                    size="small"
                  />
                  <small>
                    {state === 'breached'
                      ? '已超时'
                      : state === 'met'
                        ? '已达成'
                        : dayjs(item.slaDueAt).format('MM-DD HH:mm')}
                  </small>
                </Space>
              );
            },
          },
          {
            title: '操作',
            width: 90,
            render: (_, item) => (
              <Button
                type="link"
                icon={<Eye size={14} />}
                onClick={() => onSelect(item)}
              >
                详情
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
