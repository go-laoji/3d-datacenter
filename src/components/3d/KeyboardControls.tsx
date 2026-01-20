/**
 * 用户体验优化 - 键盘快捷键控制器
 *
 * 功能：
 * 1. WASD 移动相机
 * 2. 空格键重置视角
 * 3. 数字键快速切换视角预设
 * 4. Escape 取消选择
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ==================== 类型定义 ====================

export interface KeyboardControlsConfig {
    moveSpeed: number; // 相机移动速度
    enabled: boolean; // 是否启用
    onResetView?: () => void; // 重置视角回调
    onEscape?: () => void; // ESC键回调
    onPresetView?: (preset: ViewPreset) => void; // 视角预设回调
}

export type ViewPreset =
    | 'top'
    | 'front'
    | 'side'
    | 'perspective'
    | 'custom1'
    | 'custom2'
    | 'custom3';

// 视角预设位置
export const VIEW_PRESETS: Record<
    ViewPreset,
    { position: [number, number, number]; target: [number, number, number] }
> = {
    top: { position: [4, 15, 4], target: [4, 0, 4] }, // 俯视图
    front: { position: [4, 2, 12], target: [4, 2, 0] }, // 正视图
    side: { position: [12, 2, 4], target: [0, 2, 4] }, // 侧视图
    perspective: { position: [8, 6, 8], target: [4, 1, 4] }, // 默认透视
    custom1: { position: [10, 8, 10], target: [4, 1, 4] },
    custom2: { position: [-2, 4, 8], target: [4, 1, 4] },
    custom3: { position: [8, 3, -2], target: [4, 1, 4] },
};

// ==================== 键盘状态管理 ====================

interface KeyState {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
    q: boolean; // 上升
    e: boolean; // 下降
    shift: boolean; // 加速
}

const initialKeyState: KeyState = {
    w: false,
    a: false,
    s: false,
    d: false,
    q: false,
    e: false,
    shift: false,
};

// ==================== 键盘控制器组件 ====================

interface KeyboardControllerProps {
    config?: Partial<KeyboardControlsConfig>;
    onResetView?: () => void;
    onEscape?: () => void;
    onPresetView?: (preset: ViewPreset) => void;
}

/**
 * 键盘控制器 - 在 Canvas 内部使用
 */
export const KeyboardController: React.FC<KeyboardControllerProps> = ({
    config,
    onResetView,
    onEscape,
    onPresetView,
}) => {
    const { camera, gl } = useThree();
    const keyState = useRef<KeyState>({ ...initialKeyState });
    const moveSpeed = config?.moveSpeed ?? 0.1;
    const enabled = config?.enabled ?? true;

    // 按键处理
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!enabled) return;

            // 防止在输入框中触发
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const key = e.key.toLowerCase();

            // WASD 移动
            if (key === 'w') keyState.current.w = true;
            if (key === 'a') keyState.current.a = true;
            if (key === 's') keyState.current.s = true;
            if (key === 'd') keyState.current.d = true;
            if (key === 'q') keyState.current.q = true;
            if (key === 'e') keyState.current.e = true;
            if (e.shiftKey) keyState.current.shift = true;

            // 空格键重置视角
            if (key === ' ') {
                e.preventDefault();
                onResetView?.();
            }

            // ESC 取消选择
            if (key === 'escape') {
                onEscape?.();
            }

            // 数字键切换视角预设
            if (key === '1') onPresetView?.('top');
            if (key === '2') onPresetView?.('front');
            if (key === '3') onPresetView?.('side');
            if (key === '4') onPresetView?.('perspective');
            if (key === '5') onPresetView?.('custom1');
            if (key === '6') onPresetView?.('custom2');
            if (key === '7') onPresetView?.('custom3');
        },
        [enabled, onResetView, onEscape, onPresetView],
    );

    const handleKeyUp = useCallback(
        (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            if (key === 'w') keyState.current.w = false;
            if (key === 'a') keyState.current.a = false;
            if (key === 's') keyState.current.s = false;
            if (key === 'd') keyState.current.d = false;
            if (key === 'q') keyState.current.q = false;
            if (key === 'e') keyState.current.e = false;
            if (!e.shiftKey) keyState.current.shift = false;
        },
        [],
    );

    // 注册事件监听
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // 每帧更新相机位置
    useFrame(() => {
        if (!enabled) return;

        const keys = keyState.current;
        const speed = keys.shift ? moveSpeed * 2.5 : moveSpeed;

        // 获取相机方向
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(direction, camera.up).normalize();

        // 移动
        if (keys.w) {
            camera.position.addScaledVector(direction, speed);
        }
        if (keys.s) {
            camera.position.addScaledVector(direction, -speed);
        }
        if (keys.a) {
            camera.position.addScaledVector(right, -speed);
        }
        if (keys.d) {
            camera.position.addScaledVector(right, speed);
        }
        if (keys.q) {
            camera.position.y += speed;
        }
        if (keys.e) {
            camera.position.y -= speed;
        }
    });

    return null;
};

