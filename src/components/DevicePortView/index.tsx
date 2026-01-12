import React, { useMemo, useEffect, useState } from 'react';
import { Modal, Tag, Tooltip, Empty, Spin, Progress, Divider } from 'antd';
import { Server, HardDrive, Router, Shield, Database, Box, Wifi, WifiOff, AlertTriangle, Settings, X, Network } from 'lucide-react';
import { getPortsByDevice } from '@/services/idc/port';
import styles from './DevicePortView.less';

// 端口类型颜色映射
export const portTypeColors: Record<string, string> = {
    'RJ45': '#1890ff',
    'SFP': '#52c41a',
    'SFP+': '#13c2c2',
    'QSFP': '#722ed1',
    'QSFP+': '#eb2f96',
    'QSFP28': '#fa8c16',
    'Console': '#8c8c8c',
    'USB': '#595959',
    'Power': '#faad14',
};

// 端口状态配置
export const portStatusConfig: Record<string, { color: string; text: string }> = {
    connected: { color: '#52c41a', text: '已连接' },
    available: { color: '#1890ff', text: '可用' },
    disabled: { color: '#8c8c8c', text: '禁用' },
    error: { color: '#f5222d', text: '故障' },
};

// 设备状态配置
export const deviceStatusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
    online: { color: '#52c41a', icon: <Wifi size={16} />, text: '在线' },
    offline: { color: '#8c8c8c', icon: <WifiOff size={16} />, text: '离线' },
    warning: { color: '#faad14', icon: <AlertTriangle size={16} />, text: '告警' },
    error: { color: '#f5222d', icon: <AlertTriangle size={16} />, text: '故障' },
    maintenance: { color: '#1890ff', icon: <Settings size={16} />, text: '维护中' },
};

// 设备类型图标
export const deviceIcons: Record<string, React.ReactNode> = {
    switch: <Server size={24} />,
    router: <Router size={24} />,
    server: <HardDrive size={24} />,
    storage: <Database size={24} />,
    firewall: <Shield size={24} />,
    loadbalancer: <Box size={24} />,
    other: <Box size={24} />,
};

// ==================== 内容组件（可内嵌使用） ====================
interface DevicePortViewContentProps {
    device: IDC.Device | null;
    template: any;
    ports?: any[]; // 可选：外部传入端口数据
    compact?: boolean; // 紧凑模式
}

