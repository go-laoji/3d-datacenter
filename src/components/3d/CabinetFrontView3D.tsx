import React, { useState, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Html } from '@react-three/drei';
import { Modal, Tag, Progress, Spin, Empty, Divider } from 'antd';
import { X, Wifi, WifiOff, AlertTriangle, Settings } from 'lucide-react';
import * as THREE from 'three';
import {
    Device3D,
    deviceStatusColors,
} from './DeviceModels';
import styles from './CabinetFrontView3D.less';

// U位高度（米）
const U_HEIGHT = 0.0445;

// 3D机柜框架
interface CabinetFrame3DProps {
    uHeight: number;
    width: number;
    depth: number;
}

const CabinetFrame3D: React.FC<CabinetFrame3DProps> = ({ uHeight, width, depth }) => {
    const height = uHeight * U_HEIGHT;

    return (
        <group>
            {/* 机柜外框 - 浅色透明 */}
            <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[width + 0.02, height + 0.02, depth + 0.02]} />
                <meshStandardMaterial
                    color="#e0e5eb"
                    metalness={0.3}
                    roughness={0.5}
                    transparent
                    opacity={0.4}
                />
            </mesh>

            {/* 左侧边框 */}
            <mesh position={[-width / 2 - 0.01, height / 2, 0]}>
                <boxGeometry args={[0.02, height, depth]} />
                <meshStandardMaterial color="#5a6570" metalness={0.5} roughness={0.3} />
            </mesh>

            {/* 右侧边框 */}
            <mesh position={[width / 2 + 0.01, height / 2, 0]}>
                <boxGeometry args={[0.02, height, depth]} />
                <meshStandardMaterial color="#5a6570" metalness={0.5} roughness={0.3} />
            </mesh>

            {/* 顶部边框 */}
            <mesh position={[0, height + 0.01, 0]}>
                <boxGeometry args={[width + 0.04, 0.02, depth]} />
                <meshStandardMaterial color="#5a6570" metalness={0.5} roughness={0.3} />
            </mesh>

            {/* 底部边框 */}
            <mesh position={[0, -0.01, 0]}>
                <boxGeometry args={[width + 0.04, 0.02, depth]} />
                <meshStandardMaterial color="#5a6570" metalness={0.5} roughness={0.3} />
            </mesh>

            {/* U位标尺（左侧） */}
            {Array.from({ length: uHeight }, (_, i) => {
                const u = i + 1;
                const y = (u - 0.5) * U_HEIGHT;
                return (
                    <Html
                        key={`u-${u}`}
                        position={[-width / 2 - 0.05, y, depth / 2]}
                        center
                        distanceFactor={3}
                    >
                        <div style={{
                            background: 'rgba(255,255,255,0.9)',
                            color: '#333',
                            padding: '1px 4px',
                            borderRadius: 2,
                            fontSize: 8,
                            fontFamily: 'monospace',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}>
                            {u}
                        </div>
                    </Html>
                );
            })}

            {/* U位分割线 */}
            {Array.from({ length: uHeight + 1 }, (_, i) => {
                const y = i * U_HEIGHT;
                return (
                    <mesh key={`line-${i}`} position={[0, y, depth / 2 + 0.001]}>
                        <boxGeometry args={[width, 0.001, 0.001]} />
                        <meshBasicMaterial color="#aab5c0" transparent opacity={0.6} />
                    </mesh>
                );
            })}
        </group>
    );
};

// 空槽位
interface EmptySlot3DProps {
    startU: number;
    endU: number;
    width: number;
    depth: number;
}

const EmptySlot3D: React.FC<EmptySlot3DProps> = ({ startU, endU, width, depth }) => {
    const height = (endU - startU + 1) * U_HEIGHT;
    const y = ((startU + endU) / 2 - 0.5) * U_HEIGHT;

    return (
        <mesh position={[0, y, depth / 2 - 0.01]}>
            <boxGeometry args={[width - 0.02, height - 0.002, 0.02]} />
            <meshStandardMaterial
                color="#c5cdd5"
                transparent
                opacity={0.3}
            />
        </mesh>
    );
};

// 主组件Props
interface CabinetFrontView3DProps {
    cabinet: IDC.Cabinet | null;
    devices: IDC.Device[];
    templates: any[];
    open: boolean;
    onClose: () => void;
    onDeviceClick?: (device: IDC.Device) => void;
}

