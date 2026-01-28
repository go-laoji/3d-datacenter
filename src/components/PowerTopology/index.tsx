/**
 * 电源拓扑可视化组件
 * 展示市电→UPS→PDU→设备的完整电源链路
 */

import { Badge, Card, Space, Spin, Tag, Tooltip } from 'antd';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Server,
  Shield,
  Zap,
} from 'lucide-react';
import React, { useMemo } from 'react';
import {
  type PowerLink,
  type PowerNode,
  usePowerStore,
} from '@/stores/powerStore';

// 节点颜色配置
const nodeColors: Record<string, { bg: string; border: string; text: string }> =
  {
    utility: { bg: '#f9f0ff', border: '#722ed1', text: '#722ed1' },
    ups: { bg: '#e6f7ff', border: '#1890ff', text: '#1890ff' },
    pdu: { bg: '#e6fffb', border: '#13c2c2', text: '#13c2c2' },
    device: { bg: '#f6ffed', border: '#52c41a', text: '#52c41a' },
  };

// 电源路径颜色
const pathColors = {
  A: { line: '#1890ff', bg: '#e6f7ff', label: 'A路电源' },
  B: { line: '#52c41a', bg: '#f6ffed', label: 'B路电源' },
};

// 状态图标
const statusIcons: Record<string, React.ReactNode> = {
  online: <CheckCircle size={12} style={{ color: '#52c41a' }} />,
  offline: <AlertTriangle size={12} style={{ color: '#8c8c8c' }} />,
  warning: <AlertTriangle size={12} style={{ color: '#faad14' }} />,
};

// 节点组件
const TopologyNode: React.FC<{
  node: PowerNode;
  position: { x: number; y: number };
  onClick?: (node: PowerNode) => void;
}> = ({ node, position, onClick }) => {
  const colors = nodeColors[node.type] || nodeColors.device;

  const icons: Record<string, React.ReactNode> = {
    utility: <Zap size={20} />,
    ups: <Activity size={20} />,
    pdu: <Shield size={20} />,
    device: <Server size={20} />,
  };

  const loadPercent =
    node.capacity && node.load
      ? Math.round((node.load / node.capacity) * 100)
      : null;

  return (
    <Tooltip
      title={
        <div>
          <div>
            <strong>{node.name}</strong>
          </div>
          <div>类型: {node.type}</div>
          <div>状态: {node.status}</div>
          {loadPercent !== null && <div>负载: {loadPercent}%</div>}
        </div>
      }
    >
      <div
        onClick={() => onClick?.(node)}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: 100,
          padding: '8px',
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: 8,
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ color: colors.text, marginBottom: 4 }}>
          {icons[node.type]}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#333',
            marginBottom: 2,
          }}
        >
          {node.name}
        </div>
        <Space size={4}>
          {statusIcons[node.status]}
          {loadPercent !== null && (
            <Tag
              color={
                loadPercent > 80 ? 'red' : loadPercent > 60 ? 'orange' : 'green'
              }
              style={{ fontSize: 10, margin: 0 }}
            >
              {loadPercent}%
            </Tag>
          )}
        </Space>
      </div>
    </Tooltip>
  );
};

// 连线组件 (使用SVG)
const TopologyLinks: React.FC<{
  links: PowerLink[];
  nodePositions: Record<string, { x: number; y: number }>;
}> = ({ links, nodePositions }) => {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      role="img"
      aria-label="电源链路图"
    >
      <title>电源链路连接图</title>
      <defs>
        <marker
          id="arrowhead-A"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={pathColors.A.line} />
        </marker>
        <marker
          id="arrowhead-B"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={pathColors.B.line} />
        </marker>
      </defs>
      {links.map((link) => {
        const from = nodePositions[link.source];
        const to = nodePositions[link.target];
        if (!from || !to) return null;

        const color = pathColors[link.powerPath]?.line || '#999';
        const isActive = link.status === 'active';
        const isFault = link.status === 'fault';

        // 计算连线的起点和终点(从节点中心偏移)
        const x1 = from.x + 50; // 节点宽度100的一半
        const y1 = from.y + 40; // 节点高度约80的一半
        const x2 = to.x + 50;
        const y2 = to.y + 40;

        return (
          <g key={link.id}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isFault ? '#f5222d' : color}
              strokeWidth={isActive ? 3 : 1}
              strokeDasharray={isActive ? 'none' : '5,5'}
              opacity={isActive ? 1 : 0.5}
              markerEnd={`url(#arrowhead-${link.powerPath})`}
            />
            {/* 电源路径标签 */}
            <text
              x={(x1 + x2) / 2}
              y={(y1 + y2) / 2 - 8}
              fill={color}
              fontSize={10}
              textAnchor="middle"
            >
              {link.powerPath}路
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// 主组件
interface PowerTopologyProps {
  onNodeClick?: (node: PowerNode) => void;
  height?: number;
}

export const PowerTopology: React.FC<PowerTopologyProps> = ({
  onNodeClick,
  height = 500,
}) => {
  const { powerTopology } = usePowerStore();
  const { nodes, links } = powerTopology;

  // 按层级分组节点
  const groupedNodes = useMemo(() => {
    const groups: Record<string, PowerNode[]> = {
      utility: [],
      ups: [],
      pdu: [],
      device: [],
    };
    nodes.forEach((node) => {
      if (groups[node.type]) {
        groups[node.type].push(node);
      }
    });
    return groups;
  }, [nodes]);

  // 计算节点位置(自动布局)
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const layerY = { utility: 20, ups: 130, pdu: 240, device: 350 };
    const containerWidth = 800;

    Object.entries(groupedNodes).forEach(([type, typeNodes]) => {
      const y = layerY[type as keyof typeof layerY] || 0;
      const spacing = containerWidth / (typeNodes.length + 1);

      typeNodes.forEach((node, index) => {
        positions[node.id] = {
          x: spacing * (index + 1) - 50, // 减去节点宽度的一半
          y,
        };
      });
    });

    return positions;
  }, [groupedNodes]);

  if (nodes.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
          <div style={{ marginTop: 16, color: '#999' }}>
            加载电源拓扑数据...
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <Zap size={16} style={{ color: '#722ed1' }} />
          电源拓扑
        </Space>
      }
      extra={
        <Space>
          <Badge color={pathColors.A.line} text="A路电源" />
          <Badge color={pathColors.B.line} text="B路电源" />
        </Space>
      }
    >
      {/* 层级标签 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Tag color="purple">市电输入</Tag>
        <Tag color="blue">UPS</Tag>
        <Tag color="cyan">PDU</Tag>
        <Tag color="green">终端设备</Tag>
      </div>

      {/* 拓扑图 */}
      <div
        style={{
          position: 'relative',
          height,
          background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
          borderRadius: 8,
          border: '1px solid #e8e8e8',
          overflow: 'auto',
        }}
      >
        {/* 连线层 */}
        <TopologyLinks links={links} nodePositions={nodePositions} />

        {/* 节点层 */}
        {nodes.map((node) => (
          <TopologyNode
            key={node.id}
            node={node}
            position={nodePositions[node.id] || { x: 0, y: 0 }}
            onClick={onNodeClick}
          />
        ))}
      </div>
    </Card>
  );
};

export default PowerTopology;
