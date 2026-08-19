import {
  Button,
  Descriptions,
  Drawer,
  Space,
  Timeline,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { EntityLink, EntityStatus } from '@/components/operations';
import type { WorkOrder } from '@/services/platform';
import { getWorkOrderNextAction } from './workOrderModel';

interface WorkOrderDrawerProps {
  workOrder?: WorkOrder;
  onClose: () => void;
  onTransition: (action: string) => Promise<void>;
}

export function WorkOrderDrawer({
  workOrder,
  onClose,
  onTransition,
}: WorkOrderDrawerProps) {
  const nextAction = workOrder
    ? getWorkOrderNextAction(workOrder.status)
    : undefined;
  return (
    <Drawer
      title="工单详情与处置时间线"
      open={Boolean(workOrder)}
      onClose={onClose}
      width={600}
      extra={
        nextAction && (
          <Button
            type="primary"
            onClick={() => void onTransition(nextAction.action)}
          >
            {nextAction.label}
          </Button>
        )
      }
    >
      {workOrder && (
        <>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="工单">
              {workOrder.id} · {workOrder.title}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <EntityStatus status={workOrder.status} />
            </Descriptions.Item>
            <Descriptions.Item label="负责人">
              {workOrder.assignee}
            </Descriptions.Item>
            <Descriptions.Item label="SLA 截止">
              {dayjs(workOrder.slaDueAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            {workOrder.alertId && (
              <Descriptions.Item label="关联告警">
                <EntityLink type="alert" id={workOrder.alertId}>
                  {workOrder.alertId}
                </EntityLink>
              </Descriptions.Item>
            )}
            {workOrder.objectType && workOrder.objectId && (
              <Descriptions.Item label="影响对象">
                <EntityLink type={workOrder.objectType} id={workOrder.objectId}>
                  {workOrder.objectName}
                </EntityLink>
              </Descriptions.Item>
            )}
          </Descriptions>
          <Typography.Title level={5} style={{ marginTop: 24 }}>
            处置时间线
          </Typography.Title>
          <Timeline
            items={workOrder.timeline.map((item) => ({
              children: (
                <Space direction="vertical" size={0}>
                  <strong>
                    {item.action} · {item.actor}
                  </strong>
                  <span>{item.detail}</span>
                  <Typography.Text type="secondary">
                    {dayjs(item.at).format('MM-DD HH:mm:ss')}
                  </Typography.Text>
                </Space>
              ),
            }))}
          />
        </>
      )}
    </Drawer>
  );
}