// 3D场景内容组件
interface CabinetScene3DProps {
    cabinet: IDC.Cabinet;
    devices: IDC.Device[];
    templates: any[];
    selectedDevice: IDC.Device | null;
    onDeviceSelect: (device: IDC.Device | null) => void;
}

const CabinetScene3D: React.FC<CabinetScene3DProps> = ({
    cabinet,
    devices,
    templates,
    selectedDevice,
    onDeviceSelect,
}) => {
    const cabinetWidth = 0.48; // 机柜宽度（米）
    const cabinetDepth = 0.08; // 前视图深度
    const cabinetHeight = cabinet.uHeight * U_HEIGHT;

    // 计算空槽位
    const emptySlots = useMemo(() => {
        const occupied = new Set<number>();
        devices.forEach(d => {
            for (let u = d.startU; u <= d.endU; u++) {
                occupied.add(u);
            }
        });

        const slots: { startU: number; endU: number }[] = [];
        let currentStart = -1;

        for (let u = 1; u <= cabinet.uHeight; u++) {
            if (!occupied.has(u)) {
                if (currentStart === -1) currentStart = u;
            } else {
                if (currentStart !== -1) {
                    slots.push({ startU: currentStart, endU: u - 1 });
                    currentStart = -1;
                }
            }
        }
        if (currentStart !== -1) {
            slots.push({ startU: currentStart, endU: cabinet.uHeight });
        }
        return slots;
    }, [devices, cabinet.uHeight]);

    // 设备点击
    const handleDeviceClick = useCallback((device: IDC.Device) => {
        onDeviceSelect(device);
    }, [onDeviceSelect]);

    return (
        <>
            {/* 固定相机 - 正面视角 */}
            <PerspectiveCamera
                makeDefault
                position={[0, cabinetHeight / 2, 1.2]}
                fov={50}
            />

            {/* 灯光 */}
            <ambientLight intensity={1.2} />
            <directionalLight position={[5, 5, 8]} intensity={1.2} />
            <directionalLight position={[-5, 3, 5]} intensity={0.6} />
            <pointLight position={[0, 1, 2]} intensity={0.8} color="#ffffff" />

            {/* 机柜框架 */}
            <CabinetFrame3D
                uHeight={cabinet.uHeight}
                width={cabinetWidth}
                depth={cabinetDepth}
            />

            {/* 空槽位 */}
            {emptySlots.map((slot, idx) => (
                <EmptySlot3D
                    key={`empty-${idx}`}
                    startU={slot.startU}
                    endU={slot.endU}
                    width={cabinetWidth}
                    depth={cabinetDepth}
                />
            ))}

            {/* 设备 */}
            {devices.map(device => {
                const template = templates.find(t => t.id === device.templateId);
                const category = template?.category || 'other';
                const deviceHeight = (device.endU - device.startU + 1) * U_HEIGHT;
                const deviceY = ((device.startU + device.endU) / 2 - 0.5) * U_HEIGHT;

                return (
                    <Device3D
                        key={device.id}
                        device={device}
                        template={template}
                        category={category}
                        position={[0, deviceY, cabinetDepth / 2]}
                        height={deviceHeight - 0.003}
                        width={cabinetWidth - 0.04}
                        depth={0.06}
                        selected={selectedDevice?.id === device.id}
                        showTooltip={false}
                        onSelect={() => handleDeviceClick(device)}
                    />
                );
            })}
        </>
    );
};

// 设备详情面板
interface DeviceDetailPanelProps {
    device: IDC.Device | null;
    template: any;
}

