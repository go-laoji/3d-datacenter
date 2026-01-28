import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Card,
  Col,
  Progress,
  Row,
  Select,
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
import { getAllDatacenters } from '@/services/idc/datacenter';
import {
  getPowerLoadBalance,
  getPowerRedundancy,
  getPowerTopology,
  type LoadBalanceStatus,
  type PowerLink,
  type PowerNode,
  type RedundancyStatus,
} from '@/services/idc/power';
import styles from './index.less';
import PowerTopologyGraph from './PowerTopologyGraph';

// 状态配置
const statusConfig: Record<string, { color: string; text: string }> = {
  online: { color: 'success', text: '在线' },
  offline: { color: 'default', text: '离线' },
  warning: { color: 'warning', text: '告警' },
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
  const [datacenters, setDatacenters] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedDc, setSelectedDc] = useState<string>();
  const [topology, setTopology] = useState<{
    nodes: PowerNode[];
    links: PowerLink[];
  }>({ nodes: [], links: [] });
  const [redundancy, setRedundancy] = useState<RedundancyStatus | null>(null);
  const [loadBalance, setLoadBalance] = useState<LoadBalanceStatus | null>(
    null,
  );

  // 加载数据中心列表
  useEffect(() => {
    getAllDatacenters().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setDatacenters(res.data);
        setSelectedDc(res.data[0].id);
      }
    });
  }, []);

  // 加载电源数据
  useEffect(() => {
    if (!selectedDc) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [topoRes, redundancyRes, loadBalanceRes] = await Promise.all([
          getPowerTopology(selectedDc),
          getPowerRedundancy(selectedDc),
          getPowerLoadBalance(selectedDc),
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
  }, [selectedDc]);

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
      {/* 机房选择器 */}
      <Card style={{ marginBottom: 24 }}>
        <div className={styles.datacenterSelector}>
          <span>选择数据中心：</span>
          <Select
            placeholder="请选择数据中心"
            style={{ width: 250 }}
            value={selectedDc}
            onChange={setSelectedDc}
            options={datacenters.map((dc) => ({
              value: dc.id,
              label: dc.name,
            }))}
          />
        </div>
      </Card>

      {loading && !topology.nodes.length ? (
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

          {/* 电源拓扑图形 */}
          <Card title="电源拓扑" style={{ marginBottom: 24 }}>
            <PowerTopologyGraph
              nodes={topology.nodes}
              links={topology.links}
              loading={loading}
            />
          </Card>

          {/* 负载均衡状态 */}
          <Card title="负载均衡状态" style={{ marginBottom: 24 }}>
            <LoadBalancePanel data={loadBalance} />
          </Card>

          {/* 电源冗余状态 */}
          <Card title="电源冗余状态" style={{ marginBottom: 24 }}>
            <RedundancyPanel data={redundancy} />
          </Card>
        </>
      )}
    </PageContainer>
  );
};

export default PowerPage;
