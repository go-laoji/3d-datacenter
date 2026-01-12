import React, { useMemo } from 'react';
import { Modal, Tooltip, Badge, Empty, Progress } from 'antd';
import { Server, HardDrive, Router, Shield, Database, Box, Wifi, WifiOff, AlertTriangle, Settings, X } from 'lucide-react';
import styles from './CabinetFrontView.less';

// 设备类型图标映射
export const deviceIcons: Record<string, React.ReactNode> = {
    switch: <Server size={16} />,
    router: <Router size={16} />,
    server: <HardDrive size={16} />,
    storage: <Database size={16} />,
    firewall: <Shield size={16} />,
    loadbalancer: <Box size={16} />,
    other: <Box size={16} />,
};

// 设备状态配置
export const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; text: string }> = {
    online: { color: '#52c41a', bg: '#f6ffed', icon: <Wifi size={12} />, text: '在线' },
    offline: { color: '#8c8c8c', bg: '#fafafa', icon: <WifiOff size={12} />, text: '离线' },
    warning: { color: '#faad14', bg: '#fffbe6', icon: <AlertTriangle size={12} />, text: '告警' },
    error: { color: '#f5222d', bg: '#fff2f0', icon: <AlertTriangle size={12} />, text: '故障' },
    maintenance: { color: '#1890ff', bg: '#e6f7ff', icon: <Settings size={12} />, text: '维护' },
};

// 每个U位的高度（像素）
const U_HEIGHT = 24;

// ==================== 内容组件（可内嵌使用） ====================
interface CabinetFrontViewContentProps {
    cabinet: IDC.Cabinet | null;
    devices: IDC.Device[];
    templates: any[];
    onDeviceClick?: (device: IDC.Device) => void;
    compact?: boolean; // 紧凑模式，用于内嵌显示
}

