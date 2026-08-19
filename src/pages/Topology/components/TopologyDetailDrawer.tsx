import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Space,
  Tag,
  Typography,
} from 'antd';
import type {
  NetworkTopologyEdge,
  NetworkTopologyNode,
} from '@/services/idc/dashboard';

interface Props {
  open: boolean;
  node?: NetworkTopologyNode;
  edge?: NetworkTopologyEdge;
  nodeMap: Map<string, NetworkTopologyNode>;
  onClose: () => void;
}

const TopologyDetailDrawer: React.FC<Props> = ({
  open,
  node,
  edge,
  nodeMap,
  onClose,
}) => (
  <Drawer
    title={
      node?.label ??
      (edge
        ? `${nodeMap.get(edge.source)?.label} → ${nodeMap.get(edge.target)?.label}`
        : '拓扑详情')
    }
    open={open}
    onClose={onClose}
    width={560}
  >
    {node ? (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {node.alertCount ? (
          <Alert
            type="warning"
            showIcon
            message={`${node.alertCount} 条活动告警`}
            action={
              <Button
                size="small"
                onClick={() =>
                  history.push(`/monitor/alert?deviceId=${node.id}`)
                }
              >
                查看告警
              </Button>
            }
          />
        ) : null}
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="类型">{node.type}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag
              color={
                node.status === 'online'
                  ? 'success'
                  : node.status === 'warning'
                    ? 'warning'
                    : 'error'
              }
            >
              {node.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="机柜">{node.cabinetId}</Descriptions.Item>
          <Descriptions.Item label="管理 IP">
            {node.managementIp ?? '-'}
          </Descriptions.Item>
        </Descriptions>
        <Space>
          <Button
            type="primary"
            onClick={() =>
              history.push(
                node.id.startsWith('cabinet:')
                  ? `/idc/cabinet?cabinetId=${node.cabinetId}`
                  : `/idc/device?deviceId=${node.id}`,
              )
            }
          >
            查看资产
          </Button>
          {!node.id.startsWith('cabinet:') ? (
            <Button
              onClick={() => history.push(`/network/port?deviceId=${node.id}`)}
            >
              查看端口
            </Button>
          ) : null}
        </Space>
      </Space>
    ) : null}
    {edge ? (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {edge.status === 'faulty' ? (
          <Alert
            type="error"
            showIcon
            message="故障链路"
            description="路径分析会将该链路标记为风险，建议先核对物理介质和两端端口。"
          />
        ) : null}
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="源端">
            {nodeMap.get(edge.source)?.label} / {edge.sourcePort}
          </Descriptions.Item>
          <Descriptions.Item label="目标端">
            {nodeMap.get(edge.target)?.label} / {edge.targetPort}
          </Descriptions.Item>
          <Descriptions.Item label="速率">{edge.speed}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={edge.status === 'active' ? 'success' : 'error'}>
              {edge.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="最近采集">
            {edge.updatedAt}
          </Descriptions.Item>
        </Descriptions>
        <Button
          type="primary"
          onClick={() =>
            history.push(`/network/connection?connectionId=${edge.id}`)
          }
        >
          查看连接与变更历史
        </Button>
      </Space>
    ) : null}
    {!node && !edge ? (
      <Typography.Text type="secondary">选择节点或链路查看详情</Typography.Text>
    ) : null}
  </Drawer>
);

export default TopologyDetailDrawer;
