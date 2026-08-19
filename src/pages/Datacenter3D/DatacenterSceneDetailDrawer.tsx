import { history } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Progress,
  Space,
  Tag,
} from 'antd';
import { Box, Cable, Crosshair, ExternalLink, Server } from 'lucide-react';
import styles from './index.less';
import type { CabinetTemperature } from './useDatacenter3DData';

const statusConfig: Record<string, { color: string; text: string }> = {
  online: { color: 'success', text: '在线' },
  offline: { color: 'default', text: '离线' },
  warning: { color: 'warning', text: '告警' },
  error: { color: 'error', text: '故障' },
  maintenance: { color: 'processing', text: '维护中' },
  normal: { color: 'success', text: '正常' },
};

interface USlotDiagramProps {
  cabinet: IDC.Cabinet;
  devices: IDC.Device[];
  onDeviceSelect: (device: IDC.Device) => void;
}

function USlotDiagram({ cabinet, devices, onDeviceSelect }: USlotDiagramProps) {
  const slots = Array.from({ length: cabinet.uHeight }, (_, index) => {
    const u = cabinet.uHeight - index;
    const device = devices.find(
      (candidate) => u >= candidate.startU && u <= candidate.endU,
    );
    return { u, device, isStart: device?.startU === u };
  });

  return (
    <fieldset className={styles.uSlotDiagram}>
      <legend className={styles.srOnly}>机柜 U 位占用图</legend>
      {slots.map(({ u, device, isStart }) => (
        <button
          type="button"
          key={u}
          className={`${styles.uSlot} ${device ? styles.occupied : ''}`}
          disabled={!device}
          aria-label={device ? `U${u} ${device.name}` : `U${u} 空闲`}
          onClick={() => device && onDeviceSelect(device)}
        >
          <span className={styles.uNumber}>U{u}</span>
          {isStart && device && (
            <span className={styles.deviceName} title={device.name}>
              {device.name}
            </span>
          )}
        </button>
      ))}
    </fieldset>
  );
}

interface DatacenterSceneDetailDrawerProps {
  cabinet: IDC.Cabinet | null;
  device: IDC.Device | null;
  cabinets: IDC.Cabinet[];
  devices: IDC.Device[];
  templates: IDC.DeviceTemplate[];
  connections: IDC.Connection[];
  temperatures: CabinetTemperature[];
  onClose: () => void;
  onDeviceSelect: (device: IDC.Device) => void;
  onFocus: (device: IDC.Device) => void;
}

