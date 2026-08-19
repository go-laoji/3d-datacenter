import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import type { PowerNode, RedundancyStatus } from '@/services/idc/power';
import styles from '../index.less';

interface Row extends PowerNode {
  powerPaths: string[];
  risk?: string;
}

interface Props {
  data: RedundancyStatus | null;
  onOpen: (node: PowerNode) => void;
}

export const PowerRedundancyTable = ({ data, onOpen }: Props) => {
  const rows: Row[] = [
    ...(data?.singlePower || []),
    ...(data?.dualPower || []),
  ];
  return (
    <Card
      className={styles.redundancyCard}
      title="设备供电冗余（单路风险优先）"
    >
      <Table
        rowKey="id"
        size="small"
        dataSource={rows}
        pagination={false}
        columns={[
          {
            title: '设备',
            key: 'name',
            render: (_, node) => (
              <Button
                type="link"
                className={styles.entityButton}
                onClick={() => onOpen(node)}
              >
                {node.name}
              </Button>
            ),
          },
          {
            title: '电源路径',
            dataIndex: 'powerPaths',
            render: (paths: string[]) => (
              <Space>
                {paths.map((path) => (
                  <Tag key={path} color={path === 'A' ? 'blue' : 'green'}>
                    {path} 路
                  </Tag>
                ))}
              </Space>
            ),
          },
          {
            title: '实时负载',
            dataIndex: 'load',
            render: (value?: number) =>
              value === undefined ? '—' : `${value} W`,
          },
          {
            title: '风险判定',
            key: 'risk',
            render: (_, node) =>
              node.risk ? (
                <Space direction="vertical" size={0}>
                  <Tag color="error">单点故障</Tag>
                  <Typography.Text type="secondary">
                    任一路径失效将中断供电
                  </Typography.Text>
                </Space>
              ) : (
                <Tag color="success">双路冗余</Tag>
              ),
          },
          {
            title: '操作',
            key: 'action',
            render: (_, node) => (
              <Button onClick={() => onOpen(node)}>追踪路径</Button>
            ),
          },
        ]}
      />
    </Card>
  );
};
