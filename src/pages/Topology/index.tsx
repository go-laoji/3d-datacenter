import { PageContainer } from '@ant-design/pro-components';
import { Card, Select, Space, Badge, Tooltip, Empty } from 'antd';
import { useEffect, useState, useCallback } from 'react';
import {
    Server,
    Database,
    Shield,
    Router,
    Monitor,
    Layers,
    HardDrive,
} from 'lucide-react';
import { getTopology } from '@/services/idc/dashboard';
import { getAllDatacenters } from '@/services/idc/datacenter';
import styles from './index.less';

interface TopologyNode {
    id: string;
    label: string;
    type: string;
    status: string;
    x: number;
    y: number;
}

interface TopologyEdge {
    source: string;
    target: string;
    type: string;
}

const typeIcons: Record<string, React.ReactNode> = {
    switch: <Monitor size={20} />,
    router: <Router size={20} />,
    server: <Server size={20} />,
    storage: <Database size={20} />,
    firewall: <Shield size={20} />,
    loadbalancer: <Layers size={20} />,
    other: <HardDrive size={20} />,
};

const typeColors: Record<string, string> = {
    switch: '#1890ff',
    router: '#52c41a',
    server: '#722ed1',
    storage: '#faad14',
    firewall: '#f5222d',
    loadbalancer: '#13c2c2',
    other: '#8c8c8c',
};

const connectionColors: Record<string, string> = {
    network: '#1890ff',
    storage: '#faad14',
    management: '#52c41a',
    power: '#f5222d',
};

const TopologyPage: React.FC = () => {
    const [datacenters, setDatacenters] = useState<{ id: string; name: string }[]>([]);
    const [selectedDc, setSelectedDc] = useState<string>();
    const [nodes, setNodes] = useState<TopologyNode[]>([]);
    const [edges, setEdges] = useState<TopologyEdge[]>([]);
    const [loading, setLoading] = useState(false);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    useEffect(() => {
        getAllDatacenters().then(res => {
            if (res.success && res.data && res.data.length > 0) {
                setDatacenters(res.data);
                setSelectedDc(res.data[0].id);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedDc) {
            setLoading(true);
            getTopology(selectedDc).then(res => {
                if (res.success && res.data) {
                    setNodes(res.data.nodes);
                    setEdges(res.data.edges);
                }
            }).finally(() => setLoading(false));
        }
    }, [selectedDc]);

    const renderEdges = useCallback(() => {
        return edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;

            return (
                <line
                    key={`${edge.source}-${edge.target}`}
                    x1={sourceNode.x + 40}
                    y1={sourceNode.y + 30}
                    x2={targetNode.x + 40}
                    y2={targetNode.y + 30}
                    stroke={connectionColors[edge.type] || '#d9d9d9'}
                    strokeWidth={isHighlighted ? 3 : 2}
                    strokeOpacity={hoveredNode ? (isHighlighted ? 1 : 0.2) : 0.6}
                    style={{ transition: 'all 0.3s ease' }}
                />
            );
        });
    }, [nodes, edges, hoveredNode]);

    const renderNodes = useCallback(() => {
        return nodes.map((node) => {
            const isHighlighted = hoveredNode === node.id ||
                edges.some(e => (e.source === node.id || e.target === node.id) &&
                    (e.source === hoveredNode || e.target === hoveredNode));

            return (
                <Tooltip
                    key={node.id}
                    title={
                        <div>
                            <div><strong>{node.label}</strong></div>
                            <div>类型: {node.type}</div>
                            <div>状态: {node.status}</div>
                        </div>
                    }
                >
                    <g
                        transform={`translate(${node.x}, ${node.y})`}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{ cursor: 'pointer' }}
                    >
                        <rect
                            width={80}
                            height={60}
                            rx={8}
                            fill={hoveredNode && !isHighlighted ? '#f5f5f5' : '#fff'}
                            stroke={typeColors[node.type] || '#d9d9d9'}
                            strokeWidth={isHighlighted ? 3 : 2}
                            style={{ transition: 'all 0.3s ease' }}
                        />
                        <foreignObject x={0} y={8} width={80} height={24}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                color: typeColors[node.type],
                            }}>
                                {typeIcons[node.type] || typeIcons.other}
                            </div>
                        </foreignObject>
                        <text
                            x={40}
                            y={48}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#262626"
                            style={{ fontWeight: 500 }}
                        >
                            {node.label.length > 8 ? `${node.label.slice(0, 8)}...` : node.label}
                        </text>
                        <circle
                            cx={70}
                            cy={10}
                            r={5}
                            fill={node.status === 'online' ? '#52c41a' : node.status === 'warning' ? '#faad14' : '#f5222d'}
                        />
                    </g>
                </Tooltip>
            );
        });
    }, [nodes, edges, hoveredNode]);

    return (
        <PageContainer
            header={{
                title: '网络拓扑',
                subTitle: '可视化查看设备网络连接关系',
            }}
        >
            <Card loading={loading}>
                <Space style={{ marginBottom: 16 }}>
                    <span>选择数据中心：</span>
                    <Select
                        placeholder="请选择数据中心"
                        style={{ width: 250 }}
                        value={selectedDc}
                        onChange={setSelectedDc}
                        options={datacenters.map(dc => ({ value: dc.id, label: dc.name }))}
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
                    {nodes.length > 0 ? (
                        <svg width="100%" height={600} viewBox="0 0 800 600" role="img" aria-labelledby="topology-title">
                            <title id="topology-title">网络拓扑图</title>
                            <defs>
                                <filter id="shadow">
                                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
                                </filter>
                            </defs>
                            <g filter="url(#shadow)">
                                {renderEdges()}
                                {renderNodes()}
                            </g>
                        </svg>
                    ) : (
                        <Empty description="暂无拓扑数据" style={{ padding: 100 }} />
                    )}
                </div>
            </Card>
        </PageContainer>
    );
};

export default TopologyPage;
