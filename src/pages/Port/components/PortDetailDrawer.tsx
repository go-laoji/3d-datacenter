import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type { PortView } from '@/services/idc/port';

interface Props {
  open: boolean;
  port?: PortView;
  device?: IDC.Device;
  onClose: () => void;
  onConfigure: () => void;
}

const PortDetailDrawer: React.FC<Props> = ({
  open,
  port,
  device,
  onClose,
  onConfigure,
}) => (
  <Drawer
    title={
      port
        ? `${device?.name ?? port.deviceId} · ${port.portNumber}`
        : '端口详情'
    }
    open={open}
    onClose={onClose}
    width={680}
    extra={
      <Button type="primary" onClick={onConfigure}>
        配置端口
      </Button>
    }
  >
    {port ? (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space wrap>
          <Tag
            color={
              port.status === 'up'
                ? 'success'
                : port.status === 'error'
                  ? 'error'
                  : 'warning'
            }
          >
            {port.status}
          </Tag>
          <Tag color={port.linkStatus === 'connected' ? 'blue' : 'default'}>
            {port.linkStatus === 'connected' ? '已连接' : '未连接'}
          </Tag>
          <Tag>
            {port.portType} · {port.speed}
          </Tag>
        </Space>
        {port.linkStatus === 'connected' ? (
          <Alert
            type={port.connectedDeviceId ? 'info' : 'warning'}
            showIcon
            message={
              port.connectedDeviceId
                ? `对端：${port.connectedDeviceName} / ${port.connectedPortName}`
                : '端口已占用，但连接关系待核对'
            }
            description={port.connectionPurpose ?? '暂无业务用途说明'}
            action={
              port.connectionId ? (
                <Button
                  size="small"
                  onClick={() =>
                    history.push(
                      `/network/connection?connectionId=${port.connectionId}`,
                    )
                  }
                >
                  连接详情
                </Button>
              ) : undefined
            }
          />
        ) : null}
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="别名">
            {port.portAlias ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最近变化">
            {port.lastChangedAt}
          </Descriptions.Item>
          <Descriptions.Item label="VLAN 模式">
            {port.vlanConfig?.mode?.toUpperCase() ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="PVID">
            {port.vlanConfig?.pvid ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="允许 VLAN" span={2}>
            {port.vlanConfig?.allowedVlans?.join(', ') ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="QoS">
            {port.qosConfig
              ? `${port.qosConfig.trustMode} · 入方向 ${port.qosConfig.ingressRateLimit ?? '不限速'} Mbps`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="端口安全">
            {port.portSecurity
              ? `开启 · 最大 ${port.maxMacCount ?? '-'} MAC`
              : '未开启'}
          </Descriptions.Item>
          <Descriptions.Item label="学习 MAC" span={2}>
            {port.learnedMacs.length
              ? port.learnedMacs.map((mac) => <Tag key={mac}>{mac}</Tag>)
              : '-'}
          </Descriptions.Item>
        </Descriptions>
        <div>
          <Typography.Title level={5}>链路与配置历史</Typography.Title>
          <Timeline
            items={port.history.map((item) => ({
              children: (
                <>
                  <strong>{item.action}</strong> · {item.operator}
                  <div>
                    <Typography.Text type="secondary">
                      {item.occurredAt} · {item.detail}
                    </Typography.Text>
                  </div>
                </>
              ),
            }))}
          />
        </div>
      </Space>
    ) : null}
  </Drawer>
);

export default PortDetailDrawer;
