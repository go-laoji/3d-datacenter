import { PageContainer } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import {
  Alert,
  Badge,
  Button,
  Card,
  message,
  Select,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getTopology,
  type NetworkTopologyEdge,
  type NetworkTopologyNode,
} from '@/services/idc/dashboard';
import { getAllDatacenters } from '@/services/idc/datacenter';
import TopologyCanvas from './components/TopologyCanvas';
import TopologyControls from './components/TopologyControls';
import TopologyDetailDrawer from './components/TopologyDetailDrawer';
import styles from './index.less';
import { connectionColors, typeColors } from './nodes';
import {
  aggregateByCabinet,
  filterTopology,
  findTopologyPath,
  type TopologyView,
} from './topologyModel';

const TopologyPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [datacenters, setDatacenters] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedDc, setSelectedDc] = useState<string>();
  const [nodes, setNodes] = useState<NetworkTopologyNode[]>([]);
  const [edges, setEdges] = useState<NetworkTopologyEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<TopologyView>(
    (searchParams.get('view') as TopologyView) || 'physical',
  );
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');
  const [status, setStatus] = useState(searchParams.get('status') ?? undefined);
  const [onlyAbnormal, setOnlyAbnormal] = useState(
    searchParams.get('abnormal') === 'true',
  );
  const [focusedId, setFocusedId] = useState(
    searchParams.get('deviceId') ?? undefined,
  );
  const [pathSource, setPathSource] = useState<string>();
  const [pathTarget, setPathTarget] = useState<string>();
  const [selectedNode, setSelectedNode] = useState<NetworkTopologyNode>();
  const [selectedEdge, setSelectedEdge] = useState<NetworkTopologyEdge>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saveToken, setSaveToken] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const updateUrl = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    void getAllDatacenters().then((result) => {
      if (!result.success || !result.data?.length) return;
      setDatacenters(result.data);
      const requested = searchParams.get('datacenterId');
      const target =
        result.data.find((dc) => dc.id === requested)?.id ?? result.data[0].id;
      setSelectedDc(target);
    });
  }, []);

  useEffect(() => {
    if (!selectedDc) return;
    setLoading(true);
    void getTopology(selectedDc)
      .then((result) => {
        if (!result.success || !result.data) return;
        setNodes(result.data.nodes);
        setEdges(result.data.edges);
        const requestedDevice = searchParams.get('deviceId');
        const requestedConnection = searchParams.get('connectionId');
        if (requestedDevice) {
          const node = result.data.nodes.find(
            (item) => item.id === requestedDevice,
          );
          if (node) {
            setFocusedId(node.id);
            setSelectedNode(node);
            setDrawerOpen(true);
          } else message.warning('拓扑中没有找到目标设备');
        } else if (requestedConnection) {
          const edge = result.data.edges.find(
            (item) => item.id === requestedConnection,
          );
          if (edge) {
            setSelectedEdge(edge);
            setDrawerOpen(true);
          } else message.warning('拓扑中没有找到目标连接');
        }
      })
      .finally(() => setLoading(false));
  }, [selectedDc]);

  const viewTopology = useMemo(() => {
    if (view === 'cabinet') return aggregateByCabinet(nodes, edges);
    if (view === 'business') {
      const businessEdges = edges.filter((edge) => edge.type !== 'management');
      const ids = new Set(
        businessEdges.flatMap((edge) => [edge.source, edge.target]),
      );
      return {
        nodes: nodes.filter((node) => ids.has(node.id)),
        edges: businessEdges,
      };
    }
    return { nodes, edges };
  }, [nodes, edges, view]);
  const visible = useMemo(
    () =>
      filterTopology(viewTopology.nodes, viewTopology.edges, {
        keyword,
        status,
        onlyAbnormal,
      }),
    [viewTopology, keyword, status, onlyAbnormal],
  );
  const nodeMap = useMemo(
    () => new Map(viewTopology.nodes.map((node) => [node.id, node])),
    [viewTopology.nodes],
  );
  const path = useMemo(
    () =>
      pathSource && pathTarget
        ? findTopologyPath(viewTopology.edges, pathSource, pathTarget)
        : [],
    [viewTopology.edges, pathSource, pathTarget],
  );
  const highlightedIds = useMemo(() => {
    const ids = [...path];
    for (let index = 0; index < path.length - 1; index += 1) {
      const edge = viewTopology.edges.find(
        (item) =>
          (item.source === path[index] && item.target === path[index + 1]) ||
          (item.target === path[index] && item.source === path[index + 1]),
      );
      if (edge) ids.push(edge.id);
    }
    return ids;
  }, [path, viewTopology.edges]);

  const selectNode = (id: string) => {
    const node = nodeMap.get(id);
    if (!node) return;
    setSelectedNode(node);
    setSelectedEdge(undefined);
    setDrawerOpen(true);
    updateUrl({
      deviceId: id.startsWith('cabinet:') ? undefined : id,
      connectionId: undefined,
    });
  };
  const selectEdge = (id: string) => {
    const edge = viewTopology.edges.find((item) => item.id === id);
    if (!edge) return;
    setSelectedEdge(edge);
    setSelectedNode(undefined);
    setDrawerOpen(true);
    updateUrl({ connectionId: edge.id, deviceId: undefined });
  };

  const toggleFullscreen = async () => {
    if (!cardRef.current) return;
    if (!document.fullscreenElement) await cardRef.current.requestFullscreen();
    else await document.exitFullscreen();
    setFullscreen(!fullscreen);
  };

  return (
    <PageContainer
      header={{
        title: '网络拓扑',
        subTitle: '搜索、聚合、定位并分析设备与物理链路路径',
      }}
    >
      {pathSource && pathTarget ? (
        <Alert
          type={path.length ? 'info' : 'warning'}
          showIcon
          message={
            path.length
              ? `已高亮 ${path.length} 个节点的最短路径`
              : '两个端点之间没有可达路径'
          }
          description={path
            .map((id) => nodeMap.get(id)?.label ?? id)
            .join(' → ')}
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <Card ref={cardRef} style={{ background: '#fff' }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Typography.Text strong>数据中心</Typography.Text>
          <Select
            value={selectedDc}
            onChange={(value) => {
              setSelectedDc(value);
              updateUrl({ datacenterId: value });
            }}
            options={datacenters.map((dc) => ({
              value: dc.id,
              label: dc.name,
            }))}
            style={{ width: 240 }}
          />
          <Tooltip title={fullscreen ? '退出全屏' : '全屏模式'}>
            <Button
              icon={
                fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />
              }
              onClick={toggleFullscreen}
            >
              {fullscreen ? '退出全屏' : '全屏'}
            </Button>
          </Tooltip>
        </Space>
        <TopologyControls
          view={view}
          keyword={keyword}
          status={status}
          onlyAbnormal={onlyAbnormal}
          nodes={viewTopology.nodes}
          pathSource={pathSource}
          pathTarget={pathTarget}
          onViewChange={(value) => {
            setView(value);
            setPathSource(undefined);
            setPathTarget(undefined);
            updateUrl({ view: value });
          }}
          onKeywordChange={(value) => {
            setKeyword(value);
            updateUrl({ keyword: value || undefined });
          }}
          onStatusChange={(value) => {
            setStatus(value);
            updateUrl({ status: value });
          }}
          onOnlyAbnormalChange={(value) => {
            setOnlyAbnormal(value);
            updateUrl({ abnormal: value ? 'true' : undefined });
          }}
          onFocus={(id) => {
            setFocusedId(id);
            selectNode(id);
          }}
          onPathSourceChange={setPathSource}
          onPathTargetChange={setPathTarget}
          onSave={() => setSaveToken((value) => value + 1)}
        />
        <div className={styles.legend}>
          <Space wrap>
            <Badge color={typeColors.switch} text="交换机" />
            <Badge color={typeColors.server} text="服务器" />
            <Badge color={typeColors.storage} text="存储" />
            <Badge color={typeColors.firewall} text="防火墙" />
            <Badge color={connectionColors.network} text="网络链路" />
            <Badge color="#ff4d4f" text="故障链路" />
          </Space>
        </div>
        <div className={styles.topologyContainer}>
          <TopologyCanvas
            datacenterId={selectedDc ?? 'unknown'}
            view={view}
            nodes={visible.nodes}
            edges={visible.edges}
            loading={loading}
            highlightedIds={highlightedIds}
            focusedId={focusedId}
            saveToken={saveToken}
            onNodeSelect={selectNode}
            onEdgeSelect={selectEdge}
            onSaved={() =>
              message.success('拓扑布局已保存，下次进入会自动恢复')
            }
          />
        </div>
        <section className={styles.accessibleList} aria-label="拓扑对象列表">
          <Typography.Text strong>列表替代视图</Typography.Text>
          <Space wrap>
            {visible.nodes.map((node) => (
              <Button
                key={node.id}
                size="small"
                danger={node.status !== 'online'}
                onClick={() => selectNode(node.id)}
              >
                {node.label}
              </Button>
            ))}
          </Space>
        </section>
      </Card>
      <TopologyDetailDrawer
        open={drawerOpen}
        node={selectedNode}
        edge={selectedEdge}
        nodeMap={nodeMap}
        onClose={() => {
          setDrawerOpen(false);
          updateUrl({ deviceId: undefined, connectionId: undefined });
        }}
      />
    </PageContainer>
  );
};

export default TopologyPage;
