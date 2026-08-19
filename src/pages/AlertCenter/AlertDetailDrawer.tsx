import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  List,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { Box, Building2, ClipboardPlus, Server } from 'lucide-react';
import type { AlertTransitionAction } from '@/services/idc/alert';
import {
  alertLevelConfig,
  alertSourceLabels,
  alertStatusConfig,
  alertTypeLabels,
  formatAlertDateTime,
  getAlertStatus,
  getSlaPresentation,
  isAlertTerminal,
} from './alertPresentation';

interface Props {
  alert?: IDC.AlertDetail;
  onClose: () => void;
  onTransition: (alert: IDC.AlertDetail, action: AlertTransitionAction) => void;
  onCreateWorkOrder: (alert: IDC.AlertDetail) => void;
}

const primaryActions: Partial<
  Record<
    NonNullable<IDC.AlertDetail['workflowStatus']>,
    { label: string; action: AlertTransitionAction }
  >
> = {
  new: { label: '确认并接单', action: 'acknowledge' },
  reopened: { label: '重新确认', action: 'acknowledge' },
  acknowledged: { label: '开始处理', action: 'start' },
  processing: { label: '标记恢复', action: 'recover' },
  recovered: { label: '关闭告警', action: 'close' },
  closed: { label: '重新打开', action: 'reopen' },
};

const AlertDetailDrawer = ({
  alert,
  onClose,
  onTransition,
  onCreateWorkOrder,
}: Props) => {
  const status = alert ? getAlertStatus(alert) : 'new';
  const statusConfig = alertStatusConfig[status];
  const primary = primaryActions[status];
  const sla = getSlaPresentation(alert?.slaDueAt);
  return (
    <Drawer
      title="告警诊断与处置"
      open={Boolean(alert)}
      width={680}
      onClose={onClose}
      extra={
        alert && (
          <Space>
            {primary && (
              <Button
                type="primary"
                onClick={() => onTransition(alert, primary.action)}
              >
                {primary.label}
              </Button>
            )}
            <Button
              icon={<ClipboardPlus size={14} />}
              onClick={() => onCreateWorkOrder(alert)}
            >
              {alert.workOrderId || '创建工单'}
            </Button>
          </Space>
        )
      }
    >
      {alert && (
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <div>
            <Space wrap>
              <Tag color={alertLevelConfig[alert.level].color}>
                {alertLevelConfig[alert.level].text}
              </Tag>
              <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
              <Tag>{alert.priority || 'P3'}</Tag>
              <Tag>{alertTypeLabels[alert.type] || alert.type}</Tag>
              <Tag>{alertSourceLabels[alert.source]}</Tag>
            </Space>
            <Typography.Title level={4}>{alert.message}</Typography.Title>
          </div>

          <Alert
            type={
              sla.tone === 'error'
                ? 'error'
                : sla.tone === 'warning'
                  ? 'warning'
                  : 'info'
            }
            showIcon
            message={`SLA ${sla.label}`}
            description={`责任团队：${alert.team || '未分组'} · 责任人：${alert.assignee || '待指派'} · 升级等级：L${alert.escalationLevel || 0}`}
            action={
              !isAlertTerminal(alert) ? (
                <Button
                  size="small"
                  onClick={() => onTransition(alert, 'assign')}
                >
                  调整责任人
                </Button>
              ) : undefined
            }
          />

          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="告警编号">
              <Typography.Text copyable>{alert.id}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="规则">
              {alert.ruleName || '系统内置检测'}
            </Descriptions.Item>
            <Descriptions.Item label="触发值">
              {alert.value ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="阈值">
              {alert.threshold ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="SLA 截止">
              {formatAlertDateTime(alert.slaDueAt)}
            </Descriptions.Item>
            <Descriptions.Item label="维护窗口">
              {alert.maintenanceWindow || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="工单" span={2}>
              {alert.workOrderId || '尚未创建'}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <Typography.Title level={5}>影响对象</Typography.Title>
            <Space wrap>
              {alert.datacenterId && (
                <Button
                  icon={<Building2 size={14} />}
                  onClick={() =>
                    history.push(
                      `/idc/datacenter?datacenterId=${alert.datacenterId}`,
                    )
                  }
                >
                  {alert.datacenterName}
                </Button>
              )}
              {alert.cabinetId && (
                <Button
                  icon={<Box size={14} />}
                  onClick={() =>
                    history.push(`/idc/cabinet?cabinetId=${alert.cabinetId}`)
                  }
                >
                  {alert.cabinetName}
                </Button>
              )}
              {alert.deviceId && (
                <Button
                  icon={<Server size={14} />}
                  onClick={() =>
                    history.push(`/idc/device?deviceId=${alert.deviceId}`)
                  }
                >
                  {alert.deviceName}
                </Button>
              )}
              {alert.relatedAlertIds?.map((id) => (
                <Button
                  key={id}
                  onClick={() => history.push(`/monitor/alert?alertId=${id}`)}
                >
                  关联告警 {id}
                </Button>
              ))}
            </Space>
          </div>

          {alert.notes && (
            <Alert
              type="info"
              showIcon
              message="处置备注"
              description={alert.notes}
            />
          )}

          <div>
            <Typography.Title level={5}>通知投递</Typography.Title>
            <List
              size="small"
              bordered
              dataSource={alert.notificationDeliveries || []}
              renderItem={(delivery) => (
                <List.Item
                  extra={
                    <Tag
                      color={
                        delivery.status === 'delivered'
                          ? 'success'
                          : delivery.status === 'failed'
                            ? 'error'
                            : 'processing'
                      }
                    >
                      {delivery.status === 'delivered'
                        ? '已送达'
                        : delivery.status === 'failed'
                          ? '失败'
                          : '发送中'}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    title={`${delivery.channel} · ${delivery.target}`}
                    description={formatAlertDateTime(delivery.sentAt)}
                  />
                </List.Item>
              )}
            />
          </div>

          <div>
            <Typography.Title level={5}>升级与处置时间线</Typography.Title>
            <Timeline
              items={(alert.timeline || []).map((event) => ({
                color:
                  event.type === 'created'
                    ? 'red'
                    : event.type === 'close'
                      ? 'green'
                      : 'blue',
                children: (
                  <div>
                    <strong>{event.title}</strong>
                    <div>
                      {event.actor} · {formatAlertDateTime(event.occurredAt)}
                    </div>
                    {event.detail && (
                      <Typography.Text type="secondary">
                        {event.detail}
                      </Typography.Text>
                    )}
                  </div>
                ),
              }))}
            />
          </div>
        </Space>
      )}
    </Drawer>
  );
};

export default AlertDetailDrawer;
