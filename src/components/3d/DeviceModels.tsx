import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { FrontPortPanel, RearPortPanel } from './PortRenderer3D';

// 设备状态颜色配置
export const deviceStatusColors: Record<string, { color: string; emissive: string }> = {
    online: { color: '#52c41a', emissive: '#52c41a' },
    offline: { color: '#8c8c8c', emissive: '#4a4a4a' },
    warning: { color: '#faad14', emissive: '#faad14' },
    error: { color: '#f5222d', emissive: '#f5222d' },
    maintenance: { color: '#1890ff', emissive: '#1890ff' },
};

// 设备悬停信息面板
interface DeviceTooltipProps {
    device: IDC.Device;
    template?: any;
    visible: boolean;
}

export const Device3DTooltip: React.FC<DeviceTooltipProps> = ({ device, template, visible }) => {
    if (!visible) return null;

    const statusLabels: Record<string, string> = {
        online: '在线',
        offline: '离线',
        warning: '告警',
        error: '故障',
        maintenance: '维护中',
    };

    return (
        <Html center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div style={{
                background: 'rgba(0,0,0,0.9)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 12,
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
            }}>
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>{device.name}</div>
                <div style={{ color: '#bbb', fontSize: 11, lineHeight: 1.6 }}>
                    {template && <div>型号: {template.brand} {template.model}</div>}
                    <div>资产编码: {device.assetCode}</div>
                    <div>U位: U{device.startU}-U{device.endU}</div>
                    <div>状态: <span style={{ color: deviceStatusColors[device.status]?.color }}>{statusLabels[device.status] || device.status}</span></div>
                    {device.managementIp && <div>IP: {device.managementIp}</div>}
                </div>
            </div>
        </Html>
    );
};

// 通用设备属性
interface DeviceModelProps {
    device: IDC.Device;
    template?: IDC.DeviceTemplate;
    ports?: IDC.Port[];
    position: [number, number, number];
    height: number;
    width: number;
    depth: number;
    selected?: boolean;
    hovered?: boolean;
    showRear?: boolean;
    showTooltip?: boolean;
    onClick?: (e: any) => void;
    onDoubleClick?: (e: any) => void;
    onPointerOver?: () => void;
    onPointerOut?: () => void;
}

