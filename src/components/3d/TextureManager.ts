/**
 * 3D渲染性能优化 - 材质和几何体缓存管理器
 * 
 * 功能：
 * 1. 缓存和复用材质（MeshStandardMaterial）
 * 2. 缓存和复用几何体（BoxGeometry、SphereGeometry等）
 * 3. 减少GPU资源分配和切换开销
 */

import * as THREE from 'three';

// ==================== 材质缓存 ====================

interface MaterialParams {
    color: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
}

// 生成唯一的缓存键
function getMaterialKey(params: MaterialParams): string {
    return [
        params.color,
        params.metalness ?? 0.4,
        params.roughness ?? 0.5,
        params.emissive ?? '#000000',
        params.emissiveIntensity ?? 0,
        params.transparent ?? false,
        params.opacity ?? 1
    ].join('|');
}

// 材质缓存存储
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

/**
 * 获取缓存的材质，如果不存在则创建
 */
export function getCachedMaterial(params: MaterialParams): THREE.MeshStandardMaterial {
    const key = getMaterialKey(params);

    if (materialCache.has(key)) {
        return materialCache.get(key)!;
    }

    const material = new THREE.MeshStandardMaterial({
        color: params.color,
        metalness: params.metalness ?? 0.4,
        roughness: params.roughness ?? 0.5,
        emissive: params.emissive ?? '#000000',
        emissiveIntensity: params.emissiveIntensity ?? 0,
        transparent: params.transparent ?? false,
        opacity: params.opacity ?? 1,
    });

    materialCache.set(key, material);
    return material;
}

// ==================== 几何体缓存 ====================

// 几何体缓存存储（按类型和尺寸）
const boxGeometryCache = new Map<string, THREE.BoxGeometry>();
const sphereGeometryCache = new Map<string, THREE.SphereGeometry>();

/**
 * 获取缓存的盒子几何体
 */
export function getCachedBoxGeometry(
    width: number,
    height: number,
    depth: number,
    precision: number = 3 // 小数精度，用于合并相近尺寸
): THREE.BoxGeometry {
    // 将尺寸四舍五入到指定精度，增加缓存命中率
    const roundedWidth = Number(width.toFixed(precision));
    const roundedHeight = Number(height.toFixed(precision));
    const roundedDepth = Number(depth.toFixed(precision));

    const key = `${roundedWidth}|${roundedHeight}|${roundedDepth}`;

    if (boxGeometryCache.has(key)) {
        return boxGeometryCache.get(key)!;
    }

    const geometry = new THREE.BoxGeometry(roundedWidth, roundedHeight, roundedDepth);
    boxGeometryCache.set(key, geometry);
    return geometry;
}

/**
 * 获取缓存的球体几何体
 */
export function getCachedSphereGeometry(
    radius: number,
    widthSegments: number = 16,
    heightSegments: number = 16,
    precision: number = 4
): THREE.SphereGeometry {
    const roundedRadius = Number(radius.toFixed(precision));
    const key = `${roundedRadius}|${widthSegments}|${heightSegments}`;

    if (sphereGeometryCache.has(key)) {
        return sphereGeometryCache.get(key)!;
    }

    const geometry = new THREE.SphereGeometry(roundedRadius, widthSegments, heightSegments);
    sphereGeometryCache.set(key, geometry);
    return geometry;
}

// ==================== 预定义材质（常用） ====================

