import { Button, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { EntityLink, EntityStatus } from '@/components/operations';
import type { DataQualityIssue } from '@/services/platform';

interface QualityTabProps {
  issues: DataQualityIssue[];
  onAcknowledge: (issue: DataQualityIssue) => void;
}

export function QualityTab({ issues, onAcknowledge }: QualityTabProps) {
  return (
    <Table
      rowKey="id"
      dataSource={issues}
      pagination={false}
      columns={[
        {
          title: '质量规则',
          render: (_, issue) => (
            <Space direction="vertical" size={0}>
              <strong>{issue.rule}</strong>
              <Typography.Text type="secondary">
                {issue.id} · {dayjs(issue.detectedAt).format('MM-DD HH:mm')}
              </Typography.Text>
            </Space>
          ),
        },
        {
          title: '对象',
          render: (_, issue) => (
            <EntityLink type={issue.objectType} id={issue.objectId}>
              {issue.objectName}
            </EntityLink>
          ),
        },
        { title: '问题', dataIndex: 'detail' },
        {
          title: '等级',
          width: 80,
          render: (_, issue) => (
            <Tag color={issue.severity === 'error' ? 'error' : 'warning'}>
              {issue.severity === 'error' ? '错误' : '警告'}
            </Tag>
          ),
        },
        {
          title: '状态',
          width: 100,
          render: (_, issue) => <EntityStatus status={issue.status} />,
        },
        {
          title: '操作',
          width: 100,
          render: (_, issue) =>
            issue.status === 'pending' && (
              <Button type="link" onClick={() => onAcknowledge(issue)}>
                确认跟进
              </Button>
            ),
        },
      ]}
    />
  );
}
