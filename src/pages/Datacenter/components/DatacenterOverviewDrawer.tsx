import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Drawer,
  Progress,
  Row,
  Space,
  Statistic,
  Tabs,
  Tag,
} from 'antd';
import { Box, LayoutGrid, Monitor, Network, Server, Zap } from 'lucide-react';

interface DatacenterOverviewDrawerProps {
  datacenter?: IDC.Datacenter;
  open: boolean;
  onClose: () => void;
}

const DatacenterOverviewDrawer: React.FC<DatacenterOverviewDrawerProps> = ({
  datacenter,
  open,
  onClose,
}) => {
  if (!datacenter) return null;

  const cabinetUsage = datacenter.totalCabinets
    ? Math.round((datacenter.usedCabinets / datacenter.totalCabinets) * 100)
    : 0;
  const contextQuery = `datacenterId=${datacenter.id}`;
  const healthScore = datacenter.healthScore ?? 100;
  const healthColor =
    healthScore >= 90 ? '#52c41a' : healthScore >= 80 ? '#faad14' : '#ff4d4f';

  const resourceActions = (
    <Space wrap>
      <Button
        icon={<Server size={14} />}
        onClick={() => history.push(`/idc/cabinet?${contextQuery}`)}
      >
        机柜 {datacenter.usedCabinets}/{datacenter.totalCabinets}
      </Button>
      <Button
        icon={<Box size={14} />}
        onClick={() => history.push(`/idc/device?${contextQuery}`)}
      >
        设备 {datacenter.deviceCount ?? '-'} 台
      </Button>
      <Button
        icon={<Zap size={14} />}
        onClick={() => history.push(`/monitor/environment?${contextQuery}`)}
      >
        动力环境
      </Button>
      <Button
        icon={<Monitor size={14} />}
        onClick={() => history.push(`/monitor/alert?${contextQuery}`)}
      >
        告警 {datacenter.activeAlertCount ?? 0} 条
      </Button>
      <Button
        icon={<Network size={14} />}
        onClick={() => history.push(`/network/topology?${contextQuery}`)}
      >
        网络拓扑
      </Button>
    </Space>
  );

  return (
    <Drawer
      title={`${datacenter.name} · 站点总览`}
      open={open}
      onClose={onClose}
      width={760}
      extra={
        <Space>
          <Button
            icon={<LayoutGrid size={14} />}
            onClick={() => history.push(`/layout?${contextQuery}`)}
          >
            布局
          </Button>
          <Button
            type="primary"
            onClick={() => history.push(`/datacenter3d?id=${datacenter.id}`)}
          >
            进入 3D
          </Button>
        </Space>
      }
    >
      <Row gutter={[12, 12]}>
        <Col xs={12} md={6}>
          <Statistic
            title="健康度"
            value={healthScore}
            suffix="分"
            valueStyle={{ color: healthColor }}
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title="活动告警"
            value={datacenter.activeAlertCount ?? 0}
            suffix="条"
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="机柜容量" value={cabinetUsage} suffix="%" />
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title="制冷余量"
            value={datacenter.coolingHeadroomPercent ?? '-'}
            suffix="%"
          />
        </Col>
      </Row>

      <Tabs
        style={{ marginTop: 16 }}
        items={[
          {
            key: 'overview',
            label: '概览',
            children: (
              <>
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="站点编码">
                    {datacenter.code}
                  </Descriptions.Item>
                  <Descriptions.Item label="运行状态">
                    <Tag
                      color={
                        datacenter.status === 'active'
                          ? 'success'
                          : datacenter.status === 'maintenance'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {datacenter.status === 'active'
                        ? '运行中'
                        : datacenter.status === 'maintenance'
                          ? '维护中'
                          : '已下线'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="负责人">
                    {datacenter.contact || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="联系电话">
                    {datacenter.phone || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="地址" span={2}>
                    {datacenter.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后同步" span={2}>
                    {datacenter.lastSyncedAt
                      ? new Date(datacenter.lastSyncedAt).toLocaleString(
                          'zh-CN',
                        )
                      : '-'}
                  </Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 20 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <span>机柜容量</span>
                    <Progress percent={cabinetUsage} />
                    <span>站点功率使用</span>
                    <Progress
                      percent={datacenter.powerUsagePercent ?? 0}
                      strokeColor="#faad14"
                    />
                    <span>制冷余量</span>
                    <Progress
                      percent={datacenter.coolingHeadroomPercent ?? 0}
                      strokeColor="#13c2c2"
                    />
                  </Space>
                </div>
              </>
            ),
          },
          {
            key: 'resources',
            label: '资源与拓扑',
            children: resourceActions,
          },
          {
            key: 'operations',
            label: '运维状态',
            children: (
              <Alert
                type={datacenter.activeAlertCount ? 'warning' : 'success'}
                showIcon
                message={
                  datacenter.activeAlertCount
                    ? `当前有 ${datacenter.activeAlertCount} 条活动告警待处理`
                    : '站点当前无活动告警'
                }
                description="可进入告警中心查看责任人、SLA 和完整处置时间线。"
                action={
                  <Button
                    size="small"
                    onClick={() =>
                      history.push(`/monitor/alert?${contextQuery}`)
                    }
                  >
                    查看告警
                  </Button>
                }
              />
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default DatacenterOverviewDrawer;
