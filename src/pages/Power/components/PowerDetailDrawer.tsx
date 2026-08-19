import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Progress,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { PowerLink, PowerNode } from '@/services/idc/power';
import {
  getDownstreamDeviceIds,
  traceUpstreamPaths,
} from '../powerPresentation';

interface Props {
  node?: PowerNode;
  nodes: PowerNode[];
  links: PowerLink[];
  onClose: () => void;
  onSimulate: (node: PowerNode) => void;
}

const qualityLabels = {
  good: '正常',
  delayed: '延迟',
  estimated: '估算',
  invalid: '无效',
};

export const PowerDetailDrawer = ({
  node,
  nodes,
  links,
  onClose,
  onSimulate,
}: Props) => {
  const traces = node ? traceUpstreamPaths(node.id, nodes, links) : [];
  const downstream = node ? getDownstreamDeviceIds(node.id, nodes, links) : [];
  const nodeById = new Map(nodes.map((item) => [item.id, item]));
  const loadPercent = node?.capacity
    ? Math.round(((node.load || 0) / node.capacity) * 100)
    : undefined;
  return (
    <Drawer
      width={660}
      open={Boolean(node)}
      title={node ? `${node.name} · 电源诊断` : '电源诊断'}
      onClose={onClose}
      extra={
        node && (
          <Space>
            {node.type !== 'device' && (
              <Button danger onClick={() => onSimulate(node)}>
                模拟单点故障
              </Button>
            )}
            {node.type === 'pdu' && (
              <Button
                type="primary"
                onClick={() => history.push(`/idc/pdu?deviceId=${node.id}`)}
              >
                PDU 详情
              </Button>
            )}
          </Space>
        )
      }
    >
      {node && (
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="资产编号">
              {node.assetCode}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={node.status === 'online' ? 'success' : 'warning'}>
                {node.status === 'online' ? '在线' : '告警'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="实时负载">
              {node.load === undefined ? '—' : `${node.load} W`}
            </Descriptions.Item>
            <Descriptions.Item label="额定容量">
              {node.capacity === undefined ? '—' : `${node.capacity} W`}
            </Descriptions.Item>
            <Descriptions.Item label="数据来源">
              {node.source}
            </Descriptions.Item>
            <Descriptions.Item label="数据质量">
              <Tag color={node.quality === 'good' ? 'success' : 'warning'}>
                {qualityLabels[node.quality]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="采集时间" span={2}>
              {new Date(node.collectedAt).toLocaleString('zh-CN')}
              （Asia/Shanghai）
            </Descriptions.Item>
          </Descriptions>
          {loadPercent !== undefined && (
            <div>
              <Typography.Text type="secondary">容量利用率</Typography.Text>
              <Progress
                percent={loadPercent}
                status={loadPercent >= 80 ? 'exception' : 'normal'}
              />
            </div>
          )}

          <div>
            <Typography.Title level={5}>A/B 上游路径</Typography.Title>
            {traces.length ? (
              traces.map((trace) => (
                <Alert
                  key={trace.path}
                  type={trace.healthy ? 'success' : 'warning'}
                  showIcon
                  message={
                    <Space>
                      <Tag color={trace.path === 'A' ? 'blue' : 'green'}>
                        {trace.path} 路
                      </Tag>
                      {trace.healthy ? '链路健康' : '链路存在风险'}
                    </Space>
                  }
                  description={trace.nodes.map((item) => item.name).join(' → ')}
                  style={{ marginBottom: 8 }}
                />
              ))
            ) : (
              <Alert type="info" message="源节点无上游链路" />
            )}
          </div>

          <div>
            <Typography.Title level={5}>下游影响范围</Typography.Title>
            <Space wrap>
              {downstream.length ? (
                downstream.map((id) => (
                  <Button
                    key={id}
                    onClick={() => history.push(`/idc/device?deviceId=${id}`)}
                  >
                    {nodeById.get(id)?.name || id}
                  </Button>
                ))
              ) : (
                <Typography.Text type="secondary">
                  无下游 IT 设备
                </Typography.Text>
              )}
            </Space>
          </div>

          <Space wrap>
            <Button
              onClick={() =>
                history.push(
                  `/monitor/alert?type=power&datacenterId=${node.datacenterId}&deviceId=${node.id}`,
                )
              }
            >
              相关告警
            </Button>
            {node.cabinetId && (
              <Button
                onClick={() =>
                  history.push(`/idc/cabinet?cabinetId=${node.cabinetId}`)
                }
              >
                所在机柜
              </Button>
            )}
          </Space>
        </Space>
      )}
    </Drawer>
  );
};
