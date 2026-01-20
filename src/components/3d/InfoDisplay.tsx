/**
 * 用户体验优化 - 信息展示优化组件
 *
 * 功能：
 * 1. 可折叠的信息面板
 * 2. 根据缩放级别显示不同信息
 * 3. 增强搜索（模糊搜索、高亮、历史记录）
 */

import React, {
    useState,
    useCallback,
    useMemo,
    useEffect,
    useRef,
} from 'react';

// ==================== 类型定义 ====================

export interface DeviceInfo {
    id: string;
    name: string;
    type: string;
    status: string;
    assetCode?: string;
    managementIp?: string;
    cabinetId: string;
    cabinetName?: string;
    startU: number;
    endU: number;
}

export interface SearchResult {
    device: DeviceInfo;
    matchField: string;
    matchScore: number;
}

// ==================== 可折叠信息面板 ====================

interface CollapsiblePanelProps {
    title: string;
    icon?: string;
    defaultExpanded?: boolean;
    children: React.ReactNode;
    badge?: string | number;
}

/**
 * 可折叠信息面板
 */
export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
    title,
    icon,
    defaultExpanded = true,
    children,
    badge,
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <div
            style={{
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                marginBottom: 12,
            }}
        >
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: expanded ? '#fafafa' : '#fff',
                    borderBottom: expanded ? '1px solid #f0f0f0' : 'none',
                    userSelect: 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{title}</span>
                    {badge !== undefined && (
                        <span
                            style={{
                                background: '#4096ff',
                                color: '#fff',
                                fontSize: 11,
                                padding: '1px 6px',
                                borderRadius: 10,
                            }}
                        >
                            {badge}
                        </span>
                    )}
                </div>
                <span
                    style={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        fontSize: 12,
                        color: '#999',
                    }}
                >
                    ▼
                </span>
            </div>
            {expanded && (
                <div style={{ padding: 16 }}>
                    {children}
                </div>
            )}
        </div>
    );
};

// ==================== 缩放级别信息控制 ====================

export type ZoomLevel = 'far' | 'medium' | 'close';

interface ZoomInfo {
    level: ZoomLevel;
    showLabels: boolean;
    showDetails: boolean;
    showPorts: boolean;
    labelSize: 'small' | 'medium' | 'large';
}

/**
 * 根据相机距离计算缩放级别
 */
export function calculateZoomLevel(distance: number): ZoomInfo {
    if (distance > 12) {
        return {
            level: 'far',
            showLabels: true,
            showDetails: false,
            showPorts: false,
            labelSize: 'small',
        };
    } else if (distance > 5) {
        return {
            level: 'medium',
            showLabels: true,
            showDetails: true,
            showPorts: false,
            labelSize: 'medium',
        };
    } else {
        return {
            level: 'close',
            showLabels: true,
            showDetails: true,
            showPorts: true,
            labelSize: 'large',
        };
    }
}

/**
 * Hook: 缩放级别信息
 */
export function useZoomLevel(distance: number): ZoomInfo {
    return useMemo(() => calculateZoomLevel(distance), [distance]);
}

// ==================== 增强搜索组件 ====================

interface EnhancedSearchProps {
    devices: DeviceInfo[];
    onSelect: (device: DeviceInfo) => void;
    onHighlight: (deviceId: string | null) => void;
    placeholder?: string;
}

/**
 * 模糊搜索函数
 */
function fuzzyMatch(text: string, query: string): { match: boolean; score: number } {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // 精确匹配得分最高
    if (lowerText === lowerQuery) {
        return { match: true, score: 100 };
    }

    // 包含匹配
    if (lowerText.includes(lowerQuery)) {
        return { match: true, score: 80 };
    }

    // 开头匹配
    if (lowerText.startsWith(lowerQuery)) {
        return { match: true, score: 90 };
    }

    // 模糊匹配（字符按顺序出现）
    let queryIndex = 0;
    let matchCount = 0;
    for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
        if (lowerText[i] === lowerQuery[queryIndex]) {
            matchCount++;
            queryIndex++;
        }
    }

    if (queryIndex === lowerQuery.length) {
        const score = (matchCount / lowerText.length) * 60;
        return { match: true, score };
    }

    return { match: false, score: 0 };
}

