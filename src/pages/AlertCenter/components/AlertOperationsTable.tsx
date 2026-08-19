import {
  Button,
  Card,
  Dropdown,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Bell, MoreHorizontal } from 'lucide-react';
import type { AlertTransitionAction } from '@/services/idc/alert';
import {
  alertLevelConfig,
  alertStatusConfig,
  alertTypeLabels,
  formatAlertDateTime,
  getAlertStatus,
  getSlaPresentation,
  isAlertTerminal,
} from '../alertPresentation';
import styles from '../index.less';

interface Props {
  alerts: IDC.AlertDetail[];
  loading: boolean;
  total: number;
  current: number;
  pageSize: number;
  level?: string;
  status?: string;
  type?: string;
  selectedIds: string[];
  onFilterChange: (key: 'level' | 'status' | 'type', value?: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onSelectionChange: (ids: string[]) => void;
  onOpen: (alert: IDC.AlertDetail) => void;
  onTransition: (alert: IDC.AlertDetail, action: AlertTransitionAction) => void;
  onBatchAcknowledge: () => void;
  onBatchClose: () => void;
}

const nextAction: Partial<
  Record<
    NonNullable<IDC.AlertDetail['workflowStatus']>,
    { label: string; action: AlertTransitionAction }
  >
> = {
  new: { label: '确认', action: 'acknowledge' },
  reopened: { label: '确认', action: 'acknowledge' },
  acknowledged: { label: '开始处理', action: 'start' },
  processing: { label: '标记恢复', action: 'recover' },
  recovered: { label: '关闭', action: 'close' },
  closed: { label: '重开', action: 'reopen' },
};

export const AlertOperationsTable = ({
  alerts,
  loading,
  total,
  current,
  pageSize,
  level,
  status,
  type,
  selectedIds,
  onFilterChange,
  onPageChange,
  onSelectionChange,
  onOpen,
  onTransition,
  onBatchAcknowledge,
  onBatchClose,
}: Props) => {
  const columns: ColumnsType<IDC.AlertDetail> = [
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (value: IDC.AlertDetail['priority'], alert) => (
        <Space direction="vertical" size={2}>
          <Tag
            color={
              value === 'P1' ? 'error' : value === 'P2' ? 'warning' : 'default'
            }
          >
            {value || 'P3'}
          </Tag>
          <Tag color={alertLevelConfig[alert.level].color}>
            {alertLevelConfig[alert.level].text}
          </Tag>
        </Space>
      ),
    },
    {
      title: '告警 / 影响对象',
      key: 'message',
      render: (_, alert) => (
        <Space direction="vertical" size={2}>
          <Button
            type="link"
            className={styles.alertLink}
            onClick={() => onOpen(alert)}
          >
            {alert.message}
          </Button>
          <Typography.Text type="secondary">
            {alert.datacenterName || '—'} /{' '}
            {alert.cabinetName || alert.deviceName || '系统'} ·{' '}
            {alertTypeLabels[alert.type] || alert.type}
          </Typography.Text>
          {alert.relatedAlertIds?.length ? (
            <Typography.Text type="secondary">
              关联 {alert.relatedAlertIds.length} 条告警
            </Typography.Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, alert) => {
        const config = alertStatusConfig[getAlertStatus(alert)];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '责任',
      key: 'owner',
      width: 130,
      render: (_, alert) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{alert.assignee || '待指派'}</Typography.Text>
          <Typography.Text type="secondary">
            {alert.team || '未分组'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'SLA',
      key: 'sla',
      width: 135,
      render: (_, alert) => {
        const sla = getSlaPresentation(alert.slaDueAt);
        return (
          <Space direction="vertical" size={0}>
            <Tag color={sla.tone}>{sla.label}</Tag>
            {(alert.escalationLevel || 0) > 0 && (
              <Typography.Text type="danger">
                已升级 L{alert.escalationLevel}
              </Typography.Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '发生时间',
      dataIndex: 'createdAt',
      width: 160,
      render: formatAlertDateTime,
    },
    {
      title: '操作',
      key: 'actions',
      width: 190,
      fixed: 'right',
      render: (_, alert) => {
        const statusValue = getAlertStatus(alert);
        const primary = nextAction[statusValue];
        return (
          <Space>
            {primary && (
              <Button
                size="small"
                type="primary"
                onClick={() => onTransition(alert, primary.action)}
              >
                {primary.label}
              </Button>
            )}
            <Button size="small" onClick={() => onOpen(alert)}>
              详情
            </Button>
            {!isAlertTerminal(alert) && (
              <Dropdown
                menu={{
                  items: [
                    { key: 'assign', label: '指派责任人' },
                    { key: 'suppress', label: '维护抑制' },
                    { key: 'false_positive', label: '标记误报', danger: true },
                  ],
                  onClick: ({ key }) =>
                    onTransition(alert, key as AlertTransitionAction),
                }}
              >
                <Button
                  size="small"
                  aria-label="更多告警操作"
                  icon={<MoreHorizontal size={14} />}
                />
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      className={styles.alertList}
      title={
        <Space>
          <Bell size={16} />
          告警运营队列
        </Space>
      }
      extra={
        <Space wrap>
          <Select
            allowClear
            value={level}
            placeholder="级别"
            style={{ width: 110 }}
            onChange={(value) => onFilterChange('level', value)}
            options={Object.entries(alertLevelConfig).map(([value, item]) => ({
              value,
              label: item.text,
            }))}
          />
          <Select
            allowClear
            value={status}
            placeholder="状态"
            style={{ width: 120 }}
            onChange={(value) => onFilterChange('status', value)}
            options={Object.entries(alertStatusConfig).map(([value, item]) => ({
              value,
              label: item.label,
            }))}
          />
          <Select
            allowClear
            value={type}
            placeholder="类型"
            style={{ width: 120 }}
            onChange={(value) => onFilterChange('type', value)}
            options={Object.entries(alertTypeLabels).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          {selectedIds.length > 0 && (
            <Button onClick={onBatchAcknowledge}>批量确认</Button>
          )}
          {selectedIds.length > 0 && (
            <Button onClick={onBatchClose}>批量关闭</Button>
          )}
        </Space>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={alerts}
        scroll={{ x: 1100 }}
        rowClassName={(alert) =>
          getSlaPresentation(alert.slaDueAt).tone === 'error' &&
          !isAlertTerminal(alert)
            ? styles.slaBreachedRow
            : ''
        }
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => onSelectionChange(keys as string[]),
          getCheckboxProps: (alert) => ({ disabled: isAlertTerminal(alert) }),
        }}
        pagination={{
          current,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: onPageChange,
        }}
      />
    </Card>
  );
};
