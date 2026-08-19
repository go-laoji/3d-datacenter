import { history } from '@umijs/max';
import {
  Alert,
  Badge,
  Button,
  Descriptions,
  Drawer,
  Space,
  Tabs,
  Tag,
  Timeline,
} from 'antd';
import { Cable, Network, Siren, Zap } from 'lucide-react';

interface DeviceDetailDrawerProps {
  device?: IDC.Device;
  template?: IDC.DeviceTemplate;
  cabinet?: IDC.Cabinet;
  open: boolean;
  onClose: () => void;
  onOpenPorts: () => void;
}

const statusConfig: Record<string, { color: string; text: string }> = {
  online: { color: 'success', text: '在线' },
  offline: { color: 'default', text: '离线' },
  warning: { color: 'warning', text: '告警' },
  error: { color: 'error', text: '故障' },
  maintenance: { color: 'processing', text: '维护中' },
};

const DeviceDetailDrawer: React.FC<DeviceDetailDrawerProps> = ({
  device,
  template,
  cabinet,
  open,
  onClose,
  onOpenPorts,
}) => (
  <Drawer title="设备详情" open={open} onClose={onClose} width={720}>
    {device && (
      <Tabs
        items={[
          {
            key: 'overview',
            label: '概览与位置',
            children: (
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="设备名称" span={2}>
                  <Space>
                    <Badge
                      status={
                        device.status === 'online' ? 'success' : 'default'
                      }
                    />
                    {device.name}
                    <Tag color={statusConfig[device.status]?.color}>
                      {statusConfig[device.status]?.text}
                    </Tag>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="资产编码">
                  {device.assetCode}
                </Descriptions.Item>
                <Descriptions.Item label="序列号">
                  {device.serialNumber || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="设备型号" span={2}>
                  {template?.name || device.templateId}
                  {template?.version && ` · 模板 v${template.version}`}
                </Descriptions.Item>
                <Descriptions.Item label="所在机柜">
                  {cabinet?.name || device.cabinetId}
                </Descriptions.Item>
                <Descriptions.Item label="U 位">
                  U{device.startU} - U{device.endU}
                </Descriptions.Item>
                <Descriptions.Item label="管理 IP">
                  {device.managementIp || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="架设状态">
                  {device.isMounted === false ? '已下架' : '已上架'}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>
                  {device.description || '-'}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'relations',
            label: '端口与关系',
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Alert
                  type="info"
                  showIcon
                  message="从资产详情继续完成网络、电力和告警处置"
                  description="以下入口均保留设备上下文，便于演示跨模块运维闭环。"
                />
                <Space wrap>
                  <Button icon={<Cable size={14} />} onClick={onOpenPorts}>
                    查看端口
                  </Button>
                  <Button
                    icon={<Network size={14} />}
                    onClick={() =>
                      history.push(`/network/connection?deviceId=${device.id}`)
                    }
                  >
                    网络连接
                  </Button>
                  <Button
                    icon={<Zap size={14} />}
                    onClick={() => history.push(`/power?deviceId=${device.id}`)}
                  >
                    A/B 路电源
                  </Button>
                  <Button
                    icon={<Siren size={14} />}
                    onClick={() =>
                      history.push(`/monitor/alert?deviceId=${device.id}`)
                    }
                  >
                    关联告警
                  </Button>
                </Space>
              </Space>
            ),
          },
          {
            key: 'warranty',
            label: '维保与责任',
            children: (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="采购日期">
                  {device.purchaseDate || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="质保到期">
                  {device.warrantyExpiry || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="供应商">
                  {device.vendor || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="负责人">
                  {device.owner || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="所属部门">
                  {device.department || '-'}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'changes',
            label: '变更记录',
            children: (
              <Timeline
                items={[
                  {
                    color: 'blue',
                    children: `最近更新：${new Date(device.updatedAt).toLocaleString('zh-CN')}`,
                  },
                  {
                    color: 'green',
                    children: `资产创建：${new Date(device.createdAt).toLocaleString('zh-CN')}`,
                  },
                ]}
              />
            ),
          },
        ]}
      />
    )}
  </Drawer>
);

export default DeviceDetailDrawer;
