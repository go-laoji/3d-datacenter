/**
 * 用户体验优化 - 选择和测量工具
 *
 * 功能：
 * 1. 框选多个设备
 * 2. 批量操作支持
 * 3. 设备间距离测量
 * 4. 线缆长度计算
 */

import React, {
    useState,
    useCallback,
    useRef,
    useMemo,
    useEffect,
} from 'react';
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';

// ==================== 类型定义 ====================

export interface SelectionBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export interface MeasurementPoint {
    id: string;
    position: [number, number, number];
    label?: string;
}

export interface MeasurementLine {
    id: string;
    start: MeasurementPoint;
    end: MeasurementPoint;
    distance: number;
}

// ==================== 框选工具 ====================

interface BoxSelectToolProps {
    enabled: boolean;
    selectionBox: SelectionBox | null;
    onSelectionComplete: (selectedIds: string[]) => void;
    devicePositions: Record<string, [number, number, number]>;
    deviceBounds?: Record<
        string,
        { width: number; height: number; depth: number }
    >;
}

/**
 * 框选工具 - 2D覆盖层
 */
export const BoxSelectOverlay: React.FC<{
    enabled: boolean;
    onSelectionBox: (box: SelectionBox | null) => void;
}> = ({ enabled, onSelectionBox }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [box, setBox] = useState<SelectionBox | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!enabled) return;
            e.preventDefault();

            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            setIsDragging(true);
            setBox({
                startX: e.clientX - rect.left,
                startY: e.clientY - rect.top,
                endX: e.clientX - rect.left,
                endY: e.clientY - rect.top,
            });
        },
        [enabled],
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging || !box) return;

            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            setBox({
                ...box,
                endX: e.clientX - rect.left,
                endY: e.clientY - rect.top,
            });
        },
        [isDragging, box],
    );

    const handleMouseUp = useCallback(() => {
        if (isDragging && box) {
            onSelectionBox(box);
        }
        setIsDragging(false);
        setBox(null);
    }, [isDragging, box, onSelectionBox]);

    if (!enabled) return null;

    const boxStyle = box
        ? {
            left: Math.min(box.startX, box.endX),
            top: Math.min(box.startY, box.endY),
            width: Math.abs(box.endX - box.startX),
            height: Math.abs(box.endY - box.startY),
        }
        : null;

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                cursor: 'crosshair',
                zIndex: 100,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {boxStyle && (
                <div
                    style={{
                        position: 'absolute',
                        ...boxStyle,
                        border: '2px dashed #4096ff',
                        background: 'rgba(64, 150, 255, 0.1)',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </div>
    );
};

/**
 * 3D框选检测器
 */
export const BoxSelectDetector: React.FC<BoxSelectToolProps> = ({
    enabled,
    selectionBox,
    onSelectionComplete,
    devicePositions,
}) => {
    const { camera, size } = useThree();

    // 将屏幕坐标转换为NDC坐标并检测设备
    useEffect(() => {
        if (!enabled || !selectionBox) return;

        const box = selectionBox;
        const selectedIds: string[] = [];

        // 将框选区域转换为NDC坐标
        const ndcBox = {
            minX: (Math.min(box.startX, box.endX) / size.width) * 2 - 1,
            maxX: (Math.max(box.startX, box.endX) / size.width) * 2 - 1,
            minY: -((Math.max(box.startY, box.endY) / size.height) * 2 - 1), // Flip Y correctly
            maxY: -((Math.min(box.startY, box.endY) / size.height) * 2 - 1), // Flip Y correctly
        };

        // Correct Y calculation:
        // Screen Y: 0 at top, H at bottom.
        // NDC Y: 1 at top, -1 at bottom.
        // Formula: -(y / h) * 2 + 1

        ndcBox.minY = -(Math.max(box.startY, box.endY) / size.height) * 2 + 1;
        ndcBox.maxY = -(Math.min(box.startY, box.endY) / size.height) * 2 + 1;

        // 检查每个设备是否在框选区域内
        Object.entries(devicePositions).forEach(([id, position]) => {
            const worldPos = new THREE.Vector3(...position);
            const screenPos = worldPos.clone().project(camera);

            if (
                screenPos.x >= ndcBox.minX &&
                screenPos.x <= ndcBox.maxX &&
                screenPos.y >= ndcBox.minY &&
                screenPos.y <= ndcBox.maxY &&
                screenPos.z < 1 // 在相机前方
            ) {
                selectedIds.push(id);
            }
        });

        onSelectionComplete(selectedIds);
    }, [enabled, selectionBox, camera, size, devicePositions, onSelectionComplete]);

    return null;
};

/**
 * 测量控制器 - 处理点击添加点
 */
export const MeasurementController: React.FC<{
    enabled: boolean;
    onAddPoint: (position: [number, number, number]) => void;
}> = ({ enabled, onAddPoint }) => {
    const { camera, scene, pointer, raycaster } = useThree();

    useEffect(() => {
        if (!enabled) return;

        const handleClick = (e: MouseEvent) => {
            // 只有当点击的目标不是UI元素时才触发 (canvas click)
            // R3F events handling usually handles this, but here we add raw listener for simplicity 
            // ensuring we catch clicks on e.g. empty floor
        };

        // 使用 R3F 系统更简单: 在全局 Mesh 上添加 onClick
        // 这里我们可以尝试使用 useThree().gl.domElement 绑定

        const domElement = document.querySelector('canvas');
        if (!domElement) return;

        const onPointerUp = (event: PointerEvent) => {
            // 简单的防抖或逻辑，这里直接进行 Raycast
            // 注意要转换 pointer 坐标

            // 计算 pointer 在 canvas 中的位置 (-1 to +1)
            const rect = domElement.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

            // 检测与特定层（例如地平面或机柜）的碰撞
            // 或者直接检测 scene.children
            const intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
                // 找到最近的可见物体
                const hit = intersects.find(i => i.object.visible && i.object.type === 'Mesh');
                if (hit) {
                    onAddPoint(hit.point.toArray());
                }
            }
        };

        domElement.addEventListener('pointerup', onPointerUp);
        return () => {
            domElement.removeEventListener('pointerup', onPointerUp);
        };

    }, [enabled, camera, scene, onAddPoint, raycaster]);

    return null;
};

// ==================== 测量工具 ====================

interface MeasurementToolProps {
    enabled: boolean;
    measurements: MeasurementLine[];
    onAddMeasurement: (line: MeasurementLine) => void;
    onRemoveMeasurement: (id: string) => void;
    onClearAll: () => void;
}

/**
 * 测量线渲染器
 */
export const MeasurementLineRenderer: React.FC<{
    measurement: MeasurementLine;
    onRemove: (id: string) => void;
}> = ({ measurement, onRemove }) => {
    const midPoint: [number, number, number] = [
        (measurement.start.position[0] + measurement.end.position[0]) / 2,
        (measurement.start.position[1] + measurement.end.position[1]) / 2,
        (measurement.start.position[2] + measurement.end.position[2]) / 2,
    ];

    return (
        <group>
            {/* 测量线 */}
            <Line
                points={[measurement.start.position, measurement.end.position]}
                color="#ff6b6b"
                lineWidth={2}
                dashed
                dashScale={10}
            />

            {/* 起点标记 */}
            <mesh position={measurement.start.position}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshBasicMaterial color="#ff6b6b" />
            </mesh>

            {/* 终点标记 */}
            <mesh position={measurement.end.position}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshBasicMaterial color="#ff6b6b" />
            </mesh>

            {/* 距离标签 */}
            <Html position={midPoint} center distanceFactor={8}>
                <div
                    style={{
                        background: 'rgba(255, 107, 107, 0.95)',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                >
                    <span>{measurement.distance.toFixed(2)}m</span>
                    <button
                        onClick={() => onRemove(measurement.id)}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: '#fff',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: 10,
                            lineHeight: '16px',
                        }}
                    >
                        ×
                    </button>
                </div>
            </Html>
        </group>
    );
};

/**
 * 测量工具管理器
 */
export const MeasurementManager: React.FC<{
    measurements: MeasurementLine[];
    onRemove: (id: string) => void;
}> = ({ measurements, onRemove }) => {
    return (
        <group>
            {measurements.map((m) => (
                <MeasurementLineRenderer
                    key={m.id}
                    measurement={m}
                    onRemove={onRemove}
                />
            ))}
        </group>
    );
};

// ==================== 测量点选择器 ====================

interface MeasurementPointSelectorProps {
    enabled: boolean;
    pendingPoint: MeasurementPoint | null;
    onPointSelect: (point: MeasurementPoint) => void;
    onCancel: () => void;
}

/**
 * 测量点选择提示
 */
export const MeasurementPointIndicator: React.FC<{
    point: MeasurementPoint;
}> = ({ point }) => {
    return (
        <group position={point.position}>
            <mesh>
                <sphereGeometry args={[0.04, 12, 12]} />
                <meshBasicMaterial color="#4096ff" transparent opacity={0.8} />
            </mesh>
            <Html center distanceFactor={6}>
                <div
                    style={{
                        background: '#4096ff',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: 10,
                        whiteSpace: 'nowrap',
                    }}
                >
                    起点
                </div>
            </Html>
        </group>
    );
};

// ==================== 工具函数 ====================

/**
 * 计算两点间距离
 */
export function calculateDistance(
    point1: [number, number, number],
    point2: [number, number, number],
): number {
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    const dz = point2[2] - point1[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 创建测量线
 */
export function createMeasurementLine(
    start: MeasurementPoint,
    end: MeasurementPoint,
): MeasurementLine {
    return {
        id: `measurement-${Date.now()}`,
        start,
        end,
        distance: calculateDistance(start.position, end.position),
    };
}

/**
 * 估算线缆长度（考虑走线路径）
 */
export function estimateCableLength(
    startPos: [number, number, number],
    endPos: [number, number, number],
    routingFactor: number = 1.3, // 走线系数（实际长度通常比直线长30%）
): number {
    const directDistance = calculateDistance(startPos, endPos);
    return directDistance * routingFactor;
}

// ==================== 批量操作工具 ====================

export interface BatchOperation {
    type: 'status_change' | 'move' | 'delete' | 'export';
    targetIds: string[];
    params?: Record<string, unknown>;
}

interface BatchOperationPanelProps {
    selectedIds: string[];
    onOperation: (operation: BatchOperation) => void;
    onClearSelection: () => void;
}

/**
 * 批量操作面板
 */
export const BatchOperationPanel: React.FC<BatchOperationPanelProps> = ({
    selectedIds,
    onOperation,
    onClearSelection,
}) => {
    if (selectedIds.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.9)',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                zIndex: 1000,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            }}
        >
            <span style={{ fontSize: 13, color: '#aaa' }}>
                已选择 <strong style={{ color: '#4096ff' }}>
                    {selectedIds.length}
                </strong>{' '}
                个设备
            </span>

            <div
                style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }}
            />

            <button
                onClick={() =>
                    onOperation({
                        type: 'status_change',
                        targetIds: selectedIds,
                        params: { status: 'maintenance' },
                    })
                }
                style={buttonStyle}
            >
                🔧 维护
            </button>

            <button
                onClick={() =>
                    onOperation({ type: 'export', targetIds: selectedIds })
                }
                style={buttonStyle}
            >
                📤 导出
            </button>

            <button
                onClick={onClearSelection}
                style={{ ...buttonStyle, background: 'rgba(255,77,79,0.8)' }}
            >
                ✕ 取消
            </button>
        </div>
    );
};

