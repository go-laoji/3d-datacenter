/**
 * 电源拓扑图形组件
 * 使用 @antv/g6 实现分层布局展示电源链路
 */
import { Graph } from '@antv/g6';
import { Empty, Spin } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import type { PowerLink, PowerNode } from '@/services/idc/power';
import styles from './index.less';
import {
  getEdgeColor,
  getNodeStyleByPowerType,
  powerPathColors,
  powerTypeColors,
} from './nodes';

interface PowerTopologyGraphProps {
  nodes: PowerNode[];
  links: PowerLink[];
  loading?: boolean;
}

const PowerTopologyGraph: React.FC<PowerTopologyGraphProps> = ({
  nodes,
  links,
  loading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const [graphReady, setGraphReady] = useState(false);

  // 初始化和更新图
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0 || loading) {
      return;
    }

    // 转换数据为 G6 格式
    const g6Data = {
      nodes: nodes.map((node) => ({
        id: node.id,
        data: {
          label: node.name,
          type: node.type,
          status: node.status,
          load: node.load,
          capacity: node.capacity,
        },
        style: getNodeStyleByPowerType(node.type),
      })),
      edges: links.map((link) => ({
        id: link.id,
        source: link.source,
        target: link.target,
        data: {
          powerPath: link.powerPath,
          status: link.status,
        },
        style: {
          stroke: getEdgeColor(link.powerPath, link.status),
          lineWidth: 2,
          endArrow: true,
        },
      })),
    };

    // 如果图已存在，销毁旧图
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
      height: 500,
      autoFit: 'view',
      padding: [40, 60, 40, 60],
      data: g6Data,
      layout: {
        type: 'dagre',
        rankdir: 'TB', // 从上到下
        nodesep: 60, // 节点间距
        ranksep: 80, // 层间距
        align: 'UL',
      },
      node: {
        style: {
          labelText: (d: any) => {
            const label = d.data?.label || d.id;
            return label.length > 10 ? `${label.slice(0, 10)}...` : label;
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
              utility: '市电',
              ups: 'UPS',
              pdu: 'PDU',
              device: '设备',
            };
            const statusLabel: Record<string, string> = {
              online: '在线',
              warning: '告警',
              offline: '离线',
            };

            let loadInfo = '';
            if (data.capacity) {
              const loadPercent = data.load
                ? Math.round((data.load / data.capacity) * 100)
                : 0;
              loadInfo = `<div>负载: ${data.load || 0}W / ${data.capacity}W (${loadPercent}%)</div>`;
            } else if (data.load) {
              loadInfo = `<div>功耗: ${data.load}W</div>`;
            }

            return `
              <div style="padding: 8px 12px; font-size: 13px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${data.label || item.id}</div>
                <div>类型: ${typeLabel[data.type] || data.type}</div>
                <div>状态: ${statusLabel[data.status] || data.status}</div>
                ${loadInfo}
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
  }, [nodes, links, loading]);

  // 窗口大小变化时调整图大小
  useEffect(() => {
    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
        try {
          graphRef.current.setSize(containerRef.current.clientWidth, 500);
        } catch (e) {
          console.warn('Graph resize error:', e);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.powerTopologyContainer}>
      {/* 图例 */}
      <div className={styles.legend}>
        <div className={styles.legendSection}>
          <span className={styles.legendTitle}>节点类型：</span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendNode}
              style={{ borderColor: powerTypeColors.utility }}
            />
            市电
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendNode}
              style={{ borderColor: powerTypeColors.ups }}
            />
            UPS
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendNode}
              style={{ borderColor: powerTypeColors.pdu }}
            />
            PDU
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendNode}
              style={{ borderColor: powerTypeColors.device }}
            />
            设备
          </span>
        </div>
        <div className={styles.legendSection}>
          <span className={styles.legendTitle}>电源路径：</span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendLine}
              style={{ backgroundColor: powerPathColors.A }}
            />
            A路
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendLine}
              style={{ backgroundColor: powerPathColors.B }}
            />
            B路
          </span>
        </div>
      </div>

      {/* 图形区域 */}
      <div className={styles.graphWrapper}>
        {loading ? (
          <div className={styles.loadingWrapper}>
            <Spin size="large" tip="加载拓扑数据中..." />
          </div>
        ) : nodes.length === 0 ? (
          <Empty description="暂无电源拓扑数据" style={{ padding: 100 }} />
        ) : (
          <div
            ref={containerRef}
            className={styles.graphContainer}
            style={{ opacity: graphReady ? 1 : 0.3 }}
          />
        )}
      </div>
    </div>
  );
};

export default PowerTopologyGraph;
