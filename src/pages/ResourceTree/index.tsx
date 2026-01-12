import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Tree, Card, Spin, Input, Tag, Empty, Button, Divider } from 'antd';
import { history } from '@umijs/max';
import {
    DatabaseOutlined,
    HddOutlined,
    SearchOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { Server, HardDrive, Router, Shield, Database, Box, Wifi, WifiOff, AlertTriangle, Settings } from 'lucide-react';
import type { DataNode } from 'antd/es/tree';
import { getAllDatacenters } from '@/services/idc/datacenter';
import { getCabinetsByDatacenter } from '@/services/idc/cabinet';
import { getDevicesByCabinet } from '@/services/idc/device';
import { getAllDeviceTemplates } from '@/services/idc/deviceTemplate';
import { CabinetFrontViewContent } from '@/components/CabinetFrontView';
import { DevicePortViewContent } from '@/components/DevicePortView';
import styles from './index.less';

const { Search } = Input;

// 设备类型图标 - 与组件保持一致
const deviceIcons: Record<string, React.ReactNode> = {
    switch: <Server size={16} />,
    router: <Router size={16} />,
    server: <HardDrive size={16} />,
    storage: <Database size={16} />,
    firewall: <Shield size={16} />,
    loadbalancer: <Box size={16} />,
    other: <Box size={16} />,
};

// 状态标签颜色
const statusColors: Record<string, string> = {
    online: 'success',
    warning: 'warning',
    error: 'error',
    offline: 'default',
    active: 'processing',
    maintenance: 'orange',
    normal: 'cyan',
};

// 设备状态配置
const deviceStatusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
    online: { color: '#52c41a', icon: <Wifi size={12} />, text: '在线' },
    offline: { color: '#8c8c8c', icon: <WifiOff size={12} />, text: '离线' },
    warning: { color: '#faad14', icon: <AlertTriangle size={12} />, text: '告警' },
    error: { color: '#f5222d', icon: <AlertTriangle size={12} />, text: '故障' },
    maintenance: { color: '#1890ff', icon: <Settings size={12} />, text: '维护' },
};

