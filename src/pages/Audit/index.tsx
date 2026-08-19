import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { Download, Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  DataFreshness,
  EntityLink,
  EntityStatus,
} from '@/components/operations';
import {
  type AuditFilters,
  type AuditRecord,
  getAuditRecords,
} from '@/services/platform';
import { AuditDetailDrawer } from './AuditDetailDrawer';
import { serializeAuditCsv } from './auditModel';

export default function AuditPage() {
  const { message } = App.useApp();
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [selected, setSelected] = useState<AuditRecord>();
  const deepLinkedId = useMemo(
    () => new URLSearchParams(location.search).get('auditId'),
    [],
  );

  const refresh = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const response = await getAuditRecords(nextFilters);
      setRecords(response.data);
      const deepLinked = response.data.find(
        (record) => record.id === deepLinkedId,
      );
      if (deepLinked) setSelected(deepLinked);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh({});
  }, []);

  const download = () => {
    const blob = new Blob([`\uFEFF${serializeAuditCsv(records)}`], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `audit-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${records.length} 条审计记录`);
  };

  return (
    <PageContainer
      title="操作审计"
      subTitle="追溯人员、系统任务和对象字段的每一次变化"
      extra={
        <DataFreshness
          source="Mock 审计日志"
          collectedAt={new Date().toISOString()}
        />
      }
    >
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="对象、摘要或 Trace ID"
            aria-label="搜索审计记录"
            value={filters.keyword}
            onChange={(event) =>
              setFilters({ ...filters, keyword: event.target.value })
            }
            onSearch={() => void refresh()}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="操作人"
            style={{ width: 140 }}
            value={filters.operator}
            options={['张运维', '李工程师', '管理员', '系统任务'].map(
              (value) => ({ value, label: value }),
            )}
            onChange={(operator) => {
              const next = { ...filters, operator };
              setFilters(next);
              void refresh(next);
            }}
          />
          <Select
            allowClear
            placeholder="执行结果"
            style={{ width: 130 }}
            value={filters.result}
            options={[
              { value: 'success', label: '成功' },
              { value: 'failed', label: '失败' },
            ]}
            onChange={(result) => {
              const next = { ...filters, result };
              setFilters(next);
              void refresh(next);
            }}
          />
          <Button icon={<Download size={15} />} onClick={download}>
            导出当前结果
          </Button>
        </Space>
        <Table<AuditRecord>
          rowKey="id"
          loading={loading}
          dataSource={records}
          pagination={false}
          columns={[
            {
              title: '时间',
              width: 150,
              render: (_, record) =>
                dayjs(record.occurredAt).format('MM-DD HH:mm:ss'),
            },
            {
              title: '操作人',
              width: 120,
              render: (_, record) => (
                <EntityLink type="user" id={record.operatorId}>
                  {record.operator}
                </EntityLink>
              ),
            },
            { title: '动作', dataIndex: 'actionLabel', width: 120 },
            {
              title: '操作对象',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <EntityLink type={record.objectType} id={record.objectId}>
                    {record.objectName}
                  </EntityLink>
                  <Typography.Text type="secondary">
                    {record.summary}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: '结果',
              width: 90,
              render: (_, record) => <EntityStatus status={record.result} />,
            },
            {
              title: 'Trace ID',
              dataIndex: 'traceId',
              width: 160,
              ellipsis: true,
            },
            {
              title: '操作',
              width: 90,
              render: (_, record) => (
                <Button
                  type="link"
                  icon={<Eye size={14} />}
                  onClick={() => setSelected(record)}
                >
                  详情
                </Button>
              ),
            },
          ]}
        />
      </Card>
      <AuditDetailDrawer
        record={selected}
        onClose={() => setSelected(undefined)}
      />
    </PageContainer>
  );
}