export const CabinetFrontViewContent: React.FC<CabinetFrontViewContentProps> = ({
    cabinet,
    devices,
    templates,
    onDeviceClick,
    compact = false,
}) => {
    // 生成空闲U位槽位
    const emptySlots = useMemo(() => {
        if (!cabinet) return [];

        const slots: React.ReactNode[] = [];
        for (let u = cabinet.uHeight; u >= 1; u--) {
            const isOccupied = devices.some(d => u >= d.startU && u <= d.endU);
            slots.push(
                <div
                    key={`slot-${u}`}
                    className={`${styles.slot} ${isOccupied ? styles.occupied : styles.empty}`}
                >
                    {!isOccupied && <span className={styles.emptyLabel}>空闲</span>}
                </div>
            );
        }
        return slots;
    }, [cabinet, devices]);

    // 生成设备元素
    const deviceElements = useMemo(() => {
        if (!cabinet) return [];

        return devices.map(device => {
            const height = device.endU - device.startU + 1;
            const template = templates.find(t => t.id === device.templateId);
            const status = statusConfig[device.status] || statusConfig.offline;
            const category = template?.category || 'other';
            const topPosition = (cabinet.uHeight - device.endU) * U_HEIGHT;

            return (
                <Tooltip
                    key={`device-${device.id}`}
                    title={
                        <div>
                            <div style={{ fontWeight: 600 }}>{device.name}</div>
                            <div>型号: {template?.brand} {template?.model}</div>
                            <div>U位: U{device.startU}{device.startU !== device.endU ? `-U${device.endU}` : ''}</div>
                            <div>IP: {device.managementIp || '-'}</div>
                            <div>状态: {status.text}</div>
                        </div>
                    }
                    placement="right"
                >
                    <div
                        className={`${styles.device} ${styles[device.status] || ''}`}
                        style={{
                            position: 'absolute',
                            top: topPosition,
                            left: 0,
                            right: 0,
                            height: height * U_HEIGHT - 2,
                            backgroundColor: status.bg,
                            borderColor: status.color,
                            cursor: onDeviceClick ? 'pointer' : 'default',
                        }}
                        onClick={() => onDeviceClick?.(device)}
                    >
                        <div className={styles.deviceIcon} style={{ color: status.color }}>
                            {deviceIcons[category]}
                        </div>
                        <div className={styles.deviceInfo}>
                            <div className={styles.deviceName}>{device.name}</div>
                            {height > 1 && (
                                <div className={styles.deviceModel}>
                                    {template?.brand} {template?.model}
                                </div>
                            )}
                        </div>
                        <div className={styles.deviceStatus}>
                            <Badge status={device.status === 'online' ? 'success' : device.status === 'warning' ? 'warning' : device.status === 'error' ? 'error' : 'default'} />
                            {device.managementIp && (
                                <span className={styles.deviceIp}>{device.managementIp}</span>
                            )}
                        </div>
                        <div className={styles.uLabel}>
                            {device.startU === device.endU ? `U${device.startU}` : `U${device.startU}-${device.endU}`}
                        </div>
                    </div>
                </Tooltip>
            );
        });
    }, [cabinet, devices, templates, onDeviceClick]);

    if (!cabinet) return <Empty description="请选择机柜" />;

    const usagePercent = Math.round((cabinet.usedU / cabinet.uHeight) * 100);
    const powerPercent = Math.round((cabinet.currentPower / cabinet.maxPower) * 100);

    return (
        <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
            {/* 机柜头部信息 */}
            <div className={styles.header}>
                <div className={styles.cabinetInfo}>
                    <h2>{cabinet.name}</h2>
                    <div className={styles.cabinetMeta}>
                        <span>编码: {cabinet.code}</span>
                        <span>位置: {cabinet.row}排{cabinet.column}列</span>
                        <span>总U位: {cabinet.uHeight}U</span>
                    </div>
                </div>
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>U位使用</span>
                        <Progress
                            percent={usagePercent}
                            size="small"
                            status={usagePercent > 90 ? 'exception' : 'active'}
                            format={() => `${cabinet.usedU}/${cabinet.uHeight}U`}
                        />
                    </div>
                    {!compact && (
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>功率</span>
                            <Progress
                                percent={powerPercent}
                                size="small"
                                strokeColor="#faad14"
                                format={() => `${cabinet.currentPower}W`}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 机柜正面视图 */}
            <div className={styles.cabinetFront}>
                {/* 左侧U位标尺 */}
                <div className={styles.uRuler}>
                    {Array.from({ length: cabinet.uHeight }, (_, i) => cabinet.uHeight - i).map(u => (
                        <div key={u} className={styles.uMark}>
                            {u}
                        </div>
                    ))}
                </div>

                {/* 机柜主体 */}
                <div className={styles.cabinetBody}>
                    <div className={styles.slotsLayer}>
                        {emptySlots}
                    </div>
                    <div className={styles.devicesLayer}>
                        {deviceElements}
                    </div>
                </div>

                {/* 右侧状态统计 */}
                {!compact && (
                    <div className={styles.sideStats}>
                        <div className={styles.legend}>
                            <div className={styles.legendItem}>
                                <Badge status="success" text="在线" />
                                <span>{devices.filter(d => d.status === 'online').length}</span>
                            </div>
                            <div className={styles.legendItem}>
                                <Badge status="default" text="离线" />
                                <span>{devices.filter(d => d.status === 'offline').length}</span>
                            </div>
                            <div className={styles.legendItem}>
                                <Badge status="warning" text="告警" />
                                <span>{devices.filter(d => d.status === 'warning').length}</span>
                            </div>
                            <div className={styles.legendItem}>
                                <Badge status="error" text="故障" />
                                <span>{devices.filter(d => d.status === 'error').length}</span>
                            </div>
                        </div>

                        <div className={styles.deviceCount}>
                            <div className={styles.countNumber}>{devices.length}</div>
                            <div className={styles.countLabel}>设备总数</div>
                        </div>
                    </div>
                )}
            </div>

            {devices.length === 0 && (
                <Empty description="该机柜暂无设备" style={{ marginTop: 24 }} />
            )}
        </div>
    );
};

// ==================== Modal包装组件（用于列表页弹窗） ====================
interface CabinetFrontViewProps {
    cabinet: IDC.Cabinet | null;
    devices: IDC.Device[];
    templates: any[];
    open: boolean;
    onClose: () => void;
    onDeviceClick: (device: IDC.Device) => void;
}

const CabinetFrontView: React.FC<CabinetFrontViewProps> = ({
    cabinet,
    devices,
    templates,
    open,
    onClose,
    onDeviceClick,
}) => {
    return (
        <Modal
            title={null}
            open={open}
            onCancel={onClose}
            footer={null}
            width={700}
            centered
            className={styles.cabinetModal}
            closeIcon={<X size={20} />}
        >
            <CabinetFrontViewContent
                cabinet={cabinet}
                devices={devices}
                templates={templates}
                onDeviceClick={onDeviceClick}
            />
        </Modal>
    );
};

export default CabinetFrontView;
