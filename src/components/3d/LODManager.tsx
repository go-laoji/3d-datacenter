/**
 * 3D渲染性能优化 - LOD（细节层次）管理器
 * 
 * 功能：
 * 1. 根据相机距离动态切换模型精度
 * 2. 距离远时使用简化模型，减少渲染开销
 * 3. 提供 LODDevice3D 组件包装原有 Device3D
 */

import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// LOD 级别定义
export enum LODLevel {
    HIGH = 0,    // 完整细节：< 3m
    MEDIUM = 1,  // 中等细节：3-8m
    LOW = 2,     // 低细节：> 8m
    HIDDEN = 3,  // 超远距离，不渲染：> 15m
}

// LOD 阈值配置
export interface LODThresholds {
    high: number;     // 高精度阈值（低于此距离使用高精度）
    medium: number;   // 中精度阈值
    low: number;      // 低精度阈值（超过此距离隐藏）
}

// 默认阈值
export const DEFAULT_LOD_THRESHOLDS: LODThresholds = {
    high: 3,
    medium: 8,
    low: 15,
};

/**
 * 根据距离计算 LOD 级别
 */
export function calculateLODLevel(
    distance: number,
    thresholds: LODThresholds = DEFAULT_LOD_THRESHOLDS
): LODLevel {
    if (distance < thresholds.high) return LODLevel.HIGH;
    if (distance < thresholds.medium) return LODLevel.MEDIUM;
    if (distance < thresholds.low) return LODLevel.LOW;
    return LODLevel.HIDDEN;
}

// ==================== LOD Context ====================

interface LODContextValue {
    lodLevel: LODLevel;
    distance: number;
}

const LODContext = React.createContext<LODContextValue>({
    lodLevel: LODLevel.HIGH,
    distance: 0,
});

export const useLODContext = () => React.useContext(LODContext);

// ==================== LOD 容器组件 ====================

interface LODContainerProps {
    children: React.ReactNode;
    position: [number, number, number];
    thresholds?: LODThresholds;
    updateFrequency?: number; // 更新频率（每N帧更新一次）
}

/**
 * LOD 容器 - 根据相机距离提供 LOD 级别给子组件
 */
export const LODContainer: React.FC<LODContainerProps> = ({
    children,
    position,
    thresholds = DEFAULT_LOD_THRESHOLDS,
    updateFrequency = 10, // 默认每10帧更新一次，降低计算开销
}) => {
    const { camera } = useThree();
    const [lodLevel, setLodLevel] = React.useState<LODLevel>(LODLevel.HIGH);
    const [distance, setDistance] = React.useState<number>(0);
    const frameCount = useRef(0);
    const positionVec = useMemo(() => new THREE.Vector3(...position), [position]);

    useFrame(() => {
        frameCount.current++;

        // 降低更新频率
        if (frameCount.current % updateFrequency !== 0) return;

        const newDistance = camera.position.distanceTo(positionVec);
        const newLevel = calculateLODLevel(newDistance, thresholds);

        // 只在级别变化时更新状态
        if (newLevel !== lodLevel) {
            setLodLevel(newLevel);
            setDistance(newDistance);
        }
    });

    // 如果是 HIDDEN 级别，不渲染任何内容
    if (lodLevel === LODLevel.HIDDEN) {
        return null;
    }

    return (
        <LODContext.Provider value={{ lodLevel, distance }}>
            {children}
        </LODContext.Provider>
    );
};

// ==================== 简化设备模型 ====================

interface SimplifiedDeviceProps {
    position: [number, number, number];
    width: number;
    height: number;
    depth: number;
    color: string;
    status: string;
    onClick?: (e: any) => void;
    onDoubleClick?: (e: any) => void;
    onPointerOver?: () => void;
    onPointerOut?: () => void;
}

/**
 * 低精度设备模型 - 仅显示主体盒子和状态指示灯
 */
export const LowDetailDevice: React.FC<SimplifiedDeviceProps> = ({
    position,
    width,
    height,
    depth,
    color,
    status,
    onClick,
    onDoubleClick,
    onPointerOver,
    onPointerOut,
}) => {
    const statusColors: Record<string, string> = {
        online: '#52c41a',
        offline: '#8c8c8c',
        warning: '#faad14',
        error: '#f5222d',
        maintenance: '#1890ff',
    };

    return (
        <group position={position}>
            {/* 简化主体 - 仅一个盒子 */}
            <mesh
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onPointerOver={onPointerOver}
                onPointerOut={onPointerOut}
            >
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.4}
                    roughness={0.5}
                />
            </mesh>

            {/* 简化状态指示灯 - 低多边形球体 */}
            <mesh position={[width / 2 - 0.02, height / 3, depth / 2 + 0.005]}>
                <sphereGeometry args={[0.01, 4, 4]} />
                <meshStandardMaterial
                    color={statusColors[status] || statusColors.offline}
                    emissive={statusColors[status] || statusColors.offline}
                    emissiveIntensity={0.5}
                />
            </mesh>
        </group>
    );
};

/**
 * 中等精度设备模型 - 主体 + 前面板 + 状态灯
 */
