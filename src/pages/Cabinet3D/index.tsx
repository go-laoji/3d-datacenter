import React, { useState, useMemo, useCallback, useEffect, Suspense, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Html } from '@react-three/drei';
import { Card, Spin, Empty, Tag, Descriptions, Button, Tooltip, Divider, Progress, Row, Col, Statistic, Switch, Space } from 'antd';
import { X, Wifi, WifiOff, AlertTriangle, Settings, RotateCcw, Eye } from 'lucide-react';
import { useSearchParams, history } from '@umijs/max';
import * as THREE from 'three';
import { Device3D, deviceStatusColors } from '@/components/3d/DeviceModels';
import { getCabinet } from '@/services/idc/cabinet';
import { getDevicesByCabinet } from '@/services/idc/device';
import { getAllDeviceTemplates } from '@/services/idc/deviceTemplate';
import { getPortsByDevice } from '@/services/idc/port';
import styles from './index.less';

// U位高度（米）和显示比例
const U_HEIGHT = 0.0445;
const DISPLAY_SCALE = 1.0; // 正常显示比例

// 可拖拽旋转的组
interface DraggableRotatableGroupProps {
    children: React.ReactNode;
    rotationY: number;
    onRotationChange: (rotation: number) => void;
    position?: [number, number, number];
    pivotY?: number; // Y轴旋转中心点
}