// ==================== 服务器3D模型 ====================
export const ServerModel: React.FC<DeviceModelProps> = ({
    device, template, ports = [], position, height, width, depth,
    selected, hovered, showRear = false, showTooltip = true, onClick, onDoubleClick, onPointerOver, onPointerOut
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const [breathPhase, setBreathPhase] = useState(0);
    const status = deviceStatusColors[device.status] || deviceStatusColors.offline;
    const isWarning = device.status === 'warning' || device.status === 'error';

    // 呼吸灯动画
    useFrame((_, delta) => {
        if (isWarning) {
            setBreathPhase(prev => (prev + delta * 3) % (Math.PI * 2));
        }
    });

    const emissiveIntensity = isWarning ? 0.5 + Math.sin(breathPhase) * 0.5 : 0.3;

    // 硬盘LED阵列
    const diskLeds = useMemo(() => {
        const leds: React.ReactNode[] = [];
        const ledCount = Math.min(8, Math.floor(width / 0.05));
        const startX = -width / 2 + 0.03;

        for (let i = 0; i < ledCount; i++) {
            const isActive = Math.random() > 0.3;
            leds.push(
                <mesh key={i} position={[startX + i * 0.05, -height / 4, depth / 2 + 0.005]}>
                    <boxGeometry args={[0.02, 0.01, 0.002]} />
                    <meshStandardMaterial
                        color={isActive ? '#00ff00' : '#333'}
                        emissive={isActive ? '#00ff00' : '#000'}
                        emissiveIntensity={isActive ? 0.8 : 0}
                    />
                </mesh>
            );
        }
        return leds;
    }, [width, height, depth]);

    return (
        <group ref={groupRef} position={position}>
            {/* 服务器主体 */}
            <mesh
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onPointerOver={onPointerOver}
                onPointerOut={onPointerOut}
            >
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={hovered ? '#7a8fa3' : '#5c6b7a'}
                    metalness={0.5}
                    roughness={0.4}
                />
            </mesh>

            {/* 前面板（深色） */}
            <mesh position={[0, 0, depth / 2 + 0.001]}>
                <boxGeometry args={[width - 0.01, height - 0.005, 0.003]} />
                <meshStandardMaterial color="#2a2f35" metalness={0.3} roughness={0.6} />
            </mesh>

            {/* 硬盘LED阵列 */}
            {diskLeds}

            {/* 端口渲染 - 如果有端口数据 */}
            {ports.length > 0 && template && (
                <FrontPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {/* 后面板渲染 */}
            {showRear && (
                <RearPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {/* 电源指示灯 */}
            <mesh position={[width / 2 - 0.02, height / 3, depth / 2 + 0.005]}>
                <sphereGeometry args={[0.008, 8, 8]} />
                <meshStandardMaterial
                    color={status.color}
                    emissive={status.emissive}
                    emissiveIntensity={emissiveIntensity}
                />
            </mesh>

            {/* 选中高亮边框 */}
            {selected && (
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(width + 0.01, height + 0.01, depth + 0.01)]} />
                    <lineBasicMaterial color="#4096ff" linewidth={2} />
                </lineSegments>
            )}

            {/* Tooltip */}
            {showTooltip && hovered && <Device3DTooltip device={device} template={template} visible={true} />}
        </group>
    );
};

// ==================== 交换机3D模型 ====================
export const SwitchModel: React.FC<DeviceModelProps> = ({
    device, template, ports = [], position, height, width, depth,
    selected, hovered, showRear = false, showTooltip = true, onClick, onDoubleClick, onPointerOver, onPointerOut
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const [breathPhase, setBreathPhase] = useState(0);
    const status = deviceStatusColors[device.status] || deviceStatusColors.offline;
    const isWarning = device.status === 'warning' || device.status === 'error';

    useFrame((_, delta) => {
        if (isWarning) {
            setBreathPhase(prev => (prev + delta * 3) % (Math.PI * 2));
        }
    });

    const emissiveIntensity = isWarning ? 0.5 + Math.sin(breathPhase) * 0.5 : 0.3;

    // 使用真实端口数据或回退到模拟端口
    const portMatrix = useMemo(() => {
        // 如果有真实端口数据，使用 PortRenderer
        if (ports.length > 0 && template) {
            return null; // 将由 FrontPortPanel 渲染
        }

        // 回退：模拟端口矩阵
        const portsElements: React.ReactNode[] = [];
        const cols = Math.min(24, Math.floor(width / 0.02));
        const rows = 2;
        const startX = -width / 2 + 0.03;
        const startY = -height / 4;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const isActive = Math.random() > 0.4;
                portsElements.push(
                    <mesh key={`${row}-${col}`} position={[startX + col * 0.018, startY + row * 0.015, depth / 2 + 0.003]}>
                        <boxGeometry args={[0.012, 0.01, 0.002]} />
                        <meshStandardMaterial
                            color={isActive ? '#1890ff' : '#333'}
                            emissive={isActive ? '#0066cc' : '#000'}
                            emissiveIntensity={isActive ? 0.6 : 0}
                        />
                    </mesh>
                );
            }
        }
        return portsElements;
    }, [width, height, depth, ports.length, template]);

    return (
        <group ref={groupRef} position={position}>
            {/* 交换机主体 */}
            <mesh
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onPointerOver={onPointerOver}
                onPointerOut={onPointerOut}
            >
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={hovered ? '#4a7c9b' : '#2d5a7b'}
                    metalness={0.4}
                    roughness={0.5}
                />
            </mesh>

            {/* 前面板 */}
            <mesh position={[0, 0, depth / 2 + 0.001]}>
                <boxGeometry args={[width - 0.01, height - 0.005, 0.003]} />
                <meshStandardMaterial color="#1a2530" metalness={0.3} roughness={0.6} />
            </mesh>

            {/* 端口渲染 - 使用真实数据或模拟 */}
            {ports.length > 0 && template ? (
                <FrontPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            ) : portMatrix}

            {/* 后面板渲染 */}
            {showRear && (
                <RearPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {/* 状态指示灯 */}
            <mesh position={[width / 2 - 0.02, height / 3, depth / 2 + 0.005]}>
                <sphereGeometry args={[0.008, 8, 8]} />
                <meshStandardMaterial
                    color={status.color}
                    emissive={status.emissive}
                    emissiveIntensity={emissiveIntensity}
                />
            </mesh>

            {/* 选中高亮 */}
            {selected && (
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(width + 0.01, height + 0.01, depth + 0.01)]} />
                    <lineBasicMaterial color="#4096ff" linewidth={2} />
                </lineSegments>
            )}

            {showTooltip && hovered && <Device3DTooltip device={device} template={template} visible={true} />}
        </group>
    );
};

// ==================== 路由器3D模型 ====================
export const RouterModel: React.FC<DeviceModelProps> = ({
    device, template, ports = [], position, height, width, depth,
    selected, hovered, showRear = false, showTooltip = true, onClick, onDoubleClick, onPointerOver, onPointerOut
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const [breathPhase, setBreathPhase] = useState(0);
    const status = deviceStatusColors[device.status] || deviceStatusColors.offline;
    const isWarning = device.status === 'warning' || device.status === 'error';

    useFrame((_, delta) => {
        if (isWarning) {
            setBreathPhase(prev => (prev + delta * 3) % (Math.PI * 2));
        }
    });

    const emissiveIntensity = isWarning ? 0.5 + Math.sin(breathPhase) * 0.5 : 0.3;

    return (
        <group ref={groupRef} position={position}>
            {/* 路由器主体 */}
            <mesh
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onPointerOver={onPointerOver}
                onPointerOut={onPointerOut}
            >
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={hovered ? '#6b8e7d' : '#4a6b5c'}
                    metalness={0.4}
                    roughness={0.5}
                />
            </mesh>

            {/* 前面板 */}
            <mesh position={[0, 0, depth / 2 + 0.001]}>
                <boxGeometry args={[width - 0.01, height - 0.005, 0.003]} />
                <meshStandardMaterial color="#1f2d25" metalness={0.3} roughness={0.6} />
            </mesh>

            {/* 网络接口指示灯 */}
            {[...Array(4)].map((_, i) => (
                <mesh key={i} position={[-width / 4 + i * 0.06, 0, depth / 2 + 0.005]}>
                    <boxGeometry args={[0.03, 0.015, 0.002]} />
                    <meshStandardMaterial
                        color={Math.random() > 0.3 ? '#52c41a' : '#333'}
                        emissive={Math.random() > 0.3 ? '#52c41a' : '#000'}
                        emissiveIntensity={0.5}
                    />
                </mesh>
            ))}

            {/* 状态指示灯 */}
            <mesh position={[width / 2 - 0.02, height / 3, depth / 2 + 0.005]}>
                <sphereGeometry args={[0.008, 8, 8]} />
                <meshStandardMaterial
                    color={status.color}
                    emissive={status.emissive}
                    emissiveIntensity={emissiveIntensity}
                />
            </mesh>

            {selected && (
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(width + 0.01, height + 0.01, depth + 0.01)]} />
                    <lineBasicMaterial color="#4096ff" linewidth={2} />
                </lineSegments>
            )}

            {/* 端口渲染 */}
            {ports.length > 0 && template && (
                <FrontPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {/* 后面板渲染 */}
            {showRear && (
                <RearPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {showTooltip && hovered && <Device3DTooltip device={device} template={template} visible={true} />}
        </group>
    );
};

// ==================== 存储设备3D模型 ====================
export const StorageModel: React.FC<DeviceModelProps> = ({
    device, template, ports = [], position, height, width, depth,
    selected, hovered, showRear = false, showTooltip = true, onClick, onDoubleClick, onPointerOver, onPointerOut
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const [breathPhase, setBreathPhase] = useState(0);
    const status = deviceStatusColors[device.status] || deviceStatusColors.offline;
    const isWarning = device.status === 'warning' || device.status === 'error';

    useFrame((_, delta) => {
        if (isWarning) {
            setBreathPhase(prev => (prev + delta * 3) % (Math.PI * 2));
        }
    });

    const emissiveIntensity = isWarning ? 0.5 + Math.sin(breathPhase) * 0.5 : 0.3;

    // 磁盘托架
    const diskBays = useMemo(() => {
        const bays: React.ReactNode[] = [];
        const cols = Math.min(12, Math.floor(width / 0.04));
        const rows = Math.max(1, Math.floor(height / 0.025));
        const startX = -width / 2 + 0.03;
        const startY = height / 2 - 0.02;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const isActive = Math.random() > 0.2;
                bays.push(
                    <group key={`${row}-${col}`} position={[startX + col * 0.038, startY - row * 0.025, depth / 2 + 0.003]}>
                        {/* 磁盘托架 */}
                        <mesh>
                            <boxGeometry args={[0.032, 0.02, 0.004]} />
                            <meshStandardMaterial color="#222" metalness={0.6} roughness={0.3} />
                        </mesh>
                        {/* 活动LED */}
                        <mesh position={[0.01, 0.006, 0.002]}>
                            <boxGeometry args={[0.006, 0.003, 0.001]} />
                            <meshStandardMaterial
                                color={isActive ? '#00ff00' : '#333'}
                                emissive={isActive ? '#00ff00' : '#000'}
                                emissiveIntensity={isActive ? 0.8 : 0}
                            />
                        </mesh>
                    </group>
                );
            }
        }
        return bays;
    }, [width, height, depth]);

    return (
        <group ref={groupRef} position={position}>
            {/* 存储主体 */}
            <mesh
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onPointerOver={onPointerOver}
                onPointerOut={onPointerOut}
            >
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={hovered ? '#6a5acd' : '#483d8b'}
                    metalness={0.4}
                    roughness={0.5}
                />
            </mesh>

            {/* 前面板 */}
            <mesh position={[0, 0, depth / 2 + 0.001]}>
                <boxGeometry args={[width - 0.01, height - 0.005, 0.003]} />
                <meshStandardMaterial color="#1a1525" metalness={0.3} roughness={0.6} />
            </mesh>

            {/* 磁盘托架 */}
            {diskBays}

            {/* 状态指示灯 */}
            <mesh position={[width / 2 - 0.02, height / 2 - 0.015, depth / 2 + 0.005]}>
                <sphereGeometry args={[0.008, 8, 8]} />
                <meshStandardMaterial
                    color={status.color}
                    emissive={status.emissive}
                    emissiveIntensity={emissiveIntensity}
                />
            </mesh>

            {selected && (
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(width + 0.01, height + 0.01, depth + 0.01)]} />
                    <lineBasicMaterial color="#4096ff" linewidth={2} />
                </lineSegments>
            )}

            {/* 端口渲染 */}
            {ports.length > 0 && template && (
                <FrontPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {/* 后面板渲染 */}
            {showRear && (
                <RearPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {showTooltip && hovered && <Device3DTooltip device={device} template={template} visible={true} />}
        </group>
    );
};

// ==================== 防火墙3D模型 ====================
export const FirewallModel: React.FC<DeviceModelProps> = ({
    device, template, ports = [], position, height, width, depth,
    selected, hovered, showRear = false, showTooltip = true, onClick, onDoubleClick, onPointerOver, onPointerOut
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const [breathPhase, setBreathPhase] = useState(0);
    const status = deviceStatusColors[device.status] || deviceStatusColors.offline;
    const isWarning = device.status === 'warning' || device.status === 'error';

    useFrame((_, delta) => {
        if (isWarning) {
            setBreathPhase(prev => (prev + delta * 3) % (Math.PI * 2));
        }
    });

    const emissiveIntensity = isWarning ? 0.5 + Math.sin(breathPhase) * 0.5 : 0.3;

    return (
        <group ref={groupRef} position={position}>
            {/* 防火墙主体 */}
            <mesh
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onPointerOver={onPointerOver}
                onPointerOut={onPointerOut}
            >
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={hovered ? '#cd5c5c' : '#8b0000'}
                    metalness={0.4}
                    roughness={0.5}
                />
            </mesh>

            {/* 盾牌标识 */}
            <mesh position={[0, 0, depth / 2 + 0.003]}>
                <boxGeometry args={[width * 0.3, height * 0.6, 0.004]} />
                <meshStandardMaterial
                    color="#ffd700"
                    emissive="#ffd700"
                    emissiveIntensity={0.2}
                    metalness={0.6}
                    roughness={0.3}
                />
            </mesh>

            {/* 状态指示灯 */}
            <mesh position={[width / 2 - 0.02, height / 3, depth / 2 + 0.005]}>
                <sphereGeometry args={[0.008, 8, 8]} />
                <meshStandardMaterial
                    color={status.color}
                    emissive={status.emissive}
                    emissiveIntensity={emissiveIntensity}
                />
            </mesh>

            {selected && (
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(width + 0.01, height + 0.01, depth + 0.01)]} />
                    <lineBasicMaterial color="#4096ff" linewidth={2} />
                </lineSegments>
            )}

            {/* 端口渲染 */}
            {ports.length > 0 && template && (
                <FrontPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {/* 后面板渲染 */}
            {showRear && (
                <RearPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {showTooltip && hovered && <Device3DTooltip device={device} template={template} visible={true} />}
        </group>
    );
};

// ==================== 负载均衡器3D模型 ====================
export const LoadBalancerModel: React.FC<DeviceModelProps> = ({
    device, template, ports = [], position, height, width, depth,
    selected, hovered, showRear = false, showTooltip = true, onClick, onDoubleClick, onPointerOver, onPointerOut
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const [breathPhase, setBreathPhase] = useState(0);
    const status = deviceStatusColors[device.status] || deviceStatusColors.offline;
    const isWarning = device.status === 'warning' || device.status === 'error';

    useFrame((_, delta) => {
        setBreathPhase(prev => (prev + delta * 2) % (Math.PI * 2));
    });

    const emissiveIntensity = isWarning ? 0.5 + Math.sin(breathPhase) * 0.5 : 0.3;
    const arrowGlow = 0.3 + Math.sin(breathPhase) * 0.2;

    return (
        <group ref={groupRef} position={position}>
            {/* 负载均衡器主体 */}
            <mesh
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onPointerOver={onPointerOver}
                onPointerOut={onPointerOut}
            >
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={hovered ? '#20b2aa' : '#008b8b'}
                    metalness={0.4}
                    roughness={0.5}
                />
            </mesh>

            {/* 流量箭头指示（动态发光） */}
            <mesh position={[-width * 0.15, 0, depth / 2 + 0.003]}>
                <boxGeometry args={[0.02, height * 0.4, 0.003]} />
                <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={arrowGlow}
                />
            </mesh>
            <mesh position={[width * 0.15, 0, depth / 2 + 0.003]}>
                <boxGeometry args={[0.02, height * 0.4, 0.003]} />
                <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={arrowGlow}
                />
            </mesh>

            {/* 状态指示灯 */}
            <mesh position={[width / 2 - 0.02, height / 3, depth / 2 + 0.005]}>
                <sphereGeometry args={[0.008, 8, 8]} />
                <meshStandardMaterial
                    color={status.color}
                    emissive={status.emissive}
                    emissiveIntensity={emissiveIntensity}
                />
            </mesh>

            {selected && (
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(width + 0.01, height + 0.01, depth + 0.01)]} />
                    <lineBasicMaterial color="#4096ff" linewidth={2} />
                </lineSegments>
            )}

            {/* 端口渲染 */}
            {ports.length > 0 && template && (
                <FrontPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {/* 后面板渲染 */}
            {showRear && (
                <RearPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {showTooltip && hovered && <Device3DTooltip device={device} template={template} visible={true} />}
        </group>
    );
};

// ==================== 通用设备3D模型 ====================
export const GenericDeviceModel: React.FC<DeviceModelProps> = ({
    device, template, ports = [], position, height, width, depth,
    selected, hovered, showRear = false, showTooltip = true, onClick, onDoubleClick, onPointerOver, onPointerOut
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const status = deviceStatusColors[device.status] || deviceStatusColors.offline;

    return (
        <group ref={groupRef} position={position}>
            <mesh
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onPointerOver={onPointerOver}
                onPointerOut={onPointerOut}
            >
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={hovered ? '#8fa3b8' : '#6b7b8c'}
                    metalness={0.4}
                    roughness={0.5}
                />
            </mesh>

            {/* 状态指示灯 */}
            <mesh position={[width / 2 - 0.02, height / 3, depth / 2 + 0.005]}>
                <sphereGeometry args={[0.008, 8, 8]} />
                <meshStandardMaterial
                    color={status.color}
                    emissive={status.emissive}
                    emissiveIntensity={0.5}
                />
            </mesh>

            {selected && (
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(width + 0.01, height + 0.01, depth + 0.01)]} />
                    <lineBasicMaterial color="#4096ff" linewidth={2} />
                </lineSegments>
            )}

            {/* 端口渲染 */}
            {ports.length > 0 && template && (
                <FrontPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {/* 后面板渲染 */}
            {showRear && (
                <RearPortPanel
                    template={template}
                    ports={ports}
                    width={width}
                    height={height}
                    depth={depth}
                />
            )}

            {showTooltip && hovered && <Device3DTooltip device={device} template={template} visible={true} />}
        </group>
    );
};

// ==================== 设备模型选择器 ====================
interface Device3DProps {
    device: IDC.Device;
    template?: IDC.DeviceTemplate;
    ports?: IDC.Port[];
    category: string;
    position: [number, number, number];
    height: number;
    width: number;
    depth: number;
    selected?: boolean;
    showRear?: boolean;
    showTooltip?: boolean;
    onSelect?: (device: IDC.Device) => void;
    onDoubleClick?: (device: IDC.Device, position: [number, number, number]) => void;
}

export const Device3D: React.FC<Device3DProps> = ({
    device, template, ports, category, position, height, width, depth,
    selected, showRear = false, showTooltip = true, onSelect, onDoubleClick
}) => {
    const [hovered, setHovered] = useState(false);

    const handleClick = (e: any) => {
        e.stopPropagation();
        onSelect?.(device);
    };

    const handleDoubleClick = (e: any) => {
        e.stopPropagation();
        onDoubleClick?.(device, position);
    };

    const commonProps: DeviceModelProps = {
        device,
        template,
        ports,
        position,
        height,
        width,
        depth,
        selected,
        hovered,
        showRear,
        showTooltip,
        onClick: handleClick,
        onDoubleClick: handleDoubleClick,
        onPointerOver: () => setHovered(true),
        onPointerOut: () => setHovered(false),
    };

    // 根据设备类型选择对应的3D模型
    switch (category) {
        case 'server':
            return <ServerModel {...commonProps} />;
        case 'switch':
            return <SwitchModel {...commonProps} />;
        case 'router':
            return <RouterModel {...commonProps} />;
        case 'storage':
            return <StorageModel {...commonProps} />;
        case 'firewall':
            return <FirewallModel {...commonProps} />;
        case 'loadbalancer':
            return <LoadBalancerModel {...commonProps} />;
        default:
            return <GenericDeviceModel {...commonProps} />;
    }
};

export default Device3D;
