/**
 * 3D渲染性能优化 - 实例化渲染（InstancedMesh）
 * 
 * 功能：
 * 1. 将相同类型的设备使用 InstancedMesh 批量渲染
 * 2. 大幅减少 draw calls 数量
 * 3. 支持单个实例的交互（选择、悬停）
 */

import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import {
    getCachedMaterial,
    getCachedBoxGeometry,
    DeviceMaterials,
    StatusMaterials
} from './TextureManager';

// ==================== 类型定义 ====================

interface DeviceInstance {
    id: string;
    position: [number, number, number];
    width: number;
    height: number;
    depth: number;
    status: string;
    name: string;
    category: string;
}

interface InstancedDeviceGroupProps {
    devices: DeviceInstance[];
    category: string;
    color: string;
    colorHover: string;
    onSelect?: (deviceId: string, position: [number, number, number]) => void;
    onDoubleClick?: (deviceId: string, position: [number, number, number]) => void;
    selectedId?: string | null;
    highlightedId?: string | null;
}

// ==================== 实例化设备组 ====================

/**
 * 实例化设备组 - 批量渲染相同类型的设备
 * 
 * 注意：此组件适用于远距离渲染（LOD LOW级别），
 * 近距离时应使用完整的 Device3D 组件以显示细节
 */