const ResourceTree: React.FC = () => {
    const [treeData, setTreeData] = useState<DataNode[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [templates, setTemplates] = useState<any[]>([]);

    // 机柜视图数据
    const [cabinetDevices, setCabinetDevices] = useState<IDC.Device[]>([]);
    const [cabinetLoading, setCabinetLoading] = useState(false);

    // 加载数据
    useEffect(() => {
        loadDatacenters();
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const res = await getAllDeviceTemplates();
            if (res.success && res.data) {
                setTemplates(res.data);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    };

    const loadDatacenters = async () => {
        setLoading(true);
        try {
            const res = await getAllDatacenters();
            if (res.success && res.data) {
                const nodes: DataNode[] = res.data.map((dc: any) => ({
                    title: (
                        <span className={styles.nodeTitle}>
                            <DatabaseOutlined className={styles.dcIcon} />
                            <span className={styles.nodeName}>{dc.name}</span>
                            <Tag color="blue" className={styles.nodeTag}>{dc.code}</Tag>
                        </span>
                    ),
                    key: `dc-${dc.id}`,
                    // icon: <DatabaseOutlined />,
                    data: { ...dc, type: 'datacenter' },
                    children: [],
                    isLeaf: false,
                }));
                setTreeData(nodes);
            }
        } catch (error) {
            console.error('Failed to load datacenters:', error);
        } finally {
            setLoading(false);
        }
    };

    // 动态加载子节点
    const onLoadData = async (node: any): Promise<void> => {
        const { key, data } = node;

        if (data.type === 'datacenter') {
            try {
                const res = await getCabinetsByDatacenter(data.id);
                if (res.success && res.data) {
                    const children: DataNode[] = res.data.map((cab: any) => ({
                        title: (
                            <span className={styles.nodeTitle}>
                                <HddOutlined className={styles.cabIcon} />
                                <span className={styles.nodeName}>{cab.name}</span>
                                <Tag color={statusColors[cab.status] || 'default'} className={styles.nodeTag}>
                                    {cab.status}
                                </Tag>
                                <span className={styles.nodeInfo}>
                                    U位: {cab.usedU || 0}/{cab.uHeight || 42}
                                </span>
                            </span>
                        ),
                        key: `cab-${cab.id}`,
                        data: { ...cab, type: 'cabinet' },
                        children: [],
                        isLeaf: false,
                    }));
                    updateTreeData(key, children);
                }
            } catch (error) {
                console.error('Failed to load cabinets:', error);
            }
        } else if (data.type === 'cabinet') {
            try {
                const res = await getDevicesByCabinet(data.id);
                if (res.success && res.data) {
                    const children: DataNode[] = res.data.map((dev: any) => {
                        const tpl = templates.find((t: any) => t.id === dev.templateId);
                        const category = tpl?.category || 'other';
                        const statusConf = deviceStatusConfig[dev.status] || deviceStatusConfig.offline;
                        return {
                            title: (
                                <span className={styles.nodeTitle}>
                                    <span className={styles.deviceTypeIcon} style={{ color: statusConf.color }}>
                                        {deviceIcons[category] || deviceIcons.other}
                                    </span>
                                    <span className={styles.nodeName}>{dev.name}</span>
                                    <Tag color={statusColors[dev.status] || 'default'} className={styles.nodeTag}>
                                        {dev.status}
                                    </Tag>
                                    <span className={styles.nodeInfo}>
                                        U{dev.startU}-{dev.endU}
                                    </span>
                                </span>
                            ),
                            key: `dev-${dev.id}`,
                            data: { ...dev, type: 'device', category },
                            isLeaf: true,
                        };
                    });
                    updateTreeData(key, children);
                }
            } catch (error) {
                console.error('Failed to load devices:', error);
            }
        }
    };

    const updateTreeData = (key: React.Key, children: DataNode[]) => {
        setTreeData((origin) =>
            origin.map((node) => updateNode(node, key, children))
        );
    };

    const updateNode = (node: DataNode, key: React.Key, children: DataNode[]): DataNode => {
        if (node.key === key) {
            return { ...node, children };
        }
        if (node.children) {
            return {
                ...node,
                children: node.children.map((child) => updateNode(child, key, children)),
            };
        }
        return node;
    };

    const onSearch = (value: string) => {
        console.log('Search:', value);
    };

    // 节点选中时加载数据
    const onSelect = async (_selectedKeys: React.Key[], info: any) => {
        if (info.node?.data) {
            const data = info.node.data;
            setSelectedNode(data);
            setCabinetDevices([]);

            // 如果是机柜，加载设备列表
            if (data.type === 'cabinet') {
                setCabinetLoading(true);
                try {
                    const res = await getDevicesByCabinet(data.id);
                    if (res.success && res.data) {
                        setCabinetDevices(res.data);
                    }
                } catch (error) {
                    console.error('Failed to load cabinet devices:', error);
                } finally {
                    setCabinetLoading(false);
                }
            }
        }
    };

    // 从机柜视图点击设备
    const onDeviceClickInCabinet = (device: IDC.Device) => {
        const tpl = templates.find((t: any) => t.id === device.templateId);
        setSelectedNode({ ...device, type: 'device', category: tpl?.category || 'other' });
    };

    // 渲染详情面板
    const renderDetail = () => {
        if (!selectedNode) {
            return <Empty description="选择一个节点查看详情" />;
        }

        const { type } = selectedNode;

        if (type === 'datacenter') {
            return (
                <div className={styles.detailPanel}>
                    <h3><DatabaseOutlined /> 数据中心详情</h3>
                    <div className={styles.detailItem}>
                        <span className={styles.label}>名称：</span>
                        <span>{selectedNode.name}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.label}>编码：</span>
                        <Tag color="blue">{selectedNode.code}</Tag>
                    </div>
                    {selectedNode.address && (
                        <div className={styles.detailItem}>
                            <span className={styles.label}>地址：</span>
                            <span>{selectedNode.address}</span>
                        </div>
                    )}
                    <Divider />
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => history.push('/datacenter3d')}
                        block
                    >
                        查看3D视图
                    </Button>
                </div>
            );
        }

        if (type === 'cabinet') {
            return (
                <Spin spinning={cabinetLoading}>
                    <CabinetFrontViewContent
                        cabinet={selectedNode as IDC.Cabinet}
                        devices={cabinetDevices}
                        templates={templates}
                        onDeviceClick={onDeviceClickInCabinet}
                        compact={true}
                    />
                </Spin>
            );
        }

        if (type === 'device') {
            const tpl = templates.find((t: any) => t.id === selectedNode.templateId);
            return (
                <DevicePortViewContent
                    device={selectedNode as IDC.Device}
                    template={tpl}
                    compact={true}
                />
            );
        }

        return null;
    };

    return (
        <PageContainer
            header={{
                title: '资源树',
                subTitle: '数据中心 / 机柜 / 设备层级视图',
            }}
        >
            <div className={styles.container}>
                <Card className={styles.treeCard} title="资源层级">
                    <Search
                        placeholder="搜索资源..."
                        allowClear
                        onSearch={onSearch}
                        className={styles.searchInput}
                        prefix={<SearchOutlined />}
                    />
                    <Spin spinning={loading}>
                        {treeData.length > 0 ? (
                            <Tree
                                className={styles.tree}
                                showLine={{ showLeafIcon: false }}
                                showIcon
                                loadData={onLoadData}
                                treeData={treeData}
                                expandedKeys={expandedKeys}
                                onExpand={(keys) => setExpandedKeys(keys)}
                                onSelect={onSelect}
                                height={600}
                            />
                        ) : (
                            !loading && <Empty description="暂无数据" />
                        )}
                    </Spin>
                </Card>

                <Card className={styles.detailCard} title="详情信息">
                    {renderDetail()}
                </Card>
            </div>
        </PageContainer>
    );
};

export default ResourceTree;