// 设备主体材质 - 预创建常用颜色
export const DeviceMaterials = {
    // 服务器
    serverBody: getCachedMaterial({ color: '#5c6b7a', metalness: 0.5, roughness: 0.4 }),
    serverBodyHover: getCachedMaterial({ color: '#7a8fa3', metalness: 0.5, roughness: 0.4 }),
    serverPanel: getCachedMaterial({ color: '#2a2f35', metalness: 0.3, roughness: 0.6 }),

    // 交换机
    switchBody: getCachedMaterial({ color: '#2d5a7b', metalness: 0.4, roughness: 0.5 }),
    switchBodyHover: getCachedMaterial({ color: '#4a7c9b', metalness: 0.4, roughness: 0.5 }),
    switchPanel: getCachedMaterial({ color: '#1a2530', metalness: 0.3, roughness: 0.6 }),

    // 路由器
    routerBody: getCachedMaterial({ color: '#4a6b5c', metalness: 0.4, roughness: 0.5 }),
    routerBodyHover: getCachedMaterial({ color: '#6b8e7d', metalness: 0.4, roughness: 0.5 }),
    routerPanel: getCachedMaterial({ color: '#1f2d25', metalness: 0.3, roughness: 0.6 }),

    // 存储
    storageBody: getCachedMaterial({ color: '#483d8b', metalness: 0.4, roughness: 0.5 }),
    storageBodyHover: getCachedMaterial({ color: '#6a5acd', metalness: 0.4, roughness: 0.5 }),
    storagePanel: getCachedMaterial({ color: '#1a1525', metalness: 0.3, roughness: 0.6 }),

    // 防火墙
    firewallBody: getCachedMaterial({ color: '#8b0000', metalness: 0.4, roughness: 0.5 }),
    firewallBodyHover: getCachedMaterial({ color: '#cd5c5c', metalness: 0.4, roughness: 0.5 }),

    // 负载均衡器
    loadbalancerBody: getCachedMaterial({ color: '#008b8b', metalness: 0.4, roughness: 0.5 }),
    loadbalancerBodyHover: getCachedMaterial({ color: '#20b2aa', metalness: 0.4, roughness: 0.5 }),

    // 通用设备
    genericBody: getCachedMaterial({ color: '#6b7b8c', metalness: 0.4, roughness: 0.5 }),
    genericBodyHover: getCachedMaterial({ color: '#8fa3b8', metalness: 0.4, roughness: 0.5 }),

    // 磁盘托架
    diskBay: getCachedMaterial({ color: '#222', metalness: 0.6, roughness: 0.3 }),
};

// 状态指示灯材质
export const StatusMaterials = {
    online: getCachedMaterial({ color: '#52c41a', emissive: '#52c41a', emissiveIntensity: 0.3 }),
    offline: getCachedMaterial({ color: '#8c8c8c', emissive: '#4a4a4a', emissiveIntensity: 0.1 }),
    warning: getCachedMaterial({ color: '#faad14', emissive: '#faad14', emissiveIntensity: 0.5 }),
    error: getCachedMaterial({ color: '#f5222d', emissive: '#f5222d', emissiveIntensity: 0.5 }),
    maintenance: getCachedMaterial({ color: '#1890ff', emissive: '#1890ff', emissiveIntensity: 0.3 }),
};

// LED指示灯材质
export const LEDMaterials = {
    active: getCachedMaterial({ color: '#00ff00', emissive: '#00ff00', emissiveIntensity: 0.8 }),
    inactive: getCachedMaterial({ color: '#333', emissive: '#000', emissiveIntensity: 0 }),
    activeBlue: getCachedMaterial({ color: '#1890ff', emissive: '#0066cc', emissiveIntensity: 0.6 }),
    activeGreen: getCachedMaterial({ color: '#52c41a', emissive: '#52c41a', emissiveIntensity: 0.5 }),
};

// 特殊效果材质
export const EffectMaterials = {
    // 防火墙盾牌
    firewallShield: getCachedMaterial({
        color: '#ffd700',
        emissive: '#ffd700',
        emissiveIntensity: 0.2,
        metalness: 0.6,
        roughness: 0.3
    }),
    // 负载均衡器流量指示
    loadbalancerArrow: getCachedMaterial({
        color: '#00ffff',
        emissive: '#00ffff',
        emissiveIntensity: 0.3
    }),
    // 选中高亮边框
    selectionOutline: new THREE.LineBasicMaterial({ color: '#4096ff' }),
};

// ==================== 简化几何体（低精度LOD） ====================

export const SimplifiedGeometries = {
    // 低精度状态指示灯（4段而非8段）
    statusLed: getCachedSphereGeometry(0.008, 4, 4),
    // 标准状态指示灯
    statusLedHigh: getCachedSphereGeometry(0.008, 8, 8),
};

// ==================== 清理方法 ====================

/**
 * 清理所有缓存（通常在场景销毁时调用）
 */
export function clearAllCaches(): void {
    // 清理材质
    materialCache.forEach(material => material.dispose());
    materialCache.clear();

    // 清理几何体
    boxGeometryCache.forEach(geometry => geometry.dispose());
    boxGeometryCache.clear();

    sphereGeometryCache.forEach(geometry => geometry.dispose());
    sphereGeometryCache.clear();
}

/**
 * 获取缓存统计信息（用于调试）
 */
export function getCacheStats(): { materials: number; boxGeometries: number; sphereGeometries: number } {
    return {
        materials: materialCache.size,
        boxGeometries: boxGeometryCache.size,
        sphereGeometries: sphereGeometryCache.size,
    };
}
