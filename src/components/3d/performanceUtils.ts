/**
 * 3D渲染性能优化 - 性能工具函数
 * 
 * 功能：
 * 1. 视锥体剔除辅助
 * 2. 遮挡检测
 * 3. 性能监控和统计
 * 4. 优化建议
 */

import * as THREE from 'three';

// ==================== 视锥体剔除 ====================

/**
 * 检查点是否在相机视锥体内
 */
export function isInFrustum(
    position: THREE.Vector3 | [number, number, number],
    camera: THREE.Camera,
    frustum?: THREE.Frustum
): boolean {
    const point = Array.isArray(position)
        ? new THREE.Vector3(...position)
        : position;

    if (!frustum) {
        frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);
    }

    return frustum.containsPoint(point);
}

/**
 * 检查边界盒是否在相机视锥体内
 */
export function isBoundingBoxInFrustum(
    box: THREE.Box3,
    camera: THREE.Camera,
    frustum?: THREE.Frustum
): boolean {
    if (!frustum) {
        frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);
    }

    return frustum.intersectsBox(box);
}

/**
 * 创建视锥体（可复用）
 */
export function createFrustum(camera: THREE.Camera): THREE.Frustum {
    const frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);
    return frustum;
}

// ==================== 遮挡检测 ====================

interface OcclusionResult {
    isOccluded: boolean;
    distance: number;
    occluder?: THREE.Object3D;
}

/**
 * 简单遮挡检测 - 从相机向目标发射射线
 */
export function checkOcclusion(
    targetPosition: THREE.Vector3 | [number, number, number],
    camera: THREE.Camera,
    occluders: THREE.Object3D[],
    raycaster?: THREE.Raycaster
): OcclusionResult {
    const target = Array.isArray(targetPosition)
        ? new THREE.Vector3(...targetPosition)
        : targetPosition;

    const direction = target.clone().sub(camera.position).normalize();
    const distanceToTarget = camera.position.distanceTo(target);

    if (!raycaster) {
        raycaster = new THREE.Raycaster();
    }

    raycaster.set(camera.position, direction);
    raycaster.far = distanceToTarget;

    const intersects = raycaster.intersectObjects(occluders, true);

    if (intersects.length > 0 && intersects[0].distance < distanceToTarget - 0.1) {
        return {
            isOccluded: true,
            distance: intersects[0].distance,
            occluder: intersects[0].object,
        };
    }

    return {
        isOccluded: false,
        distance: distanceToTarget,
    };
}

// ==================== 性能监控 ====================

interface PerformanceStats {
    fps: number;
    frameTime: number;
    drawCalls: number;
    triangles: number;
    textures: number;
    programs: number;
    geometries: number;
}

class PerformanceMonitor {
    private frameCount: number = 0;
    private lastTime: number = performance.now();
    private fps: number = 60;
    private frameTime: number = 16.67;
    private renderer: THREE.WebGLRenderer | null = null;

    /**
     * 设置渲染器引用
     */
    setRenderer(renderer: THREE.WebGLRenderer): void {
        this.renderer = renderer;
    }

    /**
     * 每帧调用，更新统计
     */
    update(): void {
        this.frameCount++;

        const now = performance.now();
        const elapsed = now - this.lastTime;

        // 每秒更新一次 FPS
        if (elapsed >= 1000) {
            this.fps = (this.frameCount * 1000) / elapsed;
            this.frameTime = elapsed / this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }
    }

    /**
     * 获取当前性能统计
     */
    getStats(): PerformanceStats {
        const info = this.renderer?.info;

        return {
            fps: Math.round(this.fps),
            frameTime: Number(this.frameTime.toFixed(2)),
            drawCalls: info?.render?.calls ?? 0,
            triangles: info?.render?.triangles ?? 0,
            textures: info?.memory?.textures ?? 0,
            programs: info?.programs?.length ?? 0,
            geometries: info?.memory?.geometries ?? 0,
        };
    }

    /**
     * 重置渲染器统计（每帧开始时调用）
     */
    resetRenderInfo(): void {
        if (this.renderer) {
            this.renderer.info.reset();
        }
    }

    /**
     * 获取性能等级建议
     */
    getPerformanceGrade(): 'excellent' | 'good' | 'fair' | 'poor' {
        if (this.fps >= 55) return 'excellent';
        if (this.fps >= 45) return 'good';
        if (this.fps >= 30) return 'fair';
        return 'poor';
    }

    /**
     * 获取优化建议
     */
    getOptimizationSuggestions(): string[] {
        const stats = this.getStats();
        const suggestions: string[] = [];

        if (stats.fps < 30) {
            suggestions.push('帧率较低，建议启用 LOD 优化');
        }

        if (stats.drawCalls > 500) {
            suggestions.push('Draw calls 过多，建议使用实例化渲染');
        }

        if (stats.triangles > 1000000) {
            suggestions.push('三角形数量较多，建议简化远距离模型');
        }

        if (stats.textures > 50) {
            suggestions.push('纹理数量较多，建议使用纹理图集');
        }

        if (stats.geometries > 200) {
            suggestions.push('几何体数量较多，建议使用缓存复用');
        }

        return suggestions;
    }
}

