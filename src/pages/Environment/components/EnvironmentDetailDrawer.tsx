import { history } from '@umijs/max';
import {
  Button,
  Descriptions,
  Drawer,
  Empty,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import type {
  CabinetEnvironmentView,
  EnvironmentSensorView,
  EnvironmentThresholds,
} from '@/services/idc/environment';
import {
  formatMetric,
  formatObservedAt,
  qualityPresentation,
} from '../environmentPresentation';

interface Props {
  cabinet?: CabinetEnvironmentView;
  sensors: EnvironmentSensorView[];
  thresholds?: EnvironmentThresholds;
  loading: boolean;
  selectedTime?: string;
  onClose: () => void;
}

export const EnvironmentDetailDrawer = ({
  cabinet,
  sensors,
  thresholds,
  loading,
  selectedTime,
  onClose,
}: Props) => (
  <Drawer
    width={620}
    open={Boolean(cabinet)}
    title={cabinet ? `${cabinet.cabinetName} · 环境诊断` : '环境诊断'}
    onClose={onClose}
    extra={
      cabinet && (
        <Space>
          <Button
            onClick={() =>
              history.push(`/resource/cabinet?cabinetId=${cabinet.cabinetId}`)
            }
          >
            机柜详情
          </Button>
          <Button
            type="primary"
            onClick={() =>
              history.push(
                `/datacenter3d?datacenterId=${cabinet.datacenterId}&cabinetId=${cabinet.cabinetId}&mode=temperature&time=${encodeURIComponent(selectedTime || cabinet.collectedAt)}`,
              )
            }
          >
            3D 热力定位
          </Button>
        </Space>
      )
    }
  >
    {cabinet && (
      <>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="数据中心">
            {cabinet.datacenterName}
          </Descriptions.Item>
          <Descriptions.Item label="传感器">
            {cabinet.sensorCount} 个
          </Descriptions.Item>
          <Descriptions.Item label="平均温度">
            {formatMetric(cabinet.avgTemperature, '℃')}
          </Descriptions.Item>
          <Descriptions.Item label="峰值温度">
            {formatMetric(cabinet.maxTemperature, '℃')}
          </Descriptions.Item>
          <Descriptions.Item label="数据质量">
            <Tag color={qualityPresentation[cabinet.quality].color}>
              {qualityPresentation[cabinet.quality].label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="采集时间">
            {formatObservedAt(cabinet.collectedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="规则来源" span={2}>
            {thresholds?.source || cabinet.source}
          </Descriptions.Item>
          <Descriptions.Item label="判定规则" span={2}>
            警告 {thresholds?.temperatureWarning}℃ / 严重{' '}
            {thresholds?.temperatureCritical}℃，持续{' '}
            {thresholds?.durationMinutes} 分钟，回差 {thresholds?.hysteresis}℃
          </Descriptions.Item>
          <Descriptions.Item label="维护窗口" span={2}>
            {thresholds?.maintenanceWindow || '未配置'}
          </Descriptions.Item>
        </Descriptions>
        <Typography.Title level={5}>传感器采样</Typography.Title>
        <Spin spinning={loading}>
          {sensors.length ? (
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={sensors}
              columns={[
                { title: '位置', dataIndex: 'position' },
                {
                  title: '温度',
                  dataIndex: 'temperature',
                  render: (value: number | null) => formatMetric(value, '℃'),
                },
                {
                  title: '湿度',
                  dataIndex: 'humidity',
                  render: (value: number | null) => formatMetric(value, '%'),
                },
                {
                  title: '质量',
                  dataIndex: 'quality',
                  render: (value: EnvironmentSensorView['quality']) => (
                    <Tag color={qualityPresentation[value].color}>
                      {qualityPresentation[value].label}
                    </Tag>
                  ),
                },
              ]}
            />
          ) : (
            <Empty description="暂无有效采样；缺失数据不会显示为 0" />
          )}
        </Spin>
      </>
    )}
  </Drawer>
);