// ==================== 视角管理器 ====================

interface ViewManagerProps {
    children?: React.ReactNode;
    onViewChange?: (preset: ViewPreset) => void;
}

/**
 * 视角管理器 - 管理视角切换动画
 */
export const ViewManager: React.FC<ViewManagerProps> = ({
    children,
    onViewChange,
}) => {
    const { camera } = useThree();
    const targetPosition = useRef<THREE.Vector3 | null>(null);
    const isAnimating = useRef(false);

    // 切换到预设视角
    const switchToPreset = useCallback(
        (preset: ViewPreset) => {
            const presetData = VIEW_PRESETS[preset];
            if (!presetData) return;

            targetPosition.current = new THREE.Vector3(...presetData.position);
            isAnimating.current = true;
            onViewChange?.(preset);
        },
        [onViewChange],
    );

    // 动画插值
    useFrame(() => {
        if (!isAnimating.current || !targetPosition.current) return;

        camera.position.lerp(targetPosition.current, 0.08);

        if (camera.position.distanceTo(targetPosition.current) < 0.1) {
            camera.position.copy(targetPosition.current);
            isAnimating.current = false;
            targetPosition.current = null;
        }
    });

    return <>{children}</>;
};

// ==================== 快捷键提示面板 ====================

interface ShortcutHelpPanelProps {
    visible: boolean;
    onClose: () => void;
}

/**
 * 快捷键帮助面板
 */
export const ShortcutHelpPanel: React.FC<ShortcutHelpPanelProps> = ({
    visible,
    onClose,
}) => {
    if (!visible) return null;

    const shortcuts = [
        { key: 'W/A/S/D', description: '移动相机' },
        { key: 'Q/E', description: '上升/下降' },
        { key: 'Shift', description: '加速移动' },
        { key: '空格', description: '重置视角' },
        { key: 'ESC', description: '取消选择' },
        { key: '1', description: '俯视图' },
        { key: '2', description: '正视图' },
        { key: '3', description: '侧视图' },
        { key: '4', description: '透视图' },
    ];

    return (
        <div
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0, 0, 0, 0.9)',
                color: '#fff',
                padding: '24px',
                borderRadius: 12,
                zIndex: 1000,
                minWidth: 300,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}
            >
                <h3 style={{ margin: 0, fontSize: 18 }}>⌨️ 快捷键</h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#888',
                        fontSize: 20,
                        cursor: 'pointer',
                    }}
                >
                    ×
                </button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
                {shortcuts.map((s) => (
                    <div
                        key={s.key}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <span
                            style={{
                                background: '#333',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontFamily: 'monospace',
                                fontSize: 12,
                            }}
                        >
                            {s.key}
                        </span>
                        <span style={{ color: '#aaa', fontSize: 13 }}>
                            {s.description}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==================== Hook: 使用键盘控制 ====================

/**
 * 键盘控制 Hook（在组件外部使用）
 */
export function useKeyboardShortcuts(callbacks: {
    onResetView?: () => void;
    onEscape?: () => void;
    onPresetView?: (preset: ViewPreset) => void;
    enabled?: boolean;
}) {
    const { onResetView, onEscape, onPresetView, enabled = true } = callbacks;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!enabled) return;

            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const key = e.key.toLowerCase();

            if (key === ' ') {
                e.preventDefault();
                onResetView?.();
            }

            if (key === 'escape') {
                onEscape?.();
            }

            const presetMap: Record<string, ViewPreset> = {
                '1': 'top',
                '2': 'front',
                '3': 'side',
                '4': 'perspective',
            };

            if (presetMap[key]) {
                onPresetView?.(presetMap[key]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, onResetView, onEscape, onPresetView]);
}
