import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Alert,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Server,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getPowerLoadBalance,
  getPowerRedundancy,
  getPowerTopology,
  type LoadBalanceStatus,
  type PowerLink,
  type PowerNode,
  type RedundancyStatus,
} from '@/services/idc/power';

// 节点类型配置(保留用于后续扩展)
const _nodeTypeConfig: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  utility: { icon: <Zap size={16} />, color: '#722ed1', label: '市电' },
  ups: { icon: <Activity size={16} />, color: '#1890ff', label: 'UPS' },
  pdu: { icon: <Shield size={16} />, color: '#13c2c2', label: 'PDU' },
  device: { icon: <Server size={16} />, color: '#52c41a', label: '设备' },
};

// 状态配置
const statusConfig: Record<string, { color: string; text: string }> = {
  online: { color: 'success', text: '在线' },
  offline: { color: 'default', text: '离线' },
  warning: { color: 'warning', text: '告警' },
};

// 电源拓扑可视化组件(简化版)
const PowerTopologyView: React.FC<{
  nodes: PowerNode[];
  links: PowerLink[];
}> = ({ nodes, links: _links }) => {
  // 按类型分组节点
  const utilityNodes = nodes.filter((n) => n.type === 'utility');
  const upsNodes = nodes.filter((n) => n.type === 'ups');
  const pduNodes = nodes.filter((n) => n.type === 'pdu');
  const deviceNodes = nodes.filter((n) => n.type === 'device');

  const renderNodeGroup = (
    title: string,
    groupNodes: PowerNode[],
    icon: React.ReactNode,
    color: string,
  ) => (
    <Card
      size="small"
      title={
        <Space>
          {icon}
          <span>{title}</span>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[8, 8]}>
        {groupNodes.map((node) => {
          const load =
            node.capacity && node.load
              ? Math.round((node.load / node.capacity) * 100)
              : 0;
          return (
            <Col key={node.id} span={12}>
              <Card size="small" style={{ borderLeft: `3px solid ${color}` }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Space>
                    <Tag color={statusConfig[node.status]?.color}>
                      {node.name}
                    </Tag>
                  </Space>
                  <Tag color={statusConfig[node.status]?.color}>
                    {statusConfig[node.status]?.text}
                  </Tag>
                </div>
                {node.capacity && (
                  <Progress
                    percent={load}
                    size="small"
                    strokeColor={
                      load > 80 ? '#f5222d' : load > 60 ? '#faad14' : '#52c41a'
                    }
                    format={() => `${node.load}W / ${node.capacity}W`}
                    style={{ marginTop: 8 }}
                  />
                )}
              </Card>
            </Col>
          );
        })}
      </Row>
    </Card>
  );

  return (
    <div>
      <Alert
        message="电源拓扑"
        description="展示从市电到终端设备的电源链路关系 (市电 → UPS → PDU → 设备)"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      {renderNodeGroup('市电输入', utilityNodes, <Zap size={14} />, '#722ed1')}
      {renderNodeGroup(
        'UPS不间断电源',
        upsNodes,
        <Activity size={14} />,
        '#1890ff',
      )}
      {renderNodeGroup(
        'PDU配电单元',
        pduNodes,
        <Shield size={14} />,
        '#13c2c2',
      )}
      {renderNodeGroup(
        '终端设备',
        deviceNodes,
        <Server size={14} />,
        '#52c41a',
      )}
    </div>
  );
};

// 电源冗余状态面板
const RedundancyPanel: React.FC<{ data: RedundancyStatus | null }> = ({
  data,
}) => {
  if (!data) return <Spin />;

  const columns = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, _record: any) => (
        <Space>
          <Server size={14} />
          {text}
        </Space>
      ),
    },
    {
      title: '电源路径',
      dataIndex: 'powerPaths',
      key: 'powerPaths',
      render: (paths: string[]) => (
        <Space>
          {paths.map((p) => (
            <Tag key={p} color={p === 'A' ? 'blue' : 'green'}>
              {p}路
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color}>
          {statusConfig[status]?.text}
        </Tag>
      ),
    },
  ];

  const singlePowerColumns = [
    ...columns,
    {
      title: '风险',
      dataIndex: 'risk',
      key: 'risk',
      render: (_risk: string) => (
        <Tag color="error" icon={<AlertTriangle size={12} />}>
          单点故障风险
        </Tag>
      ),
    },
  ];

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Card
          title={
            <Space>
              <CheckCircle size={16} style={{ color: '#52c41a' }} />
              双路电源设备
            </Space>
          }
          size="small"
        >
          <Table
            dataSource={data.dualPower}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card
          title={
            <Space>
              <AlertTriangle size={16} style={{ color: '#faad14' }} />
              单路电源设备 (存在风险)
            </Space>
          }
          size="small"
        >
          <Table
            dataSource={data.singlePower}
            columns={singlePowerColumns}
            rowKey="id"
            size="small"
            pagination={false}
          />
        </Card>
      </Col>
    </Row>
  );
};