const buttonStyle: React.CSSProperties = {
    background: 'rgba(64, 150, 255, 0.8)',
    border: 'none',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
};

// ==================== 工具栏组件 ====================

export type ActiveTool = 'select' | 'boxSelect' | 'measure' | null;

interface ToolbarProps {
    activeTool: ActiveTool;
    onToolChange: (tool: ActiveTool) => void;
    measurementCount: number;
    onClearMeasurements: () => void;
}

/**
 * 工具栏
 */
export const SelectionToolbar: React.FC<ToolbarProps> = ({
    activeTool,
    onToolChange,
    measurementCount,
    onClearMeasurements,
}) => {
    return (
        <div
            style={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                zIndex: 100,
            }}
        >
            <ToolButton
                icon="👆"
                label="选择"
                active={activeTool === 'select'}
                onClick={() =>
                    onToolChange(activeTool === 'select' ? null : 'select')
                }
            />
            <ToolButton
                icon="⬜"
                label="框选"
                active={activeTool === 'boxSelect'}
                onClick={() =>
                    onToolChange(activeTool === 'boxSelect' ? null : 'boxSelect')
                }
            />
            <ToolButton
                icon="📏"
                label="测量"
                active={activeTool === 'measure'}
                onClick={() =>
                    onToolChange(activeTool === 'measure' ? null : 'measure')
                }
                badge={measurementCount > 0 ? String(measurementCount) : undefined}
            />
            {measurementCount > 0 && (
                <ToolButton
                    icon="🗑️"
                    label="清除测量"
                    active={false}
                    onClick={onClearMeasurements}
                />
            )}
        </div>
    );
};

const ToolButton: React.FC<{
    icon: string;
    label: string;
    active: boolean;
    onClick: () => void;
    badge?: string;
}> = ({ icon, label, active, onClick, badge }) => (
    <button
        onClick={onClick}
        title={label}
        style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            border: active ? '2px solid #4096ff' : '1px solid rgba(255,255,255,0.2)',
            background: active ? 'rgba(64, 150, 255, 0.3)' : 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
        }}
    >
        {icon}
        {badge && (
            <span
                style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: '#ff4d4f',
                    color: '#fff',
                    fontSize: 10,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {badge}
            </span>
        )}
    </button>
);