export const DevicePortViewContent: React.FC<DevicePortViewContentProps> = ({
    device,
    template,
    ports: externalPorts,
    compact = false,
}) => {
    const [ports, setPorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // 如果外部没有传入端口数据，则自动获取
    useEffect(() => {
        if (device && !externalPorts) {
            setLoading(true);
            getPortsByDevice(device.id).then(res => {
                if (res.success && res.data) {
                    setPorts(res.data);
                }
            }).finally(() => setLoading(false));
        } else if (externalPorts) {
            setPorts(externalPorts);
        }
    }, [device, externalPorts]);

    // 计算端口组数据
    const portGroups = useMemo(() => {
        if (!template?.portGroups) return [];

        return template.portGroups.map((pg: any) => {
            const groupPorts = ports.filter(p => p.groupId === pg.id);
            const connectedCount = groupPorts.filter(p => p.status === 'connected').length;

            const simulatedConnected = groupPorts.length === 0
                ? Math.floor(Math.random() * Math.min(pg.count, 5))
                : connectedCount;

            return {
                ...pg,
                ports: groupPorts,
                connectedCount: simulatedConnected,
            };
        });
    }, [template, ports]);

    // 统计数据
    const stats = useMemo(() => {
        if (!template?.portGroups) return { total: 0, connected: 0, available: 0, disabled: 0, error: 0 };

        const total = template.portGroups.reduce((sum: number, pg: any) => sum + pg.count, 0);
        const connected = portGroups.reduce((sum: number, pg: any) => sum + pg.connectedCount, 0);
        const available = total - connected;

        return { total, connected, available, disabled: 0, error: 0 };
    }, [template, portGroups]);

    if (!device) return <Empty description="请选择设备" />;

    const status = deviceStatusConfig[device.status] || deviceStatusConfig.offline;
    const category = template?.category || 'other';

    return (
        <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
            {/* 设备头部信息 */}
            <div className={styles.header}>
                <div className={styles.deviceIcon} style={{ color: status.color }}>
                    {deviceIcons[category]}
                </div>
                <div className={styles.deviceInfo}>
                    <h2>{device.name}</h2>
                    <div className={styles.deviceMeta}>
                        <Tag color={status.color} icon={status.icon}>
                            {status.text}
                        </Tag>
                        <span>型号: {template?.brand} {template?.model}</span>
                        {!compact && <span>资产码: {device.assetCode}</span>}
                        {device.managementIp && <span>IP: {device.managementIp}</span>}
                    </div>
                </div>
                <div className={styles.deviceStats}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{stats.total}</span>
                        <span className={styles.statLabel}>总端口</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue} style={{ color: '#52c41a' }}>{stats.connected}</span>
                        <span className={styles.statLabel}>已连接</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue} style={{ color: '#1890ff' }}>{stats.available}</span>
                        <span className={styles.statLabel}>可用</span>
                    </div>
                </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* 端口使用率 */}
            <div className={styles.usageBar}>
                <div className={styles.usageLabel}>端口使用率</div>
                <Progress
                    percent={stats.total > 0 ? Math.round(stats.connected / stats.total * 100) : 0}
                    strokeColor="#52c41a"
                    format={(percent) => `${stats.connected}/${stats.total} (${percent}%)`}
                />
            </div>

            {/* 端口面板 */}
            <div className={styles.portPanel}>
                {loading ? (
                    <div className={styles.loading}>
                        <Spin tip="加载端口信息..." />
                    </div>
                ) : portGroups.length > 0 ? (
                    portGroups.map((group: any) => (
                        <div key={group.id} className={styles.portGroup}>
                            <div className={styles.portGroupHeader}>
                                <div className={styles.portGroupTitle}>
                                    <Network size={14} />
                                    <span>{group.name}</span>
                                    <Tag color={portTypeColors[group.portType] || '#8c8c8c'}>
                                        {group.portType}
                                    </Tag>
                                    {group.speed && <Tag>{group.speed}</Tag>}
                                    {group.poe && <Tag color="gold">PoE</Tag>}
                                </div>
                                <div className={styles.portGroupStats}>
                                    <span>{group.connectedCount}/{group.count} 已用</span>
                                </div>
                            </div>
                            <div className={styles.portGrid}>
                                {Array.from({ length: group.count }).map((_, i) => {
                                    const port = group.ports.find((p: any) => p.index === i);
                                    const isConnected = port ? port.status === 'connected' : i < group.connectedCount;
                                    const portStatus = isConnected ? portStatusConfig.connected : portStatusConfig.available;

                                    return (
                                        <Tooltip
                                            key={`${group.id}-${i}`}
                                            title={
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{group.name} #{i + 1}</div>
                                                    <div>类型: {group.portType}</div>
                                                    <div>速率: {group.speed || '-'}</div>
                                                    <div>状态: {portStatus.text}</div>
                                                    {group.poe && <div>PoE: 支持</div>}
                                                </div>
                                            }
                                        >
                                            <div
                                                className={`${styles.port} ${isConnected ? styles.connected : ''}`}
                                                style={{
                                                    backgroundColor: isConnected ? portStatus.color : '#e8e8e8',
                                                    borderColor: portTypeColors[group.portType] || '#d9d9d9',
                                                }}
                                            >
                                                <div
                                                    className={styles.portIndicator}
                                                    style={{ backgroundColor: isConnected ? '#fff' : portStatus.color }}
                                                />
                                                <span className={styles.portNumber}>{i + 1}</span>
                                            </div>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : template ? (
                    <Empty description="该设备模板未配置端口组" />
                ) : (
                    <Empty description="未找到设备模板信息" />
                )}
            </div>

            {/* 图例 */}
            {!compact && (
                <div className={styles.legend}>
                    <div className={styles.legendTitle}>图例</div>
                    <div className={styles.legendItems}>
                        <div className={styles.legendItem}>
                            <div className={styles.legendColor} style={{ backgroundColor: '#52c41a' }} />
                            <span>已连接</span>
                        </div>
                        <div className={styles.legendItem}>
                            <div className={styles.legendColor} style={{ backgroundColor: '#e8e8e8', border: '1px solid #d9d9d9' }} />
                            <span>可用</span>
                        </div>
                        <div className={styles.legendItem}>
                            <div className={styles.legendColor} style={{ backgroundColor: '#8c8c8c' }} />
                            <span>禁用</span>
                        </div>
                        <div className={styles.legendItem}>
                            <div className={styles.legendColor} style={{ backgroundColor: '#f5222d' }} />
                            <span>故障</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==================== Modal包装组件（用于列表页弹窗） ====================
interface DevicePortViewProps {
    device: IDC.Device | null;
    template: any;
    open: boolean;
    onClose: () => void;
}

const DevicePortView: React.FC<DevicePortViewProps> = ({
    device,
    template,
    open,
    onClose,
}) => {
    return (
        <Modal
            title={null}
            open={open}
            onCancel={onClose}
            footer={null}
            width={800}
            centered
            className={styles.deviceModal}
            closeIcon={<X size={20} />}
        >
            <DevicePortViewContent
                device={device}
                template={template}
            />
        </Modal>
    );
};

export default DevicePortView;