/**
 * 高亮匹配文本
 */
export const HighlightText: React.FC<{ text: string; query: string }> = ({
    text,
    query,
}) => {
    if (!query) return <>{text}</>;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return <>{text}</>;

    return (
        <>
            {text.slice(0, index)}
            <span style={{ background: '#ffe58f', fontWeight: 600 }}>
                {text.slice(index, index + query.length)}
            </span>
            {text.slice(index + query.length)}
        </>
    );
};

/**
 * 搜索历史记录管理
 */
const SEARCH_HISTORY_KEY = 'datacenter_search_history';
const MAX_HISTORY_ITEMS = 10;

function getSearchHistory(): string[] {
    try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch {
        return [];
    }
}

function addToSearchHistory(query: string): void {
    if (!query.trim()) return;

    try {
        let history = getSearchHistory();
        // 移除重复项
        history = history.filter((h) => h !== query);
        // 添加到开头
        history.unshift(query);
        // 限制数量
        history = history.slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch {
        // 忽略存储错误
    }
}

function clearSearchHistory(): void {
    try {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
        // 忽略错误
    }
}

/**
 * 增强搜索组件
 */
export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
    devices,
    onSelect,
    onHighlight,
    placeholder = '搜索设备名称、IP、资产编码...',
}) => {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // 加载搜索历史
    useEffect(() => {
        setHistory(getSearchHistory());
    }, []);

    // 搜索结果
    const results = useMemo((): SearchResult[] => {
        if (!query.trim()) return [];

        const matches: SearchResult[] = [];

        devices.forEach((device) => {
            // 搜索多个字段
            const fields: { field: string; value: string }[] = [
                { field: 'name', value: device.name },
                { field: 'assetCode', value: device.assetCode || '' },
                { field: 'managementIp', value: device.managementIp || '' },
                { field: 'cabinetName', value: device.cabinetName || '' },
            ];

            let bestMatchField = '';
            let bestMatchScore = 0;

            fields.forEach(({ field, value }) => {
                if (!value) return;
                const { match, score } = fuzzyMatch(value, query);
                if (match && score > bestMatchScore) {
                    bestMatchField = field;
                    bestMatchScore = score;
                }
            });

            if (bestMatchScore > 0) {
                matches.push({
                    device,
                    matchField: bestMatchField,
                    matchScore: bestMatchScore,
                });
            }
        });

        // 按匹配度排序
        return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);
    }, [query, devices]);

    const handleSelect = useCallback(
        (device: DeviceInfo) => {
            addToSearchHistory(query);
            setHistory(getSearchHistory());
            setQuery('');
            setFocused(false);
            onSelect(device);
        },
        [query, onSelect],
    );

    const handleHistorySelect = useCallback(
        (historyQuery: string) => {
            setQuery(historyQuery);
            setShowHistory(false);
            inputRef.current?.focus();
        },
        [],
    );

    const handleClearHistory = useCallback(() => {
        clearSearchHistory();
        setHistory([]);
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* 搜索输入框 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#fff',
                    border: focused ? '2px solid #4096ff' : '1px solid #d9d9d9',
                    borderRadius: 8,
                    padding: '8px 12px',
                    transition: 'border-color 0.2s',
                }}
            >
                <span style={{ marginRight: 8, fontSize: 16, color: '#999' }}>
                    🔍
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        setFocused(true);
                        setShowHistory(true);
                    }}
                    onBlur={() => {
                        setFocused(false);
                        // 延迟关闭以允许点击结果
                        setTimeout(() => setShowHistory(false), 200);
                    }}
                    placeholder={placeholder}
                    style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: 14,
                        background: 'transparent',
                    }}
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            onHighlight(null);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#999',
                            cursor: 'pointer',
                            fontSize: 16,
                            padding: 0,
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            {/* 搜索结果下拉 */}
            {focused && (query ? results.length > 0 : showHistory && history.length > 0) && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        background: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        maxHeight: 400,
                        overflow: 'auto',
                        zIndex: 1000,
                    }}
                >
                    {query ? (
                        // 搜索结果
                        <>
                            <div
                                style={{
                                    padding: '8px 12px',
                                    fontSize: 12,
                                    color: '#999',
                                    borderBottom: '1px solid #f0f0f0',
                                }}
                            >
                                找到 {results.length} 个结果
                            </div>
                            {results.map((result) => (
                                <div
                                    key={result.device.id}
                                    onClick={() => handleSelect(result.device)}
                                    onMouseEnter={() => onHighlight(result.device.id)}
                                    onMouseLeave={() => onHighlight(null)}
                                    style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f5f5f5',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseOver={(e) =>
                                        (e.currentTarget.style.background = '#f5f5f5')
                                    }
                                    onMouseOut={(e) =>
                                        (e.currentTarget.style.background = 'transparent')
                                    }
                                >
                                    <div
                                        style={{
                                            fontWeight: 500,
                                            fontSize: 14,
                                            marginBottom: 4,
                                        }}
                                    >
                                        <HighlightText
                                            text={result.device.name}
                                            query={query}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: '#888',
                                            display: 'flex',
                                            gap: 12,
                                        }}
                                    >
                                        {result.device.managementIp && (
                                            <span>
                                                IP:{' '}
                                                <HighlightText
                                                    text={result.device.managementIp}
                                                    query={query}
                                                />
                                            </span>
                                        )}
                                        {result.device.cabinetName && (
                                            <span>机柜: {result.device.cabinetName}</span>
                                        )}
                                        <span>
                                            U{result.device.startU}-U{result.device.endU}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        // 搜索历史
                        <>
                            <div
                                style={{
                                    padding: '8px 12px',
                                    fontSize: 12,
                                    color: '#999',
                                    borderBottom: '1px solid #f0f0f0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span>搜索历史</span>
                                <button
                                    onClick={handleClearHistory}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#4096ff',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                    }}
                                >
                                    清除
                                </button>
                            </div>
                            {history.map((h, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleHistorySelect(h)}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                    onMouseOver={(e) =>
                                        (e.currentTarget.style.background = '#f5f5f5')
                                    }
                                    onMouseOut={(e) =>
                                        (e.currentTarget.style.background = 'transparent')
                                    }
                                >
                                    <span style={{ color: '#999' }}>🕒</span>
                                    {h}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* 无结果提示 */}
            {focused && query && results.length === 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        background: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        padding: 20,
                        textAlign: 'center',
                        color: '#999',
                        fontSize: 13,
                    }}
                >
                    未找到匹配的设备
                </div>
            )}
        </div>
    );
};

// ==================== 信息密度控制器 ====================

export type InfoDensity = 'compact' | 'normal' | 'detailed';

interface InfoDensityControlProps {
    density: InfoDensity;
    onChange: (density: InfoDensity) => void;
}

/**
 * 信息密度控制器
 */
export const InfoDensityControl: React.FC<InfoDensityControlProps> = ({
    density,
    onChange,
}) => {
    const options: { value: InfoDensity; label: string; icon: string }[] = [
        { value: 'compact', label: '紧凑', icon: '▫️' },
        { value: 'normal', label: '标准', icon: '◻️' },
        { value: 'detailed', label: '详细', icon: '⬜' },
    ];

    return (
        <div
            style={{
                display: 'flex',
                background: '#f0f0f0',
                borderRadius: 6,
                padding: 2,
            }}
        >
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    title={opt.label}
                    style={{
                        flex: 1,
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: 4,
                        background: density === opt.value ? '#fff' : 'transparent',
                        boxShadow:
                            density === opt.value
                                ? '0 1px 3px rgba(0,0,0,0.1)'
                                : 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                    }}
                >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                </button>
            ))}
        </div>
    );
};