export const InstancedDeviceGroup: React.FC<InstancedDeviceGroupProps> = ({
    devices,
    color,
    onSelect,
    onDoubleClick,
    selectedId,
    highlightedId,
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const statusMeshRef = useRef<THREE.InstancedMesh>(null);
    const { raycaster, camera, pointer } = useThree();

    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

    const count = devices.length;

    // 创建共享几何体
    const geometry = useMemo(() => {
        // 使用平均尺寸创建共享几何体
        // 实际尺寸差异通过缩放矩阵处理
        return new THREE.BoxGeometry(1, 1, 1);
    }, []);

    // 状态指示灯几何体
    const statusGeometry = useMemo(() => {
        return new THREE.SphereGeometry(0.01, 6, 6);
    }, []);

    // 基础材质
    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.4,
            roughness: 0.5,
        });
    }, [color]);

    // 状态颜色映射
    const statusColors: Record<string, THREE.Color> = useMemo(() => ({
        online: new THREE.Color('#52c41a'),
        offline: new THREE.Color('#8c8c8c'),
        warning: new THREE.Color('#faad14'),
        error: new THREE.Color('#f5222d'),
        maintenance: new THREE.Color('#1890ff'),
    }), []);

    // 设备索引映射（用于快速查找）
    const deviceIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        devices.forEach((device, index) => {
            map.set(device.id, index);
        });
        return map;
    }, [devices]);

    // 更新实例变换矩阵
    useEffect(() => {
        if (!meshRef.current || !statusMeshRef.current) return;

        const tempMatrix = new THREE.Matrix4();
        const tempColor = new THREE.Color();

        devices.forEach((device, i) => {
            // 设置位置和缩放
            tempMatrix.compose(
                new THREE.Vector3(...device.position),
                new THREE.Quaternion(),
                new THREE.Vector3(device.width, device.height, device.depth)
            );
            meshRef.current!.setMatrixAt(i, tempMatrix);

            // 设置状态灯位置
            const statusPos = new THREE.Vector3(
                device.position[0] + device.width / 2 - 0.02,
                device.position[1] + device.height / 3,
                device.position[2] + device.depth / 2 + 0.005
            );
            tempMatrix.compose(
                statusPos,
                new THREE.Quaternion(),
                new THREE.Vector3(1, 1, 1)
            );
            statusMeshRef.current!.setMatrixAt(i, tempMatrix);

            // 设置状态灯颜色
            tempColor.copy(statusColors[device.status] || statusColors.offline);
            statusMeshRef.current!.setColorAt(i, tempColor);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        statusMeshRef.current.instanceMatrix.needsUpdate = true;
        if (statusMeshRef.current.instanceColor) {
            statusMeshRef.current.instanceColor.needsUpdate = true;
        }
    }, [devices, statusColors]);

    // 更新高亮状态
    useEffect(() => {
        if (!meshRef.current) return;

        const tempColor = new THREE.Color();
        const baseColor = new THREE.Color(color);
        const highlightColor = new THREE.Color('#4096ff');
        const hoverColor = new THREE.Color(color).multiplyScalar(1.3);

        devices.forEach((device, i) => {
            if (device.id === selectedId || device.id === highlightedId) {
                tempColor.copy(highlightColor);
            } else if (i === hoveredIndex) {
                tempColor.copy(hoverColor);
            } else {
                tempColor.copy(baseColor);
            }
            meshRef.current!.setColorAt(i, tempColor);
        });

        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    }, [devices, selectedId, highlightedId, hoveredIndex, color]);

    // 射线检测 - 查找悬停的实例
    const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();

        if (!meshRef.current) return;

        // 获取交叉点的实例索引
        const intersects = raycaster.intersectObject(meshRef.current);

        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
            setHoveredIndex(intersects[0].instanceId);
        } else {
            setHoveredIndex(null);
        }
    }, [raycaster]);

    const handlePointerOut = useCallback(() => {
        setHoveredIndex(null);
    }, []);

    // 点击处理
    const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();

        if (!meshRef.current) return;

        const intersects = raycaster.intersectObject(meshRef.current);

        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
            const index = intersects[0].instanceId;
            const device = devices[index];
            if (device && onSelect) {
                onSelect(device.id, device.position);
            }
        }
    }, [raycaster, devices, onSelect]);

    // 双击处理
    const handleDoubleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();

        if (!meshRef.current) return;

        const intersects = raycaster.intersectObject(meshRef.current);

        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
            const index = intersects[0].instanceId;
            const device = devices[index];
            if (device && onDoubleClick) {
                onDoubleClick(device.id, device.position);
            }
        }
    }, [raycaster, devices, onDoubleClick]);

    // 悬停提示
    const hoveredDevice = hoveredIndex !== null ? devices[hoveredIndex] : null;

    if (count === 0) return null;

    return (
        <group>
            {/* 实例化设备主体 */}
            <instancedMesh
                ref={meshRef}
                args={[geometry, material, count]}
                onPointerMove={handlePointerMove}
                onPointerOut={handlePointerOut}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
            />

            {/* 实例化状态指示灯 */}
            <instancedMesh
                ref={statusMeshRef}
                args={[statusGeometry, undefined, count]}
            >
                <meshStandardMaterial
                    vertexColors
                    emissive="#ffffff"
                    emissiveIntensity={0.3}
                />
            </instancedMesh>

            {/* 悬停提示 */}
            {hoveredDevice && (
                <Html
                    position={hoveredDevice.position}
                    center
                    distanceFactor={6}
                    style={{ pointerEvents: 'none' }}
                >
                    <div style={{
                        background: 'rgba(0,0,0,0.85)',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                        fontFamily: 'system-ui',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        <div style={{ fontWeight: 600 }}>{hoveredDevice.name}</div>
                        <div style={{ color: '#aaa', fontSize: 11 }}>
                            类型: {hoveredDevice.category}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
};

// ==================== 按类别分组的实例化渲染 ====================

interface DevicesByCategory {
    [category: string]: DeviceInstance[];
}

interface InstancedDeviceRendererProps {
    devices: IDC.Device[];
    templates: any[];
    devicePositions: Record<string, [number, number, number]>;
    deviceDimensions: Record<string, { width: number; height: number; depth: number }>;
    onSelectDevice?: (device: IDC.Device) => void;
    onDoubleClickDevice?: (device: IDC.Device, position: [number, number, number]) => void;
    selectedDeviceId?: string | null;
    highlightedDeviceId?: string | null;
}

// 设备类型颜色映射
const CATEGORY_COLORS: Record<string, { color: string; colorHover: string }> = {
    server: { color: '#5c6b7a', colorHover: '#7a8fa3' },
    switch: { color: '#2d5a7b', colorHover: '#4a7c9b' },
    router: { color: '#4a6b5c', colorHover: '#6b8e7d' },
    storage: { color: '#483d8b', colorHover: '#6a5acd' },
    firewall: { color: '#8b0000', colorHover: '#cd5c5c' },
    loadbalancer: { color: '#008b8b', colorHover: '#20b2aa' },
    other: { color: '#6b7b8c', colorHover: '#8fa3b8' },
};

/**
 * 实例化设备渲染器 - 自动按类型分组并使用实例化渲染
 */
export const InstancedDeviceRenderer: React.FC<InstancedDeviceRendererProps> = ({
    devices,
    templates,
    devicePositions,
    deviceDimensions,
    onSelectDevice,
    onDoubleClickDevice,
    selectedDeviceId,
    highlightedDeviceId,
}) => {
    // 按类别分组设备
    const devicesByCategory = useMemo(() => {
        const groups: DevicesByCategory = {};

        devices.forEach(device => {
            const template = templates.find(t => t.id === device.templateId);
            const category = template?.category || 'other';

            if (!groups[category]) {
                groups[category] = [];
            }

            const position = devicePositions[device.id];
            const dimensions = deviceDimensions[device.id];

            if (position && dimensions) {
                groups[category].push({
                    id: device.id,
                    position,
                    width: dimensions.width,
                    height: dimensions.height,
                    depth: dimensions.depth,
                    status: device.status,
                    name: device.name,
                    category,
                });
            }
        });

        return groups;
    }, [devices, templates, devicePositions, deviceDimensions]);

    // 设备ID -> Device对象映射
    const deviceMap = useMemo(() => {
        const map = new Map<string, IDC.Device>();
        devices.forEach(device => map.set(device.id, device));
        return map;
    }, [devices]);

    const handleSelect = useCallback((deviceId: string, position: [number, number, number]) => {
        const device = deviceMap.get(deviceId);
        if (device && onSelectDevice) {
            onSelectDevice(device);
        }
    }, [deviceMap, onSelectDevice]);

    const handleDoubleClick = useCallback((deviceId: string, position: [number, number, number]) => {
        const device = deviceMap.get(deviceId);
        if (device && onDoubleClickDevice) {
            onDoubleClickDevice(device, position);
        }
    }, [deviceMap, onDoubleClickDevice]);

    return (
        <group>
            {Object.entries(devicesByCategory).map(([category, categoryDevices]) => {
                const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

                return (
                    <InstancedDeviceGroup
                        key={category}
                        devices={categoryDevices}
                        category={category}
                        color={colors.color}
                        colorHover={colors.colorHover}
                        onSelect={handleSelect}
                        onDoubleClick={handleDoubleClick}
                        selectedId={selectedDeviceId}
                        highlightedId={highlightedDeviceId}
                    />
                );
            })}
        </group>
    );
};

// ==================== 工具函数 ====================

/**
 * 计算使用实例化渲染可以节省的 draw calls
 */
export function calculateDrawCallSavings(
    deviceCount: number,
    categoryCount: number
): { before: number; after: number; savings: number } {
    // 假设每个设备平均有 5 个 mesh（主体、面板、LED、状态灯、边框）
    const meshesPerDevice = 5;
    const before = deviceCount * meshesPerDevice;

    // 实例化后，每个类别只需要 2 个 draw calls（主体 + 状态灯）
    const after = categoryCount * 2;

    return {
        before,
        after,
        savings: before - after,
    };
}