export function DatacenterSceneDetailDrawer({
  cabinet,
  device,
  cabinets,
  devices,
  templates,
  connections,
  temperatures,
  onClose,
  onDeviceSelect,
  onFocus,
}: DatacenterSceneDetailDrawerProps) {
  const activeCabinet = device
    ? cabinets.find((candidate) => candidate.id === device.cabinetId) || null
    : cabinet;
  const cabinetDevices = activeCabinet
    ? devices.filter((candidate) => candidate.cabinetId === activeCabinet.id)
    : [];
  const temperature = activeCabinet
    ? temperatures.find((item) => item.cabinetId === activeCabinet.id)
    : undefined;

  return (
    <Drawer
      title={
        <Space>
          {device ? <Box size={18} /> : <Server size={18} />}
          {device ? '设备运行详情' : '机柜运行详情'}
        </Space>
      }
      open={Boolean(device || cabinet)}
      onClose={onClose}
      width={520}
    >
      {device ? (
        <DeviceSceneDetails
          device={device}
          cabinet={activeCabinet}
          template={templates.find(
            (candidate) => candidate.id === device.templateId,
          )}
          connections={connections}
          devices={devices}
          onFocus={() => onFocus(device)}
        />
      ) : activeCabinet ? (
        <>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="机柜">
              {activeCabinet.name} · {activeCabinet.code}
            </Descriptions.Item>
            <Descriptions.Item label="位置">
              {activeCabinet.row} 排 {activeCabinet.column} 列
            </Descriptions.Item>
            <Descriptions.Item label="运行状态">
              <Tag color={statusConfig[activeCabinet.status]?.color}>
                {statusConfig[activeCabinet.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="环境温度">
              {temperature ? (
                <Space>
                  <strong>{temperature.temperature.toFixed(1)}℃</strong>
                  <Tag
                    color={
                      temperature.status === 'critical'
                        ? 'error'
                        : temperature.status === 'warning'
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {temperature.status === 'normal' ? '正常' : '需关注'}
                  </Tag>
                </Space>
              ) : (
                '暂无有效采集值'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="U 位使用">
              <Progress
                percent={Math.round(
                  (activeCabinet.usedU / activeCabinet.uHeight) * 100,
                )}
                size="small"
              />
              <span className={styles.progressCaption}>
                {activeCabinet.usedU}U / {activeCabinet.uHeight}U
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="功率使用">
              <Progress
                percent={Math.round(
                  (activeCabinet.currentPower / activeCabinet.maxPower) * 100,
                )}
                size="small"
                strokeColor="#fa8c16"
              />
              <span className={styles.progressCaption}>
                {activeCabinet.currentPower}W / {activeCabinet.maxPower}W
              </span>
            </Descriptions.Item>
          </Descriptions>

          <Card
            title="U 位与受影响设备"
            size="small"
            className={styles.detailCard}
          >
            <USlotDiagram
              cabinet={activeCabinet}
              devices={cabinetDevices}
              onDeviceSelect={onDeviceSelect}
            />
          </Card>

          <Space wrap className={styles.drawerActions}>
            <Button
              type="primary"
              icon={<ExternalLink size={14} />}
              onClick={() => history.push(`/cabinet3d?id=${activeCabinet.id}`)}
            >
              进入机柜 3D
            </Button>
            <Button
              onClick={() =>
                history.push(`/idc/cabinet?cabinetId=${activeCabinet.id}`)
              }
            >
              资产详情
            </Button>
            <Button
              onClick={() =>
                history.push(`/monitor/alert?cabinetId=${activeCabinet.id}`)
              }
            >
              关联告警
            </Button>
            <Button
              onClick={() =>
                history.push(
                  `/monitor/environment?cabinetId=${activeCabinet.id}`,
                )
              }
            >
              环境趋势
            </Button>
          </Space>
        </>
      ) : null}
    </Drawer>
  );
}

interface DeviceSceneDetailsProps {
  device: IDC.Device;
  cabinet: IDC.Cabinet | null;
  template?: IDC.DeviceTemplate;
  connections: IDC.Connection[];
  devices: IDC.Device[];
  onFocus: () => void;
}

function DeviceSceneDetails({
  device,
  cabinet,
  template,
  connections,
  devices,
  onFocus,
}: DeviceSceneDetailsProps) {
  const relatedConnections = connections.filter(
    (connection) =>
      connection.sourceDeviceId === device.id ||
      connection.targetDeviceId === device.id,
  );

  return (
    <>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="设备">
          <Space>
            <Badge
              status={device.status === 'online' ? 'success' : 'warning'}
            />
            {device.name}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="资产编码">
          {device.assetCode}
        </Descriptions.Item>
        <Descriptions.Item label="型号">
          {template ? `${template.brand} ${template.model}` : device.templateId}
        </Descriptions.Item>
        <Descriptions.Item label="机柜 / U 位">
          {cabinet?.name || device.cabinetId} · U{device.startU}-U{device.endU}
        </Descriptions.Item>
        <Descriptions.Item label="管理 IP">
          {device.managementIp || '未配置'}
        </Descriptions.Item>
        <Descriptions.Item label="责任归属">
          {[device.department, device.owner].filter(Boolean).join(' · ') ||
            '待补充'}
        </Descriptions.Item>
        <Descriptions.Item label="运行状态">
          <Tag color={statusConfig[device.status]?.color}>
            {statusConfig[device.status]?.text}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <Card title="物理连线" size="small" className={styles.detailCard}>
        {relatedConnections.length ? (
          relatedConnections.map((connection) => {
            const peerId =
              connection.sourceDeviceId === device.id
                ? connection.targetDeviceId
                : connection.sourceDeviceId;
            const peer = devices.find((candidate) => candidate.id === peerId);
            return (
              <div key={connection.id} className={styles.connectionItem}>
                <Cable size={14} style={{ color: connection.cableColor }} />
                <span>{connection.cableNumber}</span>
                <span aria-hidden>→</span>
                <span>{peer?.name || peerId}</span>
                <Tag>{connection.cableType}</Tag>
              </div>
            );
          })
        ) : (
          <Empty
            description="暂无物理连线"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      <Space wrap className={styles.drawerActions}>
        <Button type="primary" icon={<Crosshair size={14} />} onClick={onFocus}>
          聚焦定位
        </Button>
        <Button
          onClick={() => history.push(`/idc/device?deviceId=${device.id}`)}
        >
          设备详情
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
    </>
  );
}
