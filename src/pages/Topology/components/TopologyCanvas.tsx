import type { IElementEvent } from '@antv/g6';
import { EdgeEvent, Graph, NodeEvent } from '@antv/g6';
import { Empty, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type {
  NetworkTopologyEdge,
  NetworkTopologyNode,
} from '@/services/idc/dashboard';
import styles from '../index.less';
import { connectionColors, getNodeStyleByType } from '../nodes';

interface Props {
  datacenterId: string;
  view: string;
  nodes: NetworkTopologyNode[];
  edges: NetworkTopologyEdge[];
  loading: boolean;
  highlightedIds: string[];
  focusedId?: string;
  saveToken: number;
  onNodeSelect: (id: string) => void;
  onEdgeSelect: (id: string) => void;
  onSaved: () => void;
}

const TopologyCanvas: React.FC<Props> = ({
  datacenterId,
  view,
  nodes,
  edges,
  loading,
  highlightedIds,
  focusedId,
  saveToken,
  onNodeSelect,
  onEdgeSelect,
  onSaved,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const [ready, setReady] = useState(false);
  const storageKey = `tddc-topology-layout:${datacenterId}:${view}`;

  useEffect(() => {
    if (!containerRef.current || loading || !nodes.length) return;
    graphRef.current?.destroy();
    setReady(false);
    const saved = JSON.parse(
      localStorage.getItem(storageKey) ?? '{}',
    ) as Record<string, { x: number; y: number }>;
    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.clientWidth || 800,
      height: 620,
      autoFit: 'view',
      padding: 48,
      data: {
        nodes: nodes.map((node) => ({
          id: node.id,
          data: { ...node },
          style: {
            ...getNodeStyleByType(node.type),
            x: saved[node.id]?.x ?? node.x,
            y: saved[node.id]?.y ?? node.y,
          },
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: { ...edge },
          style: {
            stroke:
              edge.status === 'faulty'
                ? '#ff4d4f'
                : (connectionColors[edge.type] ?? '#d9d9d9'),
            lineWidth: edge.status === 'faulty' ? 4 : 2,
            endArrow: true,
          },
        })),
      },
      node: {
        style: {
          labelText: (datum) => {
            const label = String(datum.data?.label ?? datum.id);
            return label.length > 12 ? `${label.slice(0, 12)}…` : label;
          },
          labelPlacement: 'bottom',
          labelFontSize: 11,
          labelOffsetY: 8,
        },
        state: {
          selected: { lineWidth: 4, stroke: '#1677ff', shadowBlur: 16 },
          highlight: { lineWidth: 4, stroke: '#faad14' },
        },
      },
      edge: {
        state: {
          highlight: { lineWidth: 5, stroke: '#faad14' },
          selected: { lineWidth: 5, stroke: '#1677ff' },
        },
      },
      behaviors: [
        'drag-canvas',
        'zoom-canvas',
        'drag-element',
        { type: 'hover-activate', degree: 1, state: 'hover' },
      ],
    });
    graph.on(NodeEvent.CLICK, (event) =>
      onNodeSelect(String((event as IElementEvent).target.id)),
    );
    graph.on(EdgeEvent.CLICK, (event) =>
      onEdgeSelect(String((event as IElementEvent).target.id)),
    );
    graphRef.current = graph;
    void graph.render().then(() => setReady(true));
    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [nodes, edges, loading, datacenterId, view]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !ready) return;
    const states = Object.fromEntries(
      [...nodes.map((node) => node.id), ...edges.map((edge) => edge.id)].map(
        (id) => [id, highlightedIds.includes(id) ? ['highlight'] : []],
      ),
    );
    void graph.setElementState(states, true);
  }, [highlightedIds, ready]);

  useEffect(() => {
    if (focusedId && graphRef.current && ready)
      void graphRef.current.focusElement(focusedId, { duration: 400 });
  }, [focusedId, ready]);

  useEffect(() => {
    if (!saveToken || !graphRef.current || !ready) return;
    const graph = graphRef.current;
    const positions = Object.fromEntries(
      nodes.map((node) => [node.id, graph.getElementPosition(node.id)]),
    );
    localStorage.setItem(storageKey, JSON.stringify(positions));
    onSaved();
  }, [saveToken]);

  if (loading)
    return (
      <div className={styles.loadingWrapper}>
        <Spin size="large" />
        <span>加载拓扑数据中…</span>
      </div>
    );
  if (!nodes.length)
    return (
      <Empty description="当前筛选下没有拓扑对象" style={{ padding: 120 }} />
    );
  return (
    <div
      ref={containerRef}
      className={styles.graphContainer}
      style={{ opacity: ready ? 1 : 0.35 }}
      role="img"
      aria-label={`网络拓扑，共 ${nodes.length} 个节点、${edges.length} 条链路`}
    />
  );
};

export default TopologyCanvas;