const DraggableRotatableGroup: React.FC<DraggableRotatableGroupProps> = ({
    children,
    rotationY,
    onRotationChange,
    position = [0, 0, 0],
    pivotY = 0,
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startRotation, setStartRotation] = useState(0);
    const { gl } = useThree();

    const handlePointerDown = useCallback((e: any) => {
        e.stopPropagation();
        setIsDragging(true);
        setStartX(e.clientX || e.touches?.[0]?.clientX || 0);
        setStartRotation(rotationY);
        gl.domElement.style.cursor = 'grabbing';
    }, [rotationY, gl]);

    const handlePointerMove = useCallback((e: any) => {
        if (!isDragging) return;
        const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
        const deltaX = currentX - startX;
        // 每移动 100px 旋转 PI/2
        const newRotation = startRotation + (deltaX / 100) * (Math.PI / 2);
        onRotationChange(newRotation);
    }, [isDragging, startX, startRotation, onRotationChange]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
        gl.domElement.style.cursor = 'grab';
    }, [gl]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handlePointerMove);
            window.addEventListener('mouseup', handlePointerUp);
            window.addEventListener('touchmove', handlePointerMove);
            window.addEventListener('touchend', handlePointerUp);
            return () => {
                window.removeEventListener('mousemove', handlePointerMove);
                window.removeEventListener('mouseup', handlePointerUp);
                window.removeEventListener('touchmove', handlePointerMove);
                window.removeEventListener('touchend', handlePointerUp);
            };
        }
        return undefined;
    }, [isDragging, handlePointerMove, handlePointerUp]);

    return (
        <group position={position}>
            <group
                ref={groupRef}
                rotation={[0, rotationY, 0]}
                position={[0, pivotY, 0]}
                onPointerDown={handlePointerDown}
            >
                <group position={[0, -pivotY, 0]}>
                    {children}
                </group>
            </group>
        </group>
    );
};

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
            {/* 机柜外框 */}
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

            {/* 边框 */}
            {[
                { pos: [-width / 2 - 0.01, height / 2, 0], size: [0.02, height, depth] as [number, number, number] },
                { pos: [width / 2 + 0.01, height / 2, 0], size: [0.02, height, depth] as [number, number, number] },
                { pos: [0, height + 0.01, 0], size: [width + 0.04, 0.02, depth] as [number, number, number] },
                { pos: [0, -0.01, 0], size: [width + 0.04, 0.02, depth] as [number, number, number] },
            ].map((item, idx) => (
                <mesh key={idx} position={item.pos as [number, number, number]}>
                    <boxGeometry args={item.size} />
                    <meshStandardMaterial color="#5a6570" metalness={0.5} roughness={0.3} />
                </mesh>
            ))}

            {/* U位标尺 */}
            {Array.from({ length: uHeight }, (_, i) => {
                const u = i + 1;
                const y = (u - 0.5) * U_HEIGHT;
                return (
                    <Html
                        key={`u-${u}`}
                        position={[-width / 2 - 0.06, y, depth / 2]}
                        center
                        distanceFactor={3}
                    >
                        <div style={{
                            background: 'rgba(255,255,255,0.95)',
                            color: '#333',
                            padding: '2px 6px',
                            borderRadius: 3,
                            fontSize: 10,
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
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

            {/* 地板 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[1.5, 1]} />
                <meshStandardMaterial color="#d0d8e0" />
            </mesh>
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
            <meshStandardMaterial color="#c5cdd5" transparent opacity={0.3} />
        </mesh>
    );
};

// 3D场景组件
interface CabinetScene3DProps {
    cabinet: IDC.Cabinet;
    devices: IDC.Device[];
    templates: any[];
    devicePorts: Record<string, IDC.Port[]>;
    selectedDevice: IDC.Device | null;
    cabinetRotationY: number;
    deviceRotationY: number;
    onDeviceSelect: (device: IDC.Device | null) => void;
    onCabinetRotationChange: (rotation: number) => void;
    onDeviceRotationChange: (rotation: number) => void;
}

const CabinetScene3D: React.FC<CabinetScene3DProps> = ({
    cabinet,
    devices,
    templates,
    devicePorts,
    selectedDevice,
    cabinetRotationY,
    deviceRotationY,
    onDeviceSelect,
    onCabinetRotationChange,
    onDeviceRotationChange,
}) => {
    // 机柜尺寸
    const cabinetWidth = 0.6 * DISPLAY_SCALE;
    const cabinetDepth = 0.3 * DISPLAY_SCALE;
    const cabinetHeight = cabinet.uHeight * U_HEIGHT * DISPLAY_SCALE;

    // 相机位置 - 距离足够远以完整显示机柜
    const cameraDistance = Math.max(cabinetHeight * 1.5, 3);
    const cameraPos: [number, number, number] = [
        cabinetWidth * 1.2,
        cabinetHeight * 0.5,
        cameraDistance
    ];

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

    // 计算标尺显示（每5U显示一个标签）
    const uLabels = useMemo(() => {
        const labels: number[] = [];
        for (let u = 1; u <= cabinet.uHeight; u += 5) {
            labels.push(u);
        }
        if (!labels.includes(cabinet.uHeight)) {
            labels.push(cabinet.uHeight);
        }
        return labels;
    }, [cabinet.uHeight]);

    return (
        <>
            {/* 固定相机位置 - 等轴测视角 */}
            <PerspectiveCamera
                makeDefault
                position={cameraPos}
                fov={45}
            />

            {/* 灯光 */}
            <ambientLight intensity={1.0} />
            <directionalLight position={[5, 8, 8]} intensity={1.0} />
            <directionalLight position={[-3, 5, 3]} intensity={0.5} />
            <pointLight position={[0, cabinetHeight, 2]} intensity={0.6} color="#ffffff" />

            {/* 3D机柜主体 - 可拖拽旋转 */}
            <DraggableRotatableGroup
                rotationY={cabinetRotationY}
                onRotationChange={onCabinetRotationChange}
                pivotY={cabinetHeight / 2}
            >
                {/* 机柜外壳 */}
                <mesh position={[0, cabinetHeight / 2, 0]}>
                    <boxGeometry args={[cabinetWidth, cabinetHeight, cabinetDepth]} />
                    <meshStandardMaterial
                        color="#4a5568"
                        metalness={0.6}
                        roughness={0.3}
                    />
                </mesh>

                {/* 前面板（稍微突出） */}
                <mesh position={[0, cabinetHeight / 2, cabinetDepth / 2 + 0.01]}>
                    <boxGeometry args={[cabinetWidth - 0.02, cabinetHeight - 0.02, 0.02]} />
                    <meshStandardMaterial color="#2d3748" metalness={0.4} roughness={0.5} />
                </mesh>

                {/* 顶部通风口 */}
                <mesh position={[0, cabinetHeight + 0.01, 0]}>
                    <boxGeometry args={[cabinetWidth - 0.05, 0.02, cabinetDepth - 0.05]} />
                    <meshStandardMaterial color="#1a202c" metalness={0.5} roughness={0.4} />
                </mesh>

                {/* 底部支架 */}
                {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], idx) => (
                    <mesh key={idx} position={[x * (cabinetWidth / 2 - 0.03), -0.02, z * (cabinetDepth / 2 - 0.03)]}>
                        <boxGeometry args={[0.04, 0.04, 0.04]} />
                        <meshStandardMaterial color="#2d3748" metalness={0.5} roughness={0.4} />
                    </mesh>
                ))}

                {/* 空U位 */}
                {emptySlots.map((slot, idx) => {
                    const height = (slot.endU - slot.startU + 1) * U_HEIGHT * DISPLAY_SCALE;
                    const y = ((slot.startU + slot.endU) / 2 - 0.5) * U_HEIGHT * DISPLAY_SCALE;
                    return (
                        <mesh key={`empty-${idx}`} position={[0, y, cabinetDepth / 2 + 0.02]}>
                            <boxGeometry args={[cabinetWidth - 0.08, height - 0.01, 0.03]} />
                            <meshStandardMaterial color="#a0aec0" transparent opacity={0.3} />
                        </mesh>
                    );
                })}

                {/* 设备 */}
                {devices.map(device => {
                    const template = templates.find(t => t.id === device.templateId);
                    const category = template?.category || 'other';
                    const deviceHeight = (device.endU - device.startU + 1) * U_HEIGHT * DISPLAY_SCALE;
                    const deviceY = ((device.startU + device.endU) / 2 - 0.5) * U_HEIGHT * DISPLAY_SCALE;

                    return (
                        <Device3D
                            key={device.id}
                            device={device}
                            template={template}
                            ports={devicePorts[device.id]}
                            category={category}
                            position={[0, deviceY, cabinetDepth / 2 + 0.02]}
                            height={deviceHeight - 0.02}
                            width={cabinetWidth - 0.1}
                            depth={0.15}
                            selected={selectedDevice?.id === device.id}
                            showRear={Math.abs(cabinetRotationY) > Math.PI / 2}
                            showTooltip={false}
                            onSelect={() => handleDeviceClick(device)}
                        />
                    );
                })}
            </DraggableRotatableGroup>

            {/* U位标尺（左侧）- 不旋转 */}

            {/* U位标尺（左侧） */}
            {uLabels.map(u => {
                const y = (u - 0.5) * U_HEIGHT * DISPLAY_SCALE;
                return (
                    <Html
                        key={`u-${u}`}
                        position={[-cabinetWidth / 2 - 0.15, y, cabinetDepth / 2]}
                        center
                    >
                        <div style={{
                            background: '#fff',
                            color: '#333',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            border: '1px solid #e2e8f0',
                        }}>
                            U{u}
                        </div>
                    </Html>
                );
            })}

            {/* 地板 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
                <planeGeometry args={[cabinetWidth * 4, cabinetDepth * 4]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>

            {/* 选中设备的放大3D展示 - 可拖拽旋转 */}
            {selectedDevice && (() => {
                const template = templates.find(t => t.id === selectedDevice.templateId);
                const category = template?.category || 'other';

                return (
                    <group position={[cabinetWidth + 0.8, cabinetHeight * 0.5, 0]}>
                        {/* 展示台 */}
                        <mesh position={[0, -0.12, 0]}>
                            <cylinderGeometry args={[0.35, 0.4, 0.08, 32]} />
                            <meshStandardMaterial color="#cbd5e0" metalness={0.3} roughness={0.5} />
                        </mesh>

                        {/* 放大的设备模型 - 可拖动旋转 */}
                        <DraggableRotatableGroup
                            rotationY={deviceRotationY}
                            onRotationChange={onDeviceRotationChange}
                            pivotY={0}
                        >
                            <Device3D
                                device={selectedDevice}
                                template={template}
                                ports={devicePorts[selectedDevice.id]}
                                category={category}
                                position={[0, 0, 0]}
                                height={0.25}
                                width={0.5}
                                depth={0.3}
                                selected={true}
                                showRear={Math.abs(deviceRotationY) > Math.PI / 2}
                                showTooltip={false}
                            />
                        </DraggableRotatableGroup>
                    </group>
                );
            })()}
        </>
    );
};


// 主页面组件
const Cabinet3DPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const cabinetId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [cabinet, setCabinet] = useState<IDC.Cabinet | null>(null);
    const [devices, setDevices] = useState<IDC.Device[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<IDC.Device | null>(null);
    const [devicePorts, setDevicePorts] = useState<Record<string, IDC.Port[]>>({});
    const [cabinetRotationY, setCabinetRotationY] = useState(0);
    const [deviceRotationY, setDeviceRotationY] = useState(0);

    // 加载数据
    useEffect(() => {
        if (cabinetId) {
            loadCabinetData(cabinetId);
        }
    }, [cabinetId]);

    // 加载端口数据
    const loadPortsData = async (deviceList: IDC.Device[]) => {
        const portsMap: Record<string, IDC.Port[]> = {};
        await Promise.all(
            deviceList.map(async (device) => {
                try {
                    const res = await getPortsByDevice(device.id);
                    if (res.success && res.data) {
                        portsMap[device.id] = res.data;
                    }
                } catch (e) {
                    console.error(`Failed to load ports for device ${device.id}:`, e);
                }
            })
        );
        setDevicePorts(portsMap);
    };

    const loadCabinetData = async (id: string) => {
        setLoading(true);
        try {
            const [cabRes, devRes, tplRes] = await Promise.all([
                getCabinet(id),
                getDevicesByCabinet(id),
                getAllDeviceTemplates(),
            ]);

            if (cabRes.success && cabRes.data) {
                setCabinet(cabRes.data);
            }
            if (devRes.success && devRes.data) {
                setDevices(devRes.data);
                // 加载端口数据
                loadPortsData(devRes.data);
            }
            if (tplRes.success && tplRes.data) {
                setTemplates(tplRes.data);
            }
        } catch (error) {
            console.error('Failed to load cabinet data:', error);
        } finally {
            setLoading(false);
        }
    };

    // 统计数据
    const stats = useMemo(() => {
        const online = devices.filter(d => d.status === 'online').length;
        const offline = devices.filter(d => d.status === 'offline').length;
        const warning = devices.filter(d => d.status === 'warning' || d.status === 'error').length;
        const usedU = cabinet?.usedU || 0;
        const totalU = cabinet?.uHeight || 42;
        return { online, offline, warning, total: devices.length, usedU, totalU, usage: Math.round((usedU / totalU) * 100) };
    }, [devices, cabinet]);

    if (!cabinetId) {
        return (
            <PageContainer>
                <Empty description="未指定机柜ID" />
            </PageContainer>
        );
    }

    return (
        <PageContainer
            header={{
                title: cabinet?.name || '机柜3D视图',
                subTitle: cabinet ? `${cabinet.code} | ${cabinet.row}排${cabinet.column}列` : '',
                onBack: () => history.back(),
            }}
        >
            <Spin spinning={loading}>
                {cabinet ? (
                    <div className={styles.container}>
                        {/* 左侧统计 */}
                        <Card className={styles.statsCard}>
                            <div className={styles.statsHeader}>
                                <h3>机柜信息</h3>
                            </div>
                            <Divider style={{ margin: '12px 0' }} />

                            <div className={styles.statItem}>
                                <span>U位使用率</span>
                                <Progress
                                    percent={stats.usage}
                                    size="small"
                                    status={stats.usage > 90 ? 'exception' : 'active'}
                                />
                                <span className={styles.statDetail}>{stats.usedU} / {stats.totalU} U</span>
                            </div>

                            <Divider style={{ margin: '16px 0' }} />

                            <Row gutter={[8, 16]}>
                                <Col span={12}>
                                    <Statistic title="设备总数" value={stats.total} valueStyle={{ fontSize: 20 }} />
                                </Col>
                                <Col span={12}>
                                    <Statistic title="在线" value={stats.online} valueStyle={{ fontSize: 20, color: '#52c41a' }} />
                                </Col>
                                <Col span={12}>
                                    <Statistic title="离线" value={stats.offline} valueStyle={{ fontSize: 20, color: '#8c8c8c' }} />
                                </Col>
                                <Col span={12}>
                                    <Statistic title="告警" value={stats.warning} valueStyle={{ fontSize: 20, color: '#faad14' }} />
                                </Col>
                            </Row>
                        </Card>

                        {/* 3D视图 */}
                        <Card
                            className={styles.canvasCard}
                            bodyStyle={{ padding: 0, height: '100%' }}
                            title={
                                <Space>
                                    <span>3D视图</span>
                                    <span style={{ fontSize: 12, color: '#888' }}>
                                        拖动旋转查看不同角度
                                    </span>
                                </Space>
                            }
                        >
                            <div className={styles.canvasContainer}>
                                <Canvas shadows>
                                    <Suspense fallback={null}>
                                        <CabinetScene3D
                                            cabinet={cabinet}
                                            devices={devices}
                                            templates={templates}
                                            devicePorts={devicePorts}
                                            selectedDevice={selectedDevice}
                                            cabinetRotationY={cabinetRotationY}
                                            deviceRotationY={deviceRotationY}
                                            onDeviceSelect={setSelectedDevice}
                                            onCabinetRotationChange={setCabinetRotationY}
                                            onDeviceRotationChange={setDeviceRotationY}
                                        />
                                    </Suspense>
                                </Canvas>
                                <div className={styles.hint}>
                                    左侧机柜和右侧设备可独立拖动旋转
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    !loading && <Empty description="未找到机柜数据" />
                )}
            </Spin>
        </PageContainer>
    );
};

export default Cabinet3DPage;