const DeviceDetailPanel: React.FC<DeviceDetailPanelProps> = ({ device, template }) => {
    if (!device) {
        return (
            <div className={styles.devicePanel}>
                <div className={styles.noSelection}>
                    <Empty description="点击设备查看详情" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            </div>
        );
    }

    const status = deviceStatusColors[device.status] || deviceStatusColors.offline;
    const statusLabels: Record<string, string> = {
        online: '在线',
        offline: '离线',
        warning: '告警',
        error: '故障',
        maintenance: '维护中',
    };

    const statusIcons: Record<string, React.ReactNode> = {
        online: <Wifi size={14} />,
        offline: <WifiOff size={14} />,
        warning: <AlertTriangle size={14} />,
        error: <AlertTriangle size={14} />,
        maintenance: <Settings size={14} />,
    };

    return (
        <div className={styles.devicePanel}>
            <div className={styles.deviceHeader}>
                <h3>{device.name}</h3>
                <Tag color={status.color} icon={statusIcons[device.status]}>
                    {statusLabels[device.status]}
                </Tag>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div className={styles.deviceInfo}>
                <div className={styles.infoRow}>
                    <span>资产编码</span>
                    <span>{device.assetCode}</span>
                </div>
                <div className={styles.infoRow}>
                    <span>U位</span>
                    <span>U{device.startU} - U{device.endU}</span>
                </div>
                {template && (
                    <>
                        <div className={styles.infoRow}>
                            <span>品牌</span>
                            <span>{template.brand}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span>型号</span>
                            <span>{template.model}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span>类型</span>
                            <Tag>{template.category}</Tag>
                        </div>
                    </>
                )}
                {device.managementIp && (
                    <div className={styles.infoRow}>
                        <span>管理IP</span>
                        <span>{device.managementIp}</span>
                    </div>
                )}
                {device.owner && (
                    <div className={styles.infoRow}>
                        <span>负责人</span>
                        <span>{device.owner}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// 主组件
const CabinetFrontView3D: React.FC<CabinetFrontView3DProps> = ({
    cabinet,
    devices,
    templates,
    open,
    onClose,
    onDeviceClick,
}) => {
    const [selectedDevice, setSelectedDevice] = useState<IDC.Device | null>(null);

    const handleDeviceSelect = useCallback((device: IDC.Device | null) => {
        setSelectedDevice(device);
        if (device && onDeviceClick) {
            onDeviceClick(device);
        }
    }, [onDeviceClick]);

    if (!cabinet) return null;

    const usagePercent = Math.round((cabinet.usedU / cabinet.uHeight) * 100);

    return (
        <Modal
            title={null}
            open={open}
            onCancel={onClose}
            footer={null}
            width={900}
            centered
            className={styles.modal}
            closeIcon={<X size={20} />}
        >
            <div className={styles.container}>
                {/* 头部信息 */}
                <div className={styles.header}>
                    <div className={styles.cabinetInfo}>
                        <h2>{cabinet.name}</h2>
                        <div className={styles.meta}>
                            <span>编码: {cabinet.code}</span>
                            <span>位置: {cabinet.row}排{cabinet.column}列</span>
                            <span>总U位: {cabinet.uHeight}U</span>
                        </div>
                    </div>
                    <div className={styles.stats}>
                        <div className={styles.statItem}>
                            <span>U位使用率</span>
                            <Progress
                                percent={usagePercent}
                                size="small"
                                status={usagePercent > 90 ? 'exception' : 'active'}
                            />
                        </div>
                    </div>
                </div>

                {/* 3D场景和详情面板 */}
                <div className={styles.content}>
                    <div className={styles.canvasContainer}>
                        <Canvas shadows>
                            <CabinetScene3D
                                cabinet={cabinet}
                                devices={devices}
                                templates={templates}
                                selectedDevice={selectedDevice}
                                onDeviceSelect={handleDeviceSelect}
                            />
                        </Canvas>
                        <div className={styles.hint}>
                            拖拽旋转 | 滚轮缩放 | 点击设备查看详情
                        </div>
                    </div>

                    <DeviceDetailPanel
                        device={selectedDevice}
                        template={templates.find(t => t.id === selectedDevice?.templateId)}
                    />
                </div>

                {/* 设备计数 */}
                <div className={styles.footer}>
                    <span>设备总数: <strong>{devices.length}</strong></span>
                    <span>在线: <strong style={{ color: '#52c41a' }}>{devices.filter(d => d.status === 'online').length}</strong></span>
                    <span>离线: <strong style={{ color: '#8c8c8c' }}>{devices.filter(d => d.status === 'offline').length}</strong></span>
                    <span>告警: <strong style={{ color: '#faad14' }}>{devices.filter(d => d.status === 'warning').length}</strong></span>
                </div>
            </div>
        </Modal>
    );
};

export default CabinetFrontView3D;
