/**
 * 数据加载优化工具
 * 
 * 功能：
 * 1. 分批加载大量数据（避免一次性请求过大）
 * 2. 简单的内存缓存
 * 3. 轮询更新（模拟WebSocket）
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ==================== 缓存管理 ====================

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

export function getCache<T>(key: string): T | null {
    const item = cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }

    return item.data as T;
}

export function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(keyPrefix?: string): void {
    if (!keyPrefix) {
        cache.clear();
        return;
    }

    for (const key of cache.keys()) {
        if (key.startsWith(keyPrefix)) {
            cache.delete(key);
        }
    }
}

// ==================== 分批加载 Hook ====================

interface BatchLoadOptions<T> {
    fetcher: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>;
    pageSize?: number;
    batchDelay?: number; // 批次间延迟，避免阻塞主线程
    cacheKey?: string;
    enabled?: boolean;
}

export function useBatchLoader<T>({
    fetcher,
    pageSize = 100,
    batchDelay = 50,
    cacheKey,
    enabled = true,
}: BatchLoadOptions<T>) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    const loadData = useCallback(async () => {
        if (!enabled) return;

        // 检查缓存
        if (cacheKey) {
            const cachedData = getCache<T[]>(cacheKey);
            if (cachedData) {
                setData(cachedData);
                setProgress(100);
                return;
            }
        }

        setLoading(true);
        setProgress(0);
        setError(null);

        try {
            // 获取第一页数据和总数
            const firstPage = await fetcher(1, pageSize);
            let allData = [...firstPage.data];
            const total = firstPage.total;

            setData(allData); // 先显示第一页数据

            const totalPages = Math.ceil(total / pageSize);
            setProgress(Math.round((1 / totalPages) * 100));

            // 如果还有更多页
            if (totalPages > 1) {
                // 创建页码数组 [2, 3, ..., totalPages]
                const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

                // 串行加载剩余页面（可以用 Promise.all 并行加载，但可能造成拥塞）
                // 这里采用分批加载，每批加载5页
                const BATCH_SIZE = 5;

                for (let i = 0; i < pages.length; i += BATCH_SIZE) {
                    const batchPages = pages.slice(i, i + BATCH_SIZE);

                    await new Promise(resolve => setTimeout(resolve, batchDelay));

                    const batchResults = await Promise.all(
                        batchPages.map(page => fetcher(page, pageSize))
                    );

                    batchResults.forEach(res => {
                        allData = [...allData, ...res.data];
                    });

                    setData(allData);
                    setProgress(Math.round(((i + BATCH_SIZE + 1) / totalPages) * 100));
                }
            }

            setProgress(100);
            if (cacheKey) {
                setCache(cacheKey, allData);
            }

        } catch (err) {
            console.error('Data loading error:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [fetcher, pageSize, batchDelay, cacheKey, enabled]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { data, loading, progress, error, reload: loadData };
}

// ==================== 定时更新 Hook ====================

interface PollingOptions {
    interval?: number;
    enabled?: boolean;
}

export function usePolling<T>(
    fetcher: () => Promise<T>,
    onUpdate: (data: T) => void,
    options: PollingOptions = {}
) {
    const { interval = 10000, enabled = true } = options;
    const timerRef = useRef<NodeJS.Timeout>(undefined);

    useEffect(() => {
        if (!enabled) return;

        const poll = async () => {
            try {
                const data = await fetcher();
                onUpdate(data);
            } catch (err) {
                console.error('Polling error:', err);
            }
        };

        timerRef.current = setInterval(poll, interval);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [fetcher, onUpdate, interval, enabled]);
}
