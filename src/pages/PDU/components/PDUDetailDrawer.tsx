import { Line } from '@ant-design/charts';
import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Progress,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { PDUDevice } from '@/services/idc/pdu';
import {
  getLoadPercent,
  getLoadTone,
  predictOverloadHours,
} from '../pduPresentation';

interface Props {
  open: boolean;
  device?: PDUDevice;
  cabinet?: IDC.Cabinet;
  onClose: () => void;
}

const qualityLabels = {
  good: ['success', '正常'],
  delayed: ['warning', '延迟'],
  estimated: ['processing', '估算'],
  invalid: ['error', '无效'],
} as const;

const PDUDetailDrawer: React.FC<Props> = ({
  open,
  device,
  cabinet,
  onClose,
}) => {
  if (!device) return <Drawer open={open} onClose={onClose} />;
  const percent = getLoadPercent(device);
  const tone = getLoadTone(percent);
  const predictedHours = predictOverloadHours(device);
  const quality = qualityLabels[device.metric.quality];
  const connectedOutlets = device.outlets.filter((outlet) => outlet.deviceId);

  return (
    <Drawer
      title={`${device.name} · ${device.pduData.powerPath} 路`}
      open={open}
      onClose={onClose}
      width={720}
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Tag color={device.status === 'online' ? 'success' : 'warning'}>
          {device.status}
        </Tag>
        <Tag color={quality[0]}>数据{quality[1]}</Tag>
        <Typography.Text type="secondary">
          来源 {device.metric.source} · 采集于 {device.metric.collectedAt}
        </Typography.Text>
      </Space>
      {percent >= (device.pduData.loadThreshold ?? 80) ? (
        <Alert
          type="error"
          showIcon
          message={`负载 ${percent}% 已达到策略阈值`}
          action={
            <Button
              size="small"
              onClick={() => history.push(`/monitor/alert?pduId=${device.id}`)}
            >
              查看告警
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Tabs
        items={[
          {
            key: 'overview',
            label: '输入与容量',
            children: (
              <Space
                direction="vertical"
                size="middle"
                style={{ width: '100%' }}
              >
                <Progress
                  percent={percent}
                  strokeColor={tone.color}
                  format={() =>
                    `${device.pduData.currentLoad} / ${device.pduData.maxLoad} W`
                  }
                />
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="额定输入">
                    {device.pduData.inputVoltage} V · {device.pduData.phase}
                  </Descriptions.Item>
                  <Descriptions.Item label="当前电流">
                    {device.pduData.inputCurrent ?? '-'} A
                  </Descriptions.Item>
                  <Descriptions.Item label="峰值">
                    {device.pduData.peakLoad ?? '-'} W
                  </Descriptions.Item>
                  <Descriptions.Item label="阈值来源">
                    PDU 高负载策略 · {device.pduData.loadThreshold ?? 80}%
                  </Descriptions.Item>
                  <Descriptions.Item label="预测超载">
                    {predictedHours
                      ? `约 ${predictedHours} 小时达到阈值`
                      : '近期趋势稳定'}
                  </Descriptions.Item>
                  <Descriptions.Item label="位置">
                    <Button
                      type="link"
                      size="small"
                      onClick={() =>
                        history.push(
                          `/idc/cabinet?cabinetId=${device.cabinetId}`,
                        )
                      }
                    >
                      {cabinet?.name ?? device.cabinetId}
                    </Button>
                  </Descriptions.Item>
                </Descriptions>
                <Button
                  onClick={() => history.push(`/power?pduId=${device.id}`)}
                >
                  在电力拓扑中定位
                </Button>
              </Space>
            ),
          },
          {
            key: 'outlets',
            label: `插座与设备 (${connectedOutlets.length})`,
            children: (
              <Table
                size="small"
                pagination={false}
                rowKey="id"
                dataSource={device.outlets}
                columns={[
                  {
                    title: '插座',
                    dataIndex: 'number',
                    render: (value, row) => `#${value} · ${row.phase}`,
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    render: (value) => (
                      <Tag
                        color={
                          value === 'on'
                            ? 'success'
                            : value === 'warning'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {value}
                      </Tag>
                    ),
                  },
                  {
                    title: '电流',
                    dataIndex: 'current',
                    render: (value) => `${value} A`,
                  },
                  {
                    title: '连接设备',
                    dataIndex: 'deviceName',
                    render: (value, row) =>
                      row.deviceId ? (
                        <Button
                          type="link"
                          size="small"
                          onClick={() =>
                            history.push(`/idc/device?deviceId=${row.deviceId}`)
                          }
                        >
                          {value}
                        </Button>
                      ) : (
                        <Typography.Text type="secondary">
                          未使用
                        </Typography.Text>
                      ),
                  },
                ]}
              />
            ),
          },
          {
            key: 'trend',
            label: '负载趋势',
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Tag color="blue">最近 24 小时</Tag>
                  <Typography.Text type="secondary">
                    含昨日同比与峰值标记
                  </Typography.Text>
                </Space>
                <Line
                  data={device.loadTrend.flatMap((point) => [
                    { time: point.time, value: point.load, series: '当前' },
                    {
                      time: point.time,
                      value: point.comparison,
                      series: '昨日同期',
                    },
                  ])}
                  xField="time"
                  yField="value"
                  colorField="series"
                  height={280}
                  axis={{ y: { title: '负载 (W)' } }}
                />
              </>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default PDUDetailDrawer;