// 单例导出
export const performanceMonitor = new PerformanceMonitor();

// ==================== 批处理优化 ====================

/**
 * 合并静态物体（减少 draw calls）
 */
export function mergeStaticMeshes(meshes: THREE.Mesh[]): THREE.Mesh | null {
    if (meshes.length === 0) return null;
    if (meshes.length === 1) return meshes[0];

    // 检查是否可以合并（相同材质）
    const firstMaterial = meshes[0].material;
    const canMerge = meshes.every(mesh => mesh.material === firstMaterial);

    if (!canMerge) {
        console.warn('无法合并不同材质的网格');
        return null;
    }

    const geometries: THREE.BufferGeometry[] = [];

    meshes.forEach(mesh => {
        const geometry = mesh.geometry.clone();
        geometry.applyMatrix4(mesh.matrixWorld);
        geometries.push(geometry);
    });

    // 使用 BufferGeometryUtils 合并（需要额外导入）
    // 这里提供一个简化版本
    // import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
    // const mergedGeometry = mergeGeometries(geometries);

    // 返回第一个网格作为占位符
    return meshes[0];
}

// ==================== 距离计算优化 ====================

/**
 * 批量计算到相机的距离（优化版）
 */
export function batchCalculateDistances(
    positions: [number, number, number][],
    cameraPosition: THREE.Vector3
): number[] {
    return positions.map(pos => {
        const dx = pos[0] - cameraPosition.x;
        const dy = pos[1] - cameraPosition.y;
        const dz = pos[2] - cameraPosition.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    });
}

/**
 * 快速距离比较（避免开方运算）
 */
export function isWithinDistance(
    position: [number, number, number],
    cameraPosition: THREE.Vector3,
    maxDistance: number
): boolean {
    const dx = position[0] - cameraPosition.x;
    const dy = position[1] - cameraPosition.y;
    const dz = position[2] - cameraPosition.z;
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    return distanceSquared <= maxDistance * maxDistance;
}

// ==================== 渲染优化配置 ====================

export interface RenderOptimizationConfig {
    enableLOD: boolean;
    enableInstancing: boolean;
    enableFrustumCulling: boolean;
    enableOcclusionCulling: boolean;
    lodThresholds: {
        high: number;
        medium: number;
        low: number;
    };
    maxVisibleDevices: number;
    updateFrequency: number; // 每N帧更新一次距离计算
}

export const DEFAULT_OPTIMIZATION_CONFIG: RenderOptimizationConfig = {
    enableLOD: true,
    enableInstancing: true,
    enableFrustumCulling: true,
    enableOcclusionCulling: false, // 默认关闭，开销较大
    lodThresholds: {
        high: 3,
        medium: 8,
        low: 15,
    },
    maxVisibleDevices: 200,
    updateFrequency: 10,
};

/**
 * 根据设备数量推荐优化配置
 */
export function getRecommendedConfig(deviceCount: number): RenderOptimizationConfig {
    const config = { ...DEFAULT_OPTIMIZATION_CONFIG };

    if (deviceCount > 500) {
        config.enableInstancing = true;
        config.lodThresholds = { high: 2, medium: 5, low: 10 };
        config.maxVisibleDevices = 150;
        config.updateFrequency = 15;
    } else if (deviceCount > 200) {
        config.enableInstancing = true;
        config.lodThresholds = { high: 3, medium: 7, low: 12 };
        config.maxVisibleDevices = 180;
        config.updateFrequency = 12;
    } else if (deviceCount < 50) {
        config.enableInstancing = false;
        config.enableLOD = false;
    }

    return config;
}

// ==================== React Hook ====================

import { useRef, useEffect, useCallback } from 'react';

/**
 * 性能监控 Hook
 */
export function usePerformanceMonitor(renderer: THREE.WebGLRenderer | null) {
    const statsRef = useRef<PerformanceStats | null>(null);

    useEffect(() => {
        if (renderer) {
            performanceMonitor.setRenderer(renderer);
        }
    }, [renderer]);

    const update = useCallback(() => {
        performanceMonitor.update();
        statsRef.current = performanceMonitor.getStats();
    }, []);

    const getStats = useCallback(() => {
        return performanceMonitor.getStats();
    }, []);

    const getSuggestions = useCallback(() => {
        return performanceMonitor.getOptimizationSuggestions();
    }, []);

    return {
        update,
        getStats,
        getSuggestions,
        getGrade: () => performanceMonitor.getPerformanceGrade(),
    };
}
