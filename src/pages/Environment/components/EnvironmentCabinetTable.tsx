import { Button, Card, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CabinetEnvironmentView } from '@/services/idc/environment';
import {
  formatMetric,
  formatObservedAt,
  qualityPresentation,
  sortCabinetsByRisk,
  statusPresentation,
} from '../environmentPresentation';
import styles from '../index.less';

interface Props {
  items: CabinetEnvironmentView[];
  datacenters: { id: string; name: string }[];
  datacenterId?: string;
  onDatacenterChange: (value?: string) => void;
  onOpen: (item: CabinetEnvironmentView) => void;
}

export const EnvironmentCabinetTable = ({
  items,
  datacenters,
  datacenterId,
  onDatacenterChange,
  onOpen,
}: Props) => {
  const columns: ColumnsType<CabinetEnvironmentView> = [
    {
      title: '机柜',
      key: 'cabinet',
      render: (_, item) => (
        <Space direction="vertical" size={0}>
          <Button
            type="link"
            className={styles.entityButton}
            onClick={() => onOpen(item)}
          >
            {item.cabinetName}
          </Button>
          <Typography.Text type="secondary">
            {item.datacenterName}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '温度（平均 / 峰值）',
      key: 'temperature',
      render: (_, item) => (
        <span>
          {formatMetric(item.avgTemperature, '℃')} /{' '}
          {formatMetric(item.maxTemperature, '℃')}
        </span>
      ),
    },
    {
      title: '湿度',
      dataIndex: 'avgHumidity',
      render: (value: number | null) => formatMetric(value, '%'),
    },
    {
      title: '状态 / 原因',
      key: 'status',
      render: (_, item) => (
        <Space direction="vertical" size={2}>
          <Tag color={statusPresentation[item.status].color}>
            {statusPresentation[item.status].label}
          </Tag>
          {item.anomalyReason && (
            <Typography.Text type="secondary">
              {item.anomalyReason}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: '数据质量',
      key: 'quality',
      render: (_, item) => (
        <Space direction="vertical" size={2}>
          <Tag color={qualityPresentation[item.quality].color}>
            {qualityPresentation[item.quality].label}
          </Tag>
          <Typography.Text type="secondary">
            {formatObservedAt(item.collectedAt)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      render: (_, item) => (
        <Button onClick={() => onOpen(item)}>查看传感器</Button>
      ),
    },
  ];

  return (
    <Card
      className={styles.tableCard}
      title="机柜环境（异常优先）"
      extra={
        <Select
          allowClear
          value={datacenterId}
          placeholder="全部数据中心"
          style={{ width: 180 }}
          options={datacenters.map((item) => ({
            label: item.name,
            value: item.id,
          }))}
          onChange={onDatacenterChange}
        />
      }
    >
      <Table
        rowKey="cabinetId"
        columns={columns}
        dataSource={sortCabinetsByRisk(items)}
        scroll={{ x: 920 }}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        rowClassName={(item) =>
          item.status !== 'normal' ? styles.anomalyRow : ''
        }
      />
    </Card>
  );
};
