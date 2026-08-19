import { Line } from '@ant-design/charts';
import { Progress, Space, Table, Tag, Typography } from 'antd';
import { EntityLink } from '@/components/operations';
import type { ReportSnapshot } from '@/services/platform';

export const AssetsReport = ({ snapshot }: { snapshot: ReportSnapshot }) => (
  <Table
    rowKey="datacenterId"
    pagination={false}
    dataSource={snapshot.assets}
    columns={[
      {
        title: '数据中心',
        render: (_, row) => (
          <EntityLink type="datacenter" id={row.datacenterId}>
            {row.datacenterName}
          </EntityLink>
        ),
      },
      { title: '设备数', dataIndex: 'devices' },
      {
        title: '在线率',
        render: (_, row) => <Progress percent={row.onlineRate} size="small" />,
      },
      {
        title: '质保即将到期',
        render: (_, row) => (
          <Tag color={row.expiringWarranty ? 'warning' : 'success'}>
            {row.expiringWarranty}
          </Tag>
        ),
      },
      {
        title: '责任人缺失',
        render: (_, row) => (
          <Tag color={row.unknownOwner ? 'error' : 'success'}>
            {row.unknownOwner}
          </Tag>
        ),
      },
    ]}
  />
);

export const CapacityReport = ({ snapshot }: { snapshot: ReportSnapshot }) => (
  <Table
    rowKey="datacenterId"
    pagination={false}
    dataSource={snapshot.capacity}
    columns={[
      {
        title: '数据中心',
        render: (_, row) => (
          <EntityLink type="datacenter" id={row.datacenterId}>
            {row.datacenterName}
          </EntityLink>
        ),
      },
      ...(
        ['uUsage', 'powerUsage', 'coolingUsage', 'networkUsage'] as const
      ).map((key) => ({
        title: {
          uUsage: 'U 位',
          powerUsage: '功率',
          coolingUsage: '制冷',
          networkUsage: '网络端口',
        }[key],
        render: (_: unknown, row: ReportSnapshot['capacity'][number]) => (
          <Progress
            percent={row[key]}
            size="small"
            strokeColor={row[key] >= 80 ? '#fa8c16' : undefined}
          />
        ),
      })),
    ]}
  />
);

export const EnergyReport = ({ snapshot }: { snapshot: ReportSnapshot }) => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Typography.Text type="secondary">
      能耗与 PUE 使用独立量纲，图例可单独开关系列。
    </Typography.Text>
    <Line
      data={snapshot.energyTrend}
      xField="month"
      yField="value"
      colorField="series"
      height={320}
      smooth
      axis={{ y: { title: '指标值' } }}
    />
  </Space>
);

export const SlaReport = ({ snapshot }: { snapshot: ReportSnapshot }) => (
  <Table
    rowKey="priority"
    pagination={false}
    dataSource={snapshot.sla}
    columns={[
      {
        title: '优先级',
        dataIndex: 'priority',
        render: (value) => (
          <Tag
            color={
              value === 'P1' ? 'error' : value === 'P2' ? 'warning' : 'default'
            }
          >
            {value}
          </Tag>
        ),
      },
      { title: '告警数', dataIndex: 'total' },
      {
        title: '按时确认率',
        render: (_, row) => (
          <Progress
            percent={Math.round((row.acknowledgedInTime / row.total) * 100)}
            size="small"
          />
        ),
      },
      {
        title: '按时解决率',
        render: (_, row) => (
          <Progress
            percent={Math.round((row.resolvedInTime / row.total) * 100)}
            size="small"
          />
        ),
      },
      {
        title: '平均确认',
        render: (_, row) => `${row.averageAckMinutes} 分钟`,
      },
      {
        title: '平均解决',
        render: (_, row) => `${row.averageResolveMinutes} 分钟`,
      },
    ]}
  />
);
