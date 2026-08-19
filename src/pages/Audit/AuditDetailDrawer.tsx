import { Descriptions, Drawer, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { EntityLink, EntityStatus } from '@/components/operations';
import type { AuditRecord } from '@/services/platform';
import { buildAuditDiff } from './auditModel';

interface AuditDetailDrawerProps {
  record?: AuditRecord;
  onClose: () => void;
}

export function AuditDetailDrawer({ record, onClose }: AuditDetailDrawerProps) {
  return (
    <Drawer
      title="操作审计详情"
      open={Boolean(record)}
      onClose={onClose}
      width={680}
    >
      {record && (
        <>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="时间">
              {dayjs(record.occurredAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="操作人">
              <EntityLink type="user" id={record.operatorId}>
                {record.operator}
              </EntityLink>
            </Descriptions.Item>
            <Descriptions.Item label="操作对象">
              <EntityLink type={record.objectType} id={record.objectId}>
                {record.objectName}
              </EntityLink>
            </Descriptions.Item>
            <Descriptions.Item label="动作 / 结果">
              {record.actionLabel} <EntityStatus status={record.result} />
            </Descriptions.Item>
            <Descriptions.Item label="摘要">{record.summary}</Descriptions.Item>
            <Descriptions.Item label="来源 IP">
              {record.ipAddress}
            </Descriptions.Item>
            <Descriptions.Item label="Trace ID">
              <Typography.Text copyable code>
                {record.traceId}
              </Typography.Text>
            </Descriptions.Item>
            {record.errorMessage && (
              <Descriptions.Item label="失败原因">
                <Tag color="error">{record.errorMessage}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
          <Typography.Title level={5} style={{ marginTop: 24 }}>
            字段变更
          </Typography.Title>
          <Table
            rowKey="field"
            size="small"
            pagination={false}
            dataSource={buildAuditDiff(record)}
            columns={[
              { title: '字段', dataIndex: 'field', width: 150 },
              {
                title: '变更前',
                dataIndex: 'before',
                render: (value, row) => (
                  <Typography.Text delete={row.changed}>
                    {value}
                  </Typography.Text>
                ),
              },
              {
                title: '变更后',
                dataIndex: 'after',
                render: (value, row) => (
                  <Typography.Text strong={row.changed}>
                    {value}
                  </Typography.Text>
                ),
              },
            ]}
          />
        </>
      )}
    </Drawer>
  );
}
