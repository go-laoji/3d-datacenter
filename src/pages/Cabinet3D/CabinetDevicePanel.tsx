import { history } from '@umijs/max';
import { Badge, Button, Card, Descriptions, Empty, Space, Tag } from 'antd';
import { Crosshair, X } from 'lucide-react';
import { EntityLink, EntityStatus } from '@/components/operations';
import styles from './index.less';

interface CabinetDevicePanelProps {
  device: IDC.Device;
  template?: IDC.DeviceTemplate;
  ports: IDC.Port[];
  onClose: () => void;
  onFocus: () => void;
}

export function CabinetDevicePanel({
  device,
  template,
  ports,
  onClose,
  onFocus,
}: CabinetDevicePanelProps) {
  const upPorts = ports.filter((port) => port.status === 'up').length;
  const downPorts = ports.length - upPorts;

  return (
    <Card
      className={styles.devicePanel}
      size="small"
      title={
        <Space>
          <Badge status={device.status === 'online' ? 'success' : 'warning'} />
          <span>{device.name}</span>
        </Space>
      }
      extra={
        <Button
          type="text"
          size="small"
          aria-label="关闭设备详情"
          icon={<X size={15} />}
          onClick={onClose}
        />
      }
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="资产编码">
          <EntityLink type="device" id={device.id}>
            {device.assetCode}
          </EntityLink>
        </Descriptions.Item>
        <Descriptions.Item label="型号">
          {template ? `${template.brand} ${template.model}` : device.templateId}
        </Descriptions.Item>
        <Descriptions.Item label="安装位置">
          U{device.startU}-U{device.endU}
        </Descriptions.Item>
        <Descriptions.Item label="管理 IP">
          {device.managementIp || '未配置'}
        </Descriptions.Item>
        <Descriptions.Item label="责任人">
          {[device.department, device.owner].filter(Boolean).join(' · ') ||
            '待补充'}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          <EntityStatus status={device.status} />
        </Descriptions.Item>
      </Descriptions>

      <div className={styles.portSummary}>
        <span>端口 {ports.length}</span>
        <Tag color="success">Up {upPorts}</Tag>
        <Tag color={downPorts ? 'warning' : 'default'}>Down {downPorts}</Tag>
      </div>
      {ports.length ? (
        <div className={styles.portList}>
          {ports.slice(0, 8).map((port) => (
            <div key={port.id} className={styles.portItem}>
              <Badge status={port.status === 'up' ? 'success' : 'default'} />
              <span>{port.portNumber}</span>
              <small>{port.speed}</small>
            </div>
          ))}
          {ports.length > 8 && <small>其余 {ports.length - 8} 个端口</small>}
        </div>
      ) : (
        <Empty
          description="该设备暂无端口数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      <Space wrap className={styles.deviceActions}>
        <Button type="primary" icon={<Crosshair size={14} />} onClick={onFocus}>
          镜头聚焦
        </Button>
        <Button
          onClick={() => history.push(`/idc/device?deviceId=${device.id}`)}
        >
          资产详情
        </Button>
        <Button
          onClick={() => history.push(`/network/port?deviceId=${device.id}`)}
        >
          端口与连线
        </Button>
        <Button
          onClick={() => history.push(`/monitor/alert?deviceId=${device.id}`)}
        >
          关联告警
        </Button>
      </Space>
    </Card>
  );
}
