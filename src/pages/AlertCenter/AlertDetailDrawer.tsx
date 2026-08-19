import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Popconfirm,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { Box, Building2, Check, CheckCheck, Server } from 'lucide-react';
import {
  alertLevelConfig,
  alertSourceLabels,
  alertTypeLabels,
  formatAlertDateTime,
} from './alertPresentation';

interface AlertDetailDrawerProps {
  alert?: IDC.AlertDetail;
  onClose: () => void;
  onAcknowledge: (alert: IDC.AlertDetail) => void;
  onResolve: (alert: IDC.AlertDetail) => void;
}

const AlertDetailDrawer: React.FC<AlertDetailDrawerProps> = ({
  alert,
  onClose,
  onAcknowledge,
  onResolve,
}) => {
  const level = alert ? alertLevelConfig[alert.level] : undefined;
  const timelineItems = alert
    ? [
        {
          color: 'red',
          children: (
            <div>
              <strong>告警产生</strong>
              <div>{formatAlertDateTime(alert.createdAt)}</div>
            </div>
          ),
        },
        ...(alert.acknowledgedAt
          ? [
              {
                color: 'blue',
                dot: <Check size={14} />,
                children: (
                  <div>
                    <strong>
                      {alert.acknowledgedBy || '当前用户'}确认告警
                    </strong>
                    <div>{formatAlertDateTime(alert.acknowledgedAt)}</div>
                  </div>
                ),
              },
            ]
          : []),
        ...(alert.resolvedAt
          ? [
              {
                color: 'green',
                dot: <CheckCheck size={14} />,
                children: (
                  <div>
                    <strong>{alert.resolvedBy || '当前用户'}解决告警</strong>
                    <div>{formatAlertDateTime(alert.resolvedAt)}</div>
                  </div>
                ),
              },
            ]
          : []),
      ]
    : [];

  return (
    <Drawer
      title="告警详情"
      open={Boolean(alert)}
      width={560}
      onClose={onClose}
      extra={
        alert ? (
          <Space>
            {!alert.acknowledged && (
              <Button type="primary" onClick={() => onAcknowledge(alert)}>
                确认告警
              </Button>
            )}
            {alert.acknowledged && !alert.resolvedAt && (
              <Popconfirm
                title="确认已解决该告警？"
                description="解决后会记录处置时间和当前用户。"
                onConfirm={() => onResolve(alert)}
              >
                <Button type="primary">标记解决</Button>
              </Popconfirm>
            )}
          </Space>
        ) : null
      }
    >
      {alert && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div>
            <Space style={{ marginBottom: 8 }}>
              <Tag color={level?.color}>{level?.text}</Tag>
              <Tag>{alertTypeLabels[alert.type] || alert.type}</Tag>
              <Tag>{alertSourceLabels[alert.source]}</Tag>
            </Space>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {alert.message}
            </Typography.Title>
          </div>

          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="告警编号" span={2}>
              <Typography.Text copyable>{alert.id}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="触发值">
              {alert.value ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="阈值">
              {alert.threshold ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="告警规则" span={2}>
              {alert.ruleName || '系统内置检测'}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <Typography.Title level={5}>影响对象</Typography.Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {alert.datacenterId && (
                <Button
                  block
                  icon={<Building2 size={14} />}
                  onClick={() =>
                    history.push(
                      `/idc/datacenter?datacenterId=${alert.datacenterId}`,
                    )
                  }
                >
                  {alert.datacenterName || alert.datacenterId}
                </Button>
              )}
              {alert.cabinetId && (
                <Button
                  block
                  icon={<Box size={14} />}
                  onClick={() =>
                    history.push(`/idc/cabinet?cabinetId=${alert.cabinetId}`)
                  }
                >
                  {alert.cabinetName || alert.cabinetId}
                </Button>
              )}
              {alert.deviceId && (
                <Button
                  block
                  icon={<Server size={14} />}
                  onClick={() =>
                    history.push(`/idc/device?deviceId=${alert.deviceId}`)
                  }
                >
                  {alert.deviceName || alert.deviceId}
                </Button>
              )}
            </Space>
          </div>

          {alert.notes && (
            <Alert
              type="info"
              showIcon
              message="处理备注"
              description={alert.notes}
            />
          )}

          <div>
            <Typography.Title level={5}>处理时间线</Typography.Title>
            <Timeline items={timelineItems} />
          </div>
        </Space>
      )}
    </Drawer>
  );
};

export default AlertDetailDrawer;
