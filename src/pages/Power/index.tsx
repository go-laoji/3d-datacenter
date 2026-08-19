import { PageContainer } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { Alert, Card, message, Segmented, Select, Space, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllDatacenters } from '@/services/idc/datacenter';
import {
  getPowerLoadBalance,
  getPowerRedundancy,
  getPowerTopology,
  type LoadBalanceStatus,
  type PowerFailureSimulation,
  type PowerLink,
  type PowerNode,
  type RedundancyStatus,
  simulatePowerFailure,
} from '@/services/idc/power';
import { PowerDetailDrawer } from './components/PowerDetailDrawer';
import { PowerFailureModal } from './components/PowerFailureModal';
import { PowerMetricStrip } from './components/PowerMetricStrip';
import { PowerRedundancyTable } from './components/PowerRedundancyTable';
import styles from './index.less';
import PowerTopologyGraph from './PowerTopologyGraph';

const PowerPage = () => {
  const [searchParams] = useSearchParams();
  const datacenterId = searchParams.get('datacenterId') || undefined;
  const selectedNodeId = searchParams.get('nodeId') || undefined;
  const pathFilter = (searchParams.get('path') || undefined) as
    | 'A'
    | 'B'
    | undefined;
  const [datacenters, setDatacenters] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [nodes, setNodes] = useState<PowerNode[]>([]);
  const [links, setLinks] = useState<PowerLink[]>([]);
  const [redundancy, setRedundancy] = useState<RedundancyStatus | null>(null);
  const [loadBalance, setLoadBalance] = useState<LoadBalanceStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [simulation, setSimulation] = useState<PowerFailureSimulation>();
  const [simulationLoading, setSimulationLoading] = useState(false);
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const updateContext = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(window.location.search);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      history.replace(`/power?${params.toString()}`);
    },
    [],
  );

  useEffect(() => {
    getAllDatacenters().then((response) => {
      const options = response.data || [];
      setDatacenters(options);
      if (!datacenterId && options[0])
        updateContext({ datacenterId: options[0].id });
    });
  }, [datacenterId, updateContext]);

  useEffect(() => {
    if (!datacenterId) return;
    setLoading(true);
    Promise.all([
      getPowerTopology(datacenterId),
      getPowerRedundancy(datacenterId),
      getPowerLoadBalance(datacenterId),
    ])
      .then(([topologyResult, redundancyResult, loadResult]) => {
        setNodes(topologyResult.data?.nodes || []);
        setLinks(topologyResult.data?.links || []);
        setRedundancy(redundancyResult.data || null);
        setLoadBalance(loadResult.data || null);
      })
      .catch(() => message.error('电源链路数据加载失败'))
      .finally(() => setLoading(false));
  }, [datacenterId]);

  const handleSimulate = async (node: PowerNode) => {
    if (!datacenterId) return;
    setSimulation(undefined);
    setSimulationLoading(true);
    try {
      const response = await simulatePowerFailure(datacenterId, node.id);
      if (!response.success || !response.data)
        throw new Error(response.errorMessage);
      setSimulation(response.data);
    } catch (error) {
      message.error(
        error instanceof Error && error.message
          ? error.message
          : '故障影响计算失败',
      );
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <PageContainer
      title="电源管理"
      subTitle="A/B 路径、负载、冗余与单点故障预演"
    >
      <Alert
        className={styles.contextNotice}
        type="info"
        showIcon
        message="统一电源对象模型"
        description="市电、UPS、PDU、端口和 IT 设备共享同一条链路台账；模拟仅计算影响，不会修改设备状态。"
      />
      <Card size="small" className={styles.toolbar}>
        <Space wrap>
          <Select
            value={datacenterId}
            style={{ width: 220 }}
            placeholder="选择数据中心"
            options={datacenters.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={(value) =>
              updateContext({ datacenterId: value, nodeId: undefined })
            }
          />
          <Segmented
            value={pathFilter || 'all'}
            options={[
              { label: '全部路径', value: 'all' },
              { label: 'A 路', value: 'A' },
              { label: 'B 路', value: 'B' },
            ]}
            onChange={(value) =>
              updateContext({
                path: value === 'all' ? undefined : String(value),
              })
            }
          />
          <span>数据来源：{loadBalance?.source || '—'}</span>
        </Space>
      </Card>
      <PowerMetricStrip
        nodes={nodes.length}
        links={links.length}
        redundancy={redundancy}
        load={loadBalance}
      />
      {loading && !nodes.length ? (
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Card className={styles.topologyCard} title="供电路径拓扑">
            <PowerTopologyGraph
              nodes={nodes}
              links={links}
              selectedId={selectedNodeId}
              pathFilter={pathFilter}
              onSelect={(node) => updateContext({ nodeId: node.id })}
            />
          </Card>
          <PowerRedundancyTable
            data={redundancy}
            onOpen={(node) => updateContext({ nodeId: node.id })}
          />
        </>
      )}
      <PowerDetailDrawer
        node={selectedNode}
        nodes={nodes}
        links={links}
        onClose={() => updateContext({ nodeId: undefined })}
        onSimulate={(node) => void handleSimulate(node)}
      />
      <PowerFailureModal
        simulation={simulation}
        nodes={nodes}
        loading={simulationLoading}
        onClose={() => {
          setSimulation(undefined);
          setSimulationLoading(false);
        }}
      />
    </PageContainer>
  );
};

export default PowerPage;