// 负载均衡面板
const LoadBalancePanel: React.FC<{ data: LoadBalanceStatus | null }> = ({
  data,
}) => {
  if (!data) return <Spin />;

  const statusColors = {
    balanced: '#52c41a',
    warning: '#faad14',
    unbalanced: '#f5222d',
  };

  const statusTexts = {
    balanced: '负载均衡',
    warning: '负载不均',
    unbalanced: '严重不均',
  };

  return (
    <Row gutter={16}>
      <Col span={8}>
        <Card size="small">
          <Statistic
            title={
              <Space>
                <Tag color="blue">A路</Tag>电源负载
              </Space>
            }
            value={data.pathA.load}
            suffix="W"
            prefix={<TrendingUp size={16} style={{ color: '#1890ff' }} />}
          />
          <div style={{ marginTop: 8 }}>
            <Progress
              percent={parseInt(data.pathA.percentage, 10)}
              strokeColor="#1890ff"
            />
          </div>
        </Card>
      </Col>
      <Col span={8}>
        <Card size="small">
          <Statistic
            title={
              <Space>
                <Tag color="green">B路</Tag>电源负载
              </Space>
            }
            value={data.pathB.load}
            suffix="W"
            prefix={<TrendingDown size={16} style={{ color: '#52c41a' }} />}
          />
          <div style={{ marginTop: 8 }}>
            <Progress
              percent={parseInt(data.pathB.percentage, 10)}
              strokeColor="#52c41a"
            />
          </div>
        </Card>
      </Col>
      <Col span={8}>
        <Card size="small">
          <Statistic
            title="负载均衡状态"
            value={statusTexts[data.status]}
            valueStyle={{ color: statusColors[data.status] }}
          />
          <div style={{ marginTop: 8 }}>
            <Tooltip title={`A/B路负载差异率: ${data.balanceRate}`}>
              <Tag
                color={
                  data.status === 'balanced'
                    ? 'success'
                    : data.status === 'warning'
                      ? 'warning'
                      : 'error'
                }
              >
                差异率: {data.balanceRate}
              </Tag>
            </Tooltip>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

const PowerPage: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(true);
  const [topology, setTopology] = useState<{
    nodes: PowerNode[];
    links: PowerLink[];
  }>({ nodes: [], links: [] });
  const [redundancy, setRedundancy] = useState<RedundancyStatus | null>(null);
  const [loadBalance, setLoadBalance] = useState<LoadBalanceStatus | null>(
    null,
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [topoRes, redundancyRes, loadBalanceRes] = await Promise.all([
          getPowerTopology(),
          getPowerRedundancy(),
          getPowerLoadBalance(),
        ]);

        if (topoRes.success) setTopology(topoRes.data);
        if (redundancyRes.success) setRedundancy(redundancyRes.data);
        if (loadBalanceRes.success) setLoadBalance(loadBalanceRes.data);
      } catch (error) {
        console.error('Failed to fetch power data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PageContainer
      header={{
        title: intl.formatMessage({
          id: 'pages.power.management',
          defaultMessage: '电源管理',
        }),
        subTitle: '电源拓扑、冗余状态和负载均衡监控',
      }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* 统计概览 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="总节点数"
                  value={topology.nodes.length}
                  prefix={<Zap size={16} style={{ color: '#1890ff' }} />}
                  suffix="个"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="电源链路"
                  value={topology.links.length}
                  prefix={<Activity size={16} style={{ color: '#52c41a' }} />}
                  suffix="条"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="冗余率"
                  value={redundancy?.summary?.redundancyRate || '0%'}
                  prefix={<Shield size={16} style={{ color: '#13c2c2' }} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="总负载"
                  value={loadBalance?.totalLoad || 0}
                  prefix={<Server size={16} style={{ color: '#722ed1' }} />}
                  suffix="W"
                />
              </Card>
            </Col>
          </Row>

          {/* 负载均衡状态 */}
          <Card title="负载均衡状态" style={{ marginBottom: 24 }}>
            <LoadBalancePanel data={loadBalance} />
          </Card>

          {/* 电源冗余状态 */}
          <Card title="电源冗余状态" style={{ marginBottom: 24 }}>
            <RedundancyPanel data={redundancy} />
          </Card>

          {/* 电源拓扑 */}
          <Card title="电源拓扑">
            <PowerTopologyView nodes={topology.nodes} links={topology.links} />
          </Card>
        </>
      )}
    </PageContainer>
  );
};

export default PowerPage;
