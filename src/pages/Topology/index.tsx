import { PageContainer } from '@ant-design/pro-components';
import { Graph } from '@antv/g6';
import { Badge, Card, Empty, Select, Space, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { getTopology } from '@/services/idc/dashboard';
import { getAllDatacenters } from '@/services/idc/datacenter';
import styles from './index.less';
import { connectionColors, getNodeStyleByType, typeColors } from './nodes';

interface TopologyNode {
  id: string;
  label: string;
  type: string;
  status: string;
  x?: number;
  y?: number;
}

interface TopologyEdge {
  source: string;
  target: string;
  type: string;
}

const TopologyPage: React.FC = () => {
  const [datacenters, setDatacenters] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedDc, setSelectedDc] = useState<string>();
  const [nodes, setNodes] = useState<TopologyNode[]>([]);
  const [edges, setEdges] = useState<TopologyEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [graphReady, setGraphReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);

  // 加载数据中心列表
  useEffect(() => {
    getAllDatacenters().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setDatacenters(res.data);
        setSelectedDc(res.data[0].id);
      }
    });
  }, []);

  // 加载拓扑数据
  useEffect(() => {
    if (selectedDc) {
      setLoading(true);
      setGraphReady(false);
      getTopology(selectedDc)
        .then((res) => {
          if (res.success && res.data) {
            setNodes(res.data.nodes || []);
            setEdges(res.data.edges || []);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [selectedDc]);

  // 初始化和更新图
  useEffect(() => {
    // 确保容器存在且有数据
    if (!containerRef.current || nodes.length === 0 || loading) {
      return;
    }

    // 转换数据为 G6 格式
    const g6Data = {
      nodes: nodes.map((node) => ({
        id: node.id,
        data: {
          label: node.label,
          type: node.type,
          status: node.status,
        },
        style: getNodeStyleByType(node.type),
      })),
      edges: edges.map((edge) => ({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        data: {
          type: edge.type,
        },
        style: {
          stroke: connectionColors[edge.type] || '#d9d9d9',
          lineWidth: 2,
          endArrow: true,
        },
      })),
    };

    // 如果图已存在且未销毁，销毁旧图
    if (graphRef.current) {
      try {
        graphRef.current.destroy();
      } catch (e) {
        console.warn('Graph destroy error:', e);
      }
      graphRef.current = null;
    }

    // 创建新图
    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.clientWidth || 800,
      height: 600,
      autoFit: 'view',
      padding: [40, 40, 40, 40],
      data: g6Data,
      layout: {
        type: 'force',
        preventOverlap: true,
        nodeSize: 80,
        nodeStrength: -200,
        edgeStrength: 0.3,
        gravity: 0.1,
        linkDistance: 150,
      },
      node: {
        style: {
          labelText: (d: any) => {
            const label = d.data?.label || d.id;
            return label.length > 8 ? `${label.slice(0, 8)}...` : label;
          },
          labelPlacement: 'bottom',
          labelFill: '#262626',
          labelFontSize: 11,
          labelFontWeight: 500,
          labelOffsetY: 8,
        },
        state: {
          hover: {
            lineWidth: 3,
            shadowBlur: 15,
          },
          selected: {
            lineWidth: 3,
            stroke: '#1890ff',
          },
        },
      },
      edge: {
        style: {
          lineWidth: 2,
          endArrow: true,
          endArrowSize: 6,
        },
        state: {
          hover: {
            lineWidth: 3,
          },
          selected: {
            lineWidth: 3,
            stroke: '#1890ff',
          },
        },
      },
      behaviors: [
        'drag-canvas',
        'zoom-canvas',
        'drag-element',
        {
          type: 'hover-activate',
          degree: 1,
          state: 'hover',
        },
      ],
      plugins: [
        {
          type: 'tooltip',
          getContent: (_e: any, items: any[]) => {
            if (!items || items.length === 0) return '';
            const item = items[0];
            const data = item.data || {};
            const typeLabel: Record<string, string> = {
              switch: '交换机',
              router: '路由器',
              server: '服务器',
              storage: '存储',
              firewall: '防火墙',
              loadbalancer: '负载均衡',
              other: '其他',
            };
            const statusLabel: Record<string, string> = {
              online: '在线',
              warning: '告警',
              offline: '离线',
            };
            return `
                            <div style="padding: 8px 12px; font-size: 13px;">
                                <div style="font-weight: bold; margin-bottom: 4px;">${data.label || item.id}</div>
                                <div>类型: ${typeLabel[data.type] || data.type}</div>
                                <div>状态: ${statusLabel[data.status] || data.status}</div>
                            </div>
                        `;
          },
        },
      ],
    });

    graphRef.current = graph;

    // 渲染图
    graph
      .render()
      .then(() => {
        setGraphReady(true);
      })
      .catch((err: Error) => {
        console.error('Graph render error:', err);
      });

    // 清理函数
    return () => {
      if (graphRef.current) {
        try {
          graphRef.current.destroy();
        } catch (e) {
          console.warn('Graph cleanup error:', e);
        }
        graphRef.current = null;
      }
    };
  }, [nodes, edges, loading]);

  // 窗口大小变化时调整图大小
  useEffect(() => {
    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
        try {
          graphRef.current.setSize(containerRef.current.clientWidth, 600);
        } catch (e) {
          console.warn('Graph resize error:', e);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <PageContainer
      header={{
        title: '网络拓扑',
        subTitle: '可视化查看设备网络连接关系',
      }}
    >
      <Card>
        <Space style={{ marginBottom: 16 }}>
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
        </Space>

        <div className={styles.legend}>
          <Space size={16}>
            <span style={{ color: '#8c8c8c' }}>设备类型：</span>
            <Badge color={typeColors.switch} text="交换机" />
            <Badge color={typeColors.router} text="路由器" />
            <Badge color={typeColors.server} text="服务器" />
            <Badge color={typeColors.storage} text="存储" />
            <Badge color={typeColors.firewall} text="防火墙" />
            <Badge color={typeColors.loadbalancer} text="负载均衡" />
          </Space>
          <Space size={16} style={{ marginLeft: 32 }}>
            <span style={{ color: '#8c8c8c' }}>连线类型：</span>
            <Badge color={connectionColors.network} text="网络" />
            <Badge color={connectionColors.storage} text="存储" />
            <Badge color={connectionColors.management} text="管理" />
          </Space>
        </div>

        <div className={styles.topologyContainer}>
          {loading ? (
            <div className={styles.loadingWrapper}>
              <Spin size="large" tip="加载拓扑数据中..." />
            </div>
          ) : nodes.length === 0 ? (
            <Empty description="暂无拓扑数据" style={{ padding: 100 }} />
          ) : (
            <div
              ref={containerRef}
              className={styles.graphContainer}
              style={{ opacity: graphReady ? 1 : 0.3 }}
            />
          )}
        </div>
      </Card>
    </PageContainer>
  );
};

export default TopologyPage;