export const MediumDetailDevice: React.FC<SimplifiedDeviceProps & {
    panelColor?: string;
}> = ({
    position,
    width,
    height,
    depth,
    color,
    panelColor = '#222',
    status,
    onClick,
    onDoubleClick,
    onPointerOver,
    onPointerOut,
}) => {
        const statusColors: Record<string, string> = {
            online: '#52c41a',
            offline: '#8c8c8c',
            warning: '#faad14',
            error: '#f5222d',
            maintenance: '#1890ff',
        };

        return (
            <group position={position}>
                {/* 主体 */}
                <mesh
                    onClick={onClick}
                    onDoubleClick={onDoubleClick}
                    onPointerOver={onPointerOver}
                    onPointerOut={onPointerOut}
                >
                    <boxGeometry args={[width, height, depth]} />
                    <meshStandardMaterial
                        color={color}
                        metalness={0.4}
                        roughness={0.5}
                    />
                </mesh>

                {/* 前面板 */}
                <mesh position={[0, 0, depth / 2 + 0.001]}>
                    <boxGeometry args={[width - 0.01, height - 0.005, 0.003]} />
                    <meshStandardMaterial color={panelColor} metalness={0.3} roughness={0.6} />
                </mesh>

                {/* 状态指示灯 */}
                <mesh position={[width / 2 - 0.02, height / 3, depth / 2 + 0.005]}>
                    <sphereGeometry args={[0.008, 6, 6]} />
                    <meshStandardMaterial
                        color={statusColors[status] || statusColors.offline}
                        emissive={statusColors[status] || statusColors.offline}
                        emissiveIntensity={0.4}
                    />
                </mesh>
            </group>
        );
    };

// ==================== LOD 设备包装器 ====================

interface LODDeviceWrapperProps {
    position: [number, number, number];
    width: number;
    height: number;
    depth: number;
    bodyColor: string;
    bodyColorHover: string;
    panelColor: string;
    status: string;
    selected?: boolean;
    thresholds?: LODThresholds;
    children: React.ReactNode; // 高精度模型
    onClick?: (e: any) => void;
    onDoubleClick?: (e: any) => void;
    onPointerOver?: () => void;
    onPointerOut?: () => void;
}

/**
 * LOD 设备包装器 - 自动根据距离切换精度
 */
export const LODDeviceWrapper: React.FC<LODDeviceWrapperProps> = ({
    position,
    width,
    height,
    depth,
    bodyColor,
    panelColor,
    status,
    thresholds = DEFAULT_LOD_THRESHOLDS,
    children,
    onClick,
    onDoubleClick,
    onPointerOver,
    onPointerOut,
}) => {
    const { camera } = useThree();
    const [lodLevel, setLodLevel] = React.useState<LODLevel>(LODLevel.HIGH);
    const frameCount = useRef(0);
    const positionVec = useMemo(() => new THREE.Vector3(...position), [position]);

    useFrame(() => {
        frameCount.current++;

        // 每10帧更新一次
        if (frameCount.current % 10 !== 0) return;

        const distance = camera.position.distanceTo(positionVec);
        const newLevel = calculateLODLevel(distance, thresholds);

        if (newLevel !== lodLevel) {
            setLodLevel(newLevel);
        }
    });

    // 根据 LOD 级别渲染不同精度的模型
    switch (lodLevel) {
        case LODLevel.HIDDEN:
            return null;

        case LODLevel.LOW:
            return (
                <LowDetailDevice
                    position={position}
                    width={width}
                    height={height}
                    depth={depth}
                    color={bodyColor}
                    status={status}
                    onClick={onClick}
                    onDoubleClick={onDoubleClick}
                    onPointerOver={onPointerOver}
                    onPointerOut={onPointerOut}
                />
            );

        case LODLevel.MEDIUM:
            return (
                <MediumDetailDevice
                    position={position}
                    width={width}
                    height={height}
                    depth={depth}
                    color={bodyColor}
                    panelColor={panelColor}
                    status={status}
                    onClick={onClick}
                    onDoubleClick={onDoubleClick}
                    onPointerOver={onPointerOver}
                    onPointerOut={onPointerOut}
                />
            );

        case LODLevel.HIGH:
        default:
            return <>{children}</>;
    }
};

// ==================== 工具函数 ====================

/**
 * Hook：获取当前相机距离
 */
export function useDistanceToCamera(position: [number, number, number]): number {
    const { camera } = useThree();
    const [distance, setDistance] = React.useState(0);
    const positionVec = useMemo(() => new THREE.Vector3(...position), [position]);
    const frameCount = useRef(0);

    useFrame(() => {
        frameCount.current++;
        if (frameCount.current % 10 !== 0) return;

        setDistance(camera.position.distanceTo(positionVec));
    });

    return distance;
}

/**
 * Hook：获取当前 LOD 级别
 */
export function useLODLevel(
    position: [number, number, number],
    thresholds?: LODThresholds
): LODLevel {
    const distance = useDistanceToCamera(position);
    return useMemo(
        () => calculateLODLevel(distance, thresholds),
        [distance, thresholds]
    );
}
