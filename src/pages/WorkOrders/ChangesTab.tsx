import {
  Card,
  Collapse,
  Descriptions,
  Progress,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import {
  DangerAction,
  EntityLink,
  EntityStatus,
} from '@/components/operations';
import type { ChangePlan } from '@/services/platform';
import { getChangeNextAction } from './workOrderModel';

interface ChangesTabProps {
  changes: ChangePlan[];
  selectedId?: string;
  onTransition: (change: ChangePlan, action: string) => Promise<void>;
}

export function ChangesTab({
  changes,
  selectedId,
  onTransition,
}: ChangesTabProps) {
  return (
    <Collapse
      defaultActiveKey={selectedId ? [selectedId] : [changes[0]?.id]}
      items={changes.map((change) => {
        const next = getChangeNextAction(change);
        const completed = change.steps.filter(
          (step) => step.status === 'completed',
        ).length;
        return {
          key: change.id,
          label: (
            <Space>
              <EntityLink type="change" id={change.id}>
                {change.title}
              </EntityLink>
              <Tag
                color={
                  change.risk === 'high'
                    ? 'error'
                    : change.risk === 'medium'
                      ? 'warning'
                      : 'success'
                }
              >
                {change.risk === 'high'
                  ? '高风险'
                  : change.risk === 'medium'
                    ? '中风险'
                    : '低风险'}
              </Tag>
              <EntityStatus status={change.status} />
            </Space>
          ),
          children: (
            <Card
              bordered={false}
              extra={
                next && (
                  <DangerAction
                    title={next.label}
                    impact={`变更将影响 ${change.affectedObjects.length} 个生产对象；执行前请确认维护窗口、备份与回退步骤。`}
                    confirmPhrase={
                      next.action === 'execute' ? change.id : undefined
                    }
                    onConfirm={() => onTransition(change, next.action)}
                  >
                    {next.label}
                  </DangerAction>
                )
              }
            >
              <Descriptions size="small" column={{ xs: 1, md: 2 }}>
                <Descriptions.Item label="变更编号">
                  {change.id}
                </Descriptions.Item>
                <Descriptions.Item label="审批人">
                  {change.approver}
                </Descriptions.Item>
                <Descriptions.Item label="维护窗口">
                  {dayjs(change.windowStart).format('MM-DD HH:mm')} -{' '}
                  {dayjs(change.windowEnd).format('HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="执行进度">
                  <Progress
                    percent={Math.round(
                      (completed / change.steps.length) * 100,
                    )}
                    size="small"
                  />
                </Descriptions.Item>
                <Descriptions.Item label="影响对象" span={2}>
                  {change.affectedObjects.map((object) => (
                    <Tag key={object.id}>
                      <EntityLink type={object.type} id={object.id}>
                        {object.name}
                      </EntityLink>
                    </Tag>
                  ))}
                </Descriptions.Item>
              </Descriptions>
              <Typography.Title level={5}>实施与回退步骤</Typography.Title>
              <Timeline
                items={change.steps.map((step) => ({
                  color:
                    step.status === 'completed'
                      ? 'green'
                      : step.status === 'processing'
                        ? 'blue'
                        : 'gray',
                  children: (
                    <>
                      <strong>{step.name}</strong> · {step.owner}
                      <br />
                      <Typography.Text type="secondary">
                        {step.rollback
                          ? `回退：${step.rollback}`
                          : '无需独立回退步骤'}
                      </Typography.Text>
                    </>
                  ),
                }))}
              />
            </Card>
          ),
        };
      })}
    />
  );
}
